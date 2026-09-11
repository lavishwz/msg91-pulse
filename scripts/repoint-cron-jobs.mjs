/**
 * Re-point every cron-job.org job at the current PUBLIC_BASE_URL.
 *
 * A job's URL embeds whatever PUBLIC_BASE_URL was when the automation was
 * built. Move the app — tunnel to Vercel, Vercel to a custom domain — and
 * every existing job keeps calling the old address. Nothing in Pulse notices:
 * cron-job.org gets a connection error, the webhook is never reached, and the
 * automation just stops running with no error anywhere in the product.
 *
 * Only the origin is rewritten. The path and query string — which carry the
 * automation key and the tick secret — are preserved exactly.
 *
 *   node scripts/repoint-cron-jobs.mjs          # dry run: show what would change
 *   node scripts/repoint-cron-jobs.mjs --apply  # actually change them
 */

import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const API = "https://api.cron-job.org";
const KEY = (process.env.CRONJOB_API_KEY ?? "").trim();
const BASE = (process.env.PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
const APPLY = process.argv.includes("--apply");

if (!KEY) { console.error("CRONJOB_API_KEY is not set in .env.local"); process.exit(1); }
if (!BASE) { console.error("PUBLIC_BASE_URL is not set in .env.local"); process.exit(1); }

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${raw.slice(0, 300)}`);
  return raw ? JSON.parse(raw) : {};
}

const { jobs = [] } = await api("GET", "/jobs");
console.log(`${jobs.length} job(s) on the account. Target origin: ${BASE}\n`);

let changed = 0, already = 0, skipped = 0;
for (const job of jobs) {
  const id = String(job.jobId);
  let url;
  try { url = new URL(job.url); } catch { console.log(`  ?  ${id}  unparseable URL: ${job.url}`); skipped++; continue; }

  /* Only ours. A job on this account that does not call a Pulse endpoint is
     somebody else's and is left completely alone. */
  if (!url.pathname.startsWith("/api/pulse/")) {
    console.log(`  -  ${id}  not a Pulse job, left alone: ${url.pathname}`);
    skipped++;
    continue;
  }

  const next = BASE + url.pathname + url.search;
  if (next === job.url) { console.log(`  =  ${id}  already correct`); already++; continue; }

  console.log(`  ${APPLY ? "→" : "·"}  ${id}  ${job.title}`);
  console.log(`         from ${job.url}`);
  console.log(`           to ${next}`);
  if (APPLY) await api("PATCH", `/jobs/${id}`, { job: { url: next } });
  changed++;
}

console.log(`\n${APPLY ? "re-pointed" : "would re-point"} ${changed}, already correct ${already}, skipped ${skipped}`);
if (!APPLY && changed) console.log("Run again with --apply to make these changes.");
