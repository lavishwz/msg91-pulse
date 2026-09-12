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

/* --counts also runs each live scheduled automation's stored find_sql, so the
   report can tell "ran and found nothing" apart from "ran and lost its rows".
   Off by default: it is one real query per automation against MSG91. */
const COUNTS = process.argv.includes("--counts");
async function countRows(sql) {
  if (!sql) return null;
  try {
    const { query } = await import("../lib/db.ts");
    const rows = await query(`SELECT COUNT(*) AS n FROM (${String(sql).replace(/;\s*$/, "")}) __count`);
    return Number(rows[0]?.n ?? 0);
  } catch (err) {
    return `error: ${(err).message.slice(0, 90)}`;
  }
}

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
          capability, run_count, alert_count, last_run_at, last_error, find_sql
     FROM pulse_automation ORDER BY trigger_kind, motion, automation_key`,
);

/* "on its event" was an assumption, not a check. emitEvent only ever reaches
   what automationsForEvent() returns, and that has its own conditions —
   live, active, capability ready — so the honest answer is to ask it. */
const { automationsForEvent } = await import("../lib/pulse/autopilot/automations.ts");
const listening = new Set();
for (const name of new Set(rows.filter((r) => r.when_event && r.trigger_kind === 'event').map((r) => r.when_event))) {
  for (const a of await automationsForEvent(name)) listening.add(a.key);
}

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
      ? listening.has(r.automation_key)
        ? `on ${r.when_event}`
        : `NOT LISTENING for ${r.when_event}`
      : r.trigger_kind !== "schedule"
        ? "never (by design)"
        : job?.enabled
          ? `cron job ${r.cron_job_id}`
          : r.cron_job_id
            ? `cron job ${r.cron_job_id} MISSING at cron-job.org`
            : tickScheduled
              ? "the internal tick"
              : "NOTHING";

  if (runnable === "NOTHING" || runnable.includes("MISSING") || runnable.startsWith("NOT LISTENING"))
    stranded.push({ ...r, runnable });

  console.log(
    `${String(r.trigger_kind).padEnd(9)} ${String(r.motion).padEnd(9)} ${r.live ? "live" : "off "} ` +
    `runs=${String(r.run_count).padEnd(5)} every=${String(r.every_minutes ?? "—").padEnd(5)} ` +
    `${runnable.padEnd(34)} ${r.automation_key}`,
  );
  if (r.last_error) console.log(`${" ".repeat(10)}last_error: ${String(r.last_error).slice(0, 140)}`);
  if (COUNTS && r.trigger_kind === "schedule" && r.live && r.find_sql) {
    console.log(`${" ".repeat(10)}its query matches ${await countRows(r.find_sql)} rows right now`);
  }
}

if (stranded.length) {
  console.log(`\n${stranded.length} automation(s) that nothing will ever run:`);
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

/* Running is not the same as working. An automation whose every pass ends in
   a failed verdict still moves run_count, still looks alive on the Rules page,
   and is producing nothing — pulse_decision is the only place that difference
   is written down. */
const recent = await read(
  `SELECT policy_version AS automation_key,
          COUNT(*) AS decisions,
          SUM(verdict = 'alert') AS alerts,
          SUM(verdict = 'quiet') AS quiet,
          SUM(verdict = 'failed') AS failed,
          MAX(at) AS last_at
     FROM pulse_decision
    WHERE at >= NOW() - INTERVAL 24 HOUR
    GROUP BY policy_version
    ORDER BY failed DESC, decisions DESC`,
);
console.log(`\nlast 24h of decisions — ${recent.length} automation(s) actually judged something:`);
for (const r of recent) {
  const bad = Number(r.failed) > 0 ? "  ← failing" : "";
  console.log(
    `  ${String(r.decisions).padStart(5)} decisions  ${String(r.alerts).padStart(4)} alert ` +
    `${String(r.quiet).padStart(4)} quiet ${String(r.failed).padStart(4)} failed   ${r.automation_key}${bad}`,
  );
}

process.exit(0);
