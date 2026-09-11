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
import { due, recordRun, automationsForEvent, type Automation } from "./automations";
import { check as checkBreaker } from "./breaker";
import type { EventName } from "./events";

/**
 * Every custom automation gets its own breaker bucket, keyed by automation.
 * Before this, every custom automation shared a single `agent = 'rule-worker'`
 * row in pulse_decision, so the breaker's per-hour count was the sum across
 * every rule anybody had written — one quiet rule and one runaway rule looked
 * like one moderately busy agent, and the runaway could hide inside the
 * combined count instead of tripping on its own.
 */
function breakerAgent(automationKey: string): string {
  return `rule-worker:${automationKey}`;
}

/**
 * Inject the MAX_EXECUTION_TIME hint right after the SELECT it needs to bound
 * — the outermost one, not a `select` that happens to appear first.
 *
 * `^\s*select\b` alone only matches a bare `SELECT ...` statement. The guard
 * also allows `WITH ... SELECT ...` (see sqlguard.ts), and a naive anchor
 * silently skipped every CTE query: the hint never got inserted, so nothing
 * bounded its execution time even though the guard's own naming
 * (STATEMENT_TIMEOUT_MS) says every automation query is supposed to be capped.
 * The fix finds the top-level SELECT — the one at paren-depth 0, i.e. outside
 * every CTE body — since that is the query MySQL actually executes last and
 * the only point a hint can legally attach to.
 */
function withStatementTimeout(sql: string): string {
  const hint = `SELECT /*+ MAX_EXECUTION_TIME(${STATEMENT_TIMEOUT_MS}) */`;
  let depth = 0;
  const re = /\(|\)|\bselect\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    if (m[0] === "(") depth++;
    else if (m[0] === ")") depth--;
    else if (depth === 0) {
      return sql.slice(0, m.index) + hint + sql.slice(m.index + m[0].length);
    }
  }
  // No top-level SELECT found (should not happen — the guard requires one);
  // run the query unmodified rather than mangling something we don't understand.
  return sql;
}

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
        error_code = VALUES(error_code), usage_json = VALUES(usage_json),
        at = CURRENT_TIMESTAMP()`,
    [
      signalKey,
      breakerAgent(a.key),
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

/** At most this many extra calls to the same agent for one row, when its answer is provably broken. */
const MAX_AGENT_RETRIES = 2;

/**
 * True only when there is deterministic proof the model's subject_id is
 * wrong — rowSubject came straight off the SQL row, so it is not a guess to
 * compare against. A subject_id of "37" when rowSubject is "37" is fine even
 * though it is also "clean"; what actually happened live was gpt-5-nano
 * answering "]=" or ":{" — pure punctuation, no id in it at all — while
 * rowSubject held the real value the whole time. This does not flag every
 * mismatch, only ones that carry no usable id at all, since a rule's own
 * find_sql sometimes legitimately hands the worker something to normalize.
 */
function looksBrokenSubject(subjectId: string | null, rowSubject: string | null): boolean {
  if (!rowSubject || !subjectId) return false;
  return !/[A-Za-z0-9]/.test(subjectId);
}

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
  /* due() already filters on state/live for the internal tick, but this is
     also reachable directly — the per-automation webhook looks the automation
     up by key and calls runOne() with no filtering of its own. Retiring an
     automation tears down its external cron job, but until this check existed
     that teardown was cosmetic: the key still worked if anything else could
     still reach the webhook (a browser history entry, a copied URL, cron-job.org
     retrying a request queued before the delete went through). */
  if (a.state !== "active" || !a.live) {
    out.skipped = `automation is ${a.state}${a.live ? "" : ", not live"} — refusing to run`;
    out.ms = Date.now() - started;
    return out;
  }
  if (!a.findSql) {
    out.skipped = "no query";
    out.ms = Date.now() - started;
    return out;
  }

  /* The breaker is checked before the work, not after — same rule runner.ts
     follows for signup-triage and outreach-drafter. This was previously never
     called for custom automations at all: the built-in flows in runner.ts
     each call checkBreaker() themselves, but this runner (used for every
     custom rule, and for the unauthenticated-by-key webhook) did not. */
  const breaker = await checkBreaker(breakerAgent(a.key));
  if (breaker.tripped) {
    out.skipped = `stopped — ${breaker.reason}. A person has to clear it before it runs again.`;
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
    rows = await query<Record<string, unknown>>(withStatementTimeout(g.sql));
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
      let call = await judge(a.english, a.agentTask ?? a.english, row);
      let retries = 0;
      // The shared gpt-5-nano key answering garbage for subject_id (the "]=",
      // ":{" corruption) while we can already tell it is wrong — rowSubject is
      // the actual value, straight off the row — is worth one or two more
      // tries at the same agent before living with it. Not a general retry-
      // on-any-error: only when we have deterministic proof this particular
      // answer is broken.
      while (looksBrokenSubject(call.data.subject_id, rowSubject) && retries < MAX_AGENT_RETRIES) {
        retries++;
        call = await judge(a.english, a.agentTask ?? a.english, row);
      }
      const data = call.data;
      out.judged++;
      let acted = "none";
      if (data.should_alert && data.headline) {
        // rowSubject came straight off the query result — it is the actual
        // value, not the model's transcription of it. Trusting data.subject_id
        // first meant a mangled echo from the shared gpt-5-nano key (seen live
        // as "]=" and ":{" while the model's own headline said "ID 37") won out
        // over a value that was never in question. Fall back to the model's
        // answer only when the query itself gave nothing to go on.
        const subject = rowSubject || data.subject_id;
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

/**
 * A payload's own natural id, when it has one — `accountId` for the tag and
 * reassignment events, `email`/`memberEmail` for the member and connection
 * ones. There is no SQL row here to pull a subject column off (see runOne),
 * so this is the event-mode equivalent: whichever of these keys the payload
 * actually carries, in the order an account id is preferred over an email.
 */
function subjectOfPayload(payload: Record<string, unknown>): string | null {
  for (const key of ["accountId", "email", "memberEmail"]) {
    const v = payload[key];
    if (v !== undefined && v !== null && String(v).trim()) return String(v);
  }
  return null;
}

/**
 * Run one event-triggered automation against the one payload that just
 * happened. The event-mode counterpart to `runOne`: there is no query to run
 * and no watermark to advance — the payload itself is the one row to judge,
 * so this is `runOne` with the find/fresh/loop machinery stripped out and the
 * same breaker, decision log and alert-writing kept.
 */
export async function runEventAutomation(
  a: Automation,
  payload: Record<string, unknown>,
  judge: RowJudge = judgeRow,
): Promise<AutomationRun> {
  const started = Date.now();
  const out: AutomationRun = {
    key: a.key, rows: 1, judged: 0, alerts: 0, skipped: null, error: null, ms: 0,
  };

  if (a.triggerKind !== "event") {
    out.skipped = `${a.triggerKind} automations do not run off an event`;
    out.ms = Date.now() - started;
    return out;
  }
  if (a.state !== "active" || !a.live) {
    out.skipped = `automation is ${a.state}${a.live ? "" : ", not live"} — refusing to run`;
    out.ms = Date.now() - started;
    return out;
  }

  const breaker = await checkBreaker(breakerAgent(a.key));
  if (breaker.tripped) {
    out.skipped = `stopped — ${breaker.reason}. A person has to clear it before it runs again.`;
    out.ms = Date.now() - started;
    return out;
  }

  const subject = subjectOfPayload(payload);
  const signalKey = `auto:${a.key}:${subject || "event"}`;
  try {
    const call = await judge(a.english, a.agentTask ?? a.english, payload);
    const data = call.data;
    out.judged = 1;
    let acted = "none";
    if (data.should_alert && data.headline) {
      if (await writeAlert(a, subject || data.subject_id || null, data.headline, data.detail ?? "", data.reasons, data.confidence))
        out.alerts++;
      acted = "alerted";
    }
    await writeDecision(
      a, signalKey, call.agentId, call.model, payload, data,
      data.should_alert ? "alert" : "quiet",
      data.confidence, acted, null, call.usage,
    );
  } catch (err) {
    await writeDecision(
      a, signalKey, "", null, payload, null, "failed", null, "none",
      (err as Error).message.slice(0, 40), {},
    ).catch(() => {});
    out.error = (err as Error).message;
  }

  // Not a schedule, so `everyMinutes` means nothing here — recordRun still
  // stamps last_run_at/run_count, which the manifest and the log both read.
  await recordRun(a.key, { alerts: out.alerts, error: out.error, everyMinutes: null });
  out.ms = Date.now() - started;
  return out;
}

/**
 * Announce that something happened, and run whatever is listening for it.
 *
 * Called synchronously from inside the write path that caused it (e.g.
 * `addTag`/`removeTag` right after the insert succeeds) — there is no queue
 * and no polling, which is what makes this "instant" rather than "next tick".
 * One automation misbehaving must not stop the write that triggered it or any
 * other listener, so every automation is run independently and a failure is
 * logged rather than thrown.
 */
export async function emitEvent(name: EventName, payload: Record<string, unknown>): Promise<void> {
  let automations: Automation[] = [];
  try {
    automations = await automationsForEvent(name);
  } catch (err) {
    console.error(`[pulse] could not look up automations for event ${name}:`, (err as Error).message);
    return;
  }
  for (const a of automations) {
    try {
      await runEventAutomation(a, payload);
    } catch (err) {
      console.error(`[pulse] event automation ${a.key} (${name}) failed:`, (err as Error).message);
    }
  }
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
