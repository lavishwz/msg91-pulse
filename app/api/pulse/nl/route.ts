import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isConfigured, plan } from "@/lib/pulse/nl";
import { GtwyError } from "@/lib/pulse/gtwy";
import { guard, MAX_ROWS } from "@/lib/pulse/sqlguard";

/**
 * POST /api/pulse/nl  { question: string }
 *
 * Free-text question → SQL → rows. The pipeline is deliberately visible in the
 * response: `sql` is always returned so the number on screen can be traced back
 * to the query that produced it.
 *
 *   1. GTWY's Pulse agent writes a SELECT from the schema (lib/pulse/nl.ts)
 *   2. lib/pulse/sqlguard.ts refuses anything that is not one bounded SELECT
 *   3. it runs on the read-only connection under a statement timeout
 */

/** Hard ceiling on how long a generated query may run. */
const STATEMENT_TIMEOUT_MS = 15_000;

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ask needs a GTWY pauthkey to answer free-text questions. Add GTWY_PAUTHKEY to .env.local and restart. The eight built-in questions work without it.",
        code: "NO_PAUTHKEY",
      },
      { status: 501 },
    );
  }

  let question = "";
  try {
    const body = (await req.json()) as { question?: unknown };
    question = String(body.question ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "expected JSON body" }, { status: 400 });
  }

  if (question.length < 3) {
    return NextResponse.json({ ok: false, error: "ask a longer question" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ ok: false, error: "question is too long" }, { status: 400 });
  }

  const started = Date.now();

  try {
    const p = await plan(question);
    const planMs = Date.now() - started;

    if (!p.answerable || !p.sql) {
      return NextResponse.json({
        ok: true,
        answerable: false,
        question,
        headline: p.headline || "Pulse cannot answer that from this database.",
        shape: "none",
        confidence: p.confidence,
        caveats: p.caveats ?? [],
        sql: null,
        rows: [],
        columns: [],
        timing: { planMs, queryMs: 0 },
      });
    }

    const checked = guard(p.sql);
    if (!checked.ok) {
      // Refusals are reported with the offending SQL so the failure is legible
      // rather than mysterious.
      return NextResponse.json(
        {
          ok: false,
          error: `The generated query was refused: ${checked.reason}.`,
          sql: p.sql,
          code: "REFUSED",
        },
        { status: 422 },
      );
    }

    // A dedicated connection so the timeout cannot leak onto a pooled one.
    const conn = await pool().getConnection();
    const queryStart = Date.now();
    let rows: Record<string, unknown>[] = [];
    try {
      await applyStatementTimeout(conn);
      const [result] = await conn.query(checked.sql);
      rows = Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
    } finally {
      conn.release();
    }
    const queryMs = Date.now() - queryStart;

    // Column order comes from the rows themselves, so it always matches the
    // data even if the model's `columns` list disagrees.
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const headings =
      p.columns?.length === keys.length && keys.length ? p.columns : keys.map(prettify);

    return NextResponse.json({
      ok: true,
      answerable: true,
      question,
      headline: p.headline,
      shape: p.shape,
      confidence: p.confidence,
      caveats: p.caveats ?? [],
      sql: checked.sql,
      limitApplied: checked.addedLimit ? checked.limit : null,
      maxRows: MAX_ROWS,
      tablesUsed: p.tables_used ?? [],
      columns: headings,
      keys,
      rows: rows.map((r) => keys.map((k) => normalise(r[k]))),
      rounds: p.rounds,
      model: p.model,
      usage: p.usage,
      timing: { planMs, queryMs },
    });
  } catch (err) {
    // A GTWY failure is a different class of problem from a MySQL failure, and
    // whoever is looking at this needs to know which one happened.
    if (err instanceof GtwyError) {
      const status = err.code === "AUTH" ? 401 : err.code === "RATE_LIMIT" ? 429 : 502;
      return NextResponse.json(
        { ok: false, error: err.message, code: err.code, via: "gtwy" },
        { status },
      );
    }

    const e = err as { message?: string; code?: string; status?: number; errno?: number };

    // A query the guard allowed can still be rejected or time out in the
    // database. Matched on the error codes both servers raise — never on the
    // message text, which previously let an unrelated failure masquerade as a
    // timeout and sent us hunting the wrong bug.
    if (e.code === "ER_QUERY_TIMEOUT" || e.code === "ER_STATEMENT_TIMEOUT" ||
        e.errno === 3024 || e.errno === 1969) {
      return NextResponse.json(
        {
          ok: false,
          error: `That query took longer than ${STATEMENT_TIMEOUT_MS / 1000}s and was stopped. Try narrowing it to a date range or a single account.`,
          code: "TIMEOUT",
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { ok: false, error: e.message ?? String(err), code: e.code ?? "ERROR" },
      { status: e.status === 401 ? 401 : 500 },
    );
  }
}

/**
 * Cap how long a generated query may run.
 *
 * The two servers spell this differently and neither accepts the other's name:
 * MySQL has `max_execution_time` in milliseconds, MariaDB has
 * `max_statement_time` in seconds. Production is MySQL 5.7, local development
 * is MariaDB, so both are attempted.
 *
 * Failing to set a limit is not worth failing the request over — it is a
 * safety net, not the answer. But it must be reported, because a missing net
 * is exactly the thing you want to know about before a bad query arrives.
 */
async function applyStatementTimeout(conn: {
  query: (sql: string) => Promise<unknown>;
}): Promise<void> {
  const attempts = [
    `SET SESSION max_statement_time = ${STATEMENT_TIMEOUT_MS / 1000}`, // MariaDB
    `SET SESSION max_execution_time = ${STATEMENT_TIMEOUT_MS}`, // MySQL
  ];
  for (const stmt of attempts) {
    try {
      await conn.query(stmt);
      return;
    } catch {
      // try the other spelling
    }
  }
  console.warn(
    "[pulse] could not set a statement timeout on this server — a slow generated query will run to completion",
  );
}

/** `user_fname` → `User fname`, for when the model's headings do not line up. */
function prettify(key: string): string {
  const s = key.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Make row values JSON-safe and readable. */
function normalise(v: unknown): string | number | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace("T", " ");
  if (Buffer.isBuffer(v)) return v.toString("utf8");
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "bigint") return Number(v);
  return String(v);
}

export const dynamic = "force-dynamic";
