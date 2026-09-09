/**
 * Member types, and the rules about them.
 *
 * Separated from members.ts on purpose: nothing here touches the database, so
 * the ladder can be read in one sitting and tested without one
 * (tests/members.test.mjs). members.ts re-exports all of it, so callers need
 * not care which file a name came from.
 */

/**
 * Three levels, and the ladder is the whole rule: you may bring in the level
 * below you, never your own and never above.
 *
 *   member      — uses Pulse. Can see who else is in; cannot change the list.
 *   admin       — everything a member can, plus invite and remove members.
 *   super_admin — everything, plus invite admins and change anybody's type.
 */
export const ROLES = ["super_admin", "admin", "member"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  member: "Member",
};

/**
 * The founding super admin.
 *
 * Seeded by migrations/004_member_roles.sql, and treated as a super admin here
 * whatever the row says. Not a back door — this email still has to pass the
 * same Proxy login as everyone else — but a floor: it cannot be demoted or
 * removed, so there is always one account that can let people back in. A
 * members list that can lock every administrator out is one bad click away from
 * needing somebody with database access.
 */
export const FOUNDING_SUPER_ADMIN = "lavishgehlod@gmail.com";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A real address, checked no further than that. Proxy owns the real proof. */
export function isEmailShaped(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isFounder(email: string): boolean {
  return normalizeEmail(email) === FOUNDING_SUPER_ADMIN;
}

export type Member = {
  id: number;
  email: string;
  name: string | null;
  status: "invited" | "active";
  role: Role;
  /** True for the seeded super admin, who cannot be demoted or removed. */
  founder: boolean;
  invitedBy: string | null;
  invitedAt: string;
  lastLoginAt: string | null;
};

/* ── the rules ─────────────────────────────────────────────────────────────
   Each returns null when the act is allowed, or the sentence to show the
   person when it is not. A refusal that does not say why turns into a support
   question, so the reason is the return value rather than a boolean. */

/** May `actor` invite somebody at `target` level? */
export function denyInvite(actor: Role, target: Role): string | null {
  if (actor === "super_admin") return null;
  if (actor === "admin") {
    if (target === "member") return null;
    return `Admins can invite members. Only a super admin can invite ${ROLE_LABEL[target].toLowerCase()}s.`;
  }
  return "Members cannot invite. Ask an admin or a super admin.";
}

/** May `actor` remove `target`? `superAdminCount` is the list's current count. */
export function denyRemove(
  actor: { role: Role; email: string },
  target: Member,
  superAdminCount: number,
): string | null {
  if (target.founder) {
    return "The founding super admin cannot be removed — that account is what guarantees somebody can always let people back in.";
  }

  const isSelf = normalizeEmail(actor.email) === normalizeEmail(target.email);

  if (actor.role === "member") {
    // Leaving is always yours to do. It needs nobody's permission, and it is
    // the only exit that does not depend on somebody else being around.
    if (isSelf) return null;
    return "Members cannot remove people. Ask an admin or a super admin.";
  }

  if (actor.role === "admin" && !isSelf && target.role !== "member") {
    return `Admins can remove members. Removing ${ROLE_LABEL[target.role].toLowerCase()}s is a super admin's job.`;
  }

  if (target.role === "super_admin" && superAdminCount <= 1) {
    return "This is the last super admin. Promote somebody else first.";
  }

  return null;
}

/** May `actor` set `target` to `next`? */
export function denySetRole(
  actor: { role: Role; email: string },
  target: Member,
  next: Role,
  superAdminCount: number,
): string | null {
  if (actor.role !== "super_admin") {
    return "Only a super admin can change what somebody is allowed to do.";
  }
  if (target.founder) {
    return "The founding super admin's type is fixed.";
  }
  if (target.role === next) return null;
  if (target.role === "super_admin" && next !== "super_admin" && superAdminCount <= 1) {
    return "This is the last super admin. Promote somebody else first.";
  }
  return null;
}

/** What the members surface should offer this person. */
export function abilities(role: Role): {
  invite: Role[];
  canRemoveOthers: boolean;
  canSetRole: boolean;
} {
  return {
    invite: ROLES.filter((r) => denyInvite(role, r) === null),
    canRemoveOthers: role !== "member",
    canSetRole: role === "super_admin",
  };
}

/**
 * Does `role` clear the bar set by `need`?
 *
 * The ladder rule writes lean on. Kept here rather than beside the gate that
 * uses it because this module is free of Next imports and can therefore be
 * tested without a session or a database — see tests/rule-guard.test.mjs.
 *
 * An unset `need` means "any member will do", which is what the writes that
 * must be attributed but not restricted pass.
 */
const RANK: Record<Role, number> = { member: 0, admin: 1, super_admin: 2 };

export function roleAtLeast(role: Role, need?: Role): boolean {
  return !need || RANK[role] >= RANK[need];
}
