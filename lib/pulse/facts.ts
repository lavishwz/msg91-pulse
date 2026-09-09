import { query } from "@/lib/db";
import { domainOf, entityFromCurrency, money, MSG91_ROOT_PID, USER_TYPE } from "./domain";
import type { SignupFacts } from "./agents";

/**
 * Fact assembly — SQL, never an agent.
 *
 * The rule from docs/autopilot-agents.md §2: a query answers "what is true", an
 * agent answers "what should we do about it". So everything the triage agent
 * sees is assembled here, deterministically, and the agent never touches the
 * database.
 *
 * That split is also what makes a decision auditable. `pulse_decision` stores a
 * digest of exactly this object, so the same facts can be replayed against a
 * later version of the prompt and the two answers compared.
 *
 * ── Cost ───────────────────────────────────────────────────────────────────
 * Same constraint as the card scanners: `ms_trans` has ~1M rows and only a
 * primary key, `ms_user` likewise. So this does a bounded candidate query
 * first, then at most one aggregate pass per fact over the whole batch — never
 * a correlated subquery. A batch of 10 signups costs the same three queries as
 * a batch of 1.
 */

/** Mailbox providers, not companies. A free mailbox is weak evidence, not bad. */
const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.in",
  "outlook.com", "hotmail.com", "live.com", "msn.com", "protonmail.com",
  "proton.me", "icloud.com", "me.com", "aol.com", "rediffmail.com",
  "zoho.com", "zohomail.com", "mail.com", "gmx.com", "yandex.com",
]);

/**
 * Messaging competitors. A signup from one of these domains is someone looking
 * at MSG91's product, not someone buying it.
 */
const COMPETITOR_DOMAINS = new Set([
  "twilio.com", "gupshup.io", "kaleyra.com", "karix.com", "textlocal.in",
  "exotel.com", "plivo.com", "sinch.com", "messagebird.com", "infobip.com",
  "vonage.com", "route-mobile.com", "routemobile.com", "valuefirst.com",
  "acl-mobile.com", "netcore.co.in", "smsgupshup.com", "interakt.shop",
  "wati.io", "aisensy.com", "doubletick.io",
]);

type CandidateRow = {
  user_pid: number;
  user_fname: string | null;
  user_email: string | null;
  user_mobno: string | null;
  user_date: Date;
  user_userid: number | null;
  currency: string | null;
  admin_id: number | null;
};

/**
 * Signups newer than the watermark, oldest first.
 *
 * Oldest first matters: the runner advances the watermark to the last row it
 * processed, so a batch must be a contiguous prefix of what is unread. Newest
 * first would strand everything older than the batch forever.
 */
async function candidates(since: string, limit: number): Promise<CandidateRow[]> {
  return query<CandidateRow>(
    `SELECT u.user_pid, u.user_fname, u.user_email, u.user_mobno, u.user_date,
            u.user_userid, d.currency, h.admin_id
       FROM ms_user u
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
      WHERE u.user_type = ?
        AND u.user_date > ?
      ORDER BY u.user_date ASC
      LIMIT ?`,
    [USER_TYPE.CUSTOMER, since, limit],
  );
}

/**
 * How many accounts share each domain, and what they pay.
 *
 * One pass over ms_trans for the whole batch. `domain_monthly_spend` is real
 * customer money only — gateway payments, per docs/gtwy-agent.md — and stays in
 * its own currency, because summing across currencies is the one arithmetic
 * error this codebase refuses to make.
 */
async function domainHistory(
  domains: string[],
): Promise<Map<string, { accounts: number; spend: string; known: boolean }>> {
  const out = new Map<string, { accounts: number; spend: string; known: boolean }>();
  if (!domains.length) return out;

  const marks = domains.map(() => "?").join(",");

  const counts = await query<{ domain: string; accounts: number }>(
    `SELECT SUBSTRING_INDEX(u.user_email, '@', -1) domain, COUNT(*) accounts
       FROM ms_user u
      WHERE u.user_type = ?
        AND SUBSTRING_INDEX(u.user_email, '@', -1) IN (${marks})
      GROUP BY domain`,
    [USER_TYPE.CUSTOMER, ...domains],
  );

  // Spend on the domain over the last 90 days, per currency. One scan.
  const spend = await query<{ domain: string; currency: string | null; total: string }>(
    `SELECT SUBSTRING_INDEX(u.user_email, '@', -1) domain,
            d.currency, SUM(t.trans_amt) total
       FROM ms_trans t
       JOIN ms_user u ON u.user_pid = t.trans_tuserid
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE t.trans_type = 1 AND t.payment_mode = 2
        AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        AND SUBSTRING_INDEX(u.user_email, '@', -1) IN (${marks})
      GROUP BY domain, d.currency`,
    domains,
  );

  for (const c of counts) {
    const paid = spend.filter((s) => s.domain === c.domain);
    out.set(c.domain, {
      accounts: Number(c.accounts),
      // Per currency, joined — never added together.
      spend: paid.length
        ? paid.map((p) => money(Number(p.total) / 3, p.currency)).join(" + ") + " / month"
        : "0",
      // "Known customer" means the domain has paid, not merely that it exists.
      known: paid.length > 0,
    });
  }

  return out;
}

/**
 * How far each signup got before stopping, plus what they typed about
 * themselves. `signup_tracking.step` is a decimal like 9.9 for completed and
 * 3.0 for abandoned partway; `requestData` carries the industry and company
 * name when they reached that page.
 */
async function signupProgress(
  emails: string[],
): Promise<Map<string, { step: number | null; industry: string | null; ip_country: string | null }>> {
  const out = new Map<string, { step: number | null; industry: string | null; ip_country: string | null }>();
  if (!emails.length) return out;

  const rows = await query<{ email: string; step: string | null; requestData: string | null }>(
    `SELECT s.email, s.step, s.requestData
       FROM signup_tracking s
      WHERE s.email IN (${emails.map(() => "?").join(",")})
      ORDER BY s.id ASC`,
    emails,
  );

  for (const r of rows) {
    let industry: string | null = null;
    let ipCountry: string | null = null;
    try {
      const parsed = JSON.parse(r.requestData ?? "{}") as {
        companyDetails?: { industry?: string; country?: string };
      };
      industry = parsed.companyDetails?.industry ?? null;
      ipCountry = parsed.companyDetails?.country ?? null;
    } catch {
      // requestData is free-form and occasionally truncated. A missing industry
      // is a missing fact, not an error — the agent is told to treat it as
      // unknown rather than negative.
    }
    // Later rows win: a signup that resumed should read as the furthest it got.
    out.set(r.email, { step: r.step === null ? null : Number(r.step), industry, ip_country: ipCountry });
  }

  return out;
}

export type SignupBatch = {
  facts: SignupFacts[];
  /** The user_date of the last row read — what the watermark advances to. */
  cursor: string | null;
};

/**
 * Assemble the facts for every signup newer than `since`, oldest first.
 *
 * Three queries regardless of batch size. Everything the agent is told comes
 * from here; nothing is inferred inside the prompt.
 */
export async function signupFacts(since: string, limit = 10): Promise<SignupBatch> {
  const rows = await candidates(since, limit);
  if (!rows.length) return { facts: [], cursor: null };

  const emails = rows.map((r) => r.user_email ?? "").filter(Boolean);
  const domains = [...new Set(rows.map((r) => domainOf(r.user_email)).filter(Boolean))];

  const [history, progress] = await Promise.all([domainHistory(domains), signupProgress(emails)]);

  const facts: SignupFacts[] = rows.map((r) => {
    const domain = domainOf(r.user_email);
    const hist = history.get(domain);
    const prog = progress.get(r.user_email ?? "");
    const isFree = FREE_MAIL.has(domain);

    return {
      user_pid: String(r.user_pid),
      company_name: r.user_fname?.trim() || null,
      email_domain: domain || null,
      is_free_mail: isFree,
      mobile_present: Boolean(r.user_mobno && String(r.user_mobno).trim()),
      entity: entityFromCurrency(r.currency),
      // A parent of MSG91 itself means they came direct; any other parent is a
      // reseller's customer, and those are never contacted by MSG91.
      motion: r.user_userid === MSG91_ROOT_PID ? "direct" : `partner:${r.user_userid ?? "unknown"}`,
      signup_step_reached: prog?.step ?? null,
      // A free mailbox has thousands of unrelated accounts behind it. Reporting
      // that as "domain history" would make every gmail signup look like an
      // expansion, so it is deliberately not counted.
      accounts_on_domain: isFree ? 1 : (hist?.accounts ?? 1),
      domain_monthly_spend: isFree ? "0" : (hist?.spend ?? "0"),
      domain_matches_known_customer: isFree ? false : Boolean(hist?.known),
      domain_matches_competitor: COMPETITOR_DOMAINS.has(domain),
      industry: prog?.industry ?? null,
      owner_auto_assigned: r.admin_id !== null,
      ip_country: prog?.ip_country ?? null,
    };
  });

  const last = rows[rows.length - 1].user_date;
  return { facts, cursor: toMysqlDatetime(last) };
}

/** MySQL DATETIME text, in the server's own terms — no timezone conversion. */
export function toMysqlDatetime(d: Date | string): string {
  if (typeof d === "string") return d;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}
