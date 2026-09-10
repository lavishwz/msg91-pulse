/**
 * Running the automations.
 *
 * One pass: take the automations that are due, run each one's query against
 * MSG91's read-only connection, hand the rows that are new to the worker
 * agent, and write an alert for the ones it says are worth a person's time.
 *
 * The shape is deliberately the same as the rest of Autopilot — find, judge,
 * record — so an automation somebody wrote this morning is run by the same
 * machinery as the four that shipped with the product.
 *
 * What this does NOT do, and why:
 *
 *   it does not run guards. A guard constrains an action; it has nothing to
 *   do on a schedule. automations.due() will not return one.
 *
 *   it does not trust find_sql because it was checked once. Every query goes
 *   through the guard again on the way out of the table.
 *
 *   it does not read the whole result. maxRows caps a pass, because a rule
 *   over every account would otherwise spend ten thousand agent calls the
 *   first time it ran.
 */

import { createHash, randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { read, write, acquireLock, releaseLock } from "@/lib/store";
import { guard } from "@/lib/pulse/sqlguard";
import { judgeRow } from "../agents";
import { due, recordRun, type Automation } from "./automations";

/** Long enough for an aggregate over ms_trans, short enough to not wedge a pass. */
const STATEMENT_TIMEOUT_MS = 15_000;

/**
 * How long one pass of automations may take.
 *
 * The worker takes 15-25 seconds a row against gpt-5-nano, so an automation
 * allowed its full 25 rows would hold the tick for ten minutes on its own —
 * and the tick is also what triages signups. A pass stops when the budget is
 * spent and picks up where it left off next time: the watermark has already
 * advanced past the rows that were judged, so nothing is judged twice and
 * nothing is skipped.
 */
const PASS_BUDGET_MS = 90_000;

export type AutomationRun = {
  key: string;
  rows: number;
  judged: number;
  alerts: number;
  skipped: string | null;
  error: string | null;
  ms: number;
};

export type AutomationPass = {
  ran: number;
  alerts: number;
  runs: AutomationRun[];
  /** Set when the pass did not run at all, e.g. another one holds the lock. */
  skipped?: string;
};

/**
 * The watermark for one automation, kept per automation rather than per
 * stream: two rules reading the same table advance independently, and one
 * being switched off must not hide rows from the other. The map is only a
 * read-through cache for a single pass; the store holds the real value.
 */
const MARKS = new Map<string, string>();

async function loadMark(key: string): Promise<string | null> {
  const rows = await read<{ position: string }>(
    "SELECT position FROM pulse_watermark WHERE stream = ? LIMIT 1",
    ["automation:" + key],
  );
  const pos = rows.length ? String(rows[0].position) : null;
  if (pos) MARKS.set(key, pos);
  return pos;
}

async function advanceMark(key: string, position: string, count: number): Promise<void> {
  await write(
    `INSERT INTO pulse_watermark (stream, position, last_run_at, last_count)
     VALUES (?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE position=VALUES(position), last_run_at=NOW(), last_count=VALUES(last_count)`,
    ["automation:" + key, position, count],
  );
  MARKS.set(key, position);
}

/**
 * A watermark value as a string that sorts correctly.
 *
 * The driver hands DATETIME columns back as Date objects, and String(date)
 * gives "Wed Jun 24 2026 05:21:14 GMT+0530" — which compares alphabetically,
 * so Wednesday sorts after Monday and the watermark stops meaning anything.
 * ISO is the only form where string order and time order agree.
 */
function markOf(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v ?? "");
}

/**
 * Record the decision, alert or no alert.
 *
 * pulse_decision is the Log tab, and 001_store is explicit that every branch
 * writes one — "including suppressions and failures: a gateway timeout is a
 * decision row with held = 1 and an error code, never a silent skip". This
 * runner did not, so its first four cards appeared on no surface at all: the
 * Log reads pulse_decision, and there was nothing there to read.
 *
 * A row the worker declined to alert on is the interesting case. It is the
 * only evidence that a rule ran, looked, and chose to stay quiet.
 */
async function writeDecision(
  a: Automation,
  signalKey: string,
  agentId: string,
  model: string | null,
  input: Record<string, unknown>,
  output: unknown,
  verdict: string,
  confidence: number | null,
  action: string,
  errorCode: string | null,
  usage: Record<string, unknown>,
): Promise<void> {
  await write(
    `INSERT INTO pulse_decision
        (signal_key, agent, agent_id, model, policy_version, input_digest, input_json,
         output_json, verdict, confidence, action_taken, held, hold_reason, error_code, usage_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
        output_json = VALUES(output_json), verdict = VALUES(verdict),
        confidence = VALUES(confidence), action_taken = VALUES(action_taken),
        error_code = VALUES(error_code), usage_json = VALUES(usage_json)`,
    [
      signalKey,
      "rule-worker",
      agentId,
      model,
      a.key,
      createHash("sha256").update(JSON.stringify(input)).digest("hex"),
      JSON.stringify({ rule: a.english, automation: a.key, ...input }),
      JSON.stringify(output ?? null),
      verdict,
      confidence,
      action,
      errorCode ? 1 : 0,
      errorCode ? "the worker could not judge this row" : null,
      errorCode,
      JSON.stringify(usage ?? {}),
    ],
  );
}

/** Write what the worker decided, as a card a person will see. */
async function writeAlert(
  a: Automation,
  subjectId: string | null,
  headline: string,
  detail: string,
  reasons: string[],
  confidence: number,
): Promise<boolean> {
  const key = `auto:${a.key}:${subjectId ?? "portfolio"}`;
  const res = await write(
    `INSERT INTO pulse_signal
       (signal_key, kind, subject_type, subject_id, source, state, evidence)
     VALUES (?, ?, ?, ?, 'agent', 'open', ?)
     ON DUPLICATE KEY UPDATE evidence = VALUES(evidence), updated_at = NOW()`,
    [
      key,
      "automation",
      subjectId ? "account" : "portfolio",
      subjectId,
      JSON.stringify({
        automation: a.key,
        rule: a.english,
        headline,
        detail,
        reasons,
        confidence,
      }),
    ],
  );
  /* affectedRows is 1 for an insert and 2 for an update, so a repeat of the
     same alert is not counted as a new one. */
  return res.affectedRows === 1;
}

/** What judges one row: the shared rule-worker by default, a dynamic per-automation agent when the caller supplies one. */
export type RowJudge = (ruleEnglish: string, agentTask: string, row: Record<string, unknown>) => ReturnType<typeof judgeRow>;

/** Run one automation. Never throws — a bad rule must not stop the pass. */
export async function runOne(
  a: Automation,
  deadline = Date.now() + PASS_BUDGET_MS,
  judge: RowJudge = judgeRow,
): Promise<AutomationRun> {
  const started = Date.now();
  const out: AutomationRun = {
    key: a.key, rows: 0, judged: 0, alerts: 0, skipped: null, error: null, ms: 0,
  };

  if (a.triggerKind !== "schedule") {
    out.skipped = `${a.triggerKind} automations are not run on a schedule`;
    out.ms = Date.now() - started;
    return out;
  }
  if (!a.findSql) {
    out.skipped = "no query";
    out.ms = Date.now() - started;
    return out;
  }

  /* Checked again on the way out of the table, not only on the way in. */
  const g = guard(a.findSql, Math.min(a.maxRows, 200));
  if (!g.ok) {
    out.error = "the stored query is no longer safe to run: " + g.reason;
    await recordRun(a.key, { alerts: 0, error: out.error, everyMinutes: a.everyMinutes });
    out.ms = Date.now() - started;
    return out;
  }

  let rows: Record<string, unknown>[] = [];
  try {
    // `SET STATEMENT ... FOR ...` is MariaDB syntax and does not exist on this
    // server (MySQL 5.7 / RDS) — every automation that reached this line threw
    // a syntax error, seeded ones included. MySQL 5.7.4+'s equivalent is an
    // optimizer hint inline in the SELECT itself, in milliseconds rather than
    // seconds. Found by actually running one; nothing about it was caught by
    // the guard or by TypeScript, since it is a runtime dialect mismatch.
    rows = await query<Record<string, unknown>>(
      g.sql.replace(/^\s*select\b/i, `SELECT /*+ MAX_EXECUTION_TIME(${STATEMENT_TIMEOUT_MS}) */`),
    );
  } catch (err) {
    out.error = (err as Error).message;
    await recordRun(a.key, { alerts: 0, error: out.error, everyMinutes: a.everyMinutes });
    out.ms = Date.now() - started;
    return out;
  }
  out.rows = rows.length;

  /* Only what is new since last time, when the rule said which column moves.
     Without one, every row is judged every pass — which is why the compiler is
     asked for a watermark column and the UI says so when there is none. */
  const mark = a.watermarkCol ? await loadMark(a.key) : null;
  let fresh = rows;
  if (a.watermarkCol && mark) {
    fresh = rows.filter((r) => markOf(r[a.watermarkCol!]) > mark);
  }
  fresh = fresh.slice(0, a.maxRows);

  let highest = mark ?? "";
  for (const row of fresh) {
    if (Date.now() > deadline) {
      /* Out of time. Everything judged so far is kept and the watermark below
         records it, so the next pass starts at the next unjudged row. */
      out.skipped = `budget spent after ${out.judged} of ${fresh.length} rows`;
      break;
    }
    if (a.watermarkCol) {
      const v = markOf(row[a.watermarkCol]);
      if (v > highest) highest = v;
    }
    const rowSubject = a.subjectCol ? String(row[a.subjectCol] ?? "") : null;
    const signalKey = `auto:${a.key}:${rowSubject || "portfolio"}`;
    try {
      const call = await judge(a.english, a.agentTask ?? a.english, row);
      const data = call.data;
      out.judged++;
      let acted = "none";
      if (data.should_alert && data.headline) {
        const subject = data.subject_id ?? rowSubject;
        if (await writeAlert(a, subject || null, data.headline, data.detail ?? "", data.reasons, data.confidence))
          out.alerts++;
        acted = "alerted";
      }
      await writeDecision(
        a, signalKey, call.agentId, call.model, row, data,
        data.should_alert ? "alert" : "quiet",
        data.confidence, acted, null, call.usage,
      );
    } catch (err) {
      await writeDecision(
        a, signalKey, "", null, row, null, "failed", null, "none",
        (err as Error).message.slice(0, 40), {},
      ).catch(() => {});
      /* One row failing is not the automation failing. Record it and carry on
         — the alternative is that a single malformed account silences a rule
         for everybody. */
      out.error = (err as Error).message;
    }
  }

  if (a.watermarkCol && highest && highest !== mark)
    await advanceMark(a.key, highest, fresh.length);

  await recordRun(a.key, { alerts: out.alerts, error: out.error, everyMinutes: a.everyMinutes });
  out.ms = Date.now() - started;
  return out;
}

/** One pass over everything due. Called by the tick. */
export async function runAutomations(limit = 10, budgetMs = PASS_BUDGET_MS): Promise<AutomationPass> {
  /* One pass at a time.
     A pass takes up to ninety seconds and the tick is called from outside on a
     schedule, so nothing stops a second call arriving mid-pass. Two passes
     overlapping is not merely wasted spend: each reads the automation rows for
     itself, so a pass that started before a rule changed goes on running the
     old query alongside the new one, and the alerts interleave. That happened
     the first time this ran, and it is why the lock is here rather than left
     to the caller. */
  const holder = randomUUID();
  const got = await acquireLock("automations", holder, Math.ceil(budgetMs / 1000) + 30);
  if (!got) return { ran: 0, alerts: 0, runs: [], skipped: "another pass is already running" };

  try {
    const deadline = Date.now() + budgetMs;
    const list = await due(new Date(), limit);
    const runs: AutomationRun[] = [];
    for (const a of list) {
      if (Date.now() > deadline) break;
      runs.push(await runOne(a, deadline));
    }
    return {
      ran: runs.length,
      alerts: runs.reduce((n, r) => n + r.alerts, 0),
      runs,
    };
  } finally {
    await releaseLock("automations", holder);
  }
}
