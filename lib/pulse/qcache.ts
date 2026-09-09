import { createHash } from "node:crypto";
import { read, write, readOne } from "@/lib/store";
import type { Plan } from "./nl";

/**
 * Remembering how a question was answered.
 *
 * Ask sends a question to an agent, which writes one SELECT. Asking the same
 * question tomorrow produces the same SELECT, so paying for the translation
 * twice buys nothing.
 *
 * ── What is cached, and what is not ────────────────────────────────────────
 * The *question to SQL* translation is cached. The **answer never is** — the
 * SQL is re-run on every ask, so the numbers are always current. A cached
 * number would be a screenshot, and the handover is explicit that answers are
 * live, not screenshots.
 *
 * The cache is invalidated by `schema_version`: if the set of tables Ask may
 * read changes, yesterday's SQL may reference something that is gone, so the
 * plan is re-made rather than trusted.
 */

/**
 * Two people asking the same thing in different words should hit the same row.
 *
 * Normalisation is deliberately mild — case, spacing, trailing punctuation and
 * common filler words. Anything cleverer risks collapsing two questions that
 * differ in a way that matters ("this month" vs "last month"), and a wrong
 * cache hit is far worse than a miss.
 */
export function fingerprint(question: string, schemaVersion: string): string {
  const normalised = question
    .toLowerCase()
    .replace(/[?!.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/^(please |can you |could you |show me |tell me |give me |i want to know )/g, "")
    .trim();
  return createHash("sha256").update(`${schemaVersion}::${normalised}`).digest("hex");
}

export type CachedPlan = Plan & {
  cached: true;
  askedCount: number;
  firstAskedAt: string;
  model: string | null;
};

type Row = {
  question: string;
  sql_text: string;
  headline: string | null;
  shape: string | null;
  confidence: string | null;
  columns_json: unknown;
  tables_json: unknown;
  caveats_json: unknown;
  model: string | null;
  asked_count: number;
  first_asked_at: Date;
};

const arr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as string[];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Look for a plan we already have.
 *
 * Also counts the ask, because the Asked tab's "asked 22 times by 5 people" is
 * the thing that keeps that list short without anyone pruning it.
 */
export async function lookup(
  question: string,
  schemaVersion: string,
  who: string | null,
): Promise<CachedPlan | null> {
  const fp = fingerprint(question, schemaVersion);
  const row = await readOne<Row>(
    `SELECT question, sql_text, headline, shape, confidence, columns_json, tables_json,
            caveats_json, model, asked_count, first_asked_at
       FROM pulse_question
      WHERE fingerprint = ? AND retired = 0 AND schema_version = ?`,
    [fp, schemaVersion],
  );
  if (!row) return null;

  await write(
    `UPDATE pulse_question
        SET asked_count = asked_count + 1, last_asked_at = NOW(), last_asked_by = ?
      WHERE fingerprint = ?`,
    [who, fp],
  );

  return {
    answerable: true,
    sql: row.sql_text,
    headline: row.headline ?? "",
    shape: (row.shape ?? "table") as Plan["shape"],
    confidence: (row.confidence ?? "medium") as Plan["confidence"],
    columns: arr(row.columns_json),
    tables_used: arr(row.tables_json),
    caveats: arr(row.caveats_json),
    needs_schema_for: [],
    cached: true,
    askedCount: Number(row.asked_count) + 1,
    firstAskedAt: row.first_asked_at.toISOString(),
    model: row.model,
  };
}

/**
 * Remember a plan the agent just produced.
 *
 * Only answerable plans with real SQL are kept. A refusal is not worth
 * remembering — the data may exist tomorrow, and serving yesterday's "I cannot
 * answer that" forever would make the system look broken rather than honest.
 */
export async function remember(
  question: string,
  schemaVersion: string,
  plan: Plan,
  model: string | null,
  who: string | null,
): Promise<void> {
  if (!plan.answerable || !plan.sql?.trim()) return;

  await write(
    `INSERT INTO pulse_question
       (fingerprint, question, sql_text, headline, shape, confidence,
        columns_json, tables_json, caveats_json, model, schema_version, last_asked_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
        sql_text = VALUES(sql_text), headline = VALUES(headline), shape = VALUES(shape),
        confidence = VALUES(confidence), columns_json = VALUES(columns_json),
        tables_json = VALUES(tables_json), caveats_json = VALUES(caveats_json),
        model = VALUES(model), asked_count = asked_count + 1,
        last_asked_at = NOW(), last_asked_by = VALUES(last_asked_by), retired = 0`,
    [
      fingerprint(question, schemaVersion),
      question.slice(0, 2000),
      plan.sql,
      plan.headline?.slice(0, 500) ?? null,
      plan.shape,
      plan.confidence,
      JSON.stringify(plan.columns ?? []),
      JSON.stringify(plan.tables_used ?? []),
      JSON.stringify(plan.caveats ?? []),
      model,
      schemaVersion,
      who,
    ],
  );
}

/**
 * Stop serving a cached plan.
 *
 * This is what "this answer was wrong" does. One bad plan served fifty times is
 * worse than fifty fresh calls, so a single complaint retires it and the next
 * ask goes back to the agent.
 */
export async function retire(question: string, schemaVersion: string, reason: string): Promise<boolean> {
  const res = await write(
    `UPDATE pulse_question SET retired = 1, retired_reason = ? WHERE fingerprint = ?`,
    [reason.slice(0, 200), fingerprint(question, schemaVersion)],
  );
  return res.affectedRows > 0;
}

/** The Asked tab: what people actually ask, most-asked first. */
export async function asked(limit = 30) {
  const rows = await read<{
    question: string;
    asked_count: number;
    last_asked_at: Date;
    headline: string | null;
  }>(
    `SELECT question, asked_count, last_asked_at, headline
       FROM pulse_question
      WHERE retired = 0
      ORDER BY asked_count DESC, last_asked_at DESC
      LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    question: r.question,
    headline: r.headline,
    askedCount: Number(r.asked_count),
    lastAskedAt: r.last_asked_at.toISOString(),
  }));
}


/**
 * Questions matching what someone is typing in the command bar.
 *
 * ⌘K searched ten thousand companies and nothing else. But half of what a
 * person wants is a question they or a colleague already asked — and those are
 * the cheap ones to answer, because the SQL is already written.
 *
 * Ordered by how often it has been asked, not by how recently: a question five
 * people rely on should outrank one somebody tried once.
 */
export async function search(q: string, limit = 6) {
  const term = `%${q.replace(/[%_]/g, "")}%`;
  const rows = await read<{
    question: string;
    headline: string | null;
    asked_count: number;
    last_asked_at: Date;
  }>(
    `SELECT question, headline, asked_count, last_asked_at
       FROM pulse_question
      WHERE retired = 0 AND (question LIKE ? OR headline LIKE ?)
      ORDER BY asked_count DESC, last_asked_at DESC
      LIMIT ?`,
    [term, term, limit],
  );
  return rows.map((r) => ({
    question: r.question,
    headline: r.headline,
    askedCount: Number(r.asked_count),
    lastAskedAt: r.last_asked_at.toISOString(),
  }));
}
