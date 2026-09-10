import { read } from "@/lib/store";
import { all as allBreakers } from "./breaker";

/**
 * System exceptions — the things that need a person *now*, not on a tab.
 *
 * These used to live inside Autopilot. That was the wrong place: Autopilot is
 * where someone goes to check whether they trust the AI, and a person who never
 * opens it would never learn that a rule fired forty-one times or that every
 * decision for an hour was held. An alert nobody sees is not an alert.
 *
 * So they surface on Now, at Team and Company scope — the altitudes where
 * someone is responsible for the system rather than for one account. Me scope
 * deliberately gets nothing: a rep is not on call for the gateway.
 */

export type SystemAlert = {
  key: string;
  /**
   * Which scope this belongs on.
   *
   * "work" is somebody's job — a signup waiting on a call belongs in the
   * owner's own list at Me scope, because that is where a person looks for
   * things to do. "system" is the machinery — a gateway that stopped answering
   * is nobody's account and belongs at Team and Company, where somebody is
   * responsible for the system rather than for one customer.
   *
   * Mixing them was the mistake: work buried on an Autopilot tab is work nobody
   * does, and infrastructure trouble in a salesperson's morning list is noise.
   */
  audience: "work" | "system";
  severity: "act" | "watch";
  eyebrow: string;
  headline: string;
  detail: string;
  count: number;
};

/** How many held decisions in an hour is worth interrupting someone over. */
const HELD_THRESHOLD = 3;

/**
 * A policy firing far more than usual.
 *
 * The prototype tells this story as a warning: a config change at 08:58 made a
 * rule fire 41 times in an hour when normal was four. The number here is
 * deliberately low, because the cost of asking "was that expected?" is a
 * question, and the cost of not asking is 400 emailed customers.
 */
const RUNAWAY_THRESHOLD = 40;

export async function systemAlerts(): Promise<SystemAlert[]> {
  const out: SystemAlert[] = [];

  // 1. Decisions that could not be made. A gateway that stops answering is
  //    invisible otherwise: nothing breaks on screen, work simply stops.
  const held = await read<{ n: number; code: string | null }>(
    `SELECT COUNT(*) n, MAX(error_code) code
       FROM pulse_decision
      WHERE held = 1 AND at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
  );
  const heldCount = Number(held[0]?.n ?? 0);
  if (heldCount >= HELD_THRESHOLD) {
    out.push({
      key: "held",
      audience: "system",
      severity: "act",
      eyebrow: "Needs attention",
      headline: `${heldCount} decisions could not be made in the last hour.`,
      detail: `The gateway returned ${held[0]?.code ?? "an error"}. Nothing was acted on and nothing was sent — each one is held and will be tried again. If this does not clear on its own, somebody needs to look at the connection.`,
      count: heldCount,
    });
  }

  // 2. A runaway. Volume is the symptom of a config change nobody meant.
  const runaway = await read<{ agent: string; n: number }>(
    `SELECT agent, COUNT(*) n
       FROM pulse_decision
      WHERE at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY agent HAVING n >= ?`,
    [RUNAWAY_THRESHOLD],
  );
  for (const r of runaway) {
    out.push({
      key: `runaway:${r.agent}`,
      audience: "system",
      severity: "act",
      eyebrow: "Needs attention",
      headline: `${r.agent} ran ${r.n} times in an hour.`,
      detail: `That is far above normal for this volume of signups. Check whether a rule or a threshold was changed recently — a runaway automation is the failure mode that costs trust permanently.`,
      count: Number(r.n),
    });
  }

  // 3. Drafts nobody has looked at. Not urgent, but it compounds quietly, and
  //    a queue that is never emptied is the same as a feature that was never
  //    built.
  const stale = await read<{ n: number }>(
    `SELECT COUNT(*) n FROM pulse_draft
      WHERE status = 'held' AND created_at < DATE_SUB(NOW(), INTERVAL 3 DAY)`,
  );
  const staleCount = Number(stale[0]?.n ?? 0);
  if (staleCount > 0) {
    out.push({
      key: "stale-drafts",
      audience: "work",
      severity: "watch",
      eyebrow: "Watch closely",
      headline: `${staleCount} message${staleCount === 1 ? " has" : "s have"} been waiting more than three days.`,
      detail: `Written for a person to release, and nobody has. A first touch that arrives a week late is worth less than one that never went — either release them or let Autopilot know they were wrong.`,
      count: staleCount,
    });
  }

  // 4. The kill switch, left on. Easy to set during an incident and easy to
  //    forget afterwards, and while it is on nothing reaches a customer.
  const paused = await read<{ body: unknown }>(
    `SELECT body FROM pulse_policy WHERE policy_key = 'sending.paused' AND state = 'active'`,
  );
  const body = paused[0]
    ? ((typeof paused[0].body === "string" ? JSON.parse(paused[0].body) : paused[0].body) as { paused?: boolean | number })
    : null;
  if (body?.paused) {
    out.push({
      key: "paused",
      audience: "system",
      severity: "watch",
      eyebrow: "Watch closely",
      headline: "Automatic sending is paused.",
      detail: "Autopilot is still scoring signups and writing drafts, and they are stacking up. Nothing will reach a customer until somebody resumes it from the command bar.",
      count: 1,
    });
  }

  // 5. A breaker that has tripped. This is the loudest thing in the file: an
  //    agent has stopped itself and will not run again until somebody clears
  //    it, so nothing else in Autopilot is happening for that agent.
  for (const b of await allBreakers()) {
    if (!b.tripped) continue;
    out.push({
      key: `breaker:${b.agent}`,
      audience: "system",
      severity: "act",
      eyebrow: "Needs attention",
      headline: `${b.agent} stopped itself.`,
      detail: `${b.reason}. It will not run again until a person clears it. Check what changed before you do — a runaway automation usually follows a config change nobody meant.`,
      count: b.count,
    });
  }

  // 6. Signups above the call threshold that nobody has taken yet. This is the
  //    banner that used to sit on an Autopilot tab, which is the one place a
  //    person is not looking when they are deciding what to do next.
  const waiting = await read<{ n: number; oldest: Date | null }>(
    `SELECT COUNT(*) n, MIN(s.created_at) oldest
       FROM pulse_signal s
      WHERE s.state = 'open' AND s.kind = 'signup' AND s.sla_due_at IS NOT NULL`,
  );
  const waitingCount = Number(waiting[0]?.n ?? 0);
  if (waitingCount > 0) {
    out.push({
      key: "waiting",
      audience: "work",
      severity: "act",
      eyebrow: "Your hands",
      headline: `${waitingCount} signup${waitingCount === 1 ? "" : "s"} scored above the call threshold.`,
      detail: `Scored on domain history, signup progress and entity. The evidence is on each one, and the clock is running.`,
      count: waitingCount,
    });
  }

  // 6b. Cards raised by the rules people wrote themselves. These land in
  //     pulse_signal like everything else, but nothing was looking for them —
  //     the automations ran, wrote their cards, and appeared on no surface.
  const auto = await read<{ n: number; oldest: Date | null }>(
    `SELECT COUNT(*) n, MIN(s.created_at) oldest
       FROM pulse_signal s
      WHERE s.state = 'open' AND s.kind = 'automation'`,
  );
  const autoCount = Number(auto[0]?.n ?? 0);
  if (autoCount > 0) {
    out.push({
      key: "automations",
      audience: "work",
      severity: "act",
      eyebrow: "Your rules",
      headline: `${autoCount} account${autoCount === 1 ? "" : "s"} matched a rule you wrote.`,
      detail:
        "Found by the rules on the Autopilot tab, not by Pulse's own scanners. " +
        "Each one names the rule that raised it and the evidence behind it.",
      count: autoCount,
    });
  }

  return out;
}
