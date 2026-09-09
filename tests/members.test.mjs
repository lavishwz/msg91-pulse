/**
 * The member-type ladder.
 *
 * These are the rules that decide who can let somebody else into Pulse, so
 * they are worth testing without a database in the way. lib/pulse/member-roles
 * is pure for exactly this reason.
 */

import {
  abilities,
  denyInvite,
  denyRemove,
  denySetRole,
  FOUNDING_SUPER_ADMIN,
  isEmailShaped,
  isFounder,
  isRole,
  normalizeEmail,
  ROLES,
} from "../lib/pulse/member-roles.ts";

let pass = 0, fail = 0;
const check = (cond, label) => (cond ? pass++ : (fail++, console.log("FAIL " + label)));

const member = (over = {}) => ({
  id: 1,
  email: "someone@msg91.com",
  name: null,
  status: "active",
  role: "member",
  founder: false,
  invitedBy: "boss@msg91.com",
  invitedAt: "2026-09-09T00:00:00.000Z",
  lastLoginAt: null,
  ...over,
});

/* ── the types themselves ────────────────────────────────────────────────── */

check(ROLES.length === 3, "three member types and no more");
check(isRole("super_admin") && isRole("admin") && isRole("member"), "the three are recognised");
check(!isRole("owner") && !isRole("") && !isRole(undefined), "anything else is not a type");

/* ── the founder ─────────────────────────────────────────────────────────── */

check(FOUNDING_SUPER_ADMIN === "lavishgehlod@gmail.com", "the founding super admin is who it should be");
check(isFounder("LavishGehlod@Gmail.com  "), "the founder is recognised whatever the casing");
check(!isFounder("someone@msg91.com"), "nobody else is the founder");

/* ── inviting ────────────────────────────────────────────────────────────── */

for (const target of ROLES) {
  check(denyInvite("super_admin", target) === null, `a super admin may invite a ${target}`);
}
check(denyInvite("admin", "member") === null, "an admin may invite a member");
check(typeof denyInvite("admin", "admin") === "string", "an admin may not invite an admin");
check(typeof denyInvite("admin", "super_admin") === "string", "an admin may not invite a super admin");
for (const target of ROLES) {
  check(typeof denyInvite("member", target) === "string", `a member may not invite a ${target}`);
}

/* ── the abilities the members sheet draws itself from ───────────────────── */

check(abilities("super_admin").invite.length === 3, "a super admin is offered all three types");
check(
  abilities("admin").invite.length === 1 && abilities("admin").invite[0] === "member",
  "an admin is offered only member",
);
check(abilities("member").invite.length === 0, "a member is offered no invite box at all");
check(abilities("super_admin").canSetRole && !abilities("admin").canSetRole, "only a super admin changes types");
check(abilities("admin").canRemoveOthers && !abilities("member").canRemoveOthers, "members remove nobody");

/* ── removing ────────────────────────────────────────────────────────────── */

const boss = { role: "super_admin", email: "boss@msg91.com" };
const adm = { role: "admin", email: "adm@msg91.com" };
const mem = { role: "member", email: "someone@msg91.com" };

check(denyRemove(boss, member(), 2) === null, "a super admin removes a member");
check(denyRemove(boss, member({ role: "admin" }), 2) === null, "a super admin removes an admin");
check(denyRemove(adm, member(), 2) === null, "an admin removes a member");
check(typeof denyRemove(adm, member({ role: "admin" }), 2) === "string", "an admin cannot remove an admin");
check(typeof denyRemove(mem, member({ email: "other@msg91.com" }), 2) === "string", "a member removes nobody else");

// Leaving is always yours to do — no type gates the exit.
check(denyRemove(mem, member({ email: mem.email }), 2) === null, "a member may leave");
check(denyRemove(adm, member({ role: "admin", email: adm.email }), 2) === null, "an admin may leave");

// The two floors that keep somebody able to let people back in.
check(
  typeof denyRemove(boss, member({ email: FOUNDING_SUPER_ADMIN, founder: true, role: "super_admin" }), 3) === "string",
  "the founder cannot be removed, even by a super admin",
);
check(
  typeof denyRemove(boss, member({ role: "super_admin", email: boss.email }), 1) === "string",
  "the last super admin cannot remove themselves",
);
check(
  denyRemove(boss, member({ role: "super_admin", email: "other@msg91.com" }), 2) === null,
  "one of two super admins can go",
);

/* ── changing a type ─────────────────────────────────────────────────────── */

check(denySetRole(boss, member(), "admin", 2) === null, "a super admin promotes a member");
check(typeof denySetRole(adm, member(), "admin", 2) === "string", "an admin cannot promote anybody");
check(typeof denySetRole(mem, member(), "admin", 2) === "string", "a member cannot promote anybody");
check(
  typeof denySetRole(boss, member({ email: FOUNDING_SUPER_ADMIN, founder: true, role: "super_admin" }), "member", 3) === "string",
  "the founder cannot be demoted",
);
check(
  typeof denySetRole(boss, member({ role: "super_admin", email: boss.email }), "admin", 1) === "string",
  "the last super admin cannot demote themselves",
);
check(
  denySetRole(boss, member({ role: "super_admin", email: boss.email }), "super_admin", 1) === null,
  "setting a type to what it already is changes nothing and is refused by nothing",
);

/* ── the email helpers the invite box leans on ───────────────────────────── */

check(normalizeEmail("  Someone@MSG91.com ") === "someone@msg91.com", "emails are normalised");
check(isEmailShaped("a@b.co") && !isEmailShaped("nope") && !isEmailShaped("a@b"), "email shape");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
