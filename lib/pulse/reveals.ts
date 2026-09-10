import { read, write } from "@/lib/store";

/**
 * Who has looked at a company's commercials.
 *
 * The reveal button on the company page has always said "opening them writes
 * an audit event against your name". Nothing was written. This is the row that
 * makes the sentence true — `pulse_commercial_reveal`, migrations/010.
 *
 * Deliberately records only who, which account, and when. What was revealed
 * can be read from MSG91 at any time, and copying a customer's payment history
 * into a second database in order to prove somebody read it would be a strange
 * way to protect it.
 */

export type Reveal = {
  id: number;
  accountId: string;
  accountName: string | null;
  member: string;
  at: string;
};

type Row = { id: number; account_id: string; account_name: string | null; member_email: string; at: Date };

const toReveal = (r: Row): Reveal => ({
  id: Number(r.id),
  accountId: r.account_id,
  accountName: r.account_name,
  member: r.member_email,
  at: new Date(r.at).toISOString(),
});

/**
 * Record one reveal.
 *
 * Never throws: the figures have already been read by the time this is
 * called, so failing here would mean refusing to show a rep data they are
 * entitled to because the audit database blinked. It is logged loudly instead
 * — a reveal that went unrecorded is worth knowing about.
 */
export async function recordReveal(
  accountId: number | string,
  accountName: string | null,
  memberEmail: string,
): Promise<void> {
  try {
    await write(
      `INSERT INTO pulse_commercial_reveal (account_id, account_name, member_email)
            VALUES (?, ?, ?)`,
      [String(accountId), accountName, memberEmail],
    );
  } catch (err) {
    console.error(
      `[pulse] FAILED to record a commercial reveal of account ${accountId} by ${memberEmail}:`,
      (err as Error).message,
    );
  }
}

/** Who has revealed this company's commercials, newest first. */
export async function revealsFor(accountId: number | string, limit = 20): Promise<Reveal[]> {
  const rows = await read<Row>(
    `SELECT id, account_id, account_name, member_email, at
       FROM pulse_commercial_reveal
      WHERE account_id = ? ORDER BY id DESC LIMIT ?`,
    [String(accountId), Math.min(Math.max(1, limit), 100)],
  );
  return rows.map(toReveal);
}

/** Every reveal across the base, newest first — the audit tab's feed. */
export async function recentReveals(limit = 50): Promise<Reveal[]> {
  const rows = await read<Row>(
    `SELECT id, account_id, account_name, member_email, at
       FROM pulse_commercial_reveal ORDER BY id DESC LIMIT ?`,
    [Math.min(Math.max(1, limit), 200)],
  );
  return rows.map(toReveal);
}
