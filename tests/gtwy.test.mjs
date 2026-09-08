import { extractJson, newThreadId, GtwyError } from "../lib/pulse/gtwy.ts";

const plan = { answerable: true, sql: "SELECT 1", headline: "x" };
const cases = [
  ['{"answerable":true,"sql":"SELECT 1","headline":"x"}', plan, "bare json"],
  ['```json\n{"answerable":true,"sql":"SELECT 1","headline":"x"}\n```', plan, "fenced json"],
  ['```\n{"answerable":true,"sql":"SELECT 1","headline":"x"}\n```', plan, "fence no lang"],
  ['Sure! Here is the plan:\n{"answerable":true,"sql":"SELECT 1","headline":"x"}', plan, "prose prefix"],
  ['{"answerable":true,"sql":"SELECT 1","headline":"x"}\nHope that helps.', plan, "prose suffix"],
  // A brace inside a SQL string literal must not end the object early.
  ['{"answerable":true,"sql":"SELECT a FROM t WHERE s = \'{x}\'","headline":"y"}',
    { answerable: true, sql: "SELECT a FROM t WHERE s = '{x}'", headline: "y" }, "brace in sql literal"],
  // Nested object.
  ['{"answerable":true,"sql":"SELECT 1","headline":"x","meta":{"a":{"b":1}}}',
    { answerable: true, sql: "SELECT 1", headline: "x", meta: { a: { b: 1 } } }, "nested objects"],
];

let pass = 0, fail = 0;
for (const [input, expect, label] of cases) {
  try {
    const got = extractJson(input);
    if (JSON.stringify(got) === JSON.stringify(expect)) pass++;
    else { fail++; console.log(`FAIL ${label}\n  got      ${JSON.stringify(got)}\n  expected ${JSON.stringify(expect)}`); }
  } catch (e) { fail++; console.log(`FAIL ${label} — threw ${e.message}`); }
}

// Failure modes must throw GtwyError, not return junk.
for (const [input, label] of [["no json at all here", "no object"], ['{"a":1', "unclosed"], ['{"a":}', "malformed"]]) {
  try { extractJson(input); fail++; console.log(`FAIL ${label} — should have thrown`); }
  catch (e) { if (e instanceof GtwyError) pass++; else { fail++; console.log(`FAIL ${label} — wrong error type ${e.name}`); } }
}

// Thread ids must be unique, or GTWY would replay one conversation's history
// into an unrelated question.
const ids = new Set(Array.from({ length: 500 }, () => newThreadId()));
if (ids.size === 500) pass++; else { fail++; console.log(`FAIL thread ids collided: ${ids.size}/500`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
