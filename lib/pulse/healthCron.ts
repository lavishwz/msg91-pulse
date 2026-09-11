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
import { read, write, watermark, acquireLock, releaseLock } from "@/lib/store";
import { accountsAfter } from "./accounts";
import { healthFor, type AccountHealth } from "./health";

const PASS_BUDGET_MS = 90_000;
/**
 * Accounts per page, per loop iteration. Found live: at 50, a single
 * iteration calls healthFor() on the whole page, which itself makes several
 * sequential agent-batch calls (see healthJudge.ts's own BATCH) before this
 * loop ever gets back to checking its own deadline — a pass with a 70s
 * budget still took 100-200s wall clock, because the deadline can only stop
 * the *next* iteration, and one iteration was the whole problem. 10 keeps a
 * single iteration's worst case small enough that the budget check between
 * iterations is actually the thing bounding total time, not a hopeful upper
 * bound nothing enforces.
 */
const BATCH = 10;

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

/** Where this pass remembers how far through the customer base it has gotten. */
const CURSOR_STREAM = "account-health-cursor";

/**
 * Move the cursor, forwards or back to 0 on wraparound.
 *
 * Deliberately not `advanceWatermark()` (lib/store.ts): that helper only ever
 * moves a position forward (`GREATEST`), which is right for a watermark that
 * must never lose track of what it has already processed, and wrong here —
 * this cursor is supposed to fall back to 0 once it reaches the end, so the
 * next pass starts a fresh lap over the whole customer base instead of
 * sitting at the highest id forever.
 */
async function setCursor(position: number): Promise<void> {
  await write(
    `INSERT INTO pulse_watermark (stream, position, last_run_at, last_count)
          VALUES (?, ?, NOW(), 0)
     ON DUPLICATE KEY UPDATE position = VALUES(position), last_run_at = NOW()`,
    [CURSOR_STREAM, String(position)],
  );
}

/**
 * Score real customer accounts, a batch at a time, resuming from wherever the
 * last pass left off rather than starting over from the top every time.
 *
 * This used to page through `listAccounts` (newest-signup-first, OFFSET-based)
 * starting at offset 0 on every call — which meant every single hourly pass
 * re-scored the same handful of newest accounts and never reached the rest of
 * the customer base at all. Found by checking `pulse_account_health` directly
 * after this had been running for a while: only ~40 rows existed, and every
 * one of them was among the ~40 newest signups in the whole system — out of
 * over ten thousand customer accounts.
 *
 * The fix is `accountsAfter()` (accounts.ts): a page ordered by `user_pid`,
 * which is stable across time (new signups don't shift where an existing
 * account sits), plus a persisted cursor (`pulse_watermark`, see `setCursor`
 * above) so each pass resumes exactly where the last one stopped. Once a pass
 * runs off the end of the table, it wraps back to 0 and starts a new lap —
 * so over time every account gets (re-)scored, not just the newest sliver.
 */
export async function runHealthPass(budgetMs = PASS_BUDGET_MS): Promise<HealthPass> {
  const holder = randomUUID();
  const got = await acquireLock("account-health", holder, Math.ceil(budgetMs / 1000) + 30);
  if (!got) return { scanned: 0, scored: 0, aiScored: 0, skipped: "another pass is already running" };

  try {
    const deadline = Date.now() + budgetMs;
    let afterId = Number(await watermark(CURSOR_STREAM, "0")) || 0;
    let scanned = 0;
    let scored = 0;
    let aiScored = 0;
    let wrapped = false;

    while (Date.now() < deadline) {
      const rows = await accountsAfter(afterId, BATCH);

      if (!rows.length) {
        // Ran off the end. Wrap once, so a genuinely empty customer base (or
        // one entirely below whatever id this started at) does not spin —
        // wrapping a second time in the same pass means there is truly
        // nothing to score.
        if (wrapped) break;
        wrapped = true;
        afterId = 0;
        continue;
      }

      scanned += rows.length;
      const health = await healthFor(
        rows.map((a) => ({ id: a.id, hasOwner: Boolean(a.owner), ageDays: a.ageDays })),
      );
      for (const h of health.values()) {
        scored++;
        if (h.decidedBy === "ai") aiScored++;
        await saveHealth(h);
      }

      afterId = Math.max(...rows.map((a) => a.id));
      await setCursor(afterId);
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
