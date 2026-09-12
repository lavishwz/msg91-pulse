/**
 * Make sure something actually calls the Autopilot tick.
 *
 * /api/pulse/autopilot/tick is what runs signup triage and every scheduled
 * automation that has no cron-job.org job of its own (`due()` →
 * `runAutomations()`). Dynamically built rules each get their own job at
 * build time, so they kept working and hid the fact that nothing was ever
 * registered for the tick itself: scripts/automation-inventory.mjs reported
 * ten scheduled automations that nothing could run, `auto.partner.silence`
 * among them — live, and never once fired.
 *
 * Two things had to be true for this to work, and only one of them was:
 *
 *   · the route has to accept the secret as ?secret=, because createCronJob()
 *     registers a bare URL and cannot attach a custom header. It did not
 *     until this was found; every other machine endpoint already did.
 *   · a job has to exist. That is what this script creates.
 *
 * Idempotent: an existing tick job is left alone rather than duplicated, and
 * re-pointed if PUBLIC_BASE_URL has moved since it was made.
 *
 *   node --experimental-strip-types scripts/ensure-tick-job.mjs            # report only
 *   node --experimental-strip-types scripts/ensure-tick-job.mjs --apply    # create or re-point it
 *
 * Deploy the route fix first. Against a deployment that still only reads the
 * header, the job registers fine and then collects 401s every time it fires.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const APPLY = process.argv.includes("--apply");
const SCHEDULE = "*/5 * * * *";

const { createCronJob, listCronJobs, setCronJobUrl } = await import("../lib/pulse/cronjob.ts");

const base = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
const secret = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
if (!base) { console.error("PUBLIC_BASE_URL is not set."); process.exit(2); }
if (!secret) { console.error("AUTOPILOT_TICK_SECRET is not set."); process.exit(2); }

const url = `${base}/api/pulse/autopilot/tick?secret=${encodeURIComponent(secret)}`;
const jobs = await listCronJobs();
const existing = jobs.find((j) => j.url.includes("/api/pulse/autopilot/tick"));

if (existing) {
  const pointsHere = existing.url.startsWith(`${base}/api/pulse/autopilot/tick`);
  console.log(`tick job ${existing.jobId} exists, enabled=${existing.enabled}, points here=${pointsHere}`);
  if (!pointsHere) {
    if (!APPLY) { console.log("would re-point it at", base, "— re-run with --apply"); process.exit(0); }
    await setCronJobUrl(existing.jobId, url);
    console.log("re-pointed", existing.jobId);
  }
  process.exit(0);
}

console.log(`no cron job calls the Autopilot tick. ${jobs.length} other jobs exist.`);
if (!APPLY) {
  console.log(`would create one on "${SCHEDULE}" against ${base}/api/pulse/autopilot/tick — re-run with --apply`);
  process.exit(0);
}
const id = await createCronJob("pulse: autopilot tick", url, SCHEDULE);
console.log(`created cron job ${id} on "${SCHEDULE}"`);
process.exit(0);
