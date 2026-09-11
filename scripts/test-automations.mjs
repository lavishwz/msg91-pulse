/**
 * Create automations of every kind, run them for real, and report what broke.
 *
 * Goes through buildAutomation() — the exact path the Rules page takes — not a
 * reimplementation of it, so a failure here is a failure a person would hit.
 * Each case is planned by the real planner agent, guarded by the real SQL
 * guard, saved to the real store, and then actually run: an event automation
 * through emitEvent, a scheduled one through runOne.
 *
 *   node --experimental-strip-types scripts/test-automations.mjs            # event cases only (no cron-job.org)
 *   node --experimental-strip-types scripts/test-automations.mjs --schedule # also build scheduled ones
 *   node --experimental-strip-types scripts/test-automations.mjs --keep     # leave what it built behind
 *   node --experimental-strip-types scripts/test-automations.mjs --only=x   # one case by key fragment
 *
 * Without --keep every automation it created is deleted again, including any
 * cron-job.org job provisioned for it, so a run leaves the account as it found
 * it. With --keep the working ones stay live.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { EVENTS } = await import("../lib/pulse/autopilot/events.ts");
const { buildAutomation } = await import("../lib/pulse/autopilot/build.ts");
const { getAutomation, deleteAutomationCompletely, automationsForEvent } =
  await import("../lib/pulse/autopilot/automations.ts");
const { emitEvent, runOne } = await import("../lib/pulse/autopilot/automation-runner.ts");
const { read } = await import("../lib/store.ts");

const ARGS = process.argv.slice(2);
const WITH_SCHEDULE = ARGS.includes("--schedule");
const KEEP = ARGS.includes("--keep");
const ONLY = (ARGS.find((a) => a.startsWith("--only=")) || "").slice(7);
const OWNER = "automation-test@msg91.com";
const OUT = process.env.TEST_AUTOMATION_OUT || "";

/** One English rule per event in the catalogue, plus a few scheduled ones. */
const EVENT_CASES = [
  ["account.tag_added",        "When somebody tags an account at-risk, tell me so I can look at it before it churns."],
  ["account.tag_removed",      "When an at-risk tag comes off an account, note that it recovered so the team can see what worked."],
  ["account.reassigned",       "When an account changes owner, flag it if the new owner already has a large book."],
  ["member.invited",           "When somebody is invited to Pulse, flag it if they were invited as an admin rather than a member."],
  ["member.removed",           "When somebody is removed from Pulse, flag it so their accounts can be reassigned."],
  ["connection.connected",     "When somebody connects their Gmail, confirm it so we know silence detection is on for their accounts."],
  ["connection.disconnected",  "When somebody disconnects Gmail or Calendar, flag it — their accounts lose silence detection."],
];

const SCHEDULE_CASES = [
  "Every hour, find companies that signed up in the last day and have still sent nothing, and tell me which ones look worth a call.",
  "Once a day, find accounts whose balance has dropped close to zero, so somebody can talk to them before they stop sending.",
];

const log = [];
function say(...a) { const s = a.join(" "); console.log(s); log.push(s); }

const results = [];
const created = [];

/* ── event automations ──────────────────────────────────────────────────── */
say("\n═══ EVENT AUTOMATIONS ═══\n");

for (const [eventName, english] of EVENT_CASES) {
  if (ONLY && !eventName.includes(ONLY)) continue;
  const r = { kind: "event", eventName, english, step: null, key: null, ok: false, notes: [] };
  say(`── ${eventName}`);
  say(`   rule: ${english}`);

  const t0 = Date.now();
  let built;
  try {
    built = await buildAutomation(english, "inbound", OWNER, "company", eventName);
  } catch (err) {
    r.step = "build-threw";
    r.notes.push(`buildAutomation THREW (it is documented never to): ${err.message}`);
    say(`   ✗ BUILD THREW: ${err.message}`);
    results.push(r);
    continue;
  }
  say(`   build: ${built.ok ? "ok" : `FAILED at ${built.step}`} (${Date.now() - t0}ms)`);

  if (!built.ok) {
    r.step = built.step;
    r.notes.push(`build failed at ${built.step}: ${built.error}`);
    say(`   ✗ ${built.error}`);
    results.push(r);
    continue;
  }
  r.key = built.key;
  created.push(built.key);

  /* What actually landed in the table. */
  const row = await getAutomation(built.key);
  if (!row) {
    r.notes.push("build reported ok but no row exists");
    say("   ✗ no row in pulse_automation");
    results.push(r);
    continue;
  }
  say(`   stored: trigger_kind=${row.triggerKind} mode=${row.mode} when_event=${row.whenEvent} live=${row.live} capability=${row.capability}`);

  if (row.triggerKind !== "event") r.notes.push(`trigger_kind is "${row.triggerKind}", expected "event"`);
  if (row.mode !== "event") r.notes.push(`mode is "${row.mode}", expected "event"`);
  if (row.whenEvent !== eventName) r.notes.push(`when_event is "${row.whenEvent}", expected "${eventName}"`);
  if (!row.live) r.notes.push("saved but not live, so nothing will ever run it");
  if (row.findSql) r.notes.push("an event automation was given a find_sql, which it must not have");
  if (!row.agentTask) r.notes.push("no agent_task, so the worker has no instruction to judge with");

  /* Is it actually listening? */
  const listening = await automationsForEvent(eventName);
  const isListening = listening.some((a) => a.key === built.key);
  say(`   listening: ${isListening ? "yes" : "NO"}`);
  if (!isListening) r.notes.push("automationsForEvent does not return it, so emitEvent will never reach it");

  /* Fire the real event with the catalogue's own example payload. */
  const t1 = Date.now();
  try {
    await emitEvent(eventName, EVENTS[eventName].example);
  } catch (err) {
    r.notes.push(`emitEvent THREW (it must not): ${err.message}`);
  }
  const after = await getAutomation(built.key);
  const ms = Date.now() - t1;
  say(`   emitEvent: ${ms}ms -> run_count=${after.runCount} alert_count=${after.alertCount}${after.lastError ? ` ERROR=${after.lastError}` : ""}`);

  if (after.runCount < 1) r.notes.push("emitEvent did not run it — run_count never moved");
  if (after.lastError) r.notes.push(`ran with an error: ${after.lastError}`);

  /* Every branch is supposed to write a decision row, alert or no alert. */
  const decisions = await read(
    "SELECT verdict, action_taken, error_code FROM pulse_decision WHERE policy_version = ? ORDER BY id DESC LIMIT 3",
    [built.key],
  );
  say(`   decisions: ${decisions.length} (${decisions.map((d) => d.verdict).join(", ") || "none"})`);
  if (!decisions.length) r.notes.push("no pulse_decision row was written, so this run is invisible in the Log");

  r.ok = r.notes.length === 0;
  say(`   ${r.ok ? "✓ PASS" : "✗ " + r.notes.length + " problem(s)"}\n`);
  results.push(r);
}

/* ── scheduled automations ──────────────────────────────────────────────── */
if (WITH_SCHEDULE) {
  say("\n═══ SCHEDULED AUTOMATIONS ═══\n");
  for (const english of SCHEDULE_CASES) {
    if (ONLY) break;
    const r = { kind: "schedule", english, step: null, key: null, ok: false, notes: [] };
    say(`── ${english.slice(0, 70)}…`);
    const t0 = Date.now();
    let built;
    try {
      built = await buildAutomation(english, "inbound", OWNER, "company");
    } catch (err) {
      r.step = "build-threw";
      r.notes.push(`buildAutomation THREW: ${err.message}`);
      say(`   ✗ BUILD THREW: ${err.message}`);
      results.push(r);
      continue;
    }
    say(`   build: ${built.ok ? "ok" : `FAILED at ${built.step}`} (${Date.now() - t0}ms)`);
    if (!built.ok) {
      r.step = built.step;
      r.notes.push(`build failed at ${built.step}: ${built.error}`);
      say(`   ✗ ${built.error}`);
      results.push(r);
      continue;
    }
    r.key = built.key;
    created.push(built.key);
    say(`   cron job: ${built.cronJobId || "none"}  schedule: ${built.cronSchedule}`);
    say(`   sql: ${(built.findSql || "").replace(/\s+/g, " ").slice(0, 120)}…`);

    const row = await getAutomation(built.key);
    if (row.triggerKind !== "schedule") r.notes.push(`trigger_kind is "${row.triggerKind}", expected "schedule"`);
    if (row.mode !== "cron") r.notes.push(`mode is "${row.mode}", expected "cron"`);
    if (!row.findSql) r.notes.push("a scheduled automation with no find_sql cannot find anything");
    if (!row.live) r.notes.push("saved but not live");
    if (!built.cronJobId) r.notes.push("no cron-job.org job was provisioned, so nothing will ever call its webhook");

    const t1 = Date.now();
    let run;
    try {
      run = await runOne(row);
    } catch (err) {
      r.notes.push(`runOne THREW (it is documented never to): ${err.message}`);
      run = null;
    }
    if (run) {
      say(`   runOne: ${Date.now() - t1}ms rows=${run.rows} judged=${run.judged} alerts=${run.alerts} skipped=${run.skipped || "-"} error=${run.error || "-"}`);
      if (run.error) r.notes.push(`run error: ${run.error}`);
      if (run.skipped) r.notes.push(`run skipped: ${run.skipped}`);
    }
    r.ok = r.notes.length === 0;
    say(`   ${r.ok ? "✓ PASS" : "✗ " + r.notes.length + " problem(s)"}\n`);
    results.push(r);
  }
}

/* ── report ─────────────────────────────────────────────────────────────── */
say("\n═══ RESULT ═══\n");
const pass = results.filter((r) => r.ok).length;
for (const r of results) {
  const label = r.eventName || r.english.slice(0, 48) + "…";
  say(`${r.ok ? "PASS" : "FAIL"}  ${r.kind.padEnd(9)} ${label}`);
  for (const n of r.notes) say(`        · ${n}`);
}
say(`\n${pass} of ${results.length} passed.`);

if (!KEEP) {
  say("\ncleaning up…");
  for (const key of created) {
    const gone = await deleteAutomationCompletely(key);
    say(`  ${gone ? "deleted" : "MISSING"}  ${key}`);
  }
} else {
  say(`\n--keep: ${created.length} automation(s) left live.`);
}

if (OUT) {
  mkdirSync(OUT.replace(/\/[^/]*$/, ""), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ results, created, log }, null, 1));
  say(`\nwrote ${OUT}`);
}

process.exit(results.every((r) => r.ok) ? 0 : 1);
