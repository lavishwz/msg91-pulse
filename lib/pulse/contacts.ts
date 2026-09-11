import { read, write } from "@/lib/store";

/**
 * People at a company, added by hand — `pulse_account_contact`
 * (migrations/021). Alongside, not instead of, MSG91's own invited-member
 * list: that one is real but read-only, so a stakeholder MSG91 never
 * invited had nowhere to go until this existed.
 */

export type AccountContact = {
  id: number;
  name: string;
  role: string | null;
  addedBy: string;
  addedAt: string;
};

export const MAX_NAME_LENGTH = 120;
export const MAX_ROLE_LENGTH = 120;

export function isNameShaped(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= MAX_NAME_LENGTH;
}

type Row = { id: number; name: string; role: string | null; added_by: string; added_at: Date };

const toContact = (r: Row): AccountContact => ({
  id: Number(r.id),
  name: r.name,
  role: r.role,
  addedBy: r.added_by,
  addedAt: new Date(r.added_at).toISOString(),
});

/** Every hand-added person on one company, oldest first. */
export async function listContacts(accountId: number | string): Promise<AccountContact[]> {
  const rows = await read<Row>(
    `SELECT id, name, role, added_by, added_at
       FROM pulse_account_contact
      WHERE account_id = ? ORDER BY id`,
    [String(accountId)],
  );
  return rows.map(toContact);
}

/** Contacts for several companies at once, as a Map keyed by account id — same shape as tagsForAccounts. */
export async function contactsForAccounts(
  accountIds: Array<number | string>,
): Promise<Map<string, AccountContact[]>> {
  const out = new Map<string, AccountContact[]>();
  if (!accountIds.length) return out;
  const ids = accountIds.map(String);
  const rows = await read<Row & { account_id: string }>(
    `SELECT account_id, id, name, role, added_by, added_at
       FROM pulse_account_contact
      WHERE account_id IN (${ids.map(() => "?").join(",")})
      ORDER BY id`,
    ids,
  );
  for (const row of rows) {
    const list = out.get(row.account_id) ?? [];
    list.push(toContact(row));
    out.set(row.account_id, list);
  }
  return out;
}

export async function addContact(
  accountId: number | string,
  name: string,
  role: string | null,
  addedBy: string,
): Promise<AccountContact[]> {
  await write(
    `INSERT INTO pulse_account_contact (account_id, name, role, added_by) VALUES (?, ?, ?, ?)`,
    [String(accountId), name.trim().slice(0, MAX_NAME_LENGTH), role?.trim().slice(0, MAX_ROLE_LENGTH) || null, addedBy],
  );
  return listContacts(accountId);
}

export async function removeContact(accountId: number | string, id: number): Promise<boolean> {
  const res = await write(`DELETE FROM pulse_account_contact WHERE account_id = ? AND id = ?`, [
    String(accountId),
    id,
  ]);
  return res.affectedRows > 0;
}
