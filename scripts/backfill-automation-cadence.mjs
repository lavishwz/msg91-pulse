/**
 * Give every existing automation the `every_minutes` its cron job already has.
 *
 * Dynamically-built automations registered a schedule with cron-job.org and
 * then saved the row without `every_minutes`, so it landed NULL. recordRun
 * falls back to five minutes when it is NULL, and that is what sets
 * next_run_at — which is what the internal tick's due() reads. So every one of
 * these rows is permanently "due" within five minutes of its last run, no
 * matter that its actual schedule is hourly or daily.
 *
 * build.ts now stores the cadence for new automations. This backfills the ones
 * created before that, by asking cron-job.org what schedule each job actually
 * holds rather than guessing from the rule's wording.
 *
 *   node --experimental-strip-types scripts/backfill-automation-cadence.mjs
 *   node --experimental-strip-types scripts/backfill-automation-cadence.mjs --apply
 */

import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { read, write } = await import("../lib/store.ts");
const APPLY = process.argv.includes("--apply");
const KEY = (process.env.CRONJOB_API_KEY ?? "").trim();

async function job(id) {
  const r = await fetch(`https://api.cron-job.org/jobs/${id}`, { headers: { authorization: `Bearer ${KEY}` } });
  if (!r.ok) return null;
  return (await r.json()).jobDetails ?? null;
}

/** cron-job.org's schedule arrays back to an interval in minutes. [-1] is "every". */
function intervalOf(sched) {
  if (!sched) return null;
  const every = (a) => Array.isArray(a) && a.length === 1 && a[0] === -1;
  const n = (a, whole) => (every(a) ? whole : (a?.length ?? 1));
  if (every(sched.minutes)) return 1;
  const perHour = n(sched.minutes, 60);
  if (every(sched.hours)) return Math.max(1, Math.round(60 / perHour));
  const perDay = perHour * n(sched.hours, 24);
  if (every(sched.mdays) && every(sched.wdays)) return Math.max(1, Math.round(1440 / perDay));
  if (!every(sched.wdays)) return Math.max(1, Math.round((7 * 1440) / (perDay * sched.wdays.length)));
  return Math.max(1, Math.round((30 * 1440) / (perDay * n(sched.mdays, 30))));
}

const rows = await read(
  `SELECT automation_key, cron_job_id, every_minutes
     FROM pulse_automation
    WHERE state <> 'retired' AND every_minutes IS NULL`,
);
console.log(`${rows.length} automation(s) with no every_minutes\n`);

let fixed = 0, skipped = 0;
for (const r of rows) {
  if (!r.cron_job_id) {
    console.log(`  -  ${r.automation_key}\n       no cron job to read a schedule from, left alone`);
    skipped++;
    continue;
  }
  const d = await job(r.cron_job_id);
  const mins = intervalOf(d?.schedule);
  if (!mins) {
    console.log(`  ?  ${r.automation_key}\n       cron-job.org job ${r.cron_job_id} gave no readable schedule`);
    skipped++;
    continue;
  }
  const human = mins >= 1440 ? `${Math.round(mins / 1440)}d` : mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`;
  console.log(`  ${APPLY ? "→" : "·"}  ${r.automation_key}\n       every_minutes: NULL -> ${mins} (${human})`);
  if (APPLY) {
    await write(`UPDATE pulse_automation SET every_minutes = ? WHERE automation_key = ?`, [mins, r.automation_key]);
  }
  fixed++;
}

console.log(`\n${APPLY ? "set" : "would set"} ${fixed}, skipped ${skipped}`);
if (!APPLY && fixed) console.log("Run again with --apply.");
process.exit(0);
