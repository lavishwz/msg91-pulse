import { query } from "@/lib/db";
import { count } from "./domain";

/**
 * Which MSG91 products a company is actually on.
 *
 * The company page has always had a "Products" section, but it was fed by
 * `accountRoutes` — `ms_text_bal` joined to `ms_route`. That is one product's
 * plumbing, not a product list: every row it returns is an SMS route, so a
 * company running WhatsApp and nothing else showed an empty section, and a
 * company running SMS showed the same product five times under five route
 * names. Nine of MSG91's ten products could not appear there at all.
 *
 * ── Where the answer actually lives ────────────────────────────────────────
 * There is no one table. MSG91's schema records a product two different ways
 * and this reads both:
 *
 *   **Entitlement** — `ms_user_services.services`, a JSON array of ids into
 *     `microservice_names` (SMS, Email, Voice, WhatApp, RCS, Campaign, Hello,
 *     Oneapi). `company_id` there is an `ms_user.user_pid`. This is the
 *     product list somebody switched on for the account. It is authoritative
 *     about intent and says nothing about use — and it is sparse, because it
 *     only started being written in 2025.
 *
 *   **Evidence** — one table per product, each carrying the thing that exists
 *     only once the product is really being used. These are listed in
 *     EVIDENCE below with the query that reads each.
 *
 * Neither half is enough alone. Entitlement without evidence is a product
 * somebody turned on and nobody adopted, which is exactly the conversation a
 * rep wants to have; evidence without entitlement is real use through an older
 * path than `ms_user_services`. So both are read and merged, and the state
 * says which it came from:
 *
 *   active      — evidence of use
 *   setting up  — switched on, nothing built on it yet
 *   (absent)    — neither, so it is not listed
 *
 * ── Cost ───────────────────────────────────────────────────────────────────
 * Nine small indexed lookups on one account id, issued together. Every one is
 * an aggregate or a LIMITed count on a table in the thousands of rows, except
 * `ms_text_bal` (61k) which is read by `userId`. No scan, and nothing here is
 * called for a list of accounts — this is a company page.
 */

export type ProductState = "active" | "setting up";

export type AccountProduct = {
  /** Stable key: what a filter or a rule would name. */
  key: string;
  /** What the page shows. MSG91's own spelling, tidied. */
  product: string;
  state: ProductState;
  /** The evidence, in a phrase. Empty when only entitlement is known. */
  detail: string;
  /** Whether the account is switched on for it in `ms_user_services`. */
  entitled: boolean;
};

/**
 * `microservice_names` as Pulse names them.
 *
 * The lookup table is read at runtime — this is only the spelling. MSG91's row
 * for WhatsApp reads "WhatApp", which is a typo in the database and not
 * something to reproduce on a page a rep shows a customer. Ids absent here
 * fall back to whatever the table says, and ids absent from the table fall
 * back to "Service N" rather than a guess: a wrong product name would send
 * somebody into a meeting with the wrong story.
 */
const RENAME: Record<number, string> = {
  4: "WhatsApp",
  8: "OneAPI",
};

/** Which evidence probe backs which entitlement id, where the two line up. */
const EVIDENCE_FOR_SERVICE: Record<number, string> = {
  1: "sms",
  2: "email",
  3: "voice",
  4: "whatsapp",
  6: "campaign",
  7: "hello",
};

type Probe = {
  key: string;
  product: string;
  sql: string;
  /** Turns one row into the phrase under the product, or null for "no use". */
  read: (row: Record<string, unknown>) => string | null;
};

/**
 * One probe per product Pulse can prove use of.
 *
 * Each returns exactly one row — an aggregate — so a product that is not in
 * use costs the same as one that is, and the shape of the answer never depends
 * on the data. RCS and OneAPI have no per-account table in this schema, so
 * they can only ever appear as entitlement, and that is honest rather than a
 * gap: Pulse says a company is switched on for RCS and does not claim to know
 * whether they send on it.
 */
const EVIDENCE: Probe[] = [
  {
    key: "sms",
    product: "SMS",
    // Routes with credit on them. `named` is how many carry a route name, which
    // is what distinguishes a configured account from one row of default.
    sql: `SELECT COUNT(*) routes, COALESCE(SUM(b.balance),0) credits
            FROM ms_text_bal b WHERE b.userId = ?`,
    read: (r) => {
      const routes = Number(r.routes ?? 0);
      if (!routes) return null;
      const credits = Math.round(Number(r.credits ?? 0));
      return credits > 0
        ? `${count(credits)} credits across ${routes} route${routes === 1 ? "" : "s"}`
        : `${routes} route${routes === 1 ? "" : "s"} · no balance`;
    },
  },
  {
    key: "otp",
    product: "OTP",
    // The OTP widget is the product. A company with a live widget is sending
    // OTPs; one with only disabled widgets tried and stopped.
    sql: `SELECT COUNT(*) total, SUM(status = 1) live
            FROM otp_widget WHERE company_id = ?`,
    read: (r) => {
      const total = Number(r.total ?? 0);
      if (!total) return null;
      const live = Number(r.live ?? 0);
      return live
        ? `${live} live widget${live === 1 ? "" : "s"}`
        : `${total} widget${total === 1 ? "" : "s"}, none enabled`;
    },
  },
  {
    key: "email",
    product: "Email",
    sql: `SELECT MAX(email_status = 1) enabled, COUNT(*) rows_
            FROM email_feature WHERE userId = ?`,
    read: (r) => (Number(r.rows_ ?? 0) ? (Number(r.enabled ?? 0) ? "enabled" : "switched off") : null),
  },
  {
    key: "whatsapp",
    product: "WhatsApp",
    // `request_accepted` is the gate: WhatsApp is applied for and approved,
    // and an account waiting on approval is a different conversation from one
    // already sending.
    sql: `SELECT COUNT(*) rows_, MAX(request_accepted = 1) accepted
            FROM ms_whatsapp_user_setting WHERE user_id = ?`,
    read: (r) =>
      Number(r.rows_ ?? 0) ? (Number(r.accepted ?? 0) ? "approved" : "waiting on approval") : null,
  },
  {
    key: "voice",
    product: "Voice",
    sql: `SELECT COUNT(*) n FROM flow_voice_templates WHERE userId = ?`,
    read: (r) => {
      const n = Number(r.n ?? 0);
      return n ? `${n} template${n === 1 ? "" : "s"}` : null;
    },
  },
  {
    key: "campaign",
    product: "Campaign",
    sql: `SELECT MAX(feature_status = 1) enabled, COUNT(*) rows_
            FROM campaign_feature WHERE userId = ?`,
    read: (r) => (Number(r.rows_ ?? 0) ? (Number(r.enabled ?? 0) ? "enabled" : "switched off") : null),
  },
  {
    key: "hello",
    product: "Hello",
    sql: `SELECT COUNT(*) total, SUM(status = 1) live FROM hello_teams WHERE company_id = ?`,
    read: (r) => {
      const total = Number(r.total ?? 0);
      if (!total) return null;
      const live = Number(r.live ?? 0);
      return live ? `${live} team${live === 1 ? "" : "s"}` : `${total} team${total === 1 ? "" : "s"}, none live`;
    },
  },
];

/**
 * `ms_user_services.services` is a JSON array of *strings* — `["1","2"]`.
 *
 * Parsed defensively: it is a tinytext column with no constraint, so a bad
 * value there should cost the entitlement half of one company's product list
 * and nothing else.
 */
function parseServices(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

/** `microservice_names`, cached for the life of the process — eight rows that
 *  change roughly never, and this is read once per company page. */
let namesCache: Map<number, string> | null = null;
async function serviceNames(): Promise<Map<number, string>> {
  if (namesCache) return namesCache;
  const rows = await query<{ microservice_id: number; microservice_name: string | null }>(
    `SELECT microservice_id, microservice_name FROM microservice_names`,
  );
  const map = new Map<number, string>();
  for (const r of rows) {
    const id = Number(r.microservice_id);
    map.set(id, RENAME[id] ?? (r.microservice_name ?? "").trim() ?? "");
  }
  namesCache = map;
  return map;
}

/**
 * Every product one company is on, active first.
 *
 * Ordering is by state and then by the order in EVIDENCE, which runs from the
 * product most accounts have to the least — so the list does not reshuffle
 * itself between two companies and a rep learns where to look.
 */
export async function accountProducts(id: number): Promise<AccountProduct[]> {
  const [entitlementRows, names, ...evidenceRows] = await Promise.all([
    query<{ services: string | null }>(`SELECT services FROM ms_user_services WHERE company_id = ?`, [id]),
    serviceNames(),
    ...EVIDENCE.map((p) => query<Record<string, unknown>>(p.sql, [id])),
  ]);

  const entitled = new Set(entitlementRows.flatMap((r) => parseServices(r.services)));
  /* Entitlement is recorded per service id; evidence is recorded per product.
     This is the join between the two vocabularies. */
  const entitledKeys = new Set(
    [...entitled].map((sid) => EVIDENCE_FOR_SERVICE[sid]).filter((k): k is string => Boolean(k)),
  );

  const out: AccountProduct[] = [];

  EVIDENCE.forEach((probe, i) => {
    const detail = evidenceRows[i]?.[0] ? probe.read(evidenceRows[i][0]) : null;
    const isEntitled = entitledKeys.has(probe.key);
    if (detail === null && !isEntitled) return;
    out.push({
      key: probe.key,
      product: probe.product,
      state: detail === null ? "setting up" : "active",
      detail: detail ?? "switched on, nothing built on it yet",
      entitled: isEntitled,
    });
  });

  /* Products entitled but with no probe of their own — RCS and OneAPI here.
     Listed, because the account is switched on for them and that is a fact;
     never called active, because nothing in this schema can prove use. */
  for (const sid of entitled) {
    if (EVIDENCE_FOR_SERVICE[sid]) continue;
    const name = names.get(sid);
    out.push({
      key: `service-${sid}`,
      product: name || `Service ${sid}`,
      state: "setting up",
      detail: "switched on · Pulse cannot see use of this one",
      entitled: true,
    });
  }

  const rank = (p: AccountProduct) => (p.state === "active" ? 0 : 1);
  return out.sort((a, b) => rank(a) - rank(b));
}
