/**
 * Delete one automation from the deployed Pulse, cron job and all.
 *
 *   node --experimental-strip-types scripts/live-delete.mjs <automation_key> …
 *
 * Goes through DELETE /api/pulse/autopilot/automations, which is the same
 * path the Rules page uses — so the cron-job.org job is torn down with the
 * row rather than left firing at a webhook whose automation no longer exists.
 */

import { loadEnv, session, api, base } from "./live-http.mjs";

loadEnv();

const keys = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!keys.length) {
  console.error("usage: live-delete.mjs <automation_key> …");
  process.exit(2);
}

const token = await session();
console.log(`base: ${base()}`);
for (const key of keys) {
  const res = await api(token, "DELETE", `/api/pulse/autopilot/automations?key=${encodeURIComponent(key)}`);
  console.log(`${res.status === 200 ? "deleted" : `FAILED (${res.status})`}  ${key}  ${res.json?.error ?? ""}`);
}
process.exit(0);
