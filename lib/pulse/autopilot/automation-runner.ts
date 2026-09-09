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

import { query } from "@/lib/db";
import { read, write } from "@/lib/store";
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

/** Run one automation. Never throws — a bad rule must not stop the pass. */
export async function runOne(a: Automation, deadline = Date.now() + PASS_BUDGET_MS): Promise<AutomationRun> {
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
    rows = await query<Record<string, unknown>>(
      `SET STATEMENT max_statement_time=${STATEMENT_TIMEOUT_MS / 1000} FOR ${g.sql}`,
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
    fresh = rows.filter((r) => String(r[a.watermarkCol!] ?? "") > mark);
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
      const v = String(row[a.watermarkCol] ?? "");
      if (v > highest) highest = v;
    }
    try {
      const { data } = await judgeRow(a.english, a.agentTask ?? a.english, row);
      out.judged++;
      if (data.should_alert && data.headline) {
        const subject = data.subject_id ?? (a.subjectCol ? String(row[a.subjectCol] ?? "") : null);
        if (await writeAlert(a, subject || null, data.headline, data.detail ?? "", data.reasons, data.confidence))
          out.alerts++;
      }
    } catch (err) {
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
}
