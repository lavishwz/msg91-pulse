import { query } from "@/lib/db";
import { cached, DEFAULT_TTL_MS } from "./cache";
import { count, money } from "./domain";
import { USER_TYPE } from "./domain";
import { listDrafts } from "./autopilot/drafts";

/**
 * Scanners → cards.
 *
 * Handover §4: six reasons and only six may interrupt a human. Nothing here
 * invents a card — each scanner is a bounded SQL query whose rows *are* the
 * evidence, and a card is only produced when a row exists.
 *
 * §10 makes the point that matters most: event triggers only see what happened,
 * but most customer loss is a thing that stopped happening. So these are pull
 * scanners over absence and drift (nothing sent, nobody assigned, wallet run
 * dry, verification stalled), not a feed of events.
 *
 * Every query is capped with LIMIT and constrained to a date window, so the
 * cost does not grow with the size of the database.
 *
 * ── A constraint worth knowing about ────────────────────────────────────────
 * `ms_trans` (~1M rows) and `ms_user` carry a PRIMARY KEY and nothing else — no
 * index on `trans_tuserid`, `trans_date`, `user_date` or `user_type`. So any
 * predicate against ms_trans costs a full scan (~400ms), and a *correlated*
 * subquery against it costs one scan per candidate row: the first version of the
 * first-value scanner below took 37 seconds for four cards.
 *
 * The rule these scanners follow, therefore, is: at most one pass over ms_trans
 * per request, never correlated. Candidates are found in ms_user (cheap), then a
 * single aggregate pass over ms_trans answers the question for all of them at
 * once. An index on `ms_trans (trans_tuserid, trans_date)` would remove the
 * constraint entirely, but this connection is read-only.
 */

/** How many candidate rows a two-pass scanner may consider. */
const CANDIDATE_CAP = 400;

/**
 * Which of these accounts have ever transacted — one pass over ms_trans for the
 * whole set, rather than a correlated lookup per account.
 */
async function everTransacted(ids: number[]): Promise<Set<number>> {
  if (!ids.length) return new Set();
  const list = ids.map((n) => Number(n)).filter(Number.isFinite);
  const rows = await query<{ id: number }>(
    `SELECT DISTINCT t.trans_tuserid id
       FROM ms_trans t
      WHERE t.trans_tuserid IN (${list.map(() => "?").join(",")})`,
    list,
  );
  return new Set(rows.map((r) => Number(r.id)));
}

export type CardReason =
  | "Your judgment"
  | "Your voice"
  | "Your hands"
  | "Your approval"
  | "Your knowledge"
  | "Watch closely";

export type Card = {
  /** Stable id so the same signal does not become two cards (§10 merge rule). */
  key: string;
  scope: "me" | "team" | "company";
  reason: CardReason;
  watch: boolean;
  headline: string;
  why: string;
  /** The single number that justifies the card — L1 (§5). */
  l1: string;
  action: string | null;
  solid: boolean;
  account: { id: number; name: string } | null;
  geo: string;
  /** Seconds left on an SLA clock, when the card carries one. */
  clock: number | null;
  evidence: [string, string][];
};

const SLA_CALL_MINUTES = 10;

/**
 * 1. A new signup nobody owns.
 *
 * "Your hands": AI cannot make the call. Carries the ten-minute clock, which is
 * the only clock in the product (§8 feature 32).
 */
async function unownedSignups(limit: number): Promise<Card[]> {
  const rows = await query<{
    user_pid: number;
    name: string;
    user_email: string;
    user_date: Date;
    currency: string | null;
    mins: number;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            u.user_email, u.user_date, d.currency,
            TIMESTAMPDIFF(MINUTE, u.user_date, NOW()) mins
       FROM ms_user u
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
        AND h.admin_id IS NULL
        AND u.user_date >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      ORDER BY u.user_date DESC
      LIMIT ${limit}`,
  );

  return rows.map((r) => {
    const name = r.name || r.user_email;
    const domain = (r.user_email || "").split("@")[1] ?? "";
    const mins = Number(r.mins ?? 0);
    const left = SLA_CALL_MINUTES * 60 - mins * 60;
    return {
      key: `unowned-signup:${r.user_pid}`,
      scope: "me" as const,
      reason: "Your hands" as const,
      watch: false,
      headline: `Call whoever signed up at ${name}.`,
      why:
        `Signed up <span class="l1">${humanMins(mins)}</span> and still has no owner. ` +
        `Nobody at MSG91 has been assigned, so nobody is going to call unless you do.`,
      l1: humanMins(mins),
      action: "Take this account",
      solid: true,
      account: { id: Number(r.user_pid), name },
      geo: geoLine(r.currency, "Inbound"),
      clock: left > 0 ? left : null,
      evidence: [
        ["Signed up", new Date(r.user_date).toISOString().replace("T", " ").slice(0, 16)],
        ["Owner", "Unassigned — no row in user_handled_by"],
        ["Contact", r.user_email || "no email on the account"],
        ...(domain ? ([["Domain", domain]] as [string, string][]) : []),
        ["Rule", `Inbound · a human contact within ${SLA_CALL_MINUTES} minutes`],
      ],
    };
  });
}

/**
 * 2. Signed up, never sent anything.
 *
 * The first-value blocker (§8 feature 42). Zero wallet and no transaction ever
 * means they have not got going, and past the motion's normal it needs a human.
 */
async function stuckBeforeFirstMessage(limit: number): Promise<Card[]> {
  // Pass 1: candidates come from ms_user alone — 10.5k rows, one scan.
  const candidates = await query<{
    user_pid: number;
    name: string;
    user_email: string;
    days: number;
    currency: string | null;
    admin_id: number | null;
    startup: number | null;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            u.user_email,
            DATEDIFF(NOW(), u.user_date) days,
            d.currency, h.admin_id, ps.userid startup
       FROM ms_user u
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
       LEFT JOIN ms_user_paid_signup ps ON ps.userid = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
        AND u.user_date BETWEEN DATE_SUB(NOW(), INTERVAL 45 DAY) AND DATE_SUB(NOW(), INTERVAL 3 DAY)
        AND u.user_bal <= 0
      ORDER BY u.user_date ASC
      LIMIT ${CANDIDATE_CAP}`,
  );
  if (!candidates.length) return [];

  // Pass 2: which of those have ever transacted — one scan of ms_trans, not one
  // per candidate. See the note on indexes at the top of this file.
  const transacted = await everTransacted(candidates.map((c) => Number(c.user_pid)));

  return candidates
    .filter((r) => !transacted.has(Number(r.user_pid)))
    .slice(0, limit)
    .map((r) => {
      const name = r.name || r.user_email;
      const days = Number(r.days ?? 0);
      return {
        key: `no-first-value:${r.user_pid}`,
        scope: "me" as const,
        reason: "Watch closely" as const,
        watch: true,
        headline: `${trim(name)} still has not sent anything.`,
        why:
          `<span class="l1">Day ${days}</span> since signup with an empty wallet and no transaction ` +
          `of any kind. Target time to first value is three days.`,
        l1: `Day ${days}`,
        action: null,
        solid: false,
        account: { id: Number(r.user_pid), name },
        geo: geoLine(r.currency, r.startup != null ? "Startup" : "Inbound"),
        clock: null,
        evidence: [
          ["Days since signup", String(days)],
          ["Wallet", "empty"],
          ["Transactions", "none, ever"],
          ["Owner", r.admin_id ? `admin ${r.admin_id}` : "Unassigned"],
          ["Programme", r.startup != null ? "Startup programme" : "Standard signup"],
        ],
      };
    });
}

/**
 * 3. Someone new at an account MSG91 already has.
 *
 * Handover feature 22: the same person signing up twice is a silent merge, but a
 * *new* person at an existing account is a card — either another department is
 * evaluating, or they are not getting what they need from their current owner.
 *
 * Matched on the email domain, with free mail providers excluded because a
 * shared gmail.com domain says nothing about a shared employer. Aggregated so
 * one new signup produces one card, never one per account it matched.
 *
 * (`decliningAnalysis` was the obvious source for a decline card, but all 16,979
 * rows in it carry reason='declining', smsquant=0 and one of three percentages,
 * so it cannot distinguish one account from another. Using it would emit
 * thousands of identical cards, which is the card fatigue §13.4 warns about.
 * Wallet drying up, below, is the evidenced version of the same signal.)
 */
const FREE_MAIL = [
  "gmail.com",
  "yahoo.com",
  "yahoo.in",
  "hotmail.com",
  "outlook.com",
  "rediffmail.com",
  "yopmail.com",
  "icloud.com",
  "proton.me",
];

async function newPersonAtExistingAccount(limit: number): Promise<Card[]> {
  const placeholders = FREE_MAIL.map(() => "?").join(",");
  const rows = await query<{
    user_pid: number;
    new_name: string;
    user_email: string;
    user_date: Date;
    domain: string;
    siblings: number;
    anchor_name: string;
    currency: string | null;
    admin_id: number | null;
  }>(
    `SELECT n.user_pid,
            TRIM(CONCAT(COALESCE(n.user_fname,''),' ',COALESCE(n.user_lname,''))) new_name,
            n.user_email, n.user_date,
            SUBSTRING_INDEX(n.user_email,'@',-1) domain,
            COUNT(*) siblings,
            MIN(TRIM(CONCAT(COALESCE(e.user_fname,''),' ',COALESCE(e.user_lname,'')))) anchor_name,
            d.currency, h.admin_id
       FROM ms_user n
       JOIN ms_user e
         ON SUBSTRING_INDEX(e.user_email,'@',-1) = SUBSTRING_INDEX(n.user_email,'@',-1)
        AND e.user_pid <> n.user_pid
        AND e.user_date < n.user_date
        AND e.user_type = ${USER_TYPE.CUSTOMER}
       LEFT JOIN default_destination_country d ON d.u_id = n.user_pid
       LEFT JOIN user_handled_by h ON h.user_id = n.user_pid
      WHERE n.user_type = ${USER_TYPE.CUSTOMER}
        AND n.user_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND n.user_email LIKE '%@%'
        AND SUBSTRING_INDEX(n.user_email,'@',-1) NOT IN (${placeholders})
      GROUP BY n.user_pid, new_name, n.user_email, n.user_date, domain, d.currency, h.admin_id
      ORDER BY n.user_date DESC
      LIMIT ${limit}`,
    FREE_MAIL,
  );

  return rows.map((r) => {
    const name = r.new_name || r.user_email;
    const siblings = Number(r.siblings ?? 0);
    return {
      key: `new-person:${r.user_pid}`,
      scope: "me" as const,
      reason: "Your hands" as const,
      watch: false,
      headline: `Someone new at ${trim(r.domain, 24)} just signed up.`,
      why:
        `${trim(name, 40)} created their own account <span class="l1">${humanMins(
          Math.floor((Date.now() - new Date(r.user_date).getTime()) / 60000),
        )}</span>, and ${r.domain} is already on ${siblings} account${
          siblings === 1 ? "" : "s"
        } with MSG91. Either a new department is evaluating, or they are not getting what they need.`,
      l1: humanMins(Math.floor((Date.now() - new Date(r.user_date).getTime()) / 60000)),
      action: "Call them",
      solid: true,
      account: { id: Number(r.user_pid), name },
      geo: geoLine(r.currency, "Inbound"),
      clock: null,
      evidence: [
        ["Who signed up", `${name} · ${r.user_email}`],
        ["Domain already ours", `${r.domain} · ${siblings} existing account${siblings === 1 ? "" : "s"}`],
        ["Longest-standing of those", r.anchor_name || "unnamed"],
        ["Owner of the new signup", r.admin_id ? `admin ${r.admin_id}` : "Unassigned"],
        ["Not contacted", "A signup from an existing customer is a conversation, not a sequence"],
      ],
    };
  });
}

/**
 * 4. A paying account with nobody on it.
 *
 * Money has arrived and no MSG91 owner exists — the unowned scanner crossed
 * with payment evidence, which is the version worth interrupting someone for.
 */
async function unownedPaying(limit: number): Promise<Card[]> {
  const rows = await query<{
    user_pid: number;
    name: string;
    paid: string;
    n: number;
    currency: string | null;
    last: Date;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            SUM(t.trans_amt) paid, COUNT(*) n, d.currency, MAX(t.trans_date) last
       FROM ms_trans t
       JOIN ms_user u ON u.user_pid = t.trans_tuserid AND u.user_type = ${USER_TYPE.CUSTOMER}
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE t.trans_type = 1 AND t.payment_mode = 2
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        AND h.admin_id IS NULL
      GROUP BY u.user_pid, name, d.currency
      ORDER BY paid DESC
      LIMIT ${limit}`,
  );

  return rows.map((r) => ({
    key: `unowned-paying:${r.user_pid}`,
    scope: "team" as const,
    reason: "Your hands" as const,
    watch: false,
    headline: `${trim(r.name)} is paying and has no owner.`,
    why:
      `<span class="l1">${money(r.paid, r.currency)}</span> across ${r.n} payment${
        Number(r.n) === 1 ? "" : "s"
      } in the last 90 days, and no MSG91 owner is recorded. Nobody is answering their questions.`,
    l1: money(r.paid, r.currency),
    action: "Assign an owner",
    solid: true,
    account: { id: Number(r.user_pid), name: r.name },
    geo: geoLine(r.currency, "Inbound"),
    clock: null,
    evidence: [
      ["Received", `${money(r.paid, r.currency)} · last 90 days · provisional`],
      ["Payments", String(r.n)],
      ["Most recent", new Date(r.last).toISOString().slice(0, 10)],
      ["Owner", "Unassigned — no row in user_handled_by"],
      ["Basis", "ms_trans, gateway payments only (trans_type 1 · payment_mode 2)"],
    ],
  }));
}

/**
 * 5. Verification stalled.
 *
 * `user_status = 2` is signed up but unverified. Past a couple of days that is
 * a human problem, and it blocks everything else the account might do.
 */
async function verificationStalled(limit: number): Promise<Card[]> {
  const rows = await query<{
    user_pid: number;
    name: string;
    user_email: string;
    days: number;
    currency: string | null;
    admin_id: number | null;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            u.user_email, DATEDIFF(NOW(), u.user_date) days, d.currency, h.admin_id
       FROM ms_user u
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
        AND u.user_status = 2
        AND u.user_date BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND DATE_SUB(NOW(), INTERVAL 2 DAY)
      ORDER BY u.user_date ASC
      LIMIT ${limit}`,
  );

  return rows.map((r) => {
    const name = r.name || r.user_email;
    const days = Number(r.days ?? 0);
    return {
      key: `unverified:${r.user_pid}`,
      scope: "me" as const,
      reason: "Your knowledge" as const,
      watch: false,
      headline: `${trim(name)} is stuck at verification.`,
      why:
        `<span class="l1">${days} days</span> signed up and still unverified, so nothing can be sent. ` +
        `Either they abandoned it or something in the process is blocking them, and only asking will tell you which.`,
      l1: `${days} days`,
      action: "Find out what stalled",
      solid: false,
      account: { id: Number(r.user_pid), name },
      geo: geoLine(r.currency, "Inbound"),
      clock: null,
      evidence: [
        ["Status", "signed up, not verified (user_status 2)"],
        ["Days waiting", String(days)],
        ["Contact", r.user_email || "no email on the account"],
        ["Owner", r.admin_id ? `admin ${r.admin_id}` : "Unassigned"],
      ],
    };
  });
}

/**
 * 6. A wallet that has run dry after real payments.
 *
 * Paid before, empty now, quiet since — the payment-anomaly scanner (§10). This
 * is revenue stopping, which is the earliest honest churn signal available while
 * the Reports microservice cannot expose usage or delivery data (§12.3).
 */
async function walletRunDry(limit: number): Promise<Card[]> {
  const rows = await query<{
    user_pid: number;
    name: string;
    currency: string | null;
    paid: string;
    last: Date;
    quiet_days: number;
    admin_id: number | null;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            d.currency, SUM(t.trans_amt) paid, MAX(t.trans_date) last,
            DATEDIFF(NOW(), MAX(t.trans_date)) quiet_days, h.admin_id
       FROM ms_trans t
       JOIN ms_user u ON u.user_pid = t.trans_tuserid AND u.user_type = ${USER_TYPE.CUSTOMER}
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
      WHERE t.trans_type = 1 AND t.payment_mode = 2
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 365 DAY)
        AND u.user_bal <= 0
      GROUP BY u.user_pid, name, d.currency, h.admin_id
     HAVING quiet_days BETWEEN 21 AND 180
      ORDER BY paid DESC
      LIMIT ${limit}`,
  );

  return rows.map((r) => ({
    key: `wallet-dry:${r.user_pid}`,
    scope: "me" as const,
    reason: "Watch closely" as const,
    watch: true,
    headline: `${trim(r.name)} has stopped topping up.`,
    why:
      `Wallet is empty and nothing has come in for <span class="l1">${r.quiet_days} days</span>, ` +
      `after ${money(r.paid, r.currency)} over the last year. No ticket, no complaint — they just stopped.`,
    l1: `${r.quiet_days} days`,
    action: null,
    solid: false,
    account: { id: Number(r.user_pid), name: r.name },
    geo: geoLine(r.currency, "Inbound"),
    clock: null,
    evidence: [
      ["Wallet", "empty"],
      ["Quiet for", `${r.quiet_days} days`],
      ["Paid in the last year", `${money(r.paid, r.currency)} · provisional`],
      ["Last payment", new Date(r.last).toISOString().slice(0, 10)],
      ["Owner", r.admin_id ? `admin ${r.admin_id}` : "Unassigned"],
    ],
  }));
}

/**
 * 7. A recharge that failed to collect.
 *
 * `micro_sub_payment_failed_logs` records every auto-recharge/subscription
 * payment MSG91's billing tried to collect and could not — a much earlier
 * signal than the wallet actually reaching zero (walletRunDry, above, only
 * fires once the account has already gone quiet for three weeks). A repeat
 * failure while the account is still transacting is the moment to look,
 * before the account goes quiet at all.
 *
 * No timestamp exists on this table (checked: `id, company_id, status` only —
 * see docs/schema-notes for the full column list), so this cannot be scoped
 * to "recent" failures, only "has ever had one." That is stated in the
 * evidence rather than implied — the count is real, the recency is not known.
 * Cheap regardless: the whole table is a few hundred rows, so this is a group
 * by with no ms_trans scan at all.
 */
async function repeatedPaymentFailure(limit: number): Promise<Card[]> {
  const rows = await query<{
    user_pid: number;
    name: string;
    currency: string | null;
    admin_id: number | null;
    fails: number;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            d.currency, h.admin_id, COUNT(*) fails
       FROM micro_sub_payment_failed_logs m
       JOIN ms_user u ON u.user_pid = m.company_id AND u.user_type = ${USER_TYPE.CUSTOMER}
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
      GROUP BY u.user_pid, name, d.currency, h.admin_id
      ORDER BY fails DESC, u.user_pid DESC
      LIMIT ${limit}`,
  );

  return rows.map((r) => {
    const fails = Number(r.fails ?? 1);
    return {
      key: `payment-failed:${r.user_pid}`,
      scope: "me" as const,
      reason: "Watch closely" as const,
      watch: true,
      headline: `${trim(r.name)}'s recharge failed to collect.`,
      why:
        `<span class="l1">${fails} failed ${fails === 1 ? "attempt" : "attempts"}</span> on ` +
        `record — MSG91's billing tried to collect an auto-recharge and could not. This is ` +
        `earlier than a dry wallet: nothing has to have gone quiet yet for a card to belong here.`,
      l1: `${fails} failed ${fails === 1 ? "attempt" : "attempts"}`,
      action: null,
      solid: false,
      account: { id: Number(r.user_pid), name: r.name },
      geo: geoLine(r.currency, "Inbound"),
      clock: null,
      evidence: [
        ["Failed recharge attempts", String(fails)],
        ["When", "not recorded — this table carries no timestamp, only that it happened"],
        ["Owner", r.admin_id ? `admin ${r.admin_id}` : "Unassigned"],
        ["Basis", "micro_sub_payment_failed_logs, grouped by company_id"],
      ],
    };
  });
}

/**
 * 8. Drafts held for a person — "Your approval": ready to send, waiting on a yes.
 *
 * This reason has existed in `CardReason` since the six-reason taxonomy was
 * written, but nothing ever produced it — `pulse_draft` (held/released/sent,
 * see lib/pulse/autopilot/drafts.ts) already carried everything a card needs;
 * it just was never read from here. Unlike the other seven scanners this one
 * reads Pulse's own store, not ms_user/ms_trans, so it costs nothing against
 * the ms_trans-has-no-index constraint above.
 */
async function heldDrafts(limit: number): Promise<Card[]> {
  const held = (await listDrafts("held", limit)).filter((d) => d.accountPid);
  if (!held.length) return [];

  const ids = [...new Set(held.map((d) => Number(d.accountPid)))].filter(Number.isFinite);
  const rows = await query<{ user_pid: number; name: string; currency: string | null }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            d.currency
       FROM ms_user u
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_pid IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  const info = new Map(rows.map((r) => [Number(r.user_pid), r]));

  return held.map((d) => {
    const id = Number(d.accountPid);
    const found = info.get(id);
    const name = found?.name || `Account ${id}`;
    const ageMins = Math.max(0, Math.round((Date.now() - new Date(d.createdAt).getTime()) / 60000));
    const age = ageMins < 60 ? `${ageMins} min` : `${Math.round(ageMins / 60)}h`;
    return {
      key: `draft:${d.id}`,
      scope: "me" as const,
      reason: "Your approval" as const,
      watch: false,
      headline: `A ${d.channel} draft for ${trim(name)} is ready to send.`,
      why:
        `Written <span class="l1">${age} ago</span>` +
        (d.holdReason ? `, held because it ${d.holdReason}.` : ", waiting on a read before it goes.") +
        ` Nothing goes out until you say so.`,
      l1: `${age} ago`,
      action: "Review and send",
      solid: true,
      account: { id, name },
      geo: geoLine(found?.currency, "Inbound"),
      clock: null,
      evidence: [
        ["Channel", d.channel],
        ["Subject", d.subject || "(no subject)"],
        ["Held because", d.holdReason || "policy requires a read"],
        ["Confidence", d.confidence != null ? `${Math.round(d.confidence * 100)}%` : "not recorded"],
        ["Facts used", d.factsUsed.length ? d.factsUsed.join("; ") : "none recorded"],
      ],
    };
  });
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function humanMins(mins: number): string {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** Keep headlines inside the 70-char contract (§4). */
function trim(name: string, max = 34): string {
  const n = (name || "").trim();
  return n.length <= max ? n : `${n.slice(0, max - 1)}…`;
}

function sentence(s: string | null | undefined): string {
  const t = (s ?? "").trim();
  if (!t) return "No reason was recorded.";
  const body = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(body) ? body : `${body}.`;
}

function geoLine(currency: string | null | undefined, motion: string): string {
  const entity =
    { INR: "India", AED: "UAE", USD: "US", SGD: "Singapore", GBP: "UK", EUR: "EU" }[
      (currency ?? "").trim().toUpperCase()
    ] ?? "India";
  return `${entity} · ${motion}`;
}

/**
 * Build the card deck.
 *
 * Each scanner is capped, then the deck is deduplicated by account so one
 * account cannot produce three cards in the same list — the merge rule in §10,
 * because card fatigue is the stated number-one way this product dies.
 * Actionable reasons sort above watches.
 */
export async function buildCards(opts: { perScanner?: number } = {}): Promise<Card[]> {
  const n = Math.min(12, Math.max(1, opts.perScanner ?? 4));
  return cached(`cards:${n}`, DEFAULT_TTL_MS, () => buildCardsUncached(n));
}

async function buildCardsUncached(n: number): Promise<Card[]> {
  const groups = await Promise.all([
    unownedSignups(n),
    stuckBeforeFirstMessage(n),
    newPersonAtExistingAccount(n),
    unownedPaying(n),
    verificationStalled(n),
    walletRunDry(n),
    repeatedPaymentFailure(n),
    heldDrafts(n),
  ]);

  const order: CardReason[] = [
    "Your judgment",
    "Your approval",
    "Your hands",
    "Your voice",
    "Your knowledge",
    "Watch closely",
  ];

  const seen = new Set<number>();
  const deck: Card[] = [];
  for (const reason of order) {
    for (const card of groups.flat()) {
      if (card.reason !== reason) continue;
      const id = card.account?.id;
      if (id != null) {
        if (seen.has(id)) continue;
        seen.add(id);
      }
      deck.push(card);
    }
  }
  return deck;
}
