import { query } from "@/lib/db";
import { read, readOne, write } from "@/lib/store";
import { USER_TYPE } from "./domain";

/**
 * Prospects — manually added potential customers (pulse_prospect, 030).
 *
 * Backs two UI surfaces that were previously entirely static: the "Add
 * accounts in bulk" sheet (handover feature 21) and ⌘K "add a company"
 * (feature 35's paste-a-domain flow, still without the enrichment the
 * handover describes — see the note on `checkBulk` below).
 *
 * No enrichment here. The handover's "enriched and scored before they reach
 * anyone" is not built — there is no domain-triage/company-resolution code
 * anywhere in this codebase (confirmed by search), so claiming it would
 * violate the build instructions' rule against claiming something happened
 * that a connector did not confirm. This only does the part that is real:
 * checking against what Pulse already has.
 */

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "protonmail.com", "aol.com", "live.com", "rediffmail.com",
]);

export type BulkRow = {
  input: string;
  companyName: string;
  domain: string | null;
  email: string | null;
  result: "new" | "dup_customer" | "dup_prospect" | "suppressed";
  note: string;
};

/** One token → its parts. A bare domain, an email, or a free-text name. */
function parseToken(raw: string): { companyName: string; domain: string | null; email: string | null } {
  const t = raw.trim();
  if (t.includes("@")) {
    const domain = t.split("@")[1]?.toLowerCase().trim() ?? null;
    return { companyName: domain ?? t, domain, email: t.toLowerCase() };
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(t)) {
    return { companyName: t, domain: t.toLowerCase(), email: null };
  }
  return { companyName: t, domain: null, email: null };
}

/** Split "Add accounts in bulk"'s textarea: commas or newlines, blanks dropped. */
export function parseBulkInput(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Classify every row against what Pulse already has, in at most two queries
 * regardless of how many rows — the same one-pass discipline cards.ts uses
 * against ms_trans, for the same reason (no usable index on user_email).
 */
export async function checkBulk(rawRows: string[]): Promise<BulkRow[]> {
  const parsed = rawRows.map((input) => ({ input, ...parseToken(input) }));
  const domains = [...new Set(parsed.map((p) => p.domain).filter((d): d is string => !!d))];
  const emails = [...new Set(parsed.map((p) => p.email).filter((e): e is string => !!e))];

  const customerRows =
    emails.length || domains.length
      ? await query<{ user_email: string }>(
          `SELECT user_email FROM ms_user
            WHERE user_type = ${USER_TYPE.CUSTOMER}
              AND (
                ${emails.length ? `user_email IN (${emails.map(() => "?").join(",")})` : "0"}
                OR
                ${domains.length ? `SUBSTRING_INDEX(user_email,'@',-1) IN (${domains.map(() => "?").join(",")})` : "0"}
              )`,
          [...emails, ...domains],
        )
      : [];
  const customerEmails = new Set(customerRows.map((r) => r.user_email.toLowerCase()));
  const customerDomains = new Set(customerRows.map((r) => r.user_email.split("@")[1]?.toLowerCase()));

  const prospectRows = domains.length
    ? await read<{ domain: string }>(
        `SELECT DISTINCT domain FROM pulse_prospect WHERE domain IN (${domains.map(() => "?").join(",")}) AND status != 'suppressed'`,
        domains,
      )
    : [];
  const prospectDomains = new Set(prospectRows.map((r) => r.domain));

  return parsed.map((p): BulkRow => {
    if (p.email && customerEmails.has(p.email)) {
      return { ...p, result: "dup_customer", note: "Already an MSG91 customer (matched by email)." };
    }
    if (p.domain && customerDomains.has(p.domain)) {
      return { ...p, result: "dup_customer", note: "Already an MSG91 customer (matched by domain)." };
    }
    if (p.domain && prospectDomains.has(p.domain)) {
      return { ...p, result: "dup_prospect", note: "Already added as a prospect." };
    }
    if (p.domain && FREE_EMAIL_DOMAINS.has(p.domain)) {
      return { ...p, result: "suppressed", note: "Personal email domain, not a verifiable company." };
    }
    if (!p.domain && !p.email) {
      return { ...p, result: "new", note: "No domain or email given — added as a name only." };
    }
    return { ...p, result: "new", note: "Not found in MSG91 or Pulse — new." };
  });
}

export type Prospect = {
  id: number;
  companyName: string;
  domain: string | null;
  email: string | null;
  status: string;
  note: string | null;
  source: string;
  ownerId: string | null;
  addedBy: string;
  createdAt: string;
};

type RawProspect = {
  id: number;
  company_name: string;
  domain: string | null;
  email: string | null;
  status: string;
  note: string | null;
  source: string;
  owner_admin_id: string | null;
  added_by: string;
  created_at: Date;
};

const shape = (r: RawProspect): Prospect => ({
  id: r.id,
  companyName: r.company_name,
  domain: r.domain,
  email: r.email,
  status: r.status,
  note: r.note,
  source: r.source,
  ownerId: r.owner_admin_id,
  addedBy: r.added_by,
  createdAt: r.created_at.toISOString(),
});

/** Insert the rows the caller confirmed (normally the `new` ones only). */
export async function createProspects(
  rows: { companyName: string; domain: string | null; email: string | null }[],
  addedBy: string,
  source: "bulk_add" | "manual" | "cmdk" = "bulk_add",
): Promise<Prospect[]> {
  const out: Prospect[] = [];
  // Sequential, not parallel — the same reasoning the tags route uses: a
  // handful of rows is not worth racing against each other's inserts.
  for (const r of rows) {
    const res = await write(
      `INSERT INTO pulse_prospect (company_name, domain, email, source, added_by) VALUES (?, ?, ?, ?, ?)`,
      [r.companyName, r.domain, r.email, source, addedBy],
    );
    const row = await readOne<RawProspect>(`SELECT * FROM pulse_prospect WHERE id = ?`, [res.insertId]);
    if (row) out.push(shape(row));
  }
  return out;
}

export async function listProspects(status = "new", limit = 100): Promise<Prospect[]> {
  const rows = await read<RawProspect>(
    `SELECT * FROM pulse_prospect WHERE status = ? ORDER BY created_at DESC LIMIT ?`,
    [status, limit],
  );
  return rows.map(shape);
}
