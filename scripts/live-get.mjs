/**
 * Read one deployed Pulse API route as a signed-in super_admin.
 *
 * Read-only on purpose — it only ever issues GET. For checking that what the
 * runner wrote actually reaches a surface: an automation that ran, wrote a
 * decision and appears on no tab is indistinguishable, to the person using
 * Pulse, from one that never ran.
 *
 *   node --experimental-strip-types scripts/live-get.mjs /api/pulse/autopilot/decisions
 *   node --experimental-strip-types scripts/live-get.mjs /api/pulse/autopilot/automations --raw
 */

import { loadEnv, session, api, base } from "./live-http.mjs";

loadEnv();

const path = process.argv.slice(2).find((a) => a.startsWith("/"));
const RAW = process.argv.includes("--raw");
if (!path) { console.error("usage: live-get.mjs /api/pulse/... [--raw]"); process.exit(2); }

const token = await session();
const res = await api(token, "GET", path);
console.log(`GET ${base()}${path} → ${res.status}`);
if (RAW || !res.json) {
  console.log(res.text.slice(0, 4000));
} else {
  console.log(JSON.stringify(res.json, null, 1).slice(0, 6000));
}
process.exit(res.status === 200 ? 0 : 1);
