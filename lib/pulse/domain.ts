/**
 * Mapping between MSG91's legacy schema and Pulse's vocabulary (handover §9/§11).
 *
 * Pulse owns no tables here — the database user has SELECT only — so every
 * Pulse concept that legacy MySQL does not store natively is *derived* on read,
 * and each derivation carries an `evidenceLevel` so the UI never presents an
 * inference as a fact.
 */

/** Pulse entity. The handover names four; the data also holds GBP/EUR accounts. */
export type Entity = "India" | "UAE" | "US" | "Singapore" | "UK" | "EU" | "Other";

/** Exactly one motion per account (handover §11 — a field, never a tag). */
export type Motion = "Inbound" | "Outbound" | "Startup" | "Partner";

export type EvidenceLevel = "known" | "inferred" | "unknown";

const ENTITY_BY_CURRENCY: Record<string, Entity> = {
  INR: "India",
  AED: "UAE",
  USD: "US",
  SGD: "Singapore",
  GBP: "UK",
  EUR: "EU",
};

const SYMBOL_BY_CURRENCY: Record<string, string> = {
  INR: "₹",
  AED: "AED ",
  USD: "$",
  SGD: "S$",
  GBP: "£",
  EUR: "€",
};

export function entityFromCurrency(currency?: string | null): Entity {
  const c = (currency ?? "").trim().toUpperCase();
  return ENTITY_BY_CURRENCY[c] ?? "Other";
}

export function currencySymbol(currency?: string | null): string {
  const c = (currency ?? "").trim().toUpperCase();
  return SYMBOL_BY_CURRENCY[c] ?? "";
}

/**
 * Native-currency money string. Never converted and never summed across
 * currencies (handover §7.2) — Pulse shows currencies side by side instead.
 */
export function money(amount: number | string | null | undefined, currency?: string | null): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "—";
  const c = (currency ?? "").trim().toUpperCase();
  const symbol = currencySymbol(c);
  // Indian grouping for INR, Western grouping elsewhere.
  const locale = c === "INR" ? "en-IN" : "en-US";
  const body = Math.abs(n) >= 1000 ? Math.round(n).toLocaleString(locale) : n.toFixed(2);
  return `${symbol}${body}`;
}

/** Compact volume, e.g. 400000 → "4,00,000" (INR-style) or "400,000". */
export function count(n: number | string | null | undefined, locale = "en-IN"): string {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? Math.round(v).toLocaleString(locale) : "0";
}

/**
 * Motion inference.
 *
 * Legacy MySQL has no motion column, so it is derived in this order — most
 * reliable evidence first:
 *
 *   Partner  — the account hangs off a reseller in `parent_chain`, so a
 *              reseller owns the commercial relationship (handover §13.7 makes
 *              this a hard rule, so it wins over everything else).
 *   Startup  — the account is on the paid-signup/startup programme
 *              (`ms_user_paid_signup`).
 *   Outbound — no signup IP was ever recorded, i.e. the account was created by
 *              staff rather than by the customer signing themselves up.
 *   Inbound  — the default: the customer signed themselves up.
 *
 * `evidenceLevel` is "known" only for Partner and Startup, where a specific row
 * proves it. Inbound/Outbound are inferred from the absence of a signup record.
 */
export type MotionInput = {
  resellerParent?: boolean;
  startupProgramme?: boolean;
  hasSignupRecord?: boolean;
};

export function inferMotion(input: MotionInput): { motion: Motion; evidenceLevel: EvidenceLevel } {
  if (input.resellerParent) return { motion: "Partner", evidenceLevel: "known" };
  if (input.startupProgramme) return { motion: "Startup", evidenceLevel: "known" };
  if (input.hasSignupRecord === false) return { motion: "Outbound", evidenceLevel: "inferred" };
  return { motion: "Inbound", evidenceLevel: "inferred" };
}

/** `ms_user.user_type` — 1 admin/staff, 2 reseller, 3 customer. */
export const USER_TYPE = { ADMIN: 1, RESELLER: 2, CUSTOMER: 3 } as const;

/**
 * MSG91's own root account (`msg91` / support@msg91.com) is itself a type-2
 * reseller row, and 7,621 accounts hang directly off it. Those are direct MSG91
 * customers, not partner-sourced — only a parent that is *some other* reseller
 * means Partner motion, which is 2,300 accounts.
 */
export const MSG91_ROOT_PID = 2;

/**
 * `ms_user.user_status` — 1 active, 2 pending/unverified, others blocked or
 * disabled. Used only for a status sentence, never as a lifecycle stage.
 */
export function statusLabel(status: number | null | undefined): string {
  switch (Number(status)) {
    case 1:
      return "active";
    case 2:
      return "not yet verified";
    case 3:
      return "blocked";
    default:
      return "inactive";
  }
}

/**
 * `ms_trans` semantics, established by inspecting the live data:
 *
 *   trans_type = 1  credit into the account
 *              = 2  debit out of it (consumption or an admin clawback)
 *   payment_mode = 2  came through a payment gateway (razorpay / cashfree /
 *                     stripe / paypal / apple) — real cash from the customer
 *                = 1  moved by an admin or reseller — not cash from the customer
 *
 * So a genuine customer payment is `trans_type = 1 AND payment_mode = 2`, which
 * is 120,974 of the 779,996 credit rows. `trans_amt` (cash) and `trans_sms`
 * (wallet credit) are different quantities and are never added together
 * (handover §9).
 *
 * NOTE: handover §12.1 lists this mapping as an open decision owned by the tech
 * team. It is applied here because the descriptions on the rows are explicit
 * ("Online payment done through razorpay : txn-id - …"), and every figure
 * derived from it is tagged `provisional` so the UI can mark it pending
 * confirmation rather than presenting it as settled.
 */
export const PAYMENT_WHERE = "t.trans_type = 1 AND t.payment_mode = 2";
export const CONSUMPTION_WHERE = "t.trans_type = 2";
export const PAYMENTS_ARE_PROVISIONAL = true;

/** Best display name for an account row (handover §9: never duplicate). */
export function accountName(row: {
  user_fname?: string | null;
  user_lname?: string | null;
  user_uname?: string | null;
  client_name?: string | null;
}): string {
  const client = (row.client_name ?? "").trim();
  if (client && client.toLowerCase() !== "team") return client;

  const full = [row.user_fname, row.user_lname]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  if (full) return full;

  return (row.user_uname ?? "").trim() || "Unnamed account";
}

/** Domain from an email, for enrichment lines and identity matching. */
export function domainOf(email?: string | null): string {
  const at = (email ?? "").indexOf("@");
  return at === -1 ? "" : (email ?? "").slice(at + 1).trim().toLowerCase();
}

/** Whole days between a past date and now, floored at 0. */
export function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const t = date instanceof Date ? date.getTime() : Date.parse(String(date));
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

/** "4 minutes ago" / "9 days ago" — the phrasing Pulse cards use. */
export function ago(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const t = date instanceof Date ? date.getTime() : Date.parse(String(date));
  if (!Number.isFinite(t)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 45) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}
