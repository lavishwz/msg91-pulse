/**
 * Point every automation's subject_col and watermark_col at columns its own
 * query actually returns.
 *
 * Both are saved as the name of a column of the automation's find_sql, and
 * nothing ever checked that the query returns it. The planner writes
 * `SELECT u.user_pid AS subject_id …` and then answers "user_pid" — a name
 * that is now nowhere in the result — and neither failure says a word at run
 * time:
 *
 *   subject_col missing — every row in the pass falls back to the same
 *     "portfolio" signal key, and pulse_decision and pulse_signal both dedupe
 *     on it, so a pass that judged twenty-three rows leaves one row behind and
 *     the Log reads "Scored Account ?". Found on a live rule with 101 runs and
 *     exactly one visible decision to show for them.
 *
 *   watermark_col missing — markOf(undefined) is "", which is falsy, so the
 *     mark never advances. The rule re-reads the same rows forever while the
 *     UI says it is watermarked.
 *
 * build.ts now checks this when a rule is built. This is for the rows that
 * were saved before it did.
 *
 *   node --experimental-strip-types scripts/repair-automation-columns.mjs
 *   node --experimental-strip-types scripts/repair-automation-columns.mjs --apply
 *
 * Report-only without --apply. Nothing is invented: a subject_col is replaced
 * only by a column the query really returns, and cleared when there is no
 * plausible id among them — which puts the rule on the no-watermark rotation
 * path rather than a silently broken one.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const APPLY = process.argv.includes("--apply");
const { read, write } = await import("../lib/store.ts");
const { columnsOf } = await import("../lib/db.ts");

/* The same two helpers build.ts uses, so a repaired row and a freshly built
   one land on the same answer. */
const columnNamed = (wanted, columns) =>
  !wanted ? null : (columns.find((c) => c === wanted)
    ?? columns.find((c) => c.toLowerCase() === wanted.toLowerCase())
    ?? null);

const idColumn = (columns) =>
  columns.find((c) => /^(subject_id|user_pid)$/i.test(c))
  ?? columns.find((c) => /(^|_)pid$/i.test(c))
  ?? columns.find((c) => /(^|_)id$/i.test(c))
  ?? null;

const rows = await read(
  `SELECT automation_key, subject_col, watermark_col, find_sql, live, run_count
     FROM pulse_automation
    WHERE trigger_kind = 'schedule' AND find_sql IS NOT NULL AND state <> 'retired'
    ORDER BY run_count DESC`,
);

console.log(`${rows.length} scheduled automation(s) with a query.\n`);

let broken = 0;
for (const r of rows) {
  let columns;
  try {
    columns = await columnsOf(r.find_sql);
  } catch (err) {
    console.log(`?  ${r.automation_key}\n   its query will not run: ${err.message.slice(0, 120)}`);
    continue;
  }

  const subject = columnNamed(r.subject_col, columns) ?? idColumn(columns);
  const watermark = columnNamed(r.watermark_col, columns);
  const subjectWrong = (r.subject_col ?? null) !== subject;
  const watermarkWrong = (r.watermark_col ?? null) !== watermark;
  if (!subjectWrong && !watermarkWrong) continue;

  broken++;
  console.log(`✗  ${r.automation_key}  (${r.live ? "live" : "off"}, ${r.run_count} runs)`);
  console.log(`   returns: ${columns.join(", ").slice(0, 150)}`);
  if (subjectWrong) {
    console.log(`   subject_col   ${r.subject_col ?? "none"} → ${subject ?? "none"}` +
      (r.subject_col && !subject ? "   (its query returns nothing that identifies a row)" : ""));
  }
  if (watermarkWrong) {
    console.log(`   watermark_col ${r.watermark_col ?? "none"} → ${watermark ?? "none"}`);
  }

  if (APPLY) {
    await write(
      `UPDATE pulse_automation SET subject_col = ?, watermark_col = ? WHERE automation_key = ?`,
      [subject, watermark, r.automation_key],
    );
    console.log(`   updated.`);
  }
}

console.log(`\n${broken} of ${rows.length} name a column their query does not return.`);
if (broken && !APPLY) console.log("re-run with --apply to fix them.");
process.exit(0);
