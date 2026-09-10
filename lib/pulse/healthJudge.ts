/**
 * Account health, decided by the account-health agent.
 *
 * `health.ts` computes four components from the database and weighs them. That
 * arithmetic does not go away — it is what this module *sends*, and it is the
 * evidence the agent reads. What changes is who reaches the verdict: the
 * agent's score stands as given, not pulled back toward the formula.
 *
 * Two rules hold, because a health band drives missions, cards and the
 * at-risk figure a manager reads:
 *
 *   1. The formula is always computed first. It is sent to the agent as
 *      evidence, and it is the fallback for the cases in rule 2 — it is no
 *      longer an anchor the agent's answer is clamped against. A verdict the
 *      agent gives with enough confidence stands fully, band and all.
 *   2. Nothing here throws. A gateway that is down, an agent that is not
 *      configured, a reply that fails its schema — every one of those leaves
 *      the formula's own answer standing, and says so via `decidedBy`, because
 *      the alternative is the Now surface breaking rather than degrading.
 *
 * That second rule is why the surface can honestly label each score: an
 * account carries `decidedBy: "ai"` only when an agent actually answered for
 * it, `"formula"` only when none did.
 */

import { judgeHealth, healthAgentConfigured, type HealthVerdict } from "./agents";

/**
 * Below this, the verdict is discarded and the formula stands. An agent that
 * says "I am not sure" should not be the reason a manager calls a customer.
 */
export const MIN_CONFIDENCE = 0.35;

/** Accounts per gateway call. One call per account would be the cost bug. */
const BATCH = 25;

export type HealthSignals = {
  id: number;
  /** The formula's own answer, and the anchor for the clamp. */
  formulaScore: number;
  formulaPriorScore: number;
  /** What the agent is shown: the same components the formula weighed. */
  components: { label: string; value: number; weight: number; evidence: string }[];
  spend30: number;
  spendPrior30: number;
  routes: number;
  hasOwner: boolean;
  daysSincePayment: number | null;
};

export type Judgement = {
  score: number;
  priorScore: number;
  reason: string;
  confidence: number;
  /** The agent's raw answer before clamping, kept so the evidence panel can
      show when the model was reined in rather than hiding the disagreement. */
  rawScore: number;
  clamped: boolean;
  agent: string;
  model: string | null;
};

/** A score is still a number 0–100; nothing pulls it toward the formula anymore. */
const bound = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Judge every account it can, and quietly return nothing for the rest.
 *
 * The caller overlays whatever comes back and leaves the formula in place for
 * the misses, so a partial answer is useful rather than all-or-nothing: one bad
 * batch of 25 does not cost the other 200 accounts their verdicts.
 */
export async function judge(signals: HealthSignals[]): Promise<Map<number, Judgement>> {
  const out = new Map<number, Judgement>();
  if (!signals.length || !healthAgentConfigured()) return out;

  const anchors = new Map(signals.map((s) => [s.id, s]));

  for (let i = 0; i < signals.length; i += BATCH) {
    const batch = signals.slice(i, i + BATCH);
    try {
      const call = await judgeHealth(
        batch.map((s) => ({
          id: s.id,
          formula_score: s.formulaScore,
          days_since_payment: s.daysSincePayment,
          spend_last_30: s.spend30,
          spend_previous_30: s.spendPrior30,
          routes_with_balance: s.routes,
          has_owner: s.hasOwner,
          components: s.components.map((c) => ({
            what: c.label,
            scored: c.value,
            weight: c.weight,
            evidence: c.evidence,
          })),
        })),
      );

      for (const v of call.data.verdicts) {
        const anchor = anchors.get(Number(v.id));
        // An id the batch never asked about is a confused reply, not data.
        if (!anchor) continue;
        if (v.confidence < MIN_CONFIDENCE) continue;

        const score = bound(v.score_now);
        out.set(anchor.id, {
          score,
          priorScore: bound(v.score_prior),
          reason: v.reason.trim(),
          confidence: v.confidence,
          rawScore: Math.round(v.score_now),
          clamped: false,
          agent: call.agent,
          model: call.model,
        });
      }
    } catch (err) {
      // Deliberately swallowed: the formula's answer is already correct enough
      // to render, and a health band is not worth a 500 on the Now surface.
      console.warn(
        `[pulse] account-health agent failed for ${batch.length} account(s), formula stands:`,
        (err as Error).message,
      );
    }
  }

  return out;
}

/** For the note under the board, so the surface never overstates itself. */
export function verdictSummary(total: number, judged: number): "ai" | "mixed" | "formula" {
  if (!healthAgentConfigured()) return "formula";
  if (judged === 0) return "formula";
  if (judged < total) return "mixed";
  return "ai";
}

export type { HealthVerdict };
