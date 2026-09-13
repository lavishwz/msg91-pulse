/**
 * sanitizePins — the only pure logic in lib/pulse/pins.ts, and the thing a
 * PUT body from the client actually has to survive before it reaches
 * pulse_pin. getPins/savePins are not tested here since they need Pulse's
 * store; this covers what a malformed or hostile body does on the way in.
 *
 *   node --experimental-strip-types tests/pins.test.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register(new URL("../scripts/event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

import { strict as assert } from "node:assert";
const { sanitizePins, MAX_TYPED_LENGTH, MAX_TYPED_COUNT } = await import("../lib/pulse/pins.ts");

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error("✗", name, "\n  ", e.message); }
};

t("a well-formed body round-trips", () => {
  const out = sanitizePins({ q: { abc: 1, def: 0 }, typed: ["how many signups today"] });
  assert.deepEqual(out, { q: { abc: 1, def: 0 }, typed: ["how many signups today"] });
});

t("garbage in yields the empty shape, not a throw", () => {
  assert.deepEqual(sanitizePins(null), { q: {}, typed: [] });
  assert.deepEqual(sanitizePins(undefined), { q: {}, typed: [] });
  assert.deepEqual(sanitizePins("not an object"), { q: {}, typed: [] });
  assert.deepEqual(sanitizePins(42), { q: {}, typed: [] });
  assert.deepEqual(sanitizePins([]), { q: {}, typed: [] });
});

t("q values are coerced to 0/1, not kept as arbitrary truthy junk", () => {
  const out = sanitizePins({ q: { a: "yes", b: 0, c: null, d: {} } });
  assert.deepEqual(out.q, { a: 1, b: 0, c: 0, d: 1 });
});

t("a non-string q key is dropped rather than stringified", () => {
  const out = sanitizePins({ q: { "": 1, valid: 1 } });
  assert.deepEqual(out.q, { valid: 1 });
});

t("typed entries that are not non-empty strings are dropped", () => {
  const out = sanitizePins({ typed: ["real question", "", "   ", 42, null, {}, "another"] });
  assert.deepEqual(out.typed, ["real question", "another"]);
});

t("a typed entry is cut to MAX_TYPED_LENGTH, not rejected whole", () => {
  const long = "x".repeat(MAX_TYPED_LENGTH + 50);
  const out = sanitizePins({ typed: [long] });
  assert.equal(out.typed[0].length, MAX_TYPED_LENGTH);
});

t("typed is capped at MAX_TYPED_COUNT so one member cannot grow this without bound", () => {
  const many = Array.from({ length: MAX_TYPED_COUNT + 25 }, (_, i) => "q" + i);
  const out = sanitizePins({ typed: many });
  assert.equal(out.typed.length, MAX_TYPED_COUNT);
  assert.equal(out.typed[0], "q0");
});

t("q and typed are independent — one being junk does not blank the other", () => {
  const out = sanitizePins({ q: "garbage", typed: ["fine question"] });
  assert.deepEqual(out, { q: {}, typed: ["fine question"] });
});

t("a __proto__ key from a parsed JSON body does not reach Object.prototype", () => {
  // Unlike an object literal, JSON.parse gives "__proto__" a real own
  // property — this is the shape req.json() actually hands the route.
  const body = JSON.parse('{"q":{"__proto__":{"polluted":1},"ok":1}}');
  const out = sanitizePins(body);
  assert.equal(({}).polluted, undefined);
  assert.deepEqual(out.q, { ok: 1 });
});

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
