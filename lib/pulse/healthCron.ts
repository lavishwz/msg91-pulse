/**
 * Scoring accounts on a schedule instead of on every page view.
 *
 * `health.ts`'s `healthFor()` calls the account-health agent — that used to
 * happen live, inside the request that renders Now, which meant a GTWY call
 * every time anyone opened the page. This module runs the same scoring in a
 * background pass, paging through real accounts, and writes the result to
 * `pulse_account_health` (migrations/013). The board then reads that table
 * instead of scoring anything itself — see `cachedHealthFor` below and its
 * use in app/api/pulse/board/route.ts.
 *
 * The pass is budgeted and lock-guarded the same way automation-runner.ts is,
 * for the same reason: it is called from outside on a schedule, so nothing
 * stops two calls overlapping, and a full scan of every account is real work
 * that must not run forever.
 */

import { randomUUID } from "node:crypto";
import { read, write, acquireLock, releaseLock } from "@/lib/store";
import { listAccounts } from "./accounts";
import { healthFor, type AccountHealth } from "./health";
import { page } from "./paginate";

const PASS_BUDGET_MS = 90_000;
const BATCH = 50;

export type HealthPass = {
  scanned: number;
  scored: number;
  aiScored: number;
  skipped?: string;
};

async function saveHealth(h: AccountHealth): Promise<void> {
  await write(
    `INSERT INTO pulse_account_health
       (account_id, score, prior_score, band, delta, moved, spend30,
        components_json, decided_by, reason, confidence, formula_score, computed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?, NOW())
     ON DUPLICATE KEY UPDATE
        score=VALUES(score), prior_score=VALUES(prior_score), band=VALUES(band),
        delta=VALUES(delta), moved=VALUES(moved), spend30=VALUES(spend30),
        components_json=VALUES(components_json), decided_by=VALUES(decided_by),
        reason=VALUES(reason), confidence=VALUES(confidence),
        formula_score=VALUES(formula_score), computed_at=NOW()`,
    [
      h.id,
      h.score,
      h.score - h.delta,
      h.band,
      h.delta,
      h.moved,
      h.spend30,
      JSON.stringify(h.components),
      h.decidedBy,
      h.reason,
      h.confidence,
      h.formulaScore,
    ],
  );
}

/**
 * Score every real customer account it can reach within the budget, oldest
 * cache first so a stale row is refreshed before a fresh one is redone.
 *
 * Not a single unbounded scan: it pages through `listAccounts` the same way
 * any other caller must (see paginate.ts), and stops when the budget is
 * spent — the next pass picks up more accounts, it does not repeat these.
 */
export async function runHealthPass(budgetMs = PASS_BUDGET_MS): Promise<HealthPass> {
  const holder = randomUUID();
  const got = await acquireLock("account-health", holder, Math.ceil(budgetMs / 1000) + 30);
  if (!got) return { scanned: 0, scored: 0, aiScored: 0, skipped: "another pass is already running" };

  try {
    const deadline = Date.now() + budgetMs;
    let cursor = 0;
    let scanned = 0;
    let scored = 0;
    let aiScored = 0;

    while (Date.now() < deadline) {
      const { rows, nextCursor } = await listAccounts({}, page({ limit: BATCH, cursor }));
      if (!rows.length) break;
      scanned += rows.length;

      const health = await healthFor(
        rows.map((a) => ({ id: a.id, hasOwner: Boolean(a.owner), ageDays: a.ageDays })),
      );
      for (const h of health.values()) {
        scored++;
        if (h.decidedBy === "ai") aiScored++;
        await saveHealth(h);
      }

      if (nextCursor == null) break;
      cursor = nextCursor;
    }

    return { scanned, scored, aiScored };
  } finally {
    await releaseLock("account-health", holder);
  }
}

type CachedRow = {
  account_id: number;
  score: number;
  prior_score: number;
  band: AccountHealth["band"];
  delta: number;
  moved: AccountHealth["moved"];
  spend30: number;
  components_json: unknown;
  decided_by: AccountHealth["decidedBy"];
  reason: string | null;
  confidence: number | null;
  formula_score: number;
  computed_at: Date;
};

/**
 * What the board reads instead of scoring live.
 *
 * An id with no row yet (never scanned by a pass) is simply absent from the
 * map — the caller treats it the same as "too new to score", which is
 * already a state every surface using AccountHealth knows how to show.
 */
export async function cachedHealthFor(ids: number[]): Promise<Map<number, AccountHealth>> {
  const out = new Map<number, AccountHealth>();
  if (!ids.length) return out;
  const marks = ids.map(() => "?").join(",");
  const rows = await read<CachedRow>(
    `SELECT account_id, score, prior_score, band, delta, moved, spend30,
            components_json, decided_by, reason, confidence, formula_score, computed_at
       FROM pulse_account_health WHERE account_id IN (${marks})`,
    ids,
  );
  for (const r of rows) {
    const components =
      typeof r.components_json === "string" ? JSON.parse(r.components_json) : (r.components_json ?? []);
    out.set(Number(r.account_id), {
      id: Number(r.account_id),
      score: r.score,
      band: r.band,
      spend30: Number(r.spend30),
      delta: r.delta,
      moved: r.moved,
      components,
      decidedBy: r.decided_by,
      reason: r.reason,
      confidence: r.confidence,
      clamped: false,
      formulaScore: r.formula_score,
    });
  }
  return out;
}

/** For a status line: how stale the cache is, so nobody mistakes it for live. */
export async function healthCacheAge(): Promise<Date | null> {
  const rows = await read<{ oldest: Date | null }>(
    "SELECT MIN(computed_at) AS oldest FROM pulse_account_health",
  );
  return rows[0]?.oldest ?? null;
}
