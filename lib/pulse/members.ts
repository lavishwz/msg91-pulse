/**
 * The invite list — who may sign in to Pulse.
 *
 * A Proxy login says who somebody is. This says whether that person is allowed
 * in, and as what. Everything here is keyed on the email Proxy reports,
 * lowercased, and lives in Pulse's own writable schema (`pulse_member`,
 * migrations/003 and 004).
 *
 * The rules about member types are pure and live next door, in
 * lib/pulse/member-roles.ts; this file is the database half. Everything from
 * there is re-exported, so `@/lib/pulse/members` is the one import for anything
 * to do with the list.
 *
 * Read by two callers, and the difference matters:
 *   - `checkAndRecordLogin` at login — writes (marks active, stamps the login).
 *   - `memberAccess` on every request, through the guard — never writes.
 *
 * Both throw when the store is unreachable. That is deliberate: the callers
 * turn a throw into a refusal, so a database outage locks everybody out rather
 * than letting everybody in.
 */

import { read, readOne, write, type Param } from "@/lib/store";
import { isFounder, normalizeEmail, type Member, type Role } from "@/lib/pulse/member-roles";

export * from "@/lib/pulse/member-roles";

type MemberRow = {
  id: number;
  email: string;
  name: string | null;
  status: "invited" | "active";
  role: Role;
  invited_by: string | null;
  invited_at: Date;
  last_login_at: Date | null;
};

const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);

function toMember(r: MemberRow): Member {
  const founder = isFounder(r.email);
  return {
    id: Number(r.id),
    email: r.email,
    name: r.name,
    status: r.status,
    // The floor, applied on the way out as well as on the way in, so a row
    // edited by hand in the database cannot demote the founder either.
    role: founder ? "super_admin" : r.role,
    founder,
    invitedBy: r.invited_by,
    invitedAt: iso(r.invited_at)!,
    lastLoginAt: iso(r.last_login_at),
  };
}

const SELECT = `SELECT id, email, name, status, role, invited_by, invited_at, last_login_at FROM pulse_member`;

/* ── reads ───────────────────────────────────────────────────────────────── */

export async function listMembers(): Promise<Member[]> {
  const rows = await read<MemberRow>(
    // Super admins first, then admins, then everyone else: the list is read to
    // answer "who can let me in", and that person should be at the top of it.
    `${SELECT} ORDER BY FIELD(role,'super_admin','admin','member'), invited_at DESC, id DESC`,
  );
  return rows.map(toMember);
}

export async function findMember(id: number): Promise<Member | null> {
  const row = await readOne<MemberRow>(`${SELECT} WHERE id = ?`, [id]);
  return row ? toMember(row) : null;
}

/** How many people hold a type. Used to protect the last super admin. */
export async function countByRole(role: Role): Promise<number> {
  const row = await readOne<{ n: number }>(`SELECT COUNT(*) n FROM pulse_member WHERE role = ?`, [
    role,
  ]);
  return Number(row?.n ?? 0);
}

/* ── writes ──────────────────────────────────────────────────────────────── */

/** Thrown when inviting somebody who is already on the list. */
export class DuplicateMemberError extends Error {
  constructor(email: string) {
    super(`${email} is already a member`);
    this.name = "DuplicateMemberError";
  }
}

export async function inviteMember(
  email: string,
  role: Role,
  invitedBy: string | null,
  name: string | null = null,
): Promise<Member> {
  const normalized = normalizeEmail(email);
  try {
    await write(`INSERT INTO pulse_member (email, name, role, invited_by) VALUES (?, ?, ?, ?)`, [
      normalized,
      name,
      role,
      invitedBy,
    ]);
  } catch (err) {
    // 1062 = duplicate entry on uq_member_email. Anything else is a real fault.
    if ((err as { errno?: number }).errno === 1062) throw new DuplicateMemberError(normalized);
    throw err;
  }
  const row = await readOne<MemberRow>(`${SELECT} WHERE email = ?`, [normalized]);
  if (!row) throw new Error("Invite was written but could not be read back");
  return toMember(row);
}

export async function setMemberRole(id: number, role: Role): Promise<boolean> {
  const res = await write(`UPDATE pulse_member SET role = ? WHERE id = ?`, [role, id]);
  return res.affectedRows > 0;
}

export async function removeMember(id: number): Promise<boolean> {
  const res = await write(`DELETE FROM pulse_member WHERE id = ?`, [id]);
  return res.affectedRows > 0;
}

/* ── the gate ────────────────────────────────────────────────────────────── */

/**
 * The login gate.
 *
 * Returns the type this email signs in as, or null when it may not sign in at
 * all. Records the login as it goes: an invited row becomes active, and
 * `last_login_at` moves. The display name and Proxy user id are backfilled but
 * never overwritten with nothing, so a login that could not resolve a name does
 * not erase the one already there.
 *
 * An email that is not on the list is refused, full stop. There is no bootstrap
 * path: migrations/004 seeds the founding super admin, so the list is never
 * empty and "not invited" always means not invited.
 */
export async function checkAndRecordLogin(
  email: string,
  name: string | null,
  proxyUserId: string | null,
): Promise<Role | null> {
  const normalized = normalizeEmail(email);
  const params: Param[] = [name, proxyUserId, normalized];

  await write(
    `UPDATE pulse_member
        SET status        = 'active',
            last_login_at = NOW(),
            name          = COALESCE(?, name),
            proxy_user_id = COALESCE(?, proxy_user_id)
      WHERE email = ?`,
    params,
  );

  // Read back rather than trusting affectedRows: mysql2 does not set
  // CLIENT_FOUND_ROWS, so a row whose values did not change reports 0 changed.
  const row = await readOne<MemberRow>(`${SELECT} WHERE email = ?`, [normalized]);
  return row ? toMember(row).role : null;
}

/**
 * Is this email still allowed in, and as what? Read-only, called on every
 * request through the guard.
 */
export async function memberAccess(email: string): Promise<{ allowed: boolean; role: Role }> {
  const row = await readOne<MemberRow>(`${SELECT} WHERE email = ?`, [normalizeEmail(email)]);
  if (!row) return { allowed: false, role: "member" };
  return { allowed: true, role: toMember(row).role };
}
