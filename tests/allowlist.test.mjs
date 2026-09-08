import { ALLOWED_TABLES, ALLOWED_TABLE_NAMES } from "../lib/pulse/schema-notes.ts";
import { CORE_TABLES } from "../lib/pulse/schema-notes.ts";

let pass = 0, fail = 0;
const check = (cond, label) => cond ? pass++ : (fail++, console.log("FAIL " + label));

check(ALLOWED_TABLE_NAMES.size === Object.keys(ALLOWED_TABLES).length, "name set matches the map");
check(ALLOWED_TABLE_NAMES.size === 112, `112 tables allowed (got ${ALLOWED_TABLE_NAMES.size})`);

// Every table sent as column detail must be one the agent is allowed to see,
// or the prompt would describe a table the agent must not query.
for (const t of CORE_TABLES) check(ALLOWED_TABLE_NAMES.has(t), `CORE_TABLES entry "${t}" is allowlisted`);

// A description is the point of the allowlist — an empty one is a silent gap.
for (const [t, note] of Object.entries(ALLOWED_TABLES)) {
  check(typeof note === "string" && note.trim().length > 3, `"${t}" has a description`);
}

// Tables Pulse's own code reads but the agent must NOT see.
for (const t of ["clientManagement", "ms_user_balance", "signup_tracking", "decliningAnalysis",
                 "sender_id_executive_summary", "ms_user_otherdetails"]) {
  check(!ALLOWED_TABLE_NAMES.has(t), `"${t}" stays code-only`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
