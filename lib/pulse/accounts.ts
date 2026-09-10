import { query, queryOne } from "@/lib/db";
import { limitClause, page, toPaged, type Page, type Paged } from "./paginate";
import { countryOf } from "./country";
import { ownersFor, overrideCounts, type OwnerOverride } from "./ownership";
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
  /* Where that owner came from. MSG91 records ownership in `user_handled_by`,
     which Pulse may only read; a reassignment made in Pulse is an override in
     its own store, layered on here. The page shows the difference, because
     "Rhea owns this" and "we gave this to Rhea and MSG91 has not caught up"
     are different things to walk into a meeting believing. */
  ownerSource: "msg91" | "pulse";
  /** What MSG91 still says, when Pulse has overridden it. */
  ownerBefore: { id: number; name: string } | null;
  /** Why, in the words of whoever reassigned it. */
  ownerNote: string | null;
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
    /* Overwritten by `applyOverrides` for the accounts Pulse has reassigned.
       The default is the truthful one: this row came from MSG91. */
    ownerSource: "msg91",
    ownerBefore: null,
    ownerNote: null,
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
 * The ownership predicate, with Pulse's reassignments folded in.
 *
 * Filtering on owner is the one place the override cannot be applied after the
 * fact. "My accounts" and "the unowned ones" *choose* which rows come back, so
 * an account Pulse handed to you has to be in the SQL or it never reaches the
 * page — and one Pulse took off you has to be out of it, or it arrives and
 * then shows somebody else's name.
 *
 * So the override table is read first and turned into two id lists: the ones
 * that now match the filter and did not, and the ones that matched and no
 * longer do. Both go in as literal IN lists. That is only reasonable because
 * these are decisions people made by hand — there are tens of them, not tens
 * of thousands — so the list is bounded by how much reassigning has actually
 * happened. Past CAP it is dropped rather than sent, and said out loud: a
 * slightly stale "my accounts" is recoverable, a query with 50,000 literals in
 * it is not.
 *
 * On a store failure this falls back to MSG91's answer alone, like
 * `applyOverrides`.
 */
const CAP = 2000;

async function ownerClause(
  filter: AccountFilter,
): Promise<{ sql: string; params: (string | number)[] }> {
  const base = filter.ownerId ? "h.admin_id = ?" : "h.admin_id IS NULL";
  const baseParams: (string | number)[] = filter.ownerId ? [filter.ownerId] : [];

  let moved: Map<string, number | null>;
  try {
    ({ moved } = await overrideCounts());
  } catch (err) {
    console.warn("[pulse] owner overrides unavailable for filter:", (err as Error).message);
    return { sql: base, params: baseParams };
  }
  if (!moved.size) return { sql: base, params: baseParams };

  const target = filter.ownerId ?? null;
  const claimed: number[] = [];
  const released: number[] = [];
  for (const [accountId, ownerId] of moved) {
    const id = Number(accountId);
    if (!Number.isFinite(id)) continue;
    (ownerId === target ? claimed : released).push(id);
  }

  if (claimed.length + released.length > CAP) {
    console.warn(
      `[pulse] ${claimed.length + released.length} owner overrides exceeds the ${CAP} the filter ` +
        `will inline; owner filters are reading MSG91's ownership only until this is indexed properly.`,
    );
    return { sql: base, params: baseParams };
  }

  const list = (ids: number[]) => ids.join(",");
  /* Ids are numbers checked by Number.isFinite above, so inlining them is not
     an injection surface — and it keeps the placeholder count off the wire. */
  const kept = released.length ? `${base} AND u.user_pid NOT IN (${list(released)})` : base;
  const sql = claimed.length ? `((${kept}) OR u.user_pid IN (${list(claimed)}))` : `(${kept})`;
  return { sql, params: baseParams };
}

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
    const clause = await ownerClause(filter);
    where.push(clause.sql);
    params.push(...clause.params);
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
 * Lay Pulse's reassignments over MSG91's answer.
 *
 * `user_handled_by` is read-only to Pulse, so a reassignment made here is a row
 * in `pulse_account_owner` (migrations/009) and this is where the two meet.
 * The override wins where it exists, MSG91's answer stands everywhere else, and
 * the row records which of the two you are looking at.
 *
 * Degraded rather than fatal on a store failure: if Pulse's own database is
 * unreachable, an account list showing MSG91's ownership is worth far more than
 * an error page, and the alternative is that a blip in the store takes down
 * every surface that lists an account. It is logged, not swallowed silently.
 */
async function applyOverrides(accounts: Account[]): Promise<Account[]> {
  if (!accounts.length) return accounts;
  let overrides: Map<string, OwnerOverride>;
  try {
    overrides = await ownersFor(accounts.map((a) => a.id));
  } catch (err) {
    console.warn("[pulse] owner overrides unavailable:", (err as Error).message);
    return accounts;
  }
  if (!overrides.size) return accounts;

  return accounts.map((a) => {
    const o = overrides.get(String(a.id));
    if (!o) return a;
    return {
      ...a,
      owner: o.ownerId === null ? null : { id: o.ownerId, name: o.ownerName ?? `Rep ${o.ownerId}` },
      ownerSource: "pulse" as const,
      /* Only interesting when the two disagree. An override that restates what
         MSG91 already says is not a handover and should not read as one. */
      ownerBefore: a.owner && a.owner.id !== o.ownerId ? a.owner : null,
      ownerNote: o.note,
    };
  });
}

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
  const ordered = list.map((id) => byId.get(id)).filter((a): a is Account => Boolean(a));
  return applyOverrides(ordered);
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
  if (!row) return null;
  return (await applyOverrides([mapAccount(row)]))[0] ?? null;
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
  /** What this account actually pays per message, per route. */
  rates: Rate[];
};

export type Rate = {
  route: number;
  /** `ms_route.route_name` where the database has one, "Route N" where not. */
  routeName: string;
  /** `text` or `voice` — MSG91's own word. */
  kind: string;
  /** The number, unformatted, for anything that wants to compute on it. */
  price: number;
  /** The number as money, in the account's own currency. */
  priceLabel: string;
};

/**
 * The rate card for one account.
 *
 * `ms_user_pricing` is the negotiated per-account price: one row per (user,
 * route, type), five decimal places, and 489 rows in total — so most accounts
 * are on list price and have none, and an empty list is the honest answer
 * rather than a gap.
 *
 * This is the half of "payments and rates" that was never built. The reveal
 * has always shown three payment tiles and the prototype's own sample data put
 * "₹0.128 current SMS rate" beside them, which was a number somebody typed
 * into a mockup. A rep quoting that in a renewal call is the exact failure
 * this table prevents.
 *
 * Deliberately *not* `message_pricing`: that is the public volume-slab list,
 * the same for everybody, and showing it on an account page would read as
 * "this is what they pay" when it is "this is what they would pay if nobody
 * had negotiated". `country_base_pricing` has the same problem.
 *
 * Formatted at five decimals rather than two: an SMS rate is ₹0.09200, and
 * rounding it to ₹0.09 loses the digit the whole conversation is about.
 */
export async function accountRates(id: number, currency: string): Promise<Rate[]> {
  const rows = await query<{
    route: string | null;
    route_name: string | null;
    type: string | null;
    pricing: string | null;
  }>(
    `SELECT p.route, r.route_name, p.type, p.pricing
       FROM ms_user_pricing p
       LEFT JOIN ms_route r ON r.route_pid = p.route
      WHERE p.user_pid = ?
      ORDER BY p.type, CAST(p.route AS UNSIGNED)
      LIMIT 24`,
    [id],
  );

  const symbol = currencySymbol(currency);
  return rows
    .filter((r) => (r.route ?? "").trim() !== "")
    .map((r) => {
      const route = Number(r.route);
      const price = Number(r.pricing ?? 0);
      const named = (r.route_name ?? "").trim();
      return {
        route,
        routeName: named || `Route ${route}`,
        kind: (r.type ?? "").trim() || "text",
        price,
        priceLabel: `${symbol}${price.toFixed(5)}`,
      };
    });
}

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

  const rates = await accountRates(id, currency);

  return {
    provisional: true,
    currency,
    rates,
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
  if (filter.ownerId || filter.unownedOnly) {
    const clause = await ownerClause(filter);
    where.push(clause.sql);
    params.push(...clause.params);
  }

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
  const rows = await query<{
    member_name: string | null;
    member_email: string | null;
    // int(11) in this schema, not the string this code once assumed — calling
    // .trim() on it threw, and because accountPeople is inside the account
    // page's Promise.all that took the whole page down with a 503 for every
    // company that had ever invited anybody.
    member_role: number | string | null;
  }>(
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
        role: memberRole(r.member_role),
      })),
    req,
  );
}

/**
 * `ms_invite_member.member_role` is a numeric code and this database carries no
 * lookup table for it — the five values in use (0 to 4) all sit against the
 * same `member_access` list, so there is nothing to infer a meaning from.
 *
 * Reported as a code rather than guessed at, the same way `admin_updation_log`
 * types are in lib/pulse/audit.ts. "role 3" is unhelpful; "owner" would be a
 * fabrication on somebody's account page, and that is worse.
 */
function memberRole(raw: number | string | null): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (Number.isFinite(n)) return n === 0 ? null : `role ${n}`;
  return String(raw).trim() || null;
}

/**
 * Every country the customer base is in, with how many accounts are in each.
 *
 * The lens used to build its list from whatever the board had scored, which
 * is one page of 200 — and 190 of those carry no country at all, so the menu
 * collapsed to India and Unknown while the book spans 65 countries. This
 * reads the whole base instead.
 *
 * Cheap: default_destination_country is 4,218 rows and the group is on an
 * indexed-enough column. Accounts with no row there are real and are counted
 * under a null country rather than dropped — there are more of them than
 * there are of any single country.
 */
export type CountryCount = {
  code: string | null;
  name: string | null;
  flag: string | null;
  accounts: number;
};

export async function countryCounts(): Promise<CountryCount[]> {
  const rows = await query<{ code: string | null; currency: string | null; n: number }>(
    `SELECT NULLIF(TRIM(d.billing_country), '') AS code,
            NULLIF(TRIM(d.currency), '')        AS currency,
            COUNT(*)                            AS n
       FROM ms_user u
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_type = 3
      GROUP BY code, currency`,
  );

  /* Two rows can name the same country — one by dialling code, one only by
     currency — so they are summed rather than listed twice. */
  const by = new Map<string, CountryCount>();
  for (const r of rows) {
    const place = countryOf(r.code, r.currency);
    const key = place ? place.name : "";
    const at = by.get(key) ?? {
      code: r.code ?? null,
      name: place ? place.name : null,
      flag: place ? place.flag : null,
      accounts: 0,
    };
    at.accounts += Number(r.n);
    by.set(key, at);
  }

  return [...by.values()].sort((a, b) =>
    a.name === null ? 1 : b.name === null ? -1 : b.accounts - a.accounts,
  );
}
