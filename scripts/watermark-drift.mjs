/**
 * Does a rule with no watermark column reach all of its rows, or the same few?
 *
 * A scheduled automation whose planner found no watermark column has nothing
 * to filter on, so every pass takes the same ordered result from the top. The
 * limit that bites is not max_rows — the guard caps the query's own LIMIT at
 * that, so the fetch never exceeds it — it is PASS_BUDGET_MS: the worker costs
 * 15-25 seconds a row, so a pass judges roughly five of whatever it fetched.
 * Without rotation the other forty-five are fetched and thrown away, in every
 * pass, forever.
 *
 * c38ecc4 fixes that by remembering how far the last pass reached. This script
 * is how you tell, from the outside, whether the fix is in force on whatever
 * deployment is actually running: it reads the subjects each pass judged, out
 * of pulse_decision, and reports whether consecutive passes judged the same
 * ones or moved on.
 *
 *   node --experimental-strip-types scripts/watermark-drift.mjs <automation_key>
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { read } = await import("../lib/store.ts");

const key = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!key) { console.error("usage: watermark-drift.mjs <automation_key>"); process.exit(2); }

const [a] = await read(
  `SELECT automation_key, watermark_col, subject_col, max_rows, run_count, live
     FROM pulse_automation WHERE automation_key = ?`, [key],
);
if (!a) { console.error(`no automation "${key}"`); process.exit(2); }

console.log(`${a.automation_key}`);
console.log(`  watermark_col=${a.watermark_col ?? "none"}  subject_col=${a.subject_col ?? "none"}  max_rows=${a.max_rows}  runs=${a.run_count}`);
if (a.watermark_col) {
  console.log("  This rule has a watermark, so it is not the case this script is about.");
}

/* Each pass's judged subjects, newest pass first. signal_key is
   auto:<key>:<subject>, which is the only per-row identity written down. */
const rows = await read(
  `SELECT signal_key, verdict, at FROM pulse_decision
    WHERE policy_version = ? ORDER BY at DESC, id DESC LIMIT 500`, [key],
);
if (!rows.length) { console.log("  no decisions yet — nothing to compare."); process.exit(0); }

/* Group by gaps, not by clock minute.
   A pass is not instantaneous: the worker costs 15-25 seconds a row, so one
   pass judging twenty rows spans five or six minutes and bucketing by the
   minute splits it into six "passes" that each look entirely new. What
   actually separates two passes is the wait between them — the shortest
   cadence any of these rules runs on is fifteen minutes, and the longest a
   single pass can last is PASS_BUDGET_MS — so a gap of five minutes between
   consecutive decisions is a boundary and anything closer is the same pass. */
const PASS_GAP_MS = 5 * 60_000;
const ascending = [...rows].reverse();
const ordered = [];
let at = null;
for (const r of ascending) {
  const t = new Date(r.at).getTime();
  if (!at || t - at.last > PASS_GAP_MS) {
    at = { started: new Date(r.at).toISOString().slice(0, 19).replace("T", " "), last: t, subjects: new Set() };
    ordered.push([at.started, at.subjects]);
  }
  at.last = t;
  at.subjects.add(String(r.signal_key).split(":").slice(2).join(":"));
}
const passes = new Map(ordered);
console.log(`\n  ${ordered.length} pass(es) with decisions:\n`);
let prev = null;
for (const [when, subjects] of ordered) {
  const list = [...subjects];
  let note = "";
  if (prev) {
    const repeated = list.filter((s) => prev.has(s)).length;
    note = repeated === list.length
      ? "  ← judged exactly the same rows as the pass before"
      : `  ← ${list.length - repeated} of ${list.length} are new`;
  }
  console.log(`  ${when}  ${String(list.length).padStart(3)} rows judged${note}`);
  console.log(`               ${list.slice(0, 8).join(", ")}${list.length > 8 ? " …" : ""}`);
  prev = subjects;
}

const all = new Set();
for (const [, s] of passes) for (const x of s) all.add(x);
console.log(`\n  ${all.size} distinct rows reached across ${ordered.length} pass(es).`);
if (ordered.length > 1 && all.size <= Math.max(...[...passes.values()].map((s) => s.size))) {
  console.log("  Every pass judged the same set — the rule is not making progress through its result.");
}
process.exit(0);
