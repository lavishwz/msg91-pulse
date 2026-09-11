/**
 * What cron-job.org thinks of every Pulse job: is it enabled, when did it last
 * fire, and what did Pulse answer?
 *
 * The webhook is fire-and-forget from Pulse's side — nothing in the product
 * ever learns that a job is failing. A job pointed at a dead URL, or one whose
 * secret no longer matches, just stops working silently and the automation
 * looks idle rather than broken. This is the only place that difference shows.
 */
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
const KEY = (process.env.CRONJOB_API_KEY ?? "").trim();
const api = async (p) => {
  const r = await fetch("https://api.cron-job.org" + p, { headers: { authorization: `Bearer ${KEY}` } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${p} -> ${r.status}: ${t.slice(0,200)}`);
  return JSON.parse(t);
};
const STATUS = { 0:"unknown", 1:"OK", 2:"FAILED (DNS)", 3:"FAILED (could not connect)", 4:"FAILED (HTTP error)", 5:"FAILED (timeout)", 6:"FAILED (too much response data)", 7:"FAILED (invalid URL)", 8:"FAILED (internal errors)", 9:"FAILED (unknown reason)" };
const { jobs = [] } = await api("/jobs");
console.log(`${jobs.length} jobs\n`);
for (const j of jobs) {
  const path = (() => { try { return new URL(j.url).pathname.replace("/api/pulse/autopilot/","").replace("/api/pulse/",""); } catch { return j.url; } })();
  const last = j.lastExecution ? new Date(j.lastExecution * 1000).toISOString() : "never";
  const next = j.nextExecution ? new Date(j.nextExecution * 1000).toISOString() : "—";
  console.log(`${j.enabled ? "ON " : "OFF"}  ${String(j.jobId).padEnd(8)} ${path.slice(0,52).padEnd(54)}`);
  console.log(`      last=${last}  status=${STATUS[j.lastStatus] ?? j.lastStatus}  duration=${j.lastDuration ?? "?"}ms  next=${next}`);
}
