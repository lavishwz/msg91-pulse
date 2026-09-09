/**
 * Tags on a company.
 *
 * Free text, one row per tag per account (`pulse_account_tag`,
 * migrations/005). Two sources, and the difference is visible on the page: a
 * `human` tag is solid and somebody typed it, a `pulse` tag is dashed and was
 * inferred from evidence.
 *
 * Pulse's own store, so this is a write path — `lib/db.ts` is MSG91's schema and
 * Pulse has SELECT on it and nothing else.
 */

import { read, write } from "@/lib/store";

export type TagSource = "human" | "pulse";

export type AccountTag = {
  tag: string;
  source: TagSource;
  addedBy: string | null;
  addedAt: string;
};

/** The longest a tag may be. Beyond this it is a note, not a tag. */
export const MAX_TAG_LENGTH = 60;

/**
 * Trim, collapse runs of whitespace, and cut to length.
 *
 * Kept as typed otherwise: "Renewal Q4" should not come back "renewal q4"
 * because somebody's shift key was involved. Case-insensitive *uniqueness* is
 * handled by `tag_key` instead, so the two concerns stay separate.
 */
export function normalizeTag(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH);
}

/** A tag has to be something. Anything else is a mis-click, not an intent. */
export function isTagShaped(tag: string): boolean {
  return tag.length >= 2 && tag.length <= MAX_TAG_LENGTH;
}

type TagRow = {
  tag: string;
  source: TagSource;
  added_by: string | null;
  created_at: Date;
};

const toTag = (r: TagRow): AccountTag => ({
  tag: r.tag,
  source: r.source,
  addedBy: r.added_by,
  addedAt: new Date(r.created_at).toISOString(),
});

/**
 * Every tag on one company.
 *
 * Human tags first: they are somebody's deliberate note about this account, and
 * they should not be pushed down the row by whatever Pulse inferred this
 * morning. Within each source, oldest first, so the list does not reshuffle
 * itself every time somebody adds one.
 */
export async function listTags(accountId: number | string): Promise<AccountTag[]> {
  const rows = await read<TagRow>(
    `SELECT tag, source, added_by, created_at
       FROM pulse_account_tag
      WHERE account_id = ?
      ORDER BY FIELD(source,'human','pulse'), created_at, id`,
    [String(accountId)],
  );
  return rows.map(toTag);
}

/**
 * Tags for several companies at once, as a Map keyed by account id.
 *
 * One query rather than one per account: the board and the wall show dozens of
 * companies, and this is the shape that keeps that a single round trip.
 * Returns an empty Map for an empty list rather than building `IN ()`, which is
 * a syntax error in MySQL.
 */
export async function tagsForAccounts(
  accountIds: Array<number | string>,
): Promise<Map<string, AccountTag[]>> {
  const out = new Map<string, AccountTag[]>();
  if (!accountIds.length) return out;

  const ids = accountIds.map(String);
  const rows = await read<TagRow & { account_id: string }>(
    `SELECT account_id, tag, source, added_by, created_at
       FROM pulse_account_tag
      WHERE account_id IN (${ids.map(() => "?").join(",")})
      ORDER BY FIELD(source,'human','pulse'), created_at, id`,
    ids,
  );
  for (const row of rows) {
    const list = out.get(row.account_id) ?? [];
    list.push(toTag(row));
    out.set(row.account_id, list);
  }
  return out;
}

/**
 * Add a tag, or leave the existing one alone.
 *
 * ON DUPLICATE KEY rather than a select-then-insert: two people tagging the
 * same company in the same second is ordinary, and the unique key is the only
 * thing that can arbitrate that without a transaction.
 *
 * Re-adding a tag Pulse inferred promotes it to a human one — somebody has now
 * said it deliberately, and it should stop being dashed — but never the other
 * way round, so Pulse cannot quietly take credit for a person's note. Only that
 * promotion rewrites the label: otherwise the first spelling stands, so typing
 * "enterprise" on a company already tagged "Enterprise" is a no-op rather than
 * a silent re-capitalisation on everybody else's screen.
 *
 * The SET clauses read the *existing* row's `source`, so it is assigned last —
 * MySQL evaluates them in order, and updating it first would make the two
 * clauses above it test the new value instead of the old one.
 */
export async function addTag(
  accountId: number | string,
  tag: string,
  source: TagSource,
  addedBy: string | null,
): Promise<void> {
  const value = normalizeTag(tag);
  await write(
    `INSERT INTO pulse_account_tag (account_id, tag, tag_key, source, added_by)
          VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
          tag      = IF(source = 'pulse' AND VALUES(source) = 'human', VALUES(tag), tag),
          added_by = IF(source = 'pulse' AND VALUES(source) = 'human', VALUES(added_by), added_by),
          source   = IF(VALUES(source) = 'human', 'human', source)`,
    [String(accountId), value, value.toLowerCase(), source, addedBy],
  );
}

/** Remove a tag from a company. Case-insensitive, like adding one. */
export async function removeTag(accountId: number | string, tag: string): Promise<boolean> {
  const res = await write(`DELETE FROM pulse_account_tag WHERE account_id = ? AND tag_key = ?`, [
    String(accountId),
    normalizeTag(tag).toLowerCase(),
  ]);
  return res.affectedRows > 0;
}
