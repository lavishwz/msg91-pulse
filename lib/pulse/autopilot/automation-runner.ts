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
import { due, recordRun, deferRun, automationsForEvent, type Automation } from "./automations";
import { test as testCondition } from "./rules";
import { check as checkBreaker } from "./breaker";
import { bindPlaceholders, bindValues } from "./enrich";
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

/* The watermark for one automation is kept per automation rather than per
   stream: two rules reading the same table advance independently, and one
   being switched off must not hide rows from the other. The store holds it;
   there is no in-process cache. There used to be a `MARKS` Map described as
   "a read-through cache for a single pass", but nothing ever read from it —
   loadMark always went to the database — so it was only a second copy of the
   truth that could disagree with the first. */

async function loadMark(key: string): Promise<string | null> {
  const rows = await read<{ position: string }>(
    "SELECT position FROM pulse_watermark WHERE stream = ? LIMIT 1",
    ["automation:" + key],
  );
  return rows.length ? String(rows[0].position) : null;
}

async function advanceMark(key: string, position: string, count: number): Promise<void> {
  await write(
    `INSERT INTO pulse_watermark (stream, position, last_run_at, last_count)
     VALUES (?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE position=VALUES(position), last_run_at=NOW(), last_count=VALUES(last_count)`,
    ["automation:" + key, position, count],
  );
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
  /**
   * The account this decision was about, straight off the row (scheduled) or
   * the event payload — not the model's transcription of it, for the same
   * reason writeAlert() prefers rowSubject over data.subject_id. Kept on the
   * row itself (migrations/027) rather than left for the log to reconstruct
   * by joining pulse_signal, which only ever gains a row when an alert fires
   * — a quiet verdict, the common case, had no signal row to join and
   * rendered as "Scored Account ?" regardless of which real account was
   * actually judged.
   */
  subjectId: string | null,
): Promise<void> {
  await write(
    `INSERT INTO pulse_decision
        (signal_key, agent, agent_id, model, policy_version, input_digest, input_json,
         output_json, verdict, confidence, action_taken, held, hold_reason, error_code,
         subject_id, usage_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
        /* The input too, and its digest. Without these a second decision on the
           same signal kept the first one's input_json forever: the verdict, the
           output and the timestamp all moved on while the evidence column still
           described a judgement made hours earlier. Caught while verifying
           event enrichment — the row said the judge had seen a bare payload
           when it had been given the payload plus an account's balance, because
           the row predated the lookup and was only ever updated in part.
           pulse_decision is the answer to "why did it do that?", and an input
           that belongs to a different decision than the verdict beside it is
           worse than no row at all. */
        input_json = VALUES(input_json), input_digest = VALUES(input_digest),
        output_json = VALUES(output_json), verdict = VALUES(verdict),
        confidence = VALUES(confidence), action_taken = VALUES(action_taken),
        error_code = VALUES(error_code), subject_id = VALUES(subject_id), usage_json = VALUES(usage_json),
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
      subjectId,
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
  /* Null when the worker's own number could not be read — see Confidence in
     agents.ts. The card says nothing about confidence rather than inventing
     one for it. */
  confidence: number | null,
): Promise<boolean> {
  const key = `auto:${a.key}:${subjectId ?? "portfolio"}`;

  /* What the card is doing right now decides whether this is news.
   *
   * pulse_signal has a unique key on signal_key and this used to upsert with
   * `ON DUPLICATE KEY UPDATE evidence = VALUES(evidence), updated_at = NOW()`,
   * touching everything about the row except the one column that decides
   * whether anybody sees it. So the moment a card was resolved — somebody
   * acted on it, which is the *success* case — that automation could never
   * alert on that subject again: the next alert quietly overwrote the resolved
   * row's evidence, left state = 'resolved', and the board reads
   * state = 'open'. An account tagged at-risk, dealt with, and tagged at-risk
   * again six weeks later raised nothing at all. `affectedRows === 1` is false
   * on that path too, so alert_count did not move either and the counters
   * agreed with the silence.
   *
   * Read first rather than upserting blind, because the four cases genuinely
   * differ and affectedRows cannot tell a reopen from an evidence refresh —
   * both report 2.
   *
   * 'suppressed' is the one state left alone. It means a person or a policy
   * decided this should not be shown, and log.ts has `unsuppress` as the
   * deliberate way back; an automation firing again is not consent to undo
   * that. Every other terminal state — resolved, expired, held — describes
   * something that *was* true and no longer is, so a fresh occurrence reopens
   * it and clears the resolution that no longer applies. */
  const existing = await read<{ state: string }>(
    `SELECT state FROM pulse_signal WHERE signal_key = ? LIMIT 1`,
    [key],
  );
  const was = existing[0]?.state ?? null;
  if (was === "suppressed") {
    await write(
      `UPDATE pulse_signal SET evidence = ?, updated_at = NOW() WHERE signal_key = ?`,
      [
        JSON.stringify({ automation: a.key, rule: a.english, headline, detail, reasons, confidence }),
        key,
      ],
    );
    return false;
  }

  const res = await write(
    `INSERT INTO pulse_signal
       (signal_key, kind, subject_type, subject_id, source, state, evidence)
     VALUES (?, ?, ?, ?, 'agent', 'open', ?)
     ON DUPLICATE KEY UPDATE
       evidence = VALUES(evidence),
       /* These two come before state is reassigned below: MySQL evaluates the
          assignments left to right, so reading state here still sees the old
          value rather than the 'open' about to be written. */
       resolved_at = IF(state = 'open', resolved_at, NULL),
       resolution  = IF(state = 'open', resolution, NULL),
       state = 'open',
       updated_at = NOW()`,
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
  /* A new alert is one a person has not already got: the card did not exist,
     or it existed in a state that means they were finished with it and this
     is a fresh occurrence. Refreshing the evidence on a card that is still
     open is not news, and is still not counted.

     affectedRows is not enough on its own — it is 2 both for a reopen and for
     an evidence refresh — which is why `was` was read above. */
  return was === null ? res.affectedRows === 1 : was !== "open";
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

/**
 * Does this row trip one of the automation's own neverIf conditions?
 *
 * Checked before the row ever reaches judge() — a prohibition the rule's
 * English named is enforced here, in code, against the row's real fields, not
 * left for the executor agent's prompt to remember and honour on its own. An
 * automation with no neverIf (every one built before this, and every one
 * today until automation-planner's own prompt is told to populate it) always
 * returns null and costs this one array check.
 *
 * Returns the condition that matched, so the decision written for a blocked
 * row can say plainly which one it was — not just "blocked".
 */
function neverIfHit(a: Automation, facts: Record<string, unknown>) {
  if (!a.neverIf?.length) return null;
  return a.neverIf.find((c) => testCondition(c, facts)) ?? null;
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
    /* Move the next attempt out of the past before returning. Without this the
       row keeps its old next_run_at, due() sorts it to the front of every pass,
       and a tripped automation holds one of the ten slots for as long as it
       stays tripped — starving healthy rules behind it. deferRun rather than
       recordRun because nothing actually ran. */
    await deferRun(a.key, a.everyMinutes ?? 5).catch(() => {});
    out.skipped = `stopped — ${breaker.reason}. A person has to clear it before it runs again.`;
    out.ms = Date.now() - started;
    return out;
  }

  /* Checked again on the way out of the table, not only on the way in. */
  const g = guard(a.findSql, Math.min(a.maxRows, 200));
  if (!g.ok) {
    out.error = ("the stored query is no longer safe to run: " + g.reason).slice(0, 480);
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
    out.error = (err as Error).message.slice(0, 480);
    await recordRun(a.key, { alerts: 0, error: out.error, everyMinutes: a.everyMinutes });
    out.ms = Date.now() - started;
    return out;
  }
  out.rows = rows.length;

  /* Put the rows in watermark order before anything reads them that way.
   *
   * Everything below assumes ascending order by the watermark column: the cap
   * takes fresh.slice(0, maxRows) as though it were the oldest maxRows, the
   * tie-trimming compares fresh[cut - 1] against fresh[cut] as neighbours, and
   * the mark advances to the highest value judged. None of that is true of an
   * arbitrary order.
   *
   * And the order was never ours to assume. It comes from whatever ORDER BY
   * the planner happened to write, which nothing checks — the guard is about
   * safety and the dry run only asks whether the query executes. A rule
   * ordered by anything else, or not ordered at all, judges an arbitrary
   * maxRows of its matches, advances the mark past the highest of those, and
   * every unjudged row below that value is then excluded by the strict `>` on
   * every pass after it. Silently, permanently, and precisely contrary to this
   * module's claim that nothing is skipped.
   *
   * Sorting here rather than demanding an ORDER BY at build time makes it true
   * for the rules already saved as well as the next one, and costs nothing:
   * the guard caps the result at 200 rows. */
  if (a.watermarkCol) {
    const col = a.watermarkCol;
    rows.sort((x, y) => {
      const l = markOf(x[col]), r = markOf(y[col]);
      return l < r ? -1 : l > r ? 1 : 0;
    });
  }

  /* Only what is new since last time, when the rule said which column moves.
     Without one, every row is judged every pass — which is why the compiler is
     asked for a watermark column and the UI says so when there is none. */
  const mark = a.watermarkCol ? await loadMark(a.key) : null;
  let fresh = rows;
  if (a.watermarkCol && mark) {
    fresh = rows.filter((r) => markOf(r[a.watermarkCol!]) > mark);
  }

  /* A rule with no watermark column still has to make progress.

     Without one there is nothing to filter on, so every pass took the same
     ordered result from the top. The limit that bites is not maxRows — the
     guard already caps the query's own LIMIT at that, so the fetch never
     exceeds it — it is PASS_BUDGET_MS. The worker costs 15-25 seconds a row,
     so a pass judges about five of whatever it fetched. A rule allowed fifty
     rows fetched fifty and judged the same five every time; the other
     forty-five were fetched and thrown away, in every pass, forever. Seen
     live: "find accounts whose balance has dropped close to zero" matched 50
     and judged 5, and would have kept judging those same 5 every day.

     A watermark is still the better answer and the planner is still asked for
     one. This is what happens when it cannot find one: remember how far the
     last pass reached and start the next one there, wrapping at the end. The
     result set shifts between passes, so the offset is approximate — but
     approximate rotation reaches every row eventually, and starting from zero
     reaches 10% of them and never the rest. */
  let rotatedFrom = 0;
  const rotating = !a.watermarkCol && rows.length > 0;
  if (rotating) {
    rotatedFrom = Number(await loadMark(a.key + ":offset")) || 0;
    if (!Number.isFinite(rotatedFrom) || rotatedFrom < 0 || rotatedFrom >= rows.length) rotatedFrom = 0;
    fresh = rows.slice(rotatedFrom).concat(rows.slice(0, rotatedFrom));
  }
  /* Cap the pass — but never mid-group.

     The filter above is a strict `>`, so a row whose watermark equals the
     stored mark is treated as already seen. That is correct only if the cut
     below never lands between two rows carrying the *same* value. A DATETIME
     watermark at second precision collects ties easily under any write burst,
     and when the cut fell inside such a tie the excluded rows ended up with a
     watermark equal to the new mark — excluded by `>` on every pass after
     that, forever. Trimming back to the start of the straddled group means
     the mark only ever lands on a boundary where `>` is safe. */
  if (a.watermarkCol && fresh.length > a.maxRows) {
    let cut = a.maxRows;
    const edge = markOf(fresh[cut - 1][a.watermarkCol]);
    if (markOf(fresh[cut][a.watermarkCol]) === edge) {
      while (cut > 0 && markOf(fresh[cut - 1][a.watermarkCol]) === edge) cut--;
    }
    /* A single group larger than maxRows cannot be split safely at all. Take
       the whole group rather than none of it: over-running the cap by one
       group once is recoverable, stalling the automation forever is not. */
    if (cut === 0) {
      cut = a.maxRows;
      while (cut < fresh.length && markOf(fresh[cut][a.watermarkCol]) === edge) cut++;
    }
    fresh = fresh.slice(0, cut);
  } else {
    fresh = fresh.slice(0, a.maxRows);
  }

  let highest = mark ?? "";
  for (const row of fresh) {
    if (Date.now() > deadline) {
      /* Out of time. Everything judged so far is kept and the watermark below
         records it, so the next pass starts at the next unjudged row. */
      out.skipped = rotating
        ? `budget spent after ${out.judged} of ${fresh.length} rows — the next pass resumes at row ${(rotatedFrom + out.judged) % rows.length}`
        : `budget spent after ${out.judged} of ${fresh.length} rows`;
      break;
    }
    const rowSubject = a.subjectCol ? String(row[a.subjectCol] ?? "") : null;
    const signalKey = `auto:${a.key}:${rowSubject || "portfolio"}`;
    const blocked = neverIfHit(a, row);
    if (blocked) {
      // Never reaches the agent at all — a prohibition the rule named is a
      // guarantee, not a question worth even asking.
      await writeDecision(
        a, signalKey, "", null, row, { never_if: blocked },
        "quiet", null, "blocked", null, {}, rowSubject,
      ).catch(() => {});
      out.judged++;
      if (a.watermarkCol) {
        const v = markOf(row[a.watermarkCol]);
        if (v > highest) highest = v;
      }
      continue;
    }
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
        data.confidence, acted, null, call.usage, rowSubject,
      );
      /* Advance past this row only now that it has actually been judged.

         This used to happen before the call, so a row whose judge threw —
         an agent timeout, a malformed reply — still moved the watermark past
         itself. The failure was recorded as a decision and then the row was
         never looked at again, which is a silent permanent loss of exactly
         the rows that hit a transient problem. The module header claims
         "nothing is judged twice and nothing is skipped"; this is what makes
         the second half of that true. A failed row now holds the watermark
         where it is, so the next pass starts on it again. */
      if (a.watermarkCol) {
        const v = markOf(row[a.watermarkCol]);
        if (v > highest) highest = v;
      }
    } catch (err) {
      await writeDecision(
        a, signalKey, "", null, row, null, "failed", null, "none",
        (err as Error).message.slice(0, 40), {}, rowSubject,
      ).catch(() => {});
      /* One row failing is not the automation failing. Record it and carry on
         — the alternative is that a single malformed account silences a rule
         for everybody. */
      /* Truncated: last_error is VARCHAR(500) (migrations/006) and a MySQL
         error echoes back part of the offending query, which for a generated
         find_sql routinely runs past that. Under a strict sql_mode the
         oversized write raises "Data too long", out of recordRun, out of
         runOne — turning a recorded row failure into an unrecorded pass
         failure. */
      out.error = (err as Error).message.slice(0, 480);
    }
  }

  if (a.watermarkCol && highest && highest !== mark)
    await advanceMark(a.key, highest, fresh.length);

  /* Where the next pass should pick up, for a rule with no watermark. Counts
     rows actually judged, not rows offered, so a pass that ran out of budget
     resumes on the first row it did not get to rather than skipping it. */
  if (rotating && out.judged > 0)
    await advanceMark(a.key + ":offset", String((rotatedFrom + out.judged) % rows.length), out.judged);

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
 * The payload, plus whatever the rule's optional lookup found.
 *
 * An event payload says what happened; it rarely says whether it matters.
 * `{ accountId, tag }` is enough to state that an account was tagged at-risk
 * and nothing at all to decide whether that is urgent. `enrich_sql` is one
 * SELECT stored on the rule, run here with the payload's own fields bound in,
 * so the judge sees the account's balance and history beside the event.
 *
 * Three outcomes, told apart deliberately, because collapsing them is how a
 * judge ends up inventing facts:
 *
 *   no enrichment  — the rule never asked for one. The judge gets the payload
 *                    exactly as before, which is what every automation built
 *                    before migrations/025 carries.
 *   found nothing  — the query ran and matched no row. Said explicitly, rather
 *                    than as an absent key or a row of nulls: "balance unknown"
 *                    and "balance zero" must never look the same, and the
 *                    difference decides whether a person is called.
 *   failed         — the lookup itself broke. Also said, and the judging still
 *                    happens on the payload alone: an event worth reacting to
 *                    does not stop being worth reacting to because a
 *                    supporting query timed out.
 *
 * Re-guarded here rather than trusted from the table, for the same reason
 * find_sql is: the row could have been changed by a migration, a restore, or
 * anyone with database access since it was checked at build time.
 */
async function withEnrichment(
  a: Automation,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!a.enrichSql?.trim()) return payload;

  const bound = bindPlaceholders(a.enrichSql);
  const g = guard(bound.sql, Math.min(a.maxRows ?? 50, 50));
  if (!g.ok) {
    return { ...payload, lookup: { ok: false, reason: `refused by the guard: ${g.reason}` } };
  }
  try {
    const rows = await query<Record<string, unknown>>(
      withStatementTimeout(g.sql),
      bindValues(bound.names, payload) as never,
    );
    if (!rows.length) {
      return { ...payload, lookup: { ok: true, found: 0, note: "no matching record" } };
    }
    /* One row is handed over as an object rather than a one-element array —
       the overwhelmingly common shape is "the account this event is about",
       and a judge reasons about `lookup.account.user_bal` far more reliably
       than about `lookup.rows[0].user_bal`. */
    return {
      ...payload,
      lookup: rows.length === 1
        ? { ok: true, found: 1, account: rows[0] }
        : { ok: true, found: rows.length, rows },
    };
  } catch (err) {
    return { ...payload, lookup: { ok: false, reason: (err as Error).message.slice(0, 200) } };
  }
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
  /* Declared out here so the decision row can record what the judge was
     actually given, including on the failure path. A log that shows the bare
     payload when the judge saw the payload plus a lookup is a log that
     misrepresents the evidence a decision was made on — and the whole purpose
     of pulse_decision is to be able to answer "why did it do that?" later. */
  let input: Record<string, unknown> = payload;
  try {
    input = await withEnrichment(a, payload);
    const blocked = neverIfHit(a, input);
    if (blocked) {
      // Never reaches the agent at all — a prohibition the rule named is a
      // guarantee, not a question worth even asking. recordRun below still
      // runs, same as every other row this pass.
      await writeDecision(
        a, signalKey, "", null, input, { never_if: blocked },
        "quiet", null, "blocked", null, {}, subject,
      );
      out.judged = 1;
    } else {
      const call = await judge(a.english, a.agentTask ?? a.english, input);
      const data = call.data;
      out.judged = 1;
      let acted = "none";
      if (data.should_alert && data.headline) {
        if (await writeAlert(a, subject || data.subject_id || null, data.headline, data.detail ?? "", data.reasons, data.confidence))
          out.alerts++;
        acted = "alerted";
      }
      await writeDecision(
        a, signalKey, call.agentId, call.model, input, data,
        data.should_alert ? "alert" : "quiet",
        data.confidence, acted, null, call.usage, subject,
      );
    }
  } catch (err) {
    await writeDecision(
      a, signalKey, "", null, input, null, "failed", null, "none",
      (err as Error).message.slice(0, 40), {}, subject,
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
  /* In parallel, not one after another.
     Each listener is one GTWY judging call at 15-25 seconds. Run in sequence,
     three automations listening for the same event take over a minute — and
     this runs inside the invocation of whatever write fired the event, whose
     maxDuration is the ceiling on all of it (see the note on those routes).
     Sequential listeners meant the fourth automation anybody wrote for an
     event silently never got to run. They share no state and their results
     are written independently, so there is nothing to serialize for.

     allSettled, not all: one listener throwing must not cancel the others,
     and must not reject the write that fired the event. */
  const results = await Promise.allSettled(automations.map((a) => runEventAutomation(a, payload)));
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(
        `[pulse] event automation ${automations[i].key} (${name}) failed:`,
        (r.reason as Error)?.message ?? r.reason,
      );
    }
  });
}

/** One pass over everything due. Called by the tick. */
export async function runAutomations(limit = 10, budgetMs = PASS_BUDGET_MS): Promise<AutomationPass> {
  /* One pass at a time, and one run per automation at a time.
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

      /* The same per-automation lock the webhook takes.

         The pass-wide "automations" lock above stops two *passes* overlapping,
         and the webhook takes `automation:<key>` to stop two fires of one
         automation overlapping — but those are different names, so they never
         excluded each other. A cron-job.org fire and an internal tick could
         run the same automation at the same moment: both load the same
         watermark, both fetch the same rows, both judge them, and the row is
         paid for twice and alerted on twice. Taking the webhook's own lock
         here is what makes its comment ("the same pattern runAutomations
         already uses") actually true. */
      const perHolder = randomUUID();
      if (!(await acquireLock(`automation:${a.key}`, perHolder, 300))) {
        runs.push({
          key: a.key, rows: 0, judged: 0, alerts: 0,
          skipped: "already running from its own schedule", error: null, ms: 0,
        });
        continue;
      }

      try {
        runs.push(await runOne(a, deadline));
      } catch (err) {
        /* runOne is documented never to throw, and it catches everything it
           does itself — but it also awaits the store (checkBreaker, loadMark,
           advanceMark, recordRun) outside any try, so a connection reset or a
           column overflow surfaces here rather than in the returned run.

           Without this, that one automation took the whole pass down: the
           loop stopped, and every other automation still due this tick
           silently got no run at all, with nothing recorded to say why. One
           bad rule must cost one bad rule. */
        runs.push({
          key: a.key, rows: 0, judged: 0, alerts: 0, skipped: null,
          error: (err as Error).message.slice(0, 480), ms: 0,
        });
        console.error(`[pulse] automation ${a.key} threw out of runOne:`, (err as Error).message);
      } finally {
        await releaseLock(`automation:${a.key}`, perHolder).catch(() => {});
      }
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
