/**
 * The rule-worker's reply schema, at the edges a real model actually reaches.
 *
 * One field the schema could not read used to cost the whole judgement: the
 * parse threw, runOne recorded the row as failed, last_error landed on the
 * automation, and the row came back to fail the same way on the next fire.
 * That happened live on the first real cron fire of a rule built for the
 * end-to-end test — "confidence Invalid input: expected number, received
 * Infinity" — because JSON.parse turns an oversized exponent into Infinity
 * and z.number() rejects non-finite values.
 *
 *   node --experimental-strip-types tests/rule-worker-schema.test.mjs
 */

/* agents.ts imports through the app's "@/…" alias, so the same loader the
   event-check diagnostic uses is registered here rather than the schema being
   copied into the test — a copy would pass while the real one failed. */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register(new URL("../scripts/event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { RuleWorkerSchema } = await import("../lib/pulse/agents.ts");

const base = {
  subject_id: "12345",
  should_alert: true,
  headline: "Balance is at zero",
  detail: "",
  reasons: ["balance 0"],
  needs: [],
};

let pass = 0, fail = 0;
const ok = (label, cond) => { if (cond) pass++; else { fail++; console.log(`FAIL ${label}`); } };

/* What a well-behaved reply does — unchanged. */
for (const [given, want, label] of [
  [0, 0, "zero is kept"],
  [0.5, 0.5, "a mid value is kept"],
  [1, 1, "one is kept"],
  [0.95, 0.95, "a real confidence is kept"],
]) {
  const r = RuleWorkerSchema.safeParse({ ...base, confidence: given });
  ok(`${label} — parses`, r.success);
  ok(`${label} — value`, r.success && r.data.confidence === want);
}

/* Out of range is clamped rather than refused: the judgement is still good. */
for (const [given, want, label] of [
  [1.4, 1, "above one clamps to one"],
  [-0.2, 0, "below zero clamps to zero"],
  [100, 1, "a percentage clamps to one"],
]) {
  const r = RuleWorkerSchema.safeParse({ ...base, confidence: given });
  ok(`${label} — parses`, r.success);
  ok(`${label} — value`, r.success && r.data.confidence === want);
}

/* Unreadable becomes null — never a guessed number, and never a thrown parse.
   JSON.parse('{"confidence":1e999}') really is Infinity, which is how this
   reached production in the first place. */
for (const [given, label] of [
  [Infinity, "Infinity"],
  [-Infinity, "-Infinity"],
  [NaN, "NaN"],
  [JSON.parse('{"c":1e999}').c, "1e999 out of real JSON"],
  [null, "null"],
  [undefined, "a missing field"],
  ["not a number", "a non-numeric string"],
]) {
  const r = RuleWorkerSchema.safeParse({ ...base, confidence: given });
  ok(`${label} — parses instead of throwing`, r.success);
  ok(`${label} — becomes null`, r.success && r.data.confidence === null);
}

/* A numeric string is still a number the model meant. */
{
  const r = RuleWorkerSchema.safeParse({ ...base, confidence: "0.8" });
  ok("a numeric string parses", r.success);
  ok("a numeric string keeps its value", r.success && r.data.confidence === 0.8);
}

/* Confidence is the tolerant field; the rest of the reply is not. A missing
   should_alert is a reply that did not answer the question. */
{
  const { should_alert, ...without } = base;
  void should_alert;
  ok("a reply with no should_alert is still refused",
    !RuleWorkerSchema.safeParse({ ...without, confidence: 0.5 }).success);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
