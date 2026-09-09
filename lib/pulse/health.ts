/**
 * Account health — the number behind the score band and the board.
 *
 * MSG91's schema stores no health score, so Pulse derives one from four things
 * the database *does* know, each weighted (handover §11 — a derivation, never
 * presented as a stored fact):
 *
 *   recency  30%  how long since the account last paid for anything
 *   trend    30%  spend in the last 30 days against the 30 before it
 *   breadth  25%  how many routes the account actually holds balance on
 *   owner    15%  whether a human at MSG91 is responsible for it
 *
 * Bands are the thresholds the design was drawn against: 70+ thriving,
 * 50–69 steady, 35–49 wobbling, below that at risk.
 *
 * The month's movement is the same formula run over windows shifted back
 * thirty days, so "climbed a band this month" is computed rather than
 * asserted. Breadth and ownership have no history in this schema — the
 * prior score holds them at today's value, which is stated in the evidence
 * the account page shows rather than hidden.
 *
 * Cost: ms_trans has ~1M rows and no secondary index, so this never scans it
 * for the whole customer base. One grouped pass bounded by an explicit list of
 * account ids, one grouped pass over ms_text_bal, and nothing else.
 */

import { query } from "@/lib/db";

export type Band = "thriving" | "steady" | "wobbling" | "risk";

export type HealthComponent = {
  label: string;
  /** 0–100 */
  value: number;
  /** Share of the score, 0–1. */
  weight: number;
  /** Why the component scored what it did, in a rep's words. */
  evidence: string;
};

export type AccountHealth = {
  id: number;
  score: number;
  band: Band;
  /** Spend in the last thirty days, native currency, for "what that protects". */
  spend30: number;
  /** Score now minus the score thirty days ago. */
  delta: number;
  /** Set when the account changed band this month. */
  moved: "up" | "down" | null;
  components: HealthComponent[];
};

export const BAND_ORDER: Band[] = ["thriving", "steady", "wobbling", "risk"];

export function bandOf(score: number): Band {
  if (score >= 70) return "thriving";
  if (score >= 50) return "steady";
  if (score >= 35) return "wobbling";
  return "risk";
}

const WEIGHTS = { recency: 0.3, trend: 0.3, breadth: 0.25, owner: 0.15 };

/** Days since a payment, scored. Never paid at all is not the same as stale. */
function recencyScore(days: number | null): number {
  if (days == null) return 0;
  if (days <= 7) return 100;
  if (days <= 14) return 85;
  if (days <= 30) return 70;
  if (days <= 60) return 45;
  if (days <= 90) return 25;
  return 5;
}

/** This window's spend against the last one. */
function trendScore(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 90 : 20;
  if (current <= 0) return 5;
  const ratio = current / previous;
  if (ratio >= 1.25) return 100;
  if (ratio >= 1) return 85;
  if (ratio >= 0.75) return 60;
  if (ratio >= 0.5) return 35;
  return 10;
}

/** Routes the account holds balance on — Pulse's only honest proxy for
 *  product breadth, since no table maps a route id to a product name. */
function breadthScore(routes: number): number {
  if (routes >= 4) return 100;
  if (routes === 3) return 80;
  if (routes === 2) return 60;
  if (routes === 1) return 35;
  return 10;
}

function weigh(parts: { recency: number; trend: number; breadth: number; owner: number }): number {
  return Math.round(
    parts.recency * WEIGHTS.recency +
      parts.trend * WEIGHTS.trend +
      parts.breadth * WEIGHTS.breadth +
      parts.owner * WEIGHTS.owner,
  );
}

function daysBetween(from: Date | null, to: Date): number | null {
  if (!from) return null;
  return Math.max(0, Math.floor((to.getTime() - new Date(from).getTime()) / 86400000));
}

function trendWords(current: number, previous: number): string {
  if (previous <= 0 && current > 0) return "first spend in this window, nothing in the one before";
  if (previous <= 0 && current <= 0) return "no spend in either window";
  if (current <= 0) return "spent nothing this window, after spending before";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "flat against the previous thirty days";
  return `${pct > 0 ? "up" : "down"} ${Math.abs(pct)}% against the previous thirty days`;
}

type TransRow = {
  id: number;
  last_at: Date | null;
  last_at_prior: Date | null;
  w0: string | null;
  w1: string | null;
  w2: string | null;
};

/**
 * Health for an explicit list of accounts.
 *
 * `owned` says which of them have an owner — it comes off the Account rows the
 * caller already has, so this does not re-join user_handled_by.
 */
export async function healthFor(
  accounts: { id: number; hasOwner: boolean; ageDays?: number | null }[],
): Promise<Map<number, AccountHealth>> {
  const out = new Map<number, AccountHealth>();
  const ids = accounts.map((a) => Number(a.id)).filter((n) => Number.isFinite(n));
  if (!ids.length) return out;

  const marks = ids.map(() => "?").join(",");
  const [spend, routes] = await Promise.all([
    query<TransRow>(
      `SELECT t.trans_tuserid AS id,
              MAX(t.trans_date) AS last_at,
              MAX(CASE WHEN t.trans_date < DATE_SUB(NOW(), INTERVAL 30 DAY)
                       THEN t.trans_date END) AS last_at_prior,
              SUM(CASE WHEN t.trans_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                       THEN t.trans_amt ELSE 0 END) AS w0,
              SUM(CASE WHEN t.trans_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)
                        AND t.trans_date <  DATE_SUB(NOW(), INTERVAL 30 DAY)
                       THEN t.trans_amt ELSE 0 END) AS w1,
              SUM(CASE WHEN t.trans_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                        AND t.trans_date <  DATE_SUB(NOW(), INTERVAL 60 DAY)
                       THEN t.trans_amt ELSE 0 END) AS w2
         FROM ms_trans t
        WHERE t.trans_tuserid IN (${marks})
          AND t.trans_type = 1
          AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY t.trans_tuserid`,
      ids,
    ),
    query<{ id: number; routes: number }>(
      `SELECT b.userId AS id, COUNT(DISTINCT b.route) AS routes
         FROM ms_text_bal b
        WHERE b.userId IN (${marks})
        GROUP BY b.userId`,
      ids,
    ),
  ]);

  const byId = new Map(spend.map((r) => [Number(r.id), r]));
  const routesById = new Map(routes.map((r) => [Number(r.id), Number(r.routes ?? 0)]));
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  for (const a of accounts) {
    const id = Number(a.id);
    const t = byId.get(id);
    const w0 = Number(t?.w0 ?? 0);
    const w1 = Number(t?.w1 ?? 0);
    const w2 = Number(t?.w2 ?? 0);
    const routeCount = routesById.get(id) ?? 0;
    const ownerValue = a.hasOwner ? 100 : 0;

    const days = daysBetween(t?.last_at ?? null, now);

    /* An account that signed up last week and has not paid yet is not "at
       risk" — it has not had time to be anything. Scoring it would put most
       of a normal signup week in the worst band and make the board lie. */
    if (days == null && (a.ageDays ?? 999) < 30) continue;
    const parts = {
      recency: recencyScore(days),
      trend: trendScore(w0, w1),
      breadth: breadthScore(routeCount),
      owner: ownerValue,
    };
    const score = weigh(parts);

    /* The same formula, thirty days back. Breadth and ownership are held at
       today's value because this schema keeps no history of either. */
    const priorDays = daysBetween(t?.last_at_prior ?? null, thirtyDaysAgo);
    const prior = weigh({
      recency: recencyScore(priorDays),
      trend: trendScore(w1, w2),
      breadth: breadthScore(routeCount),
      owner: ownerValue,
    });

    const band = bandOf(score);
    const priorBand = bandOf(prior);
    out.set(id, {
      id,
      score,
      band,
      spend30: w0,
      delta: score - prior,
      moved:
        band === priorBand
          ? null
          : BAND_ORDER.indexOf(band) < BAND_ORDER.indexOf(priorBand)
            ? "up"
            : "down",
      components: [
        {
          label: "Payment recency",
          value: parts.recency,
          weight: WEIGHTS.recency,
          evidence:
            days == null
              ? "no payment on record in the last twelve months"
              : `last payment ${days === 0 ? "today" : days + " days ago"}`,
        },
        {
          label: "Spend trend",
          value: parts.trend,
          weight: WEIGHTS.trend,
          evidence: trendWords(w0, w1),
        },
        {
          label: "Product breadth",
          value: parts.breadth,
          weight: WEIGHTS.breadth,
          evidence:
            routeCount === 0
              ? "no route balances"
              : `balance on ${routeCount} route${routeCount === 1 ? "" : "s"}`,
        },
        {
          label: "Ownership",
          value: parts.owner,
          weight: WEIGHTS.owner,
          evidence: a.hasOwner ? "a person is responsible for it" : "nobody at MSG91 owns it",
        },
      ],
    });
  }

  return out;
}

export type BoardBand = {
  band: Band;
  count: number;
  /**
   * Accounts in the band, worst-first within thriving/steady, best-first below.
   *
   * `currency` and `moved` are carried per account because the lens on Now
   * filters client-side: without them the board could only filter the account
   * *names* it recognises, and the money and movement beside them would go on
   * describing every account regardless of the country picked.
   */
  accounts: {
    id: number;
    name: string;
    score: number;
    delta: number;
    currency: string;
    moved: AccountHealth["moved"];
  }[];
};

/** Money is never summed across currencies (handover §7.2). */
export type Protected = { currency: string; amount: number; accounts: number };

export type Board = {
  /** Accounts scored, i.e. the denominator of "N of M are healthy". */
  total: number;
  /** On the page but too new to score — signed up inside 30 days, never paid. */
  tooNew: number;
  healthy: number;
  climbed: number;
  slipped: number;
  bands: BoardBand[];
  /** Last thirty days of spend on the accounts that are holding up. */
  protects: Protected[];
  /** The same, for the accounts in the bottom two bands. */
  atRisk: Protected[];
  /** How the score is made, for the note under the board. */
  formula: string;
};

type Scorable = { id: number; name: string; currency?: string | null };

export function toBoard(
  accounts: Scorable[],
  health: Map<number, AccountHealth>,
): Board {
  const scored = accounts
    .map((a) => ({ ...a, h: health.get(Number(a.id)) }))
    .filter((a): a is Scorable & { h: AccountHealth } => Boolean(a.h));

  /* Grouped by currency, because ₹ and AED are not addable. */
  const purse = (rows: (Scorable & { h: AccountHealth })[]): Protected[] => {
    const by = new Map<string, Protected>();
    rows.forEach((a) => {
      const currency = (a.currency ?? "").trim().toUpperCase() || "INR";
      const at = by.get(currency) ?? { currency, amount: 0, accounts: 0 };
      at.amount += a.h.spend30;
      at.accounts += 1;
      by.set(currency, at);
    });
    return [...by.values()].sort((x, y) => y.amount - x.amount);
  };

  const bands: BoardBand[] = BAND_ORDER.map((band) => {
    const inBand = scored
      .filter((a) => a.h.band === band)
      .sort((x, y) => y.h.score - x.h.score)
      .map((a) => ({
        id: Number(a.id),
        name: a.name,
        score: a.h.score,
        delta: a.h.delta,
        currency: (a.currency ?? "").trim().toUpperCase() || "INR",
        moved: a.h.moved,
      }));
    return { band, count: inBand.length, accounts: inBand };
  });

  return {
    total: scored.length,
    tooNew: accounts.length - scored.length,
    healthy: scored.filter((a) => a.h.band === "thriving" || a.h.band === "steady").length,
    climbed: scored.filter((a) => a.h.moved === "up").length,
    slipped: scored.filter((a) => a.h.moved === "down").length,
    bands,
    protects: purse(scored.filter((a) => a.h.band === "thriving" || a.h.band === "steady")),
    atRisk: purse(scored.filter((a) => a.h.band === "wobbling" || a.h.band === "risk")),
    formula:
      "Payment recency 30%, spend trend 30%, product breadth 25%, ownership 15%. " +
      "Movement compares the same formula over the previous thirty days.",
  };
}
