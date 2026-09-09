/**
 * Watermark ordering.
 *
 * The driver returns DATETIME columns as Date objects. String(date) produces
 * "Wed Jun 24 2026 05:21:14 GMT+0530", which sorts alphabetically — so a
 * Wednesday would appear to come after a Monday and the watermark would let
 * rows through it had already seen, or hide ones it had not. The first live
 * run wrote exactly that string.
 */

let pass = 0, fail = 0;
const check = (cond, label) => (cond ? pass++ : (fail++, console.log("FAIL " + label)));

/* The function under test, mirrored — it is three lines and not worth
   exporting a module boundary for. If it changes there, change it here. */
const markOf = (v) => (v instanceof Date ? v.toISOString() : String(v ?? ""));

/* Monday the 22nd and the Friday four days after it. Friday is later in time,
   and "Fri" sorts before "Mon", so this is the pair that shows the bug — not
   every pair does, which is why it survived the first run. */
const monday = new Date("2026-06-22T05:00:00Z");
const friday = new Date("2026-06-26T05:00:00Z");

check(markOf(friday) > markOf(monday), "later date sorts later");
check(!(markOf(monday) > markOf(friday)), "earlier date does not sort later");
check(String(friday) < String(monday), "the naive form gets this pair backwards — the bug");
check(String(friday).startsWith("Fri"), "and that is because it leads with the weekday name");

check(markOf(null) === "", "null becomes empty, which is below every real mark");
check(markOf(undefined) === "", "so does undefined");
check(markOf("2026-06-24T05:00:00.000Z") > markOf("2026-06-22T05:00:00.000Z"), "strings already in ISO still work");
check(markOf(302406) > markOf(302349), "numeric ids of equal width still compare");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
