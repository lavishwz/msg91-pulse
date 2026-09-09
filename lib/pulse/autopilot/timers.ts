import { read, write, activePolicy } from "@/lib/store";
import { query } from "@/lib/db";
import { draftFor } from "./drafts";
import type { SignupFacts } from "../agents";

/**
 * Timers — what Autopilot decided to do later.
 *
 * "If nothing changes by Thursday, nudge once then hand it back" needs somewhere
 * to live. A timer is a row saying *do this thing on this date*, and the runner
 * works through whatever is due on each pass.
 *
 * ── The part that matters most is cancelling ───────────────────────────────
 * A timer that fires when it should not chases a customer who already replied,
 * already paid, or was already dropped by a rep. That is worse than not chasing
 * at all, so every due timer is re-checked against the world before it fires —
 * never trusted because it was scheduled.
 */

/** Gaps between nurture steps, in days. Overridable from pulse_policy. */
const DEFAULT_GAPS: Record<number, number> = { 2: 3, 3: 5 };

const timerKey = (userPid: string, step: number) => `nurture:${userPid}:step${step}`;

/**
 * Schedule the next nurture step.
 *
 * The key is stable, so a re-run of the same pass writes nothing rather than
 * queueing a second chase to the same person.
 */
export async function scheduleNextStep(
  userPid: string,
  signalKey: string,
  nextStep: 2 | 3,
  facts: SignupFacts,
  reasons: string[],
): Promise<boolean> {
  const gaps = await stepGaps();
  const days = gaps[nextStep] ?? DEFAULT_GAPS[nextStep];

  const res = await write(
    `INSERT IGNORE INTO pulse_timer (timer_key, signal_key, fires_at, action, payload, state)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, 'pending')`,
    [
      timerKey(userPid, nextStep),
      signalKey,
      days,
      `draft_step_${nextStep}`,
      JSON.stringify({ facts, reasons, step: nextStep }),
    ],
  );
  return res.affectedRows > 0;
}

/** The gaps, from policy rather than from a constant in this file. */
async function stepGaps(): Promise<Record<number, number>> {
  const rows = await read<{ policy_key: string; body: unknown }>(
    `SELECT policy_key, body FROM pulse_policy
      WHERE state = 'active' AND policy_key IN ('nurture.gap.step2','nurture.gap.step3')`,
  );
  const out: Record<number, number> = { ...DEFAULT_GAPS };
  for (const r of rows) {
    const body = (typeof r.body === "string" ? JSON.parse(r.body) : r.body) as { days?: number };
    if (body?.days) out[r.policy_key.endsWith("step2") ? 2 : 3] = Number(body.days);
  }
  return out;
}

type DueTimer = {
  id: number;
  timer_key: string;
  signal_key: string;
  action: string;
  payload: unknown;
  attempts: number;
};

/**
 * Should this timer still fire?
 *
 * Four ways a chase becomes wrong between being scheduled and being due. Three
 * are checkable today; a reply needs a mailbox, which is why silence detection
 * is the thing Gmail unlocks.
 */
async function cancelReason(t: DueTimer): Promise<string | null> {
  const rows = await read<{ state: string }>(
    `SELECT state FROM pulse_signal WHERE signal_key = ?`,
    [t.signal_key],
  );
  const state = rows[0]?.state;
  if (!state) return "the signal is gone";
  if (state === "resolved") return "a person already dealt with it";
  if (state === "suppressed") return "the signup was suppressed";

  // A rep who threw the last draft away does not want the next one sent either.
  const discarded = await read<{ n: number }>(
    `SELECT COUNT(*) n FROM pulse_draft WHERE signal_key = ? AND status = 'discarded'`,
    [t.signal_key],
  );
  if (Number(discarded[0]?.n ?? 0) > 0) return "a person discarded the previous draft";

  // The signal we do have without a mailbox: they started paying, or started
  // sending. Either way they are no longer someone to chase.
  const pid = t.signal_key.split(":")[1];
  if (pid && /^\d+$/.test(pid)) {
    const paid = await query<{ n: number }>(
      `SELECT COUNT(*) n FROM ms_trans
        WHERE trans_tuserid = ? AND trans_type = 1 AND payment_mode = 2
          AND trans_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [Number(pid)],
    );
    if (Number(paid[0]?.n ?? 0) > 0) return "they paid — no longer someone to chase";
  }

  return null;
}

export type TimerSweep = {
  due: number;
  fired: number;
  cancelled: number;
  failed: number;
  notes: string[];
};

/**
 * Fire whatever is due.
 *
 * Rows are claimed before they are acted on, so two overlapping runners cannot
 * both send step two. Anything left in `firing` for over an hour is a runner
 * that died mid-fire and is put back to `pending`, rather than being stuck
 * forever in a state nobody looks at.
 */
export async function sweepTimers(budgetMs: number, cap = 5): Promise<TimerSweep> {
  const started = Date.now();
  const out: TimerSweep = { due: 0, fired: 0, cancelled: 0, failed: 0, notes: [] };

  await write(
    `UPDATE pulse_timer SET state = 'pending'
      WHERE state = 'firing' AND fires_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
  );

  const policy = await activePolicy();

  // Claim first, then read back what is ours.
  const claim = `claim-${Date.now()}`;
  await write(
    `UPDATE pulse_timer SET state = 'firing', payload = JSON_SET(COALESCE(payload,'{}'), '$._claim', ?)
      WHERE state = 'pending' AND fires_at <= NOW()
      ORDER BY fires_at ASC LIMIT ?`,
    [claim, cap],
  );

  // JSON_UNQUOTE, not a bare JSON_EXTRACT comparison. Local development runs
  // MariaDB and production is MySQL 5.7, and only one of them matches a JSON
  // string against a quoted literal — this form is correct on both.
  const due = await read<DueTimer>(
    `SELECT id, timer_key, signal_key, action, payload, attempts
       FROM pulse_timer
      WHERE state = 'firing' AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$._claim')) = ?`,
    [claim],
  );
  out.due = due.length;

  for (const t of due) {
    if (Date.now() - started > budgetMs) {
      await write(`UPDATE pulse_timer SET state = 'pending' WHERE id = ?`, [t.id]);
      out.notes.push("stopped early — out of time; the rest stay pending");
      break;
    }

    const cancel = await cancelReason(t);
    if (cancel) {
      await write(`UPDATE pulse_timer SET state = 'cancelled', fired_at = NOW() WHERE id = ?`, [t.id]);
      out.cancelled += 1;
      out.notes.push(`${t.timer_key}: cancelled — ${cancel}`);
      continue;
    }

    if (policy.sendingPaused) {
      // Leave it pending rather than firing into a paused system: the customer
      // should get the message late, not never.
      await write(`UPDATE pulse_timer SET state = 'pending' WHERE id = ?`, [t.id]);
      out.notes.push(`${t.timer_key}: held — sending is paused`);
      continue;
    }

    const payload = (typeof t.payload === "string" ? JSON.parse(t.payload) : t.payload) as {
      facts?: SignupFacts;
      reasons?: string[];
      step?: number;
    };
    const step = (payload.step ?? 2) as 2 | 3;

    try {
      const { draftId } = await draftFor(payload.facts as SignupFacts, payload.reasons ?? [], ownerName(), step);
      await write(`UPDATE pulse_timer SET state = 'fired', fired_at = NOW() WHERE id = ?`, [t.id]);
      out.fired += 1;

      // Step two schedules step three. Step three schedules nothing — there is
      // no step four, by design.
      if (draftId && step === 2 && payload.facts) {
        await scheduleNextStep(payload.facts.user_pid, t.signal_key, 3, payload.facts, payload.reasons ?? []);
      }
    } catch (err) {
      const e = err as { code?: string; message?: string };
      const attempts = t.attempts + 1;
      // Three strikes, then it is visible rather than silently stuck.
      await write(
        attempts >= 3
          ? `UPDATE pulse_timer SET state = 'failed', attempts = ?, fired_at = NOW() WHERE id = ?`
          : `UPDATE pulse_timer SET state = 'pending', attempts = ? WHERE id = ?`,
        [attempts, t.id],
      );
      out.failed += 1;
      out.notes.push(`${t.timer_key}: ${e.code ?? "failed"} (attempt ${attempts})`);
    }
  }

  return out;
}

const ownerName = () => (process.env.PULSE_OWNER_NAME ?? "").trim() || "the MSG91 team";

/** What is waiting, for the Activity tab and the run response. */
export async function pendingTimers(limit = 20) {
  return read<{ timer_key: string; signal_key: string; fires_at: Date; action: string; state: string }>(
    `SELECT timer_key, signal_key, fires_at, action, state
       FROM pulse_timer WHERE state = 'pending' ORDER BY fires_at ASC LIMIT ?`,
    [limit],
  );
}
