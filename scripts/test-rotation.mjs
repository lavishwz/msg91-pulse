/**
 * Does a rule with no watermark column eventually see all of its rows?
 *
 * runOne takes its judge as a parameter, so this drives the real runner
 * against the real store with a stub judge — no agent calls, no spend — and
 * records which rows each pass actually looked at. That is the only way to
 * observe the bug this checks for: before the fix, every pass judged the same
 * first maxRows rows and the rest were never seen in any pass.
 */
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { saveAutomation, getAutomation, deleteAutomationCompletely } = await import("../lib/pulse/autopilot/automations.ts");
const { runOne } = await import("../lib/pulse/autopilot/automation-runner.ts");
const { write } = await import("../lib/store.ts");

const KEY = "rotation-probe";
const MAX = 10;      // the automation may look at all ten
const PER_ROW_MS = 2000; // …but the budget below only lets ~3 through a pass

/* Instant, deterministic, never alerts — the point is which rows it is given. */
const seen = [];
const stubJudge = async (_english, _task, row) => {
  /* Costs time, like the real worker does — the budget is what limits a pass,
     not the row cap, so a zero-cost judge would not reproduce the shape. */
  await new Promise((r) => setTimeout(r, PER_ROW_MS));
  seen.push(String(row.subject_id));
  return {
    data: { should_alert: false, headline: null, detail: null, reasons: [], confidence: 0.5, subject_id: String(row.subject_id) },
    agentId: "stub", model: "stub", usage: {},
  };
};

await deleteAutomationCompletely(KEY).catch(() => {});
await write("DELETE FROM pulse_watermark WHERE stream LIKE ?", ["automation:" + KEY + "%"]);

const saved = await saveAutomation({
  key: KEY, motion: "inbound", scope: "company", ownerEmail: "rotation@msg91.com",
  english: "Rotation probe.", triggerKind: "schedule", mode: "cron",
  /* Ten stable rows, no watermark column — the exact shape that used to stall. */
  findSql: "SELECT user_pid AS subject_id FROM ms_user ORDER BY user_pid ASC LIMIT 10",
  subjectCol: "subject_id", watermarkCol: null,
  agentTask: "probe", maxRows: MAX, capability: "ready", live: true,
});
if (!saved.ok) { console.error("save failed:", saved.error); process.exit(1); }

const row = await getAutomation(KEY);
const passes = [];
for (let i = 0; i < 5; i++) {
  seen.length = 0;
  /* Generous enough to cover runOne's own setup (the query, the guard and the
     breaker check are all remote round trips) and then about three rows. */
  const run = await runOne(row, Date.now() + 8_000, stubJudge);
  passes.push([...seen]);
  console.log(`pass ${i + 1}: judged ${run.judged} -> rows [${seen.join(", ")}]${run.skipped ? "  (" + run.skipped + ")" : ""}`);
}

const all = new Set(passes.flat());
console.log(`\ndistinct rows reached over 5 passes: ${all.size} of 10`);
const first = JSON.stringify(passes[0]);
const stuck = passes.every((p) => JSON.stringify(p) === first);
console.log(stuck ? "STUCK — every pass judged the same rows" : "rotating — each pass moved on");

await deleteAutomationCompletely(KEY);
await write("DELETE FROM pulse_watermark WHERE stream LIKE ?", ["automation:" + KEY + "%"]);

const ok = !stuck && all.size >= 9;
console.log(ok ? "\nPASS" : "\nFAIL");
process.exit(ok ? 0 : 1);
