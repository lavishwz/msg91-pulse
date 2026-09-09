/**
 * Who may change a rule.
 *
 * Rule writes used to take no role at all: any invited member could rewrite
 * what Autopilot is allowed to do on its own. The ladder that stops that is
 * pure, so it is tested here without a session or a database in the way.
 */

import { roleAtLeast } from "../lib/pulse/member-roles.ts";

let pass = 0, fail = 0;
const check = (cond, label) => (cond ? pass++ : (fail++, console.log("FAIL " + label)));

/* ── the bar rule writes set ─────────────────────────────────────────────── */

check(roleAtLeast("super_admin", "super_admin") === true, "a super admin may change a rule");
check(roleAtLeast("admin", "super_admin") === false, "an admin may not change a rule");
check(roleAtLeast("member", "super_admin") === false, "a member may not change a rule");

/* ── the lower bar the attributed-but-ungated writes use ─────────────────── */

check(roleAtLeast("member", undefined) === true, "any member clears an unset bar");
check(roleAtLeast("admin", undefined) === true, "so does an admin");
check(roleAtLeast("super_admin", undefined) === true, "and a super admin");

/* ── the ladder is ordered, not a set of equals ──────────────────────────── */

check(roleAtLeast("super_admin", "admin") === true, "a super admin clears the admin bar");
check(roleAtLeast("admin", "admin") === true, "an admin clears their own bar");
check(roleAtLeast("member", "admin") === false, "a member does not");
check(roleAtLeast("member", "member") === true, "a member clears the member bar");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
