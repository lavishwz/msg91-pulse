/**
 * What is in pulse_automation, and what could actually ever run it.
 *
 * An automation row is only half the picture. A scheduled one runs because
 * something calls it: either its own cron-job.org job (dynamically built
 * rules get one — see build.ts) or the internal Autopilot tick, which walks
 * `due()` and is itself only reached when something calls
 * /api/pulse/autopilot/tick. A row whose cron job is missing and whose only
 * hope was a tick nobody schedules is not idle — it is dead, and nothing in
 * the product says so.
 *
 *   node --experimental-strip-types scripts/automation-inventory.mjs
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { read } = await import("../lib/store.ts");

const KEY = (process.env.CRONJOB_API_KEY ?? "").trim();
async function cronJobs() {
  if (!KEY) return null;
  const r = await fetch("https://api.cron-job.org/jobs", { headers: { authorization: `Bearer ${KEY}` } });
  if (!r.ok) return null;
  const { jobs = [] } = await r.json();
  return jobs;
}

const rows = await read(
  `SELECT automation_key, motion, trigger_kind, mode, every_minutes, cron_job_id, live, state,
          capability, run_count, alert_count, last_run_at, last_error
     FROM pulse_automation ORDER BY trigger_kind, motion, automation_key`,
);

const jobs = await cronJobs();
const jobById = new Map((jobs ?? []).map((j) => [String(j.jobId), j]));
const tickScheduled = (jobs ?? []).some((j) => String(j.url).includes("/autopilot/tick"));

console.log(`${rows.length} automation rows; cron-job.org ${jobs ? `${jobs.length} jobs` : "unreachable"}`);
console.log(`internal Autopilot tick scheduled anywhere: ${tickScheduled ? "yes" : "NO"}\n`);

const stranded = [];
for (const r of rows) {
  const job = r.cron_job_id ? jobById.get(String(r.cron_job_id)) : null;
  const runnable =
    r.trigger_kind === "event"
      ? "on its event"
      : r.trigger_kind !== "schedule"
        ? "never (by design)"
        : job?.enabled
          ? `cron job ${r.cron_job_id}`
          : r.cron_job_id
            ? `cron job ${r.cron_job_id} MISSING at cron-job.org`
            : tickScheduled
              ? "the internal tick"
              : "NOTHING";

  if (runnable === "NOTHING" || runnable.includes("MISSING")) stranded.push({ ...r, runnable });

  console.log(
    `${String(r.trigger_kind).padEnd(9)} ${String(r.motion).padEnd(9)} ${r.live ? "live" : "off "} ` +
    `runs=${String(r.run_count).padEnd(5)} every=${String(r.every_minutes ?? "—").padEnd(5)} ` +
    `${runnable.padEnd(34)} ${r.automation_key}`,
  );
  if (r.last_error) console.log(`${" ".repeat(10)}last_error: ${String(r.last_error).slice(0, 140)}`);
}

if (stranded.length) {
  console.log(`\n${stranded.length} scheduled automation(s) that nothing will ever run:`);
  for (const s of stranded) console.log(`  · ${s.automation_key} (${s.runnable})`);
}

/* A job at cron-job.org whose automation is gone keeps firing at a webhook
   that 404s — harmless, but it is the other half of the same accounting. */
const known = new Set(rows.map((r) => String(r.cron_job_id ?? "")));
const orphanJobs = (jobs ?? []).filter(
  (j) => String(j.url).includes("/autopilot/webhook/") && !known.has(String(j.jobId)),
);
if (orphanJobs.length) {
  console.log(`\n${orphanJobs.length} cron job(s) firing at an automation that no longer exists:`);
  for (const j of orphanJobs) console.log(`  · ${j.jobId} ${j.title}`);
}

process.exit(0);
