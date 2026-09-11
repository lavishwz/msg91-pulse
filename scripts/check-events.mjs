/**
 * Is the event-trigger path actually working?
 *
 * Answers the question the UI cannot: an event automation that never fires
 * looks exactly like one that fires and decides to stay quiet, because both
 * show zero alerts. This reports the state of every link in the chain.
 *
 *   node scripts/check-events.mjs          # read-only: what is listening, what has run
 *   node scripts/check-events.mjs --live   # additionally fire a real event end to end
 *
 * --live saves a temporary automation, emits a real event at it, waits for the
 * GTWY judging call (15-25s), reports what came back, and deletes it again. It
 * spends one agent call and writes one decision row. Nothing else is touched.
 */

import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

/* The app's modules import each other as "@/lib/…" and without extensions,
   which Next resolves and bare node does not. */
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { EVENTS } = await import("../lib/pulse/autopilot/events.ts");
const { read } = await import("../lib/store.ts");
const { automationsForEvent, saveAutomation, getAutomation, deleteAutomationCompletely } =
  await import("../lib/pulse/autopilot/automations.ts");
const { emitEvent } = await import("../lib/pulse/autopilot/automation-runner.ts");

const LIVE = process.argv.includes("--live");

console.log("\n── the event catalogue, and what listens to each ──\n");
let listeningTotal = 0;
for (const name of Object.keys(EVENTS)) {
  const listeners = await automationsForEvent(name);
  listeningTotal += listeners.length;
  console.log(`  ${listeners.length ? "●" : "○"} ${name.padEnd(28)} ${listeners.length} live listener(s)`);
  for (const a of listeners) {
    console.log(`       ${a.key}  runs=${a.runCount} alerts=${a.alertCount} last=${a.lastRunAt ?? "never"}${a.lastError ? `  ERROR: ${a.lastError}` : ""}`);
  }
}

console.log("\n── event automations that exist but cannot fire ──\n");
const dormant = await read(
  `SELECT automation_key, when_event, state, live, capability, blocked_reason
     FROM pulse_automation
    WHERE trigger_kind = 'event'
      AND NOT (live = 1 AND state = 'active' AND capability = 'ready')`,
);
if (!dormant.length) console.log("  (none)");
for (const r of dormant) {
  const why = r.capability !== "ready" ? `blocked: ${r.blocked_reason ?? "no reason recorded"}`
    : r.state !== "active" ? `state is ${r.state}`
    : "not live";
  const known = Object.hasOwn(EVENTS, String(r.when_event));
  console.log(`  ${r.automation_key}`);
  console.log(`       on "${r.when_event}"${known ? "" : "  ← NOT in the event catalogue, so nothing will ever emit it"}`);
  console.log(`       ${why}`);
}

console.log(`\n${listeningTotal} automation(s) are live on an event right now.`);

if (!LIVE) {
  console.log("\nRun with --live to fire a real event end to end (spends one agent call).\n");
  process.exit(0);
}

console.log("\n── live end-to-end test ──\n");
const KEY = "diagnostic-event-check";
const saved = await saveAutomation({
  key: KEY, motion: "inbound", scope: "company", ownerEmail: "diagnostic@msg91.com",
  english: "Diagnostic: when a tag is added, report whether it needs attention.",
  triggerKind: "event", whenEvent: "account.tag_added", mode: "event",
  agentTask: "Say whether this tag means a person should look at the account.",
  capability: "ready", live: true,
});
console.log("  1. save          ", saved.ok ? "ok" : `FAILED: ${saved.error}`);
if (!saved.ok) process.exit(1);

const row = await getAutomation(KEY);
console.log("  2. stored as     ", `trigger_kind=${row.triggerKind} when_event=${row.whenEvent} live=${row.live} capability=${row.capability}`);
console.log("  3. listening     ", (await automationsForEvent("account.tag_added")).some((a) => a.key === KEY) ? "yes" : "NO — automationsForEvent did not return it");

const before = Date.now();
await emitEvent("account.tag_added", {
  accountId: "diagnostic", accountName: "Diagnostic Co", tag: "at-risk", addedBy: "diagnostic@msg91.com",
});
const after = await getAutomation(KEY);
console.log("  4. emitEvent     ", `${Date.now() - before}ms`);
console.log("  5. result        ", `run_count=${after.runCount} alert_count=${after.alertCount}${after.lastError ? `  ERROR: ${after.lastError}` : ""}`);

await deleteAutomationCompletely(KEY);
console.log("  6. cleaned up     ok");

const worked = after.runCount > 0 && !after.lastError;
console.log(`\n${worked ? "Event triggers are working." : "Event triggers are NOT working — see the error above."}\n`);
process.exit(worked ? 0 : 1);
