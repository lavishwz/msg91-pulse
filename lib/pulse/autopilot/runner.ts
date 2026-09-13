import { createHash, randomUUID } from "node:crypto";
import { triageSignups, type SignupFacts, type TriageResult } from "../agents";
import { signupFacts } from "../facts";
import {
  activePolicy, advanceWatermark, watermark, write, read, readOne,
  acquireLock, releaseLock, lockState,
} from "@/lib/store";
import { draftFor } from "./drafts";
import { scheduleNextStep, sweepTimers, type TimerSweep } from "./timers";
import { rulesByMotion, evaluate, type MotionRule } from "./rules";
import { check as checkBreaker } from "./breaker";
import { runDaily, type DailyResult } from "./daily";

/**
 * The Autopilot runner — one bounded pass, driven by cron.
 *
 * ── Where things are written ───────────────────────────────────────────────
 * Reads come from MSG91's schema through `lib/db.ts`, which has SELECT and
 * nothing else. Every write in this file goes through `lib/store.ts`, a
 * separate pool pointed at Pulse's own schema. The two never cross: nothing
 * here can write to MSG91's database, by construction rather than by care.
 *
 * Never triggered by a page load. A person opening a tab must not cause the
 * system to act on a customer, and a runner that only runs when someone is
 * looking is not a runner.
 *
 * The pass, in order:
 *
 *   read policy (kill switch first) → read watermark → assemble facts (SQL)
 *     → call the agent → write a decision for every signup → advance watermark
 *
 * The order of the last two matters. The watermark advances only after the
 * decisions are committed, so a crash mid-batch re-reads rather than skips.
 * Re-reading is safe because every signal key is unique; skipping would lose a
 * customer with nothing to show it happened.
 */

/** Never triage more than this in one tick, whatever the backlog. */
const BATCH = 10;

/** Where the signup stream starts on a store that has never run. */
const EPOCH = "2026-09-01 00:00:00";

export type TickResult = {
  ok: boolean;
  stream: "signups";
  read: number;
  decided: number;
  raised: number;
  nurtured: number;
  suppressed: number;
  failed: number;
  paused: boolean;
  watermarkFrom: string;
  watermarkTo: string | null;
  policyVersion: string;
  ms: number;
  notes: string[];
};

/** A stable key for one signup, so a re-run cannot double-triage it. */
const signalKey = (userPid: string) => `signup:${userPid}`;

/** What the agent was shown, hashed — two identical inputs with different
 *  outputs mean the agent drifted, and that comparison is Agent 7's whole job. */
function digest(facts: SignupFacts): string {
  return createHash("sha256").update(JSON.stringify(facts)).digest("hex");
}

async function upsertSignal(facts: SignupFacts, evidence: string[], slaHours: number | null) {
  if (slaHours === null) {
    await write(
      `INSERT INTO pulse_signal (signal_key, kind, subject_type, subject_id, source, evidence)
            VALUES (?, 'signup', 'signup', ?, 'agent', ?)
       ON DUPLICATE KEY UPDATE evidence = VALUES(evidence)`,
      [signalKey(facts.user_pid), facts.user_pid, JSON.stringify(evidence)],
    );
    return;
  }
  await write(
    `INSERT INTO pulse_signal (signal_key, kind, subject_type, subject_id, source, evidence, sla_due_at)
          VALUES (?, 'signup', 'signup', ?, 'agent', ?, DATE_ADD(NOW(), INTERVAL ? HOUR))
     ON DUPLICATE KEY UPDATE evidence = VALUES(evidence), sla_due_at = VALUES(sla_due_at)`,
    [signalKey(facts.user_pid), facts.user_pid, JSON.stringify(evidence), slaHours],
  );
}

type DecisionRow = {
  key: string;
  agent: string;
  agentId: string | null;
  model: string | null;
  policyVersion: string;
  digest: string;
  input: unknown;
  output: unknown;
  verdict: string | null;
  score: number | null;
  confidence: number | null;
  action: string;
  held: boolean;
  holdReason: string | null;
  errorCode: string | null;
  usage: unknown;
};

async function writeDecision(row: DecisionRow) {
  await write(
    `INSERT INTO pulse_decision
        (signal_key, agent, agent_id, model, policy_version, input_digest, input_json,
         output_json, verdict, score, confidence, action_taken, held, hold_reason,
         error_code, usage_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
        output_json = VALUES(output_json), verdict = VALUES(verdict),
        score = VALUES(score), confidence = VALUES(confidence),
        action_taken = VALUES(action_taken), held = VALUES(held),
        hold_reason = VALUES(hold_reason), error_code = VALUES(error_code),
        input_digest = VALUES(input_digest), usage_json = VALUES(usage_json)`,
    [
      row.key, row.agent, row.agentId, row.model, row.policyVersion, row.digest,
      JSON.stringify(row.input), JSON.stringify(row.output), row.verdict, row.score,
      row.confidence, row.action, row.held ? 1 : 0, row.holdReason, row.errorCode,
      JSON.stringify(row.usage ?? {}),
    ],
  );
}

/**
 * Turn a score into a verdict, using the motion's rules.
 *
 * The rules are rows — the same rows a person reads on the Rules tab — and they
 * are evaluated here, in code. The agent never sees a threshold: it returns a
 * score and its reasons, and the rules decide what that means. A rule written
 * into a prompt is guidance a model usually follows; a rule evaluated here is a
 * control that always holds.
 *
 * The thresholds also still exist as their own policy rows, and are used as the
 * fallback when no rule matches — so a motion with its rules retired degrades to
 * the documented default rather than to nothing.
 */
function applyRules(
  r: TriageResult,
  rules: MotionRule[],
  t: { humanNow: number; nurture: number; suppressConfidenceFloor: number },
): { verdict: TriageResult["verdict"]; action: string; ruleKey: string | null; note: string | null } {
  const match = evaluate(rules, "signup_scored", { score: r.score, confidence: r.confidence, verdict: r.verdict });

  const byRule: TriageResult["verdict"] | null = match
    ? match.action.do === "raise_card" ? "human_now"
      : match.action.do === "nurture" ? "nurture"
      : match.action.do === "suppress" ? "suppress"
      : null
    : null;

  // No rule matched — fall back to the thresholds, and say so rather than
  // silently doing nothing.
  const byScore: TriageResult["verdict"] =
    r.score >= t.humanNow ? "human_now" : r.score >= t.nurture ? "nurture" : "suppress";

  let verdict = byRule ?? byScore;
  let note: string | null = byRule ? null : `${r.user_pid}: no rule matched at score ${r.score}; used the default thresholds`;

  if (byRule && byRule !== r.verdict) {
    note = `${r.user_pid}: agent said ${r.verdict} at score ${r.score}; the rules say ${byRule}`;
  }

  // The confidence floor, last and unconditional. A weak suppression is the one
  // error nobody notices — the customer who was never called leaves no trace.
  if (verdict === "suppress" && r.confidence < t.suppressConfidenceFloor) {
    verdict = "nurture";
    note = `${r.user_pid}: suppression refused at confidence ${r.confidence} — below the ${t.suppressConfidenceFloor} floor`;
  }

  const action =
    verdict === "human_now" ? "card raised" : verdict === "nurture" ? "nurture queued" : "suppressed";

  return { verdict, action, ruleKey: match?.rule.key ?? null, note };
}

/**
 * One pass over new signups.
 *
 * Returns what it did rather than throwing on a bad batch: a tick that fails
 * halfway still has to report, and the failure itself is written as a held
 * decision row so it appears in the log like any other outcome.
 */
export async function tickSignups(): Promise<TickResult> {
  const started = Date.now();
  const notes: string[] = [];

  const policy = await activePolicy();
  const from = await watermark("signups", EPOCH);

  const base: TickResult = {
    ok: true, stream: "signups", read: 0, decided: 0, raised: 0, nurtured: 0,
    suppressed: 0, failed: 0, paused: policy.sendingPaused, watermarkFrom: from,
    watermarkTo: null, policyVersion: policy.version, ms: 0, notes,
  };

  // The kill switch stops *sending*, not *thinking*. Triage still runs and is
  // still logged; nothing reaches a customer either way, because drafting is a
  // separate step that checks the same flag.
  if (policy.sendingPaused) notes.push("sending is paused — triage still runs, nothing will be sent");

  // The breaker is checked before the work, not after: one that trips on the
  // way out has already let the damage through.
  const breaker = await checkBreaker("signup-triage");
  if (breaker.tripped) {
    notes.push(`signup-triage is stopped — ${breaker.reason}. A person has to clear it before it runs again.`);
    base.ok = false;
    base.ms = Date.now() - started;
    return base;
  }

  const { facts, cursor } = await signupFacts(from, BATCH);
  base.read = facts.length;

  if (!facts.length) {
    base.ms = Date.now() - started;
    return base;
  }

  let results: TriageResult[];
  let model: string | null = null;
  let agentId: string | null = null;
  let usage: unknown = {};

  try {
    const call = await triageSignups(facts, policy.version);
    results = call.data;
    model = call.model;
    agentId = call.agentId;
    usage = call.usage;
  } catch (err) {
    // A gateway failure is a held decision per signup, never a silent skip and
    // never a lost watermark: the batch stays unread and the next tick retries.
    const e = err as { code?: string; message?: string };
    for (const f of facts) {
      await writeDecision({
        key: signalKey(f.user_pid), agent: "signup-triage", agentId: null, model: null,
        policyVersion: policy.version, digest: digest(f), input: f, output: null,
        verdict: null, score: null, confidence: null, action: "none",
        held: true, holdReason: e.message?.slice(0, 120) ?? "agent call failed",
        errorCode: e.code ?? "UNKNOWN", usage: {},
      });
    }
    base.ok = false;
    base.failed = facts.length;
    base.ms = Date.now() - started;
    notes.push(`agent call failed: ${e.code ?? "UNKNOWN"} — ${facts.length} held, watermark not advanced`);
    return base;
  }

  const byPid = new Map(facts.map((f) => [f.user_pid, f]));

  // The motion's rules, read fresh each pass: a rule edited two minutes ago
  // must apply to this batch, not to the one after a restart.
  const inboundRules = (await rulesByMotion()).inbound;

  // Whose name goes on the draft. Ownership is not assigned at signup time yet,
  // so this is Pulse's configured admin until the assignment step exists.
  const ownerName = (process.env.PULSE_OWNER_NAME ?? "").trim() || "the MSG91 team";
  // Same identity's saved voice (Profile → "How you write", pulse_user_voice),
  // looked up by email since that is the traits table's key. Unset until the
  // per-signup owner-assignment step above exists — null falls through to the
  // honest "no samples yet" text in draftFor rather than a wrong voice.
  const ownerEmail = (process.env.PULSE_OWNER_EMAIL ?? "").trim() || null;

  for (const r of results) {
    const f = byPid.get(r.user_pid);
    if (!f) continue;

    const { verdict, action, ruleKey, note } = applyRules(r, inboundRules, policy.thresholds);
    if (note) notes.push(note);

    // Card fatigue is the number one way this product dies (handover §10). A
    // second person signing up from a domain that already has a card open does
    // not deserve a second card — it deserves a line on the one that exists.
    const merged = verdict === "human_now" ? await mergeIntoOpenSignal(f, r.reasons) : null;
    if (merged) {
      notes.push(`${r.user_pid}: merged into ${merged} — that domain already has a card open`);
    } else {
      await upsertSignal(f, r.reasons, verdict === "human_now" ? 4 : null);
    }
    await writeDecision({
      key: signalKey(r.user_pid), agent: "signup-triage", agentId, model,
      policyVersion: policy.version, digest: digest(f), input: f,
      // The rule that produced the verdict is recorded with the decision, so
      // "why did it do that?" resolves to a row a person can read and edit.
      output: { ...r, verdict_after_policy: verdict, rule: ruleKey },
      verdict, score: r.score, confidence: r.confidence, action,
      held: false, holdReason: null, errorCode: null, usage,
    });

    await write(`UPDATE pulse_signal SET state = ? WHERE signal_key = ?`, [
      verdict === "suppress" ? "suppressed" : "open",
      signalKey(r.user_pid),
    ]);

    base.decided += 1;
    if (verdict === "human_now") base.raised += 1;
    else if (verdict === "nurture") base.nurtured += 1;
    else base.suppressed += 1;
  }

  // Drafting used to happen here, inside the same pass. It is now its own phase
  // (`draftPending` below) because one draft is a whole agent call — three of
  // them turned a 15-second tick into nearly three minutes, and a scheduled
  // caller every five minutes cannot wait that long for the part that matters.
  // Triage is what has an SLA; drafting can be a minute late.

  // Only now. Everything above is committed.
  if (cursor) {
    await advanceWatermark("signups", cursor, base.decided);
    base.watermarkTo = cursor;
  }

  base.ms = Date.now() - started;
  return base;
}

/**
 * Is there already an open card for this company's domain?
 *
 * Matching on domain rather than on account id is deliberate: "someone new at
 * Trellis just signed up" is the same conversation as the card already sitting
 * in a rep's list, and two cards for one company is how a deck becomes noise.
 *
 * Returns the signal key it merged into, or null when this one stands alone.
 */
async function mergeIntoOpenSignal(f: SignupFacts, reasons: string[]): Promise<string | null> {
  if (!f.email_domain || f.is_free_mail) return null; // a free mailbox is not a company

  const open = await read<{ signal_key: string; evidence: unknown }>(
    `SELECT s.signal_key, s.evidence
       FROM pulse_signal s
       JOIN pulse_decision d ON d.signal_key = s.signal_key AND d.agent = 'signup-triage'
      WHERE s.state = 'open' AND s.kind = 'signup'
        AND s.subject_id <> ?
        AND JSON_UNQUOTE(JSON_EXTRACT(d.input_json, '$.email_domain')) = ?
      ORDER BY s.created_at ASC LIMIT 1`,
    [f.user_pid, f.email_domain],
  );
  const target = open[0];
  if (!target) return null;

  const existing = Array.isArray(target.evidence)
    ? (target.evidence as string[])
    : typeof target.evidence === "string"
      ? (JSON.parse(target.evidence || "[]") as string[])
      : [];

  const line = `Someone else at ${f.email_domain} signed up too: ${f.company_name ?? "no name given"}.`;
  if (!existing.includes(line)) {
    await write(`UPDATE pulse_signal SET evidence = ? WHERE signal_key = ?`, [
      JSON.stringify([...existing, line, ...reasons.slice(0, 1)]),
      target.signal_key,
    ]);
  }
  return target.signal_key;
}

/** What the log looks like right now — used by the tick response and the UI. */
export async function storeSummary() {
  return readOne<{ decisions: number; signals: number; drafts: number; open_signals: number }>(
    `SELECT (SELECT COUNT(*) FROM pulse_decision) decisions,
            (SELECT COUNT(*) FROM pulse_signal)   signals,
            (SELECT COUNT(*) FROM pulse_draft)    drafts,
            (SELECT COUNT(*) FROM pulse_signal WHERE state = 'open') open_signals`,
  );
}


/* ── drafting, as its own phase ──────────────────────────────────────────── */

/**
 * How many drafts one pass may write. Each is a full agent call (~55s).
 *
 * The cap is reported in `notes` rather than applied silently: a bound nobody
 * can see reads as "we drafted for everyone" when it did not.
 */
const DRAFT_CAP = 3;

export type DraftPhaseResult = { considered: number; drafted: number; skipped: number; notes: string[] };

/**
 * Write messages for decisions that deserve one and do not have one yet.
 *
 * Deliberately separate from triage, and deliberately re-derived from the store
 * rather than passed along in memory: a draft that failed last pass, or a
 * signup drafted for before the runner restarted, is picked up here without any
 * special retry path. The query *is* the retry.
 */
export async function draftPending(budgetMs: number): Promise<DraftPhaseResult> {
  const started = Date.now();
  const out: DraftPhaseResult = { considered: 0, drafted: 0, skipped: 0, notes: [] };

  const breaker = await checkBreaker("outreach-drafter");
  if (breaker.tripped) {
    out.notes.push(`outreach-drafter is stopped — ${breaker.reason}. Nothing was written.`);
    return out;
  }

  const rows = await read<{ signal_key: string; input_json: unknown; output_json: unknown }>(
    `SELECT d.signal_key, d.input_json, d.output_json
       FROM pulse_decision d
       LEFT JOIN pulse_draft f ON f.signal_key = d.signal_key AND f.sequence_step = 1
      WHERE d.agent = 'signup-triage'
        AND d.verdict IN ('human_now','nurture')
        AND d.held = 0
        AND f.id IS NULL
      ORDER BY d.score DESC
      LIMIT ?`,
    [DRAFT_CAP],
  );

  out.considered = rows.length;
  const ownerName = (process.env.PULSE_OWNER_NAME ?? "").trim() || "the MSG91 team";
  const ownerEmail = (process.env.PULSE_OWNER_EMAIL ?? "").trim() || null;

  for (const r of rows) {
    if (Date.now() - started > budgetMs) {
      out.notes.push(`stopped early — out of time. ${rows.length - out.drafted - out.skipped} left for the next pass.`);
      break;
    }
    // A decision with no facts stored cannot be drafted from. That should not
    // happen, but a row written by an older version — or by hand — must not
    // take the whole pass down with it.
    const facts = (typeof r.input_json === "string" ? JSON.parse(r.input_json) : r.input_json) as SignupFacts | null;
    if (!facts?.user_pid) {
      out.skipped += 1;
      out.notes.push(`${r.signal_key}: no facts stored, cannot draft`);
      continue;
    }
    const output = (typeof r.output_json === "string" ? JSON.parse(r.output_json) : r.output_json) as {
      reasons?: string[];
    };
    try {
      const { draftId, holdReason } = await draftFor(facts, output?.reasons ?? [], ownerName, 1, ownerEmail);
      if (draftId) {
        out.drafted += 1;
        // Message one is written; message two is now a dated row rather than
        // something anyone has to remember.
        await scheduleNextStep(facts.user_pid, r.signal_key, 2, facts, output?.reasons ?? []);
      } else {
        out.skipped += 1;
        if (holdReason) out.notes.push(`${facts.user_pid}: no draft — ${holdReason}`);
      }
    } catch (err) {
      const e = err as { code?: string; message?: string };
      out.skipped += 1;
      out.notes.push(`${facts.user_pid}: draft failed (${e.code ?? "UNKNOWN"})`);
      await write(
        `INSERT INTO pulse_decision
            (signal_key, agent, policy_version, input_digest, verdict, action_taken, held, hold_reason, error_code)
         VALUES (?, 'outreach-drafter', NULL, SHA2(CONCAT('draftfail:', ?), 256), NULL, 'none', 1, ?, ?)
         ON DUPLICATE KEY UPDATE held = 1, hold_reason = VALUES(hold_reason), error_code = VALUES(error_code)`,
        [r.signal_key, r.signal_key, e.message?.slice(0, 120) ?? "draft failed", e.code ?? "UNKNOWN"],
      );
    }
  }

  return out;
}

/* ── one scheduled run ───────────────────────────────────────────────────── */

export type RunResult = {
  ok: boolean;
  ran: boolean;
  reason?: string;
  signups?: TickResult;
  drafts?: DraftPhaseResult;
  timers?: TimerSweep;
  daily?: DailyResult;
  ms: number;
};

/** Total wall clock one run may take. Kept under a five-minute schedule. */
const RUN_BUDGET_MS = 240_000;

/**
 * Everything one scheduled call should do.
 *
 * This is the only entry point a scheduler needs. It takes a lock, runs the
 * phases in order of urgency, and stops when the budget is spent — whatever is
 * left is simply picked up by the next call, because every phase re-derives its
 * work from the store rather than from anything held in memory.
 *
 * Triage runs first and always. Drafting gets whatever time is left: a signup
 * that crossed the threshold has an SLA measured in minutes, and a message that
 * is written a minute later costs nothing.
 */
export async function runAutopilot(): Promise<RunResult> {
  const started = Date.now();
  const holder = randomUUID();

  // Slightly longer than the budget, so a run that overshoots still holds its
  // lock rather than letting the next call in on top of it.
  const got = await acquireLock("autopilot", holder, Math.ceil(RUN_BUDGET_MS / 1000) + 60);
  if (!got) {
    const held = await lockState("autopilot");
    return {
      ok: true,
      ran: false,
      reason: `another run is in progress (since ${held?.acquired_at?.toISOString() ?? "unknown"})`,
      ms: Date.now() - started,
    };
  }

  try {
    const signups = await tickSignups();
    const left = RUN_BUDGET_MS - (Date.now() - started);
    const drafts = left > 30_000
      ? await draftPending(left - 15_000)
      : { considered: 0, drafted: 0, skipped: 0, notes: ["no time left for drafting this pass"] };

    // Timers last: a follow-up that is a few minutes late costs nothing, and a
    // new signup waiting on triage costs an SLA.
    const stillLeft = RUN_BUDGET_MS - (Date.now() - started);
    const timers = stillLeft > 20_000
      ? await sweepTimers(stillLeft - 10_000)
      : { due: 0, fired: 0, cancelled: 0, failed: 0, notes: ["no time left for timers this pass"] };

    // The daily pass, at most once a day. It scans accounts rather than
    // signups, so running it every five minutes would be three hundred wasted
    // queries an hour for a condition that changes once a day.
    const lastDaily = await watermark("daily", "");
    const todayStr = new Date().toISOString().slice(0, 10);
    let daily: DailyResult | undefined;
    if (lastDaily !== todayStr && RUN_BUDGET_MS - (Date.now() - started) > 15_000) {
      daily = await runDaily();
      await advanceWatermark("daily", todayStr, daily.raised);
    }

    return { ok: signups.ok, ran: true, signups, drafts, timers, daily, ms: Date.now() - started };
  } finally {
    await releaseLock("autopilot", holder);
  }
}
