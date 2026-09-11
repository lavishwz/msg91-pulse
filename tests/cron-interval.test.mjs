/**
 * A cron expression, as an interval in minutes.
 *
 * This exists because an automation states its cadence twice — once as the
 * cron expression registered with cron-job.org, once as `every_minutes` on its
 * row, which is what sets next_run_at and therefore what the internal tick's
 * due() honours. Dynamically-built automations only ever set the first, so the
 * second fell to recordRun's five-minute default: a rule the planner scheduled
 * daily was eligible to be re-run every five minutes, ~288 times a day, each
 * one an agent call. These cases are the ones the planner actually emits.
 */

import { cronIntervalMinutes } from "../lib/pulse/cronjob.ts";

let pass = 0, fail = 0;
const eq = (expr, want) => {
  const got = cronIntervalMinutes(expr);
  if (got === want) pass++;
  else { fail++; console.log(`FAIL  "${expr}"  expected ${want}, got ${got}`); }
};

/* ── the shapes the planner emits ────────────────────────────────────────── */
eq("* * * * *", 1);            // every minute
eq("*/5 * * * *", 5);          // every five minutes
eq("*/15 * * * *", 15);        // every fifteen
eq("*/30 * * * *", 30);        // every half hour
eq("0 * * * *", 60);           // hourly, the build default
eq("30 * * * *", 60);          // hourly, offset
eq("0 */2 * * *", 120);        // every two hours
eq("0 0 * * *", 1440);         // daily
eq("0 9 * * *", 1440);         // daily at nine
eq("0 9 * * 1", 10080);        // weekly
eq("0 3 1 * *", 43200);        // monthly

/* ── more than one value in a field ──────────────────────────────────────── */
eq("0,30 * * * *", 30);        // twice an hour
eq("0 0,12 * * *", 720);       // twice a day
eq("0 9 * * 1,3,5", 3360);     // three days a week

/* ── it must never return something that would re-run a rule constantly ──── */
for (const expr of ["0 0 * * *", "0 9 * * 1", "0 3 1 * *"]) {
  const got = cronIntervalMinutes(expr);
  if (got >= 1440) pass++;
  else { fail++; console.log(`FAIL  "${expr}" is at least daily but reported ${got} minutes`); }
}

/* ── garbage in must not produce a one-minute cadence ────────────────────── */
for (const expr of ["", "not a cron", "* * *", "0 0 * * * *"]) {
  const got = cronIntervalMinutes(expr);
  if (got >= 60) pass++;
  else { fail++; console.log(`FAIL  unparseable "${expr}" fell back to ${got} minutes, which would hammer the tick`); }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
