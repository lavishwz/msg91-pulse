import { query, queryOne } from "@/lib/db";
import { limitClause, page, toPaged, type Page, type Paged } from "./paginate";
import { countryOf } from "./country";
import {
  accountName,
  ago,
  count,
  currencySymbol,
  daysSince,
  domainOf,
  entityFromCurrency,
  inferMotion,
  money,
  statusLabel,
  USER_TYPE,
  MSG91_ROOT_PID,
  type Entity,
  type EvidenceLevel,
  type Motion,
} from "./domain";

/**
 * Accounts — 1:1 with `ms_user.user_pid` (handover §9).
 *
 * Only `user_type = 3` rows are accounts; type 1 is MSG91 staff and type 2 is a
 * reseller, and both would otherwise show up as customers. Every query here is
 * paged, and joins are limited to small per-account lookups so a page of 20
 * accounts stays a page of 20 lookups rather than a scan.
 */

export type AccountRow = {
  user_pid: number;
  user_fname: string | null;
  user_lname: string | null;
  user_uname: string | null;
  user_email: string | null;
  user_mobno: string | null;
  user_date: Date | null;
  user_bal: number | null;
  user_status: number | null;
  admin_id: number | null;
  owner_name: string | null;
  currency: string | null;
  billing_country: string | null;
  client_name: string | null;
  client_industry: string | null;
  reseller_parent: number | null;
  startup_programme: number | null;
  has_signup: number | null;
};

export type Account = {
  id: number;
  name: string;
  initials: string;
  username: string;
  email: string;
  domain: string;
  mobile: string;
  signedUpAt: string | null;
  signedUpAgo: string;
  ageDays: number | null;
  status: string;
  entity: Entity;
  currency: string;
  /** Dialling code from billing_country, and the country it names. */
  countryCode: string | null;
  country: string | null;
  countryFlag: string | null;
  motion: Motion;
  motionEvidence: EvidenceLevel;
  industry: string | null;
  owner: { id: number; name: string } | null;
  balance: number;
  balanceLabel: string;
  /** L0 status sentence — the only prose that renders without a click. */
  line: string;
};

/** Initials for the company monogram (companies are squares — handover §6). */
function initials(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const SELECT_ACCOUNT = `
  SELECT u.user_pid, u.user_fname, u.user_lname, u.user_uname, u.user_email,
         u.user_mobno, u.user_date, u.user_bal, u.user_status,
         h.admin_id,
         a.user_fname             AS owner_name,
         d.currency, d.billing_country,
         c.name                   AS client_name,
         NULLIF(TRIM(c.industry), '') AS client_industry,
         pr.user_pid              AS reseller_parent,
         ps.userid                AS startup_programme,
         sh.user_id               AS has_signup
    FROM ms_user u
    LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
    LEFT JOIN ms_user a         ON a.user_pid = h.admin_id
    LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
    LEFT JOIN clientManagement c ON c.userId = u.user_pid
    LEFT JOIN ms_user pr        ON pr.user_pid = u.user_userid
                            AND pr.user_type = ${USER_TYPE.RESELLER}
                            AND pr.user_pid <> ${MSG91_ROOT_PID}
    LEFT JOIN ms_user_paid_signup ps ON ps.userid = u.user_pid
    LEFT JOIN ms_signup_history sh   ON sh.user_id = u.user_pid
`;

export function mapAccount(r: AccountRow): Account {
  const name = accountName(r);
  const currency = (r.currency ?? "").trim().toUpperCase();
  /* billing_country is a dialling code, and it is the only per-account country
     the database carries. Falls back to the currency, then to nothing — an
     account whose country is unknown is not quietly filed under India. */
  const place = countryOf(r.billing_country, currency);
  const { motion, evidenceLevel } = inferMotion({
    resellerParent: r.reseller_parent != null,
    startupProgramme: r.startup_programme != null,
    hasSignupRecord: r.has_signup != null,
  });
  const balance = Number(r.user_bal ?? 0);
  const age = daysSince(r.user_date);

  return {
    id: Number(r.user_pid),
    name,
    initials: initials(name),
    username: (r.user_uname ?? "").trim(),
    email: (r.user_email ?? "").trim(),
    domain: domainOf(r.user_email),
    mobile: (r.user_mobno ?? "").trim(),
    signedUpAt: r.user_date ? new Date(r.user_date).toISOString() : null,
    signedUpAgo: ago(r.user_date),
    ageDays: age,
    status: statusLabel(r.user_status),
    entity: entityFromCurrency(currency),
    currency,
    countryCode: (r.billing_country ?? "").trim() || null,
    country: place ? place.name : null,
    countryFlag: place ? place.flag : null,
    motion,
    motionEvidence: evidenceLevel,
    industry: r.client_industry ?? null,
    owner: r.admin_id ? { id: Number(r.admin_id), name: accountName({ user_fname: r.owner_name }) } : null,
    balance,
    balanceLabel: currency ? money(balance, currency) : count(balance),
    line: statusSentence({ age, balance, status: r.user_status, currency }),
  };
}

/** The L0 one-liner. A sentence, never a field list (handover §2.3). */
function statusSentence(x: {
  age: number | null;
  balance: number;
  status: number | null;
  currency: string;
}): string {
  if (Number(x.status) === 2) return "signed up, not yet verified";
  if (x.age != null && x.age <= 1) return "signed up today";
  if (x.age != null && x.age <= 14 && x.balance <= 0) return `${x.age} days in, nothing sent yet`;
  if (x.balance <= 0) return "wallet empty";
  const bal = x.currency ? money(x.balance, x.currency) : count(x.balance);
  return `${bal} in the wallet`;
}

export type AccountFilter = {
  /** Restrict to one owner (an `ms_user.user_pid` of a type-1 admin). */
  ownerId?: number;
  /** Only accounts with no owner — the unowned scanner (handover §10). */
  unownedOnly?: boolean;
  entity?: Entity;
  motion?: Motion;
  /** Free-text match on name, username or email. */
  q?: string;
};

/**
 * A page of accounts, newest signup first.
 *
 * Filters that map to a column go into SQL. `entity` and `motion` are derived,
 * so entity filters by currency in SQL (cheap, indexed-ish) while motion is
 * applied after mapping — which is why callers get a page at a time and the
 * filter is described as a lens, not a search.
 */
export async function listAccounts(
  filter: AccountFilter = {},
  req: Page = page(),
): Promise<Paged<Account>> {
  // A text search goes down a different path: see searchAccounts.
  if (filter.q) return searchAccounts(filter.q, req);

  // Step 1 — choose the page's ids from ms_user with only the joins the filter
  // needs. Pulling the full account shape here instead costs seconds: neither
  // ms_user nor ms_trans has a secondary index, so `ORDER BY user_date DESC`
  // across seven LEFT JOINs sorts every customer row through all of them.
  const where: string[] = [`u.user_type = ${USER_TYPE.CUSTOMER}`];
  const joins: string[] = [];
  const params: (string | number)[] = [];

  if (filter.ownerId || filter.unownedOnly) {
    joins.push("LEFT JOIN user_handled_by h ON h.user_id = u.user_pid");
    if (filter.ownerId) {
      where.push("h.admin_id = ?");
      params.push(filter.ownerId);
    } else {
      where.push("h.admin_id IS NULL");
    }
  }

  if (filter.entity) {
    const currency = CURRENCY_BY_ENTITY[filter.entity];
    if (currency) {
      joins.push("LEFT JOIN default_destination_country d ON d.u_id = u.user_pid");
      where.push("d.currency = ?");
      params.push(currency);
    }
  }

  const hits = await query<{ user_pid: number }>(
    `SELECT u.user_pid FROM ms_user u ${joins.join(" ")}
      WHERE ${where.join(" AND ")}
      ORDER BY u.user_date DESC, u.user_pid DESC ${limitClause(req)}`,
    params,
  );
  if (!hits.length) return toPaged([], req);

  // Step 2 — hydrate just those ids.
  const accounts = await hydrate(hits.map((h) => Number(h.user_pid)));
  const filtered = filter.motion ? accounts.filter((a) => a.motion === filter.motion) : accounts;
  return toPaged(filtered, req);
}

const CURRENCY_BY_ENTITY: Record<string, string> = {
  India: "INR",
  UAE: "AED",
  US: "USD",
  Singapore: "SGD",
  UK: "GBP",
  EU: "EUR",
};

/**
 * Fetch the full account shape for a known set of ids, preserving their order.
 * Every list path funnels through here so the expensive joins only ever run for
 * one page of rows.
 */
async function hydrate(ids: number[]): Promise<Account[]> {
  const list = ids.filter(Number.isFinite);
  if (!list.length) return [];
  const rows = await query<AccountRow>(
    `${SELECT_ACCOUNT} WHERE u.user_pid IN (${list.map(() => "?").join(",")})`,
    list,
  );
  const byId = new Map(rows.map((r) => [Number(r.user_pid), mapAccount(r)]));
  return list.map((id) => byId.get(id)).filter((a): a is Account => Boolean(a));
}

/**
 * Text search.
 *
 * `ms_user` has no index but only 10.5k rows, so a `LIKE '%q%'` over it alone is
 * ~70ms. Running that same predicate through the seven joins of SELECT_ACCOUNT
 * cost 2.8s, so matching and hydrating are two steps: find the ids cheaply,
 * then fetch the full row for the handful that matched.
 */
export async function searchAccounts(q: string, req: Page = page()): Promise<Paged<Account>> {
  const like = `%${q}%`;
  const hits = await query<{ user_pid: number }>(
    `SELECT u.user_pid
       FROM ms_user u
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
        AND (u.user_fname LIKE ? OR u.user_uname LIKE ? OR u.user_email LIKE ?)
      ORDER BY u.user_date DESC ${limitClause(req)}`,
    [like, like, like],
  );
  if (!hits.length) return toPaged([], req);

  return toPaged(await hydrate(hits.map((h) => Number(h.user_pid))), req);
}

/** One account by id. */
export async function getAccount(id: number): Promise<Account | null> {
  const row = await queryOne<AccountRow>(
    `${SELECT_ACCOUNT} WHERE u.user_pid = ? AND u.user_type = ${USER_TYPE.CUSTOMER} LIMIT 1`,
    [id],
  );
  return row ? mapAccount(row) : null;
}

/**
 * Per-route wallet balances — the "Products" strip on an account page.
 *
 * `ms_text_bal` is one row per (user, route), so this is a handful of rows.
 *
 * The route ids in use here are 0, 1, 4, 12, 18, 19, 20, 28 and 109–114, and
 * `ms_route` only names a few of them — there is no table in this database that
 * maps a route id to one of Pulse's ten products (SMS, OTP, WhatsApp, Email,
 * Voice, Hello, Segmento, Campaign, RCS, Masking). So the real route name is
 * shown when the database knows it and "Route N" when it does not, rather than
 * a guessed product name: a wrong product on an account page would send a rep
 * into a meeting with the wrong story.
 */
export async function accountRoutes(
  id: number,
): Promise<{ product: string; balance: number; route: number; named: boolean }[]> {
  const rows = await query<{ route: number; balance: number; route_name: string | null }>(
    `SELECT b.route, b.balance, r.route_name
       FROM ms_text_bal b
       LEFT JOIN ms_route r ON r.route_pid = b.route
      WHERE b.userId = ?
      ORDER BY b.balance DESC, b.route
      LIMIT 12`,
    [id],
  );
  return rows.map((r) => {
    const name = (r.route_name ?? "").trim();
    return {
      route: Number(r.route),
      product: name || `Route ${r.route}`,
      named: Boolean(name),
      balance: Number(r.balance ?? 0),
    };
  });
}

/**
 * Commercial figures — L2, only ever called behind an explicit reveal that
 * writes an audit event (handover §5).
 *
 * Bounded by construction: three aggregates over one account's rows, plus the
 * five most recent payments.
 */
export type Commercial = {
  provisional: true;
  currency: string;
  received: { amount: string; count: number; window: string };
  lastPayment: { amount: string; when: string; mode: string } | null;
  walletCredit: string;
  recent: { amount: string; when: string; via: string }[];
};

export async function accountCommercial(id: number, currency: string): Promise<Commercial> {
  const totals = await queryOne<{ amt: string | null; n: number; last: Date | null }>(
    `SELECT SUM(t.trans_amt) amt, COUNT(*) n, MAX(t.trans_date) last
       FROM ms_trans t
      WHERE t.trans_tuserid = ?
        AND t.trans_type = 1 AND t.payment_mode = 2
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`,
    [id],
  );

  const credit = await queryOne<{ sms: string | null }>(
    `SELECT SUM(t.trans_sms) sms
       FROM ms_trans t
      WHERE t.trans_tuserid = ? AND t.trans_type = 1
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`,
    [id],
  );

  const recent = await query<{ trans_amt: string; trans_date: Date; trans_desc: string }>(
    `SELECT t.trans_amt, t.trans_date, t.trans_desc
       FROM ms_trans t
      WHERE t.trans_tuserid = ? AND t.trans_type = 1 AND t.payment_mode = 2
      ORDER BY t.trans_date DESC
      LIMIT 5`,
    [id],
  );

  const gateway = (desc: string) => {
    const m = /through\s+([a-z]+)/i.exec(desc ?? "");
    return m ? m[1].toLowerCase() : "gateway";
  };

  return {
    provisional: true,
    currency,
    received: {
      amount: money(totals?.amt ?? 0, currency),
      count: Number(totals?.n ?? 0),
      window: "last 12 months",
    },
    lastPayment: totals?.last
      ? { amount: money(totals.amt ?? 0, currency), when: ago(totals.last), mode: "gateway" }
      : null,
    walletCredit: count(credit?.sms ?? 0),
    recent: recent.map((r) => ({
      amount: money(r.trans_amt, currency),
      when: ago(r.trans_date),
      via: gateway(r.trans_desc),
    })),
  };
}

/**
 * Turn a change-log row into a sentence. The log stores a free-text comment
 * plus before/after values; the comment is usually already readable, so it is
 * preferred and the values only fill in when it is empty.
 */
function describeChange(
  comment: string | null,
  prev: string | null,
  curr: string | null,
): string {
  const c = (comment ?? "").trim();
  if (c) return c;
  const from = (prev ?? "").trim();
  const to = (curr ?? "").trim();
  if (from && to) return `changed from ${from} to ${to}`;
  if (to) return `set to ${to}`;
  return "changed a setting";
}

/** Admin comments on an account — the only human notes legacy MySQL holds. */
export async function accountComments(
  id: number,
  req: Page = page({ limit: 5 }),
): Promise<Paged<{ when: string; by: string; text: string }>> {
  const rows = await query<{ comment: Buffer | string; comment_date: Date; author: string | null }>(
    `SELECT c.comment, c.comment_date, a.user_fname AS author
       FROM user_comment c
       LEFT JOIN ms_user a ON a.user_pid = c.admin_id
      WHERE c.user_id = ?
      ORDER BY c.comment_date DESC ${limitClause(req)}`,
    [id],
  );
  return toPaged(
    rows.map((r) => ({
      when: ago(r.comment_date),
      by: accountName({ user_fname: r.author }) || "an admin",
      text: (r.comment instanceof Buffer ? r.comment.toString("utf8") : String(r.comment ?? "")).trim(),
    })),
    req,
  );
}

/** Recent activity on an account, from the user-side change log. */
export async function accountActivity(
  id: number,
  req: Page = page({ limit: 8 }),
): Promise<Paged<{ when: string; what: string }>> {
  const rows = await query<{
    comment: string | null;
    action_time: Date;
    type: number;
    prev_val: string | null;
    curr_val: string | null;
  }>(
    `SELECT l.comment, l.action_time, l.type, l.prev_val, l.curr_val
       FROM ms_user_updation_logs l
      WHERE l.admin_id = ?
      ORDER BY l.action_time DESC ${limitClause(req)}`,
    [id],
  );
  return toPaged(
    rows.map((r) => ({
      when: ago(r.action_time),
      what: describeChange(r.comment, r.prev_val, r.curr_val),
    })),
    req,
  );
}

/** Count of accounts for a scope — one cheap COUNT, no row transfer. */
export async function countAccounts(filter: AccountFilter = {}): Promise<number> {
  const where: string[] = [`u.user_type = ${USER_TYPE.CUSTOMER}`];
  const params: (string | number)[] = [];
  if (filter.ownerId) {
    where.push("h.admin_id = ?");
    params.push(filter.ownerId);
  }
  if (filter.unownedOnly) where.push("h.admin_id IS NULL");

  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) n FROM ms_user u
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
      WHERE ${where.join(" AND ")}`,
    params,
  );
  return Number(row?.n ?? 0);
}


/**
 * The people at a company, from the members it has invited.
 *
 * `ms_invite_member` is the only place MSG91 records who works at a customer.
 * Most young accounts have none, and an empty list is the honest answer — it is
 * also itself a signal, because an account where you know one person churns at
 * roughly twice the rate of one where you know three.
 */
export async function accountPeople(
  id: number,
  req: Page = page({ limit: 8 }),
): Promise<Paged<{ name: string; email: string; role: string | null }>> {
  const rows = await query<{ member_name: string | null; member_email: string | null; member_role: string | null }>(
    `SELECT member_name, member_email, member_role
       FROM ms_invite_member
      WHERE member_company_id = ?
      ORDER BY member_id DESC ${limitClause(req)}`,
    [id],
  );
  return toPaged(
    rows
      .filter((r) => r.member_email)
      .map((r) => ({
        name: (r.member_name ?? "").trim() || (r.member_email ?? "").split("@")[0],
        email: r.member_email ?? "",
        role: (r.member_role ?? "").trim() || null,
      })),
    req,
  );
}
