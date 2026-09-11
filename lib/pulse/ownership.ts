import { randomUUID } from "node:crypto";
import { read, readOne, write } from "@/lib/store";

/**
 * Who owns a company, when Pulse is the one who said so.
 *
 * MSG91 records ownership in `user_handled_by`, and Pulse has SELECT on that
 * database and nothing else. So a reassignment made in Pulse is recorded here
 * — `pulse_account_owner`, migrations/009 — and layered over MSG91's answer
 * when an account is read. The override wins where it exists; MSG91's answer
 * stands everywhere else.
 *
 * The layering happens in `lib/pulse/accounts.ts`, once, at the point every
 * account is mapped. Nothing downstream of that has to know this table exists.
 */

export type OwnerOverride = {
  accountId: string;
  /** null means deliberately unowned — see migrations/009. */
  ownerId: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  note: string | null;
  assignedBy: string;
  assignedAt: string;
};

export type OwnerEvent = {
  id: number;
  accountId: string;
  accountName: string | null;
  ownerId: number | null;
  ownerName: string | null;
  previousOwnerId: number | null;
  previousOwnerName: string | null;
  action: "assigned" | "unassigned" | "cleared";
  note: string | null;
  batch: string | null;
  actor: string;
  at: string;
};

type Row = {
  account_id: string;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  note: string | null;
  assigned_by: string;
  assigned_at: Date;
};

const num = (v: string | null): number | null => {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toOverride = (r: Row): OwnerOverride => ({
  accountId: r.account_id,
  ownerId: num(r.owner_id),
  ownerName: r.owner_name,
  ownerEmail: r.owner_email,
  note: r.note,
  assignedBy: r.assigned_by,
  assignedAt: new Date(r.assigned_at).toISOString(),
});

const COLUMNS = `account_id, owner_id, owner_name, owner_email, note, assigned_by, assigned_at`;

/** The override on one company, or null when Pulse has no opinion. */
export async function ownerOf(accountId: number | string): Promise<OwnerOverride | null> {
  const row = await readOne<Row>(
    `SELECT ${COLUMNS} FROM pulse_account_owner WHERE account_id = ?`,
    [String(accountId)],
  );
  return row ? toOverride(row) : null;
}

/**
 * Overrides for a page of accounts, as a Map keyed by account id.
 *
 * One query rather than one per account: the wall shows forty companies and
 * the board two hundred, and this is what keeps that a single round trip.
 * An empty list returns an empty Map rather than building `IN ()`, which is a
 * syntax error in MySQL.
 */
export async function ownersFor(
  accountIds: Array<number | string>,
): Promise<Map<string, OwnerOverride>> {
  const out = new Map<string, OwnerOverride>();
  if (!accountIds.length) return out;
  const ids = [...new Set(accountIds.map(String))];
  const rows = await read<Row>(
    `SELECT ${COLUMNS} FROM pulse_account_owner
      WHERE account_id IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  for (const r of rows) out.set(r.account_id, toOverride(r));
  return out;
}

/**
 * Every account Pulse has handed to one rep.
 *
 * Used by the standings, which count from `user_handled_by` and would
 * otherwise credit a book to whoever held it before the reassignment.
 */
export async function accountsOwnedBy(ownerId: number | string): Promise<string[]> {
  const rows = await read<{ account_id: string }>(
    `SELECT account_id FROM pulse_account_owner WHERE owner_id = ?`,
    [String(ownerId)],
  );
  return rows.map((r) => r.account_id);
}

/** How many accounts each rep has gained or lost through Pulse, by rep id. */
export async function overrideCounts(): Promise<{
  gained: Map<string, number>;
  /** account id → the owner MSG91 still thinks has it, for the ones overridden. */
  moved: Map<string, number | null>;
}> {
  const rows = await read<{ account_id: string; owner_id: string | null }>(
    `SELECT account_id, owner_id FROM pulse_account_owner`,
  );
  const gained = new Map<string, number>();
  const moved = new Map<string, number | null>();
  for (const r of rows) {
    moved.set(r.account_id, num(r.owner_id));
    if (r.owner_id) gained.set(r.owner_id, (gained.get(r.owner_id) ?? 0) + 1);
  }
  return { gained, moved };
}

export type Assignment = {
  accountId: number | string;
  accountName?: string | null;
  /** null hands the account to nobody; use `clearOwner` to withdraw entirely. */
  ownerId: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  /** What MSG91 said before this — recorded so the change can be read back. */
  previousOwnerId?: number | null;
  previousOwnerName?: string | null;
  note?: string | null;
};

/**
 * Record one reassignment, and the event behind it.
 *
 * Two statements rather than one: the current row is a cache, the event row is
 * the record. They are written in that order so a failure between them leaves
 * the visible state correct and the log one entry short, rather than a log
 * that claims something the page does not show.
 */
export async function assignOwner(
  a: Assignment,
  actor: string,
  batch: string | null = null,
): Promise<void> {
  const accountId = String(a.accountId);
  const ownerId = a.ownerId === null ? null : String(a.ownerId);
  const note = a.note?.trim().slice(0, 255) || null;

  await write(
    `INSERT INTO pulse_account_owner
       (account_id, owner_id, owner_name, owner_email, note, assigned_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       owner_id    = VALUES(owner_id),
       owner_name  = VALUES(owner_name),
       owner_email = VALUES(owner_email),
       note        = VALUES(note),
       assigned_by = VALUES(assigned_by)`,
    [accountId, ownerId, a.ownerName ?? null, a.ownerEmail ?? null, note, actor],
  );

  await write(
    `INSERT INTO pulse_account_owner_event
       (account_id, account_name, owner_id, owner_name,
        previous_owner_id, previous_owner_name, action, note, batch, actor)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      accountId,
      a.accountName ?? null,
      ownerId,
      a.ownerName ?? null,
      a.previousOwnerId == null ? null : String(a.previousOwnerId),
      a.previousOwnerName ?? null,
      ownerId === null ? "unassigned" : "assigned",
      note,
      batch,
      actor,
    ],
  );

  if (ownerId !== null) {
    const { emitEvent } = await import("@/lib/pulse/autopilot/automation-runner");
    emitEvent("account.reassigned", {
      accountId,
      accountName: a.accountName ?? null,
      ownerId,
      ownerName: a.ownerName ?? null,
      previousOwnerId: a.previousOwnerId == null ? null : String(a.previousOwnerId),
      assignedBy: actor,
    }).catch(() => {});
  }
}

/**
 * Withdraw the override, so MSG91's own answer stands again.
 *
 * Distinct from assigning to nobody: that is Pulse saying the account has no
 * owner, this is Pulse saying it has no opinion. The event is still written —
 * undoing a reassignment is itself a reassignment as far as anyone reading the
 * log later is concerned.
 */
export async function clearOwner(
  accountId: number | string,
  actor: string,
  accountName?: string | null,
): Promise<boolean> {
  const id = String(accountId);
  const before = await ownerOf(id);
  if (!before) return false;

  await write(`DELETE FROM pulse_account_owner WHERE account_id = ?`, [id]);
  await write(
    `INSERT INTO pulse_account_owner_event
       (account_id, account_name, owner_id, owner_name,
        previous_owner_id, previous_owner_name, action, actor)
     VALUES (?, ?, NULL, NULL, ?, ?, 'cleared', ?)`,
    [
      id,
      accountName ?? null,
      before.ownerId === null ? null : String(before.ownerId),
      before.ownerName,
      actor,
    ],
  );
  return true;
}

/** A batch id, so one press of "apply the split" reads as one act. */
export const newBatch = (): string => randomUUID().replace(/-/g, "");

type EventRow = {
  id: number;
  account_id: string;
  account_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
  previous_owner_id: string | null;
  previous_owner_name: string | null;
  action: OwnerEvent["action"];
  note: string | null;
  batch: string | null;
  actor: string;
  at: Date;
};

const toEvent = (r: EventRow): OwnerEvent => ({
  id: Number(r.id),
  accountId: r.account_id,
  accountName: r.account_name,
  ownerId: num(r.owner_id),
  ownerName: r.owner_name,
  previousOwnerId: num(r.previous_owner_id),
  previousOwnerName: r.previous_owner_name,
  action: r.action,
  note: r.note,
  batch: r.batch,
  actor: r.actor,
  at: new Date(r.at).toISOString(),
});

const EVENT_COLUMNS = `id, account_id, account_name, owner_id, owner_name,
  previous_owner_id, previous_owner_name, action, note, batch, actor, at`;

/** The reassignment history of one company, newest first. */
export async function ownerHistory(
  accountId: number | string,
  limit = 20,
): Promise<OwnerEvent[]> {
  const rows = await read<EventRow>(
    `SELECT ${EVENT_COLUMNS} FROM pulse_account_owner_event
      WHERE account_id = ? ORDER BY id DESC LIMIT ?`,
    [String(accountId), Math.min(Math.max(1, limit), 100)],
  );
  return rows.map(toEvent);
}

/** Every reassignment across the base, newest first — the audit surface. */
export async function recentOwnerEvents(limit = 50): Promise<OwnerEvent[]> {
  const rows = await read<EventRow>(
    `SELECT ${EVENT_COLUMNS} FROM pulse_account_owner_event ORDER BY id DESC LIMIT ?`,
    [Math.min(Math.max(1, limit), 200)],
  );
  return rows.map(toEvent);
}
