import { createHash } from "node:crypto";
import { query } from "@/lib/db";
import { write, read, readOne, activePolicy } from "@/lib/store";
import { healthFor, toBoard, type AccountHealth } from "../health";
import { reviewAccount, digestPortfolio } from "../agents";
import { USER_TYPE } from "../domain";

/**
 * The month-end pass — Agents 4 and 5.
 *
 * Handover §7.4 and the build plan: at month end, every account with an owner or
 * any spend gets a written verdict, and each scope gets one portfolio digest.
 * The numbers were measured on this database — 38 accounts spent last month, so
 * this is tens of calls, not ten thousand.
 *
 * Both agents receive derived aggregates only: never a customer conversation,
 * and never a currency conversion. Money stays in the currency it arrived in.
 *
 * Idempotent by key, like everything else here. `month:2026-09:account:302621`
 * and `month:2026-09:portfolio:team` mean a re-run updates rather than
 * duplicates, so a month-end job that is interrupted can simply be run again.
 */

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const accountKey = (month: string, id: number) => `month:${month}:account:${id}`;
const portfolioKey = (month: string, scope: string) => `month:${month}:portfolio:${scope}`;

const digest = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");

async function writeMonthlyDecision(row: {
  key: string;
  agent: string;
  agentId: string | null;
  model: string | null;
  policyVersion: string;
  input: unknown;
  output: unknown;
  verdict: string | null;
  confidence: number | null;
  action: string;
  usage: unknown;
}) {
  await write(
    `INSERT INTO pulse_decision
       (signal_key, agent, agent_id, model, policy_version, input_digest, input_json,
        output_json, verdict, confidence, action_taken, held, usage_json)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)
     ON DUPLICATE KEY UPDATE
       output_json = VALUES(output_json), verdict = VALUES(verdict),
       confidence = VALUES(confidence), action_taken = VALUES(action_taken),
       input_digest = VALUES(input_digest), model = VALUES(model), at = NOW()`,
    [
      row.key, row.agent, row.agentId, row.model, row.policyVersion, digest(row.input),
      JSON.stringify(row.input), JSON.stringify(row.output), row.verdict, row.confidence,
      row.action, JSON.stringify(row.usage ?? {}),
    ],
  );
}

/**
 * Which accounts are worth a verdict.
 *
 * "With an owner or any spend in the window" — an account nobody owns and
 * nobody pays for has no story worth writing, and writing one anyway is how a
 * month-end review becomes noise.
 */
async function accountsInScope(limit: number) {
  return query<{ id: number; name: string; currency: string | null; has_owner: number; age_days: number }>(
    `SELECT u.user_pid AS id, u.user_fname AS name, d.currency,
            (h.admin_id IS NOT NULL) AS has_owner,
            DATEDIFF(NOW(), u.user_date) AS age_days
       FROM ms_user u
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_type = ?
        AND (h.admin_id IS NOT NULL
             OR EXISTS (SELECT 1 FROM ms_trans t
                         WHERE t.trans_tuserid = u.user_pid
                           AND t.trans_type = 1 AND t.payment_mode = 2
                           AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)))
      -- Owned and established first. Ordering by newest id picked up accounts
      -- that signed up days ago, and those are deliberately not scored yet --
      -- an account with no history has no month to describe.
      ORDER BY has_owner DESC, age_days DESC
      LIMIT ?`,
    [USER_TYPE.CUSTOMER, limit],
  );
}

export type MonthlyResult = {
  month: string;
  accountsConsidered: number;
  accountsReviewed: number;
  digestsWritten: number;
  skipped: number;
  notes: string[];
};

/**
 * Write the month's verdicts.
 *
 * Bounded by a time budget rather than run to completion: month end is one job
 * among several, and an account that is reviewed on the second call of the
 * morning is no worse off than one reviewed on the first.
 */
export async function runMonthEnd(budgetMs: number, accountCap = 25): Promise<MonthlyResult> {
  const started = Date.now();
  const month = monthKey();
  const policy = await activePolicy();
  const out: MonthlyResult = {
    month, accountsConsidered: 0, accountsReviewed: 0, digestsWritten: 0, skipped: 0, notes: [],
  };

  const accounts = await accountsInScope(accountCap);
  out.accountsConsidered = accounts.length;
  if (!accounts.length) return out;

  const health = await healthFor(
    accounts.map((a) => ({ id: a.id, hasOwner: Boolean(a.has_owner), ageDays: a.age_days })),
  );

  // Which of these already have this month's verdict — a re-run must not spend
  // an agent call to write the same thing again.
  const done = new Set(
    (
      await read<{ signal_key: string }>(
        `SELECT signal_key FROM pulse_decision WHERE agent = 'account-review' AND signal_key LIKE ?`,
        [`month:${month}:account:%`],
      )
    ).map((r) => r.signal_key),
  );

  for (const a of accounts) {
    if (Date.now() - started > budgetMs) {
      out.notes.push(`stopped early — out of time. ${accounts.length - out.accountsReviewed - out.skipped} accounts left for the next call.`);
      break;
    }
    const key = accountKey(month, a.id);
    if (done.has(key)) { out.skipped += 1; continue; }

    const h = health.get(Number(a.id));
    if (!h) {
      // Too new to score: signed up inside thirty days and never paid. Not a
      // failure — there is genuinely no month to write about yet.
      out.skipped += 1;
      out.notes.push(`${a.name}: too new to score`);
      continue;
    }

    const input = shapeHealth(a.name, h, a.currency);
    try {
      const call = await reviewAccount(input, month);
      await writeMonthlyDecision({
        key, agent: "account-review", agentId: call.agentId, model: call.model,
        policyVersion: policy.version, input, output: call.data,
        verdict: call.data.movement, confidence: call.data.confidence,
        action: "verdict written", usage: call.usage,
      });
      out.accountsReviewed += 1;
    } catch (err) {
      const e = err as { code?: string; message?: string };
      out.skipped += 1;
      out.notes.push(`${a.name}: review failed (${e.code ?? "UNKNOWN"})`);
    }
  }

  // The digest reads the board, which is derived from the same health map —
  // one pass over the data, two altitudes.
  if (Date.now() - started < budgetMs) {
    const board = toBoard(accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency })), health);
    try {
      const previous = await previousDigest("team");
      const call = await digestPortfolio(shapeBoard(board), "team", month, previous);
      await writeMonthlyDecision({
        key: portfolioKey(month, "team"), agent: "portfolio-digest", agentId: call.agentId,
        model: call.model, policyVersion: policy.version, input: shapeBoard(board),
        output: call.data, verdict: null, confidence: call.data.confidence,
        action: "digest written", usage: call.usage,
      });
      out.digestsWritten += 1;
    } catch (err) {
      out.notes.push(`digest failed (${(err as { code?: string }).code ?? "UNKNOWN"})`);
    }
  }

  return out;
}

/** Last month's note, so this month's can continue from it rather than restart. */
async function previousDigest(scope: string): Promise<string> {
  const row = await readOne<{ output_json: unknown }>(
    `SELECT output_json FROM pulse_decision
      WHERE agent = 'portfolio-digest' AND signal_key LIKE ?
      ORDER BY at DESC LIMIT 1`,
    [`month:%:portfolio:${scope}`],
  );
  if (!row) return "";
  const o = (typeof row.output_json === "string" ? JSON.parse(row.output_json) : row.output_json) as {
    narrative?: string;
  };
  return o?.narrative ?? "";
}

/** Exactly what Agent 4's prompt documents, and nothing else. */
function shapeHealth(name: string, h: AccountHealth, currency: string | null) {
  return {
    account: name,
    score: h.score,
    band: h.band,
    prior_score: h.score - h.delta,
    // The agent is told which way it moved in words; it is not asked to work it
    // out from two numbers, because that is arithmetic and arithmetic is what
    // SQL is for.
    movement: h.moved === "up" ? "climbed" : h.moved === "down" ? "slipped" : h.delta >= 5 || h.delta <= -5 ? "held" : "noise",
    components: h.components.map((c) => ({
      label: c.label, value: c.value, weight: c.weight, evidence: c.evidence,
    })),
    // Currency travels with the amount. Never converted, never totalled.
    spend_windows: [{ currency: currency ?? "INR", amount: h.spend30 }],
  };
}

function shapeBoard(board: ReturnType<typeof toBoard>) {
  return {
    bands: board.bands.map((b) => ({ band: b.band, count: b.count })),
    healthy: board.healthy,
    total: board.total,
    climbed: board.climbed,
    slipped: board.slipped,
    protected: board.protects,
    at_risk: board.atRisk,
    risers: board.bands.flatMap((b) => b.accounts.filter((a) => a.delta > 0).map((a) => ({ name: a.name, delta: a.delta }))).slice(0, 5),
    fallers: board.bands.flatMap((b) => b.accounts.filter((a) => a.delta < 0).map((a) => ({ name: a.name, delta: a.delta }))).slice(0, 5),
  };
}

/** This month's verdict for one account — read by the account page. */
export async function accountVerdict(userPid: number) {
  const row = await readOne<{ output_json: unknown; at: Date; model: string | null }>(
    `SELECT output_json, at, model FROM pulse_decision
      WHERE agent = 'account-review' AND signal_key = ? LIMIT 1`,
    [accountKey(monthKey(), userPid)],
  );
  if (!row) return null;
  const o = (typeof row.output_json === "string" ? JSON.parse(row.output_json) : row.output_json) as Record<string, unknown>;
  return { ...o, at: row.at.toISOString(), model: row.model };
}

/** The month's digest for a scope — read by "Where to grow". */
export async function portfolioDigestFor(scope: "me" | "team" | "company") {
  const row = await readOne<{ output_json: unknown; at: Date }>(
    `SELECT output_json, at FROM pulse_decision
      WHERE agent = 'portfolio-digest' AND signal_key LIKE ?
      ORDER BY at DESC LIMIT 1`,
    [`month:%:portfolio:${scope}`],
  );
  if (!row) return null;
  const o = (typeof row.output_json === "string" ? JSON.parse(row.output_json) : row.output_json) as Record<string, unknown>;
  return { ...o, at: row.at.toISOString() };
}

export { monthKey };
