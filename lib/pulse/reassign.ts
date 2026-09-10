import { query } from "@/lib/db";
import { accountName, USER_TYPE } from "./domain";
import { countryOf } from "./country";

/**
 * The unowned pile, and who Pulse thinks should get it.
 *
 * The reassign sheet used to open on "Reassign 46 accounts · Unowned since
 * Vikram left, 14 days ago", with a three-line split across India, UAE and
 * Singapore. Every number and every name in that was typed into the prototype
 * by hand. The real figure on this database is in the thousands, and Vikram
 * does not exist.
 *
 * This is the same sheet, read from the database:
 *
 *   the pile     — customers with no row in `user_handled_by`
 *   the split    — grouped by country, because that is the only dimension in
 *                  this schema that predicts who should take an account
 *   the suggestion — per country, the rep who already owns the most accounts
 *                  there. Not a model: a fact, and one a rep can argue with.
 *
 * Suggesting by country rather than by load is deliberate. Handing thirty
 * Indian accounts to whoever is least busy optimises a number nobody cares
 * about; handing them to the person who already runs India means the next
 * call goes well. Where a country has no incumbent, the pile is offered
 * without a name against it rather than dealt out to fill the gap.
 */

export type UnownedAccount = {
  id: number;
  name: string;
  country: string | null;
  countryCode: string | null;
  countryFlag: string | null;
  signedUpAt: string | null;
};

export type SplitGroup = {
  country: string;
  countryCode: string | null;
  countryFlag: string | null;
  accounts: number;
  accountIds: number[];
  /** The rep who already owns the most accounts in this country, if any. */
  suggested: { id: number; name: string; owns: number } | null;
};

/** The unowned pile, newest signup first. Bounded — this is a sheet, not a job. */
export async function unownedAccounts(limit = 200): Promise<UnownedAccount[]> {
  const rows = await query<{
    user_pid: number;
    user_fname: string | null;
    user_lname: string | null;
    user_uname: string | null;
    user_email: string | null;
    user_date: Date | null;
    billing_country: string | null;
    currency: string | null;
  }>(
    `SELECT u.user_pid, u.user_fname, u.user_lname, u.user_uname, u.user_email,
            u.user_date, d.billing_country, d.currency
       FROM ms_user u
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
      WHERE u.user_type = ${USER_TYPE.CUSTOMER}
        AND h.admin_id IS NULL
      ORDER BY u.user_date DESC, u.user_pid DESC
      LIMIT ${Math.min(Math.max(1, Math.trunc(limit)), 500)}`,
  );

  return rows.map((r) => {
    const place = countryOf(r.billing_country, (r.currency ?? "").trim().toUpperCase());
    return {
      id: Number(r.user_pid),
      name: accountName(r),
      country: place ? place.name : null,
      countryCode: (r.billing_country ?? "").trim() || null,
      countryFlag: place ? place.flag : null,
      signedUpAt: r.user_date ? new Date(r.user_date).toISOString() : null,
    };
  });
}

/**
 * Who already runs each country, by how many accounts they own there.
 *
 * One grouped query, then the top rep per country is picked in JS — the
 * per-group maximum is a window function on MySQL 8 and this database is
 * MariaDB, and the result set is small enough (a rep per country per rep) that
 * arguing with the SQL dialect is not worth it.
 */
async function incumbents(): Promise<Map<string, { id: number; name: string; owns: number }>> {
  const rows = await query<{
    billing_country: string | null;
    currency: string | null;
    admin_id: number;
    user_fname: string | null;
    user_lname: string | null;
    user_uname: string | null;
    user_email: string | null;
    n: number;
  }>(
    `SELECT d.billing_country, d.currency, h.admin_id, COUNT(*) n,
            a.user_fname, a.user_lname, a.user_uname, a.user_email
       FROM user_handled_by h
       JOIN ms_user c ON c.user_pid = h.user_id AND c.user_type = ${USER_TYPE.CUSTOMER}
       JOIN ms_user a ON a.user_pid = h.admin_id
       LEFT JOIN default_destination_country d ON d.u_id = c.user_pid
      GROUP BY d.billing_country, d.currency, h.admin_id,
               a.user_fname, a.user_lname, a.user_uname, a.user_email
      ORDER BY n DESC`,
  );

  const best = new Map<string, { id: number; name: string; owns: number }>();
  for (const r of rows) {
    const place = countryOf(r.billing_country, (r.currency ?? "").trim().toUpperCase());
    const key = place?.name ?? "Country unknown";
    const owns = Number(r.n);
    const current = best.get(key);
    if (!current || owns > current.owns) {
      best.set(key, { id: Number(r.admin_id), name: accountName(r), owns });
    }
  }
  return best;
}

/**
 * The unowned pile, grouped into the split the sheet offers.
 *
 * Biggest group first, and "Country unknown" is a group like any other rather
 * than being hidden — on this database it is the largest one, and a sheet that
 * quietly dropped it would offer to reassign a fraction of the pile while
 * showing the whole count.
 */
export async function suggestedSplit(limit = 200): Promise<{
  accounts: UnownedAccount[];
  groups: SplitGroup[];
}> {
  const [accounts, best] = await Promise.all([unownedAccounts(limit), incumbents()]);

  const byCountry = new Map<string, UnownedAccount[]>();
  for (const a of accounts) {
    const key = a.country ?? "Country unknown";
    const list = byCountry.get(key) ?? [];
    list.push(a);
    byCountry.set(key, list);
  }

  const groups: SplitGroup[] = [...byCountry.entries()]
    .map(([country, list]) => ({
      country,
      countryCode: list[0].countryCode,
      countryFlag: list[0].countryFlag,
      accounts: list.length,
      accountIds: list.map((a) => a.id),
      suggested: best.get(country) ?? null,
    }))
    .sort((a, b) => b.accounts - a.accounts);

  return { accounts, groups };
}
