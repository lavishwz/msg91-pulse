import { query, queryOne } from "@/lib/db";
import { count, entityFromCurrency, money, USER_TYPE } from "./domain";
import { countAccounts } from "./accounts";
import { repActivity } from "./team";
import { cached, drop, DEFAULT_TTL_MS } from "./cache";

/**
 * Ask (handover §7.3) — natural language replaces every dashboard.
 *
 * Each answer is a bounded query plus the access stamp that must accompany it.
 * A question Pulse cannot answer from the database returns `available: false`
 * with the reason, because §7.3 requires answers to be live rather than
 * screenshots — a plausible-looking wrong number is worse than no number.
 */

export type AskTable = {
  columns: string[];
  rows: (string | number)[][];
  /** Offset for the next slice, or null when this is the last one. */
  nextCursor?: number | null;
};

/** How many rows one page of a table answer holds. */
const PAGE = 50;

export type Answer = {
  id: string;
  question: string;
  available: boolean;
  /** The big number. */
  big: string;
  headline: string;
  prose: string;
  /** Native-currency or per-row breakdown. Never summed across currencies. */
  breakdown: [string, string][];
  table: AskTable | null;
  action: string | null;
  /** Access stamp — what this answer was allowed to see. */
  stamp: string[];
  provisional: boolean;
};

const PROVISIONAL_NOTE =
  "payments read as gateway credits (trans_type 1 · payment_mode 2) — pending confirmation";

/** Every account MSG91 has, by entity, in native currency only. */
async function accountsByEntity(): Promise<Answer> {
  const rows = await query<{ currency: string | null; n: number }>(
    `SELECT d.currency, COUNT(*) n
       FROM ms_user u
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
      GROUP BY d.currency
      ORDER BY n DESC
      LIMIT 12`,
  );

  const total = rows.reduce((a, r) => a + Number(r.n), 0);
  const named = rows.filter((r) => (r.currency ?? "").trim());

  return {
    id: "entities",
    question: "How many accounts does each entity have?",
    available: true,
    big: count(total),
    headline: `${count(total)} accounts across ${named.length} billing currencies.`,
    prose:
      "Entity comes from the account's billing currency in default_destination_country. " +
      "Accounts with no billing currency set have never been assigned to an entity.",
    breakdown: rows.map((r) => {
      const c = (r.currency ?? "").trim();
      return [c ? `${entityFromCurrency(c)} · ${c}` : "No entity set", `${count(r.n)} accounts`] as [
        string,
        string,
      ];
    }),
    table: null,
    action: null,
    stamp: ["all entities", "identity and status only", "live"],
    provisional: false,
  };
}

/** Accounts with nobody on them — the unowned scanner as an answer. */
async function unowned(offset = 0): Promise<Answer> {
  const total = await countAccounts({ unownedOnly: true });
  const rows = await query<{
    user_pid: number;
    name: string;
    user_email: string | null;
    user_date: Date | null;
    currency: string | null;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            u.user_email, u.user_date, d.currency
       FROM ms_user u
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER} AND h.admin_id IS NULL
      ORDER BY u.user_date DESC
      LIMIT ${PAGE + 1} OFFSET ${Math.max(0, Math.trunc(offset))}`,
  );
  const more = rows.length > PAGE;
  const page = more ? rows.slice(0, PAGE) : rows;

  return {
    id: "unowned",
    question: "Which accounts have nobody on them?",
    available: true,
    big: count(total),
    headline: `${count(total)} account${total === 1 ? " has" : "s have"} no MSG91 owner.`,
    prose:
      "Ownership lives in user_handled_by, one row per account. These accounts have no row at all, " +
      "so no reply is anybody's job. Newest first.",
    breakdown: [],
    table: {
      nextCursor: more ? Math.max(0, Math.trunc(offset)) + PAGE : null,
      columns: ["Account", "Signed up", "Entity", "Contact"],
      rows: page.map((r) => [
        r.name || r.user_email || `account ${r.user_pid}`,
        r.user_date ? new Date(r.user_date).toISOString().slice(0, 10) : "—",
        entityFromCurrency(r.currency),
        r.user_email ?? "—",
      ]),
    },
    action: "Reassign these accounts",
    stamp: ["all entities", "identity and status only", "live"],
    provisional: false,
  };
}

/** Payments received, by entity, native currency, never converted. */
async function paymentsByEntity(): Promise<Answer> {
  const rows = await query<{ currency: string | null; amt: string; n: number; users: number }>(
    `SELECT d.currency, SUM(t.trans_amt) amt, COUNT(*) n, COUNT(DISTINCT t.trans_tuserid) users
       FROM ms_trans t
       JOIN ms_user u ON u.user_pid = t.trans_tuserid AND u.user_type = ${USER_TYPE.CUSTOMER}
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE t.trans_type = 1 AND t.payment_mode = 2
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY d.currency
      ORDER BY n DESC
      LIMIT 10`,
  );

  const payments = rows.reduce((a, r) => a + Number(r.n), 0);

  return {
    id: "payments",
    question: "What came in over the last 30 days?",
    available: true,
    big: count(payments),
    headline: `${count(payments)} payment${payments === 1 ? "" : "s"} landed in the last 30 days.`,
    prose:
      "Gateway payments only — razorpay, cashfree, stripe, paypal and apple. Admin and reseller " +
      "credits are excluded because they are not cash from the customer. Currencies sit side by " +
      "side and are never added together.",
    breakdown: rows.map((r) => {
      const c = (r.currency ?? "").trim();
      return [
        c ? `${entityFromCurrency(c)} · ${c}` : "No entity set",
        `${money(r.amt, c)} · ${r.n} payment${Number(r.n) === 1 ? "" : "s"} · ${r.users} accounts`,
      ] as [string, string];
    }),
    table: null,
    action: null,
    stamp: ["all entities", "commercial · L2", PROVISIONAL_NOTE, "live"],
    provisional: true,
  };
}

/** Who is most likely to churn — paid before, wallet empty, quiet since. */
async function churnRisk(): Promise<Answer> {
  const rows = await query<{
    user_pid: number;
    name: string;
    currency: string | null;
    paid: string;
    quiet_days: number;
    owner: string | null;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            d.currency, SUM(t.trans_amt) paid,
            DATEDIFF(NOW(), MAX(t.trans_date)) quiet_days,
            a.user_fname owner
       FROM ms_trans t
       JOIN ms_user u ON u.user_pid = t.trans_tuserid AND u.user_type = ${USER_TYPE.CUSTOMER}
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN ms_user a ON a.user_pid = h.admin_id
      WHERE t.trans_type = 1 AND t.payment_mode = 2
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 365 DAY)
        AND u.user_bal <= 0
      GROUP BY u.user_pid, name, d.currency, a.user_fname
     HAVING quiet_days >= 21
      ORDER BY paid DESC
      LIMIT ${PAGE}`,
  );

  return {
    id: "churn",
    question: "Who is most likely to churn this month?",
    available: true,
    big: count(rows.length),
    headline: rows.length
      ? `${rows.length} account${rows.length === 1 ? "" : "s"} paid, then went quiet with an empty wallet.`
      : "Nothing is showing the pattern right now.",
    prose:
      "The pattern is: real gateway payments in the last year, wallet now at zero, and nothing " +
      "topped up for three weeks or more. Ordered by how much they used to pay, because that is " +
      "what is at risk. Usage and delivery data would catch this earlier, but the Reports " +
      "microservice does not expose either yet.",
    breakdown: [],
    table: {
      columns: ["Account", "Paid (12 months)", "Quiet for", "Owner"],
      rows: rows.map((r) => [
        r.name || `account ${r.user_pid}`,
        money(r.paid, r.currency),
        `${r.quiet_days} days`,
        (r.owner ?? "").trim() || "Unassigned",
      ]),
    },
    action: "Create recovery missions",
    stamp: ["your accounts", "commercial · L2", PROVISIONAL_NOTE, "live"],
    provisional: true,
  };
}

/**
 * Startups stuck before their first message.
 *
 * Two passes, for the same reason as the card scanner: ms_trans has no index on
 * trans_tuserid, so a correlated NOT EXISTS against it costs one full scan of a
 * million rows per candidate — this answer took 50 seconds before the split.
 */
async function stuckStartups(): Promise<Answer> {
  const candidates = await query<{
    user_pid: number;
    name: string;
    days: number;
    user_email: string | null;
    startup: number | null;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            DATEDIFF(NOW(), u.user_date) days, u.user_email, ps.userid startup
       FROM ms_user u
       LEFT JOIN ms_user_paid_signup ps ON ps.userid = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
        AND u.user_date BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 3 DAY)
        AND u.user_bal <= 0
      ORDER BY u.user_date ASC
      LIMIT 400`,
  );

  const ids = candidates.map((c) => Number(c.user_pid)).filter(Number.isFinite);
  const transacted = new Set<number>();
  if (ids.length) {
    const hit = await query<{ id: number }>(
      `SELECT DISTINCT t.trans_tuserid id
         FROM ms_trans t
        WHERE t.trans_tuserid IN (${ids.map(() => "?").join(",")})`,
      ids,
    );
    for (const r of hit) transacted.add(Number(r.id));
  }

  const rows = candidates.filter((r) => !transacted.has(Number(r.user_pid))).slice(0, PAGE);

  return {
    id: "stuck",
    question: "Which accounts are stuck before their first message?",
    available: true,
    big: count(rows.length),
    headline: `${rows.length} account${rows.length === 1 ? "" : "s"} signed up and never sent anything.`,
    prose:
      "Empty wallet and no transaction of any kind, three days or more after signing up, against " +
      "a three-day target for first value. This is where first-value dies, and in Indian SMS the " +
      "usual cause is DLT or sender-ID approval.",
    breakdown: [],
    table: {
      columns: ["Account", "Days since signup", "Programme", "Contact"],
      rows: rows.map((r) => [
        r.name || `account ${r.user_pid}`,
        r.days,
        r.startup != null ? "Startup" : "Standard",
        r.user_email ?? "—",
      ]),
    },
    action: "Chase these approvals",
    stamp: ["all entities", "identity and status only", "live"],
    provisional: false,
  };
}

/** Whose accounts are flat — reps with no recorded action for a while. */
async function flatReps(): Promise<Answer> {
  const { rows } = await repActivity();
  const flat = rows.filter((r) => (r.daysQuiet ?? 0) >= 30);

  return {
    id: "flat",
    question: "Whose accounts are flat?",
    available: true,
    big: count(flat.length),
    headline: flat.length
      ? `${flat.length} rep${flat.length === 1 ? " has" : "s have"} taken no recorded action in 30 days or more.`
      : "Everybody has acted in the last month.",
    prose:
      "Measured from admin_updation_log, which records what staff actually changed. It sees " +
      "changes made in the panel, not calls or mail — so a rep who is talking to customers " +
      "without touching the system will look quiet here. That gap closes when Gmail is connected.",
    breakdown: [],
    table: {
      columns: ["Rep", "Last recorded action", "Actions in 30 days"],
      rows: rows
        .slice(0, PAGE)
        .map((r) => [r.name, r.lastActed ?? "never", r.actions30d]),
    },
    action: null,
    stamp: ["Sales team", "manager view", "internal", "live"],
    provisional: false,
  };
}

/** Partner motion — accounts sourced through a reseller. */
async function partnerMotion(): Promise<Answer> {
  const rows = await query<{
    reseller: number;
    reseller_name: string;
    accounts: number;
  }>(
    `SELECT pr.user_pid reseller,
            TRIM(CONCAT(COALESCE(pr.user_fname,''),' ',COALESCE(pr.user_lname,''))) reseller_name,
            COUNT(*) accounts
       FROM ms_user u
       JOIN ms_user pr ON pr.user_pid = u.user_userid
                      AND pr.user_type = ${USER_TYPE.RESELLER}
                      AND pr.user_pid <> 2
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
      GROUP BY pr.user_pid, reseller_name
      ORDER BY accounts DESC
      LIMIT ${PAGE}`,
  );

  const total = rows.reduce((a, r) => a + Number(r.accounts), 0);

  return {
    id: "partner",
    question: "How much of the book is partner-sourced?",
    available: true,
    big: count(total),
    headline: `${count(total)} account${total === 1 ? " sits" : "s sit"} under a reseller.`,
    prose:
      "An account whose parent in ms_user is another reseller is partner-sourced, so the reseller " +
      "owns the commercial relationship. Accounts hanging off MSG91's own root account are direct " +
      "and are excluded. Going around a reseller on price loses the reseller, so these are a hard " +
      "stop rather than guidance.",
    breakdown: [],
    table: {
      columns: ["Partner", "Accounts sourced"],
      rows: rows.map((r) => [r.reseller_name || `reseller ${r.reseller}`, r.accounts]),
    },
    action: "Break it down by partner",
    stamp: ["all entities", "identity and status only", "live"],
    provisional: false,
  };
}

/** New signups in the last 7 days. */
async function recentSignups(): Promise<Answer> {
  const rows = await query<{
    user_pid: number;
    name: string;
    user_email: string | null;
    user_date: Date;
    owner: string | null;
    currency: string | null;
  }>(
    `SELECT u.user_pid,
            TRIM(CONCAT(COALESCE(u.user_fname,''),' ',COALESCE(u.user_lname,''))) name,
            u.user_email, u.user_date, a.user_fname owner, d.currency
       FROM ms_user u
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN ms_user a ON a.user_pid = h.admin_id
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
        AND u.user_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY u.user_date DESC
      LIMIT ${PAGE}`,
  );

  const unownedCount = rows.filter((r) => !(r.owner ?? "").trim()).length;

  return {
    id: "signups",
    question: "Who signed up this week?",
    available: true,
    big: count(rows.length),
    headline: `${rows.length} account${rows.length === 1 ? "" : "s"} signed up in the last seven days.`,
    prose: unownedCount
      ? `${unownedCount} of them still have no owner, so nobody has been asked to call them.`
      : "Every one of them has an owner.",
    breakdown: [],
    table: {
      columns: ["Account", "When", "Entity", "Owner"],
      rows: rows.map((r) => [
        r.name || r.user_email || `account ${r.user_pid}`,
        new Date(r.user_date).toISOString().slice(0, 16).replace("T", " "),
        entityFromCurrency(r.currency),
        (r.owner ?? "").trim() || "Unassigned",
      ]),
    },
    action: "Assign these accounts",
    stamp: ["all entities", "identity and status only", "live"],
    provisional: false,
  };
}

const ANSWERS: Record<string, (offset?: number) => Promise<Answer>> = {
  churn: churnRisk,
  unowned,
  stuck: stuckStartups,
  flat: flatReps,
  partner: partnerMotion,
  payments: paymentsByEntity,
  entities: accountsByEntity,
  signups: recentSignups,
};

export const ASK_CATALOGUE: { id: string; question: string; pinned?: boolean }[] = [
  { id: "churn", question: "Who is most likely to churn this month?", pinned: true },
  { id: "unowned", question: "Which accounts have nobody on them?", pinned: true },
  { id: "stuck", question: "Which accounts are stuck before their first message?" },
  { id: "signups", question: "Who signed up this week?" },
  { id: "payments", question: "What came in over the last 30 days?" },
  { id: "flat", question: "Whose accounts are flat?" },
  { id: "partner", question: "How much of the book is partner-sourced?" },
  { id: "entities", question: "How many accounts does each entity have?" },
];

export async function answer(id: string, offset = 0, fresh = false): Promise<Answer> {
  const fn = ANSWERS[id];
  // "Recompute" means recompute. Drop every page of this answer, not just the
  // one being asked for, so paging on does not reveal the stale tail.
  if (fresh) drop(`ask:${id}:`);
  // Cached because several of these aggregate ms_trans, which has no usable
  // index and costs a full scan each time (see lib/pulse/cache.ts). The offset
  // is part of the key, so page two is cached separately from page one.
  if (fn) return cached(`ask:${id}:${offset}`, DEFAULT_TTL_MS, () => fn(offset));

  return {
    id,
    question: id,
    available: false,
    big: "—",
    headline: "Pulse cannot answer that from the database yet.",
    prose:
      "Ask is wired to the questions legacy MySQL can evidence. Promises, missions, response " +
      "times and conversation history need Pulse's own store and a mailbox connection, and the " +
      "database user here has read-only access to MSG91's tables.",
    breakdown: [],
    table: null,
    action: null,
    stamp: ["no data source"],
    provisional: false,
  };
}

/**
 * Growth strip (§7.1 item 6). Only outcomes the data can evidence: the score is
 * deliberately absent because it is weighted to promises and recoveries, which
 * Pulse does not yet record.
 */
export type Growth = {
  label: string;
  headline: string;
  stats: [string, string, string, string][];
};

export async function growth(meId: number | null): Promise<Growth> {
  return cached(`growth:${meId ?? "none"}`, DEFAULT_TTL_MS, () => growthUncached(meId));
}

async function growthUncached(meId: number | null): Promise<Growth> {
  const mine = meId ? await countAccounts({ ownerId: meId }) : 0;
  const unownedTotal = await countAccounts({ unownedOnly: true });

  const signups = await queryOne<{ n30: number; n7: number }>(
    `SELECT SUM(user_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) n30,
            SUM(user_date >= DATE_SUB(NOW(), INTERVAL 7 DAY))  n7
       FROM ms_user
      WHERE user_type = ${USER_TYPE.CUSTOMER}
        AND user_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
  );

  const paying = await queryOne<{ users: number; n: number }>(
    `SELECT COUNT(DISTINCT t.trans_tuserid) users, COUNT(*) n
       FROM ms_trans t
      WHERE t.trans_type = 1 AND t.payment_mode = 2
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
  );

  return {
    label: "MSG91 this month",
    headline: `${count(signups?.n30 ?? 0)} accounts signed up. <em>${count(
      unownedTotal,
    )} have nobody on them.</em>`,
    stats: [
      [
        count(signups?.n30 ?? 0),
        "signed up",
        "Signups",
        "New accounts in ms_user over the last 30 days, customers only.",
      ],
      [
        count(signups?.n7 ?? 0),
        "this week",
        "Signups this week",
        "The last seven days, so the month figure has context.",
      ],
      [
        count(paying?.users ?? 0),
        "paid",
        "Accounts that paid",
        "Distinct accounts with a gateway payment in the last 30 days. Provisional — the transaction-type mapping is still being confirmed.",
      ],
      [
        count(unownedTotal),
        "unowned",
        "Accounts with no owner",
        "No row in user_handled_by, so no reply is anybody's job.",
      ],
      [
        count(mine),
        "yours",
        "Your accounts",
        "Accounts where user_handled_by names you as the account manager.",
      ],
    ],
  };
}
