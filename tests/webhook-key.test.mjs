/**
 * The per-automation webhook key.
 *
 * lib/pulse/autopilot/webhookKey.ts derives the value that authenticates the
 * public URL cron-job.org calls to run one automation. The path is deliberately
 * let through middleware.ts unauthenticated (the layer cannot know which
 * automation is being addressed until the path is parsed), so this key is the
 * only thing standing between a stranger and running a rule. It replaced
 * putting the shared AUTOPILOT_TICK_SECRET — which also opens /tick, /run,
 * /monthly, /store/migrate and the nightly digest — in every job URL in a third
 * party's dashboard.
 *
 * Two things must hold, and everything below is one of them:
 *
 *   1. the derivation must not run backwards to AUTOPILOT_TICK_SECRET, and
 *   2. one automation's key must not open another.
 *
 * A key that is accidentally constant, accidentally derived from an empty
 * secret, or accidentally compared loosely breaks one of those without
 * breaking anything a person would notice, because the happy path keeps
 * working either way. That is what these cases are for.
 */

import { createHmac } from "node:crypto";
import { webhookKeyFor, webhookKeyMatches } from "../lib/pulse/autopilot/webhookKey.ts";

let pass = 0, fail = 0;
const check = (cond, label) => (cond ? pass++ : (fail++, console.log("FAIL " + label)));

/* Every case below rewrites process.env.AUTOPILOT_TICK_SECRET, and the module
   reads it fresh on every call (no module-level capture), which is exactly why
   that is testable here. Saved once, restored at the end and after each case
   that moves it, so a failure part-way through cannot leave the rest of the
   file running against the wrong secret and reporting nonsense. */
const ORIGINAL = process.env.AUTOPILOT_TICK_SECRET;
const setSecret = (v) => {
  if (v === undefined) delete process.env.AUTOPILOT_TICK_SECRET;
  else process.env.AUTOPILOT_TICK_SECRET = v;
};
const restore = () => setSecret(ORIGINAL);

const SECRET_A = "test-tick-secret-alpha-0123456789";
const SECRET_B = "test-tick-secret-bravo-9876543210";

/* Names shaped like the real ones build.ts produces, plus near-misses that
   differ by a single character. Near-misses matter more than obviously
   different names: a derivation that ignored its input, or hashed only a
   prefix, or lower-cased it, would still separate "invoices" from "tickets"
   and would only ever be caught by a pair one character apart. */
const NAMES = [
  "stalled-invoices",
  "stalled-invoice", // one character shorter
  "stalled-invoicez", // last character changed
  "stalled_invoices", // separator changed
  "Stalled-invoices", // case changed
  "stalled-invoices ", // trailing space
  " stalled-invoices", // leading space
  "high-value-refunds",
  "",
];

// ── 1. Deterministic ──────────────────────────────────────────────────────
//
// The key is derived, not stored: build.ts computes it when it registers the
// cron-job.org job, and the route recomputes it months later to check the URL
// that job still calls. If the two computations could ever disagree, every
// automation would quietly stop firing and the 404 would blame the automation
// rather than the key.
setSecret(SECRET_A);

const first = webhookKeyFor("stalled-invoices");
check(
  Array.from({ length: 200 }, () => webhookKeyFor("stalled-invoices")).every((k) => k === first),
  "same automation key derives the same webhook key across 200 calls",
);
check(
  NAMES.every((n) => webhookKeyFor(n) === webhookKeyFor(n)),
  "determinism holds for every name shape, not just one",
);

// ── 2. Distinct, including one-character near-misses ──────────────────────
//
// This is the "one automation's key must not open another" half. A collision
// here is not a hash weakness in practice — it would be a bug in how the input
// is assembled, e.g. the automation key being dropped or truncated.
const derived = new Map(NAMES.map((n) => [n, webhookKeyFor(n)]));
check(
  new Set(derived.values()).size === NAMES.length,
  "every distinct automation name derives a distinct key, near-misses included",
);
check(
  webhookKeyFor("stalled-invoices") !== webhookKeyFor("stalled-invoicez"),
  "a name differing only in its last character derives a different key",
);
check(
  webhookKeyFor("stalled-invoices") !== webhookKeyFor("Stalled-invoices"),
  "the derivation is case-sensitive in the automation name",
);
check(
  webhookKeyFor("stalled-invoices") !== webhookKeyFor("stalled-invoices "),
  "a trailing space in the name is not trimmed away into the same key",
);

/* A wider sweep, because eight names would not notice a derivation that had,
   say, collapsed to the first byte of the digest. 2000 names, no collisions. */
const sweep = new Set(Array.from({ length: 2000 }, (_, i) => webhookKeyFor(`automation-${i}`)));
check(sweep.size === 2000, "2000 distinct names derive 2000 distinct keys");

// ── 3. Rotating the shared secret rotates every derived key ───────────────
//
// The stated reason this design was adopted was that rotating
// AUTOPILOT_TICK_SECRET used to mean rewriting every cron job at once. It still
// means that — what changed is that a leaked *webhook* key is not the shared
// secret. So every derived key must move when the secret moves; if any name
// derived the same value under both secrets, that name's key would survive a
// rotation meant to revoke it.
const underA = NAMES.map((n) => webhookKeyFor(n));
setSecret(SECRET_B);
const underB = NAMES.map((n) => webhookKeyFor(n));
check(
  underA.every((k, i) => k !== underB[i]),
  "changing AUTOPILOT_TICK_SECRET changes the key for every automation",
);
check(
  new Set([...underA, ...underB]).size === NAMES.length * 2,
  "and no key under the old secret equals any key under the new one",
);

/* A secret one character apart is the near-miss case for the secret itself:
   a derivation that used only part of the secret, or a fixed-length prefix of
   it, would pass the test above and fail this one. */
setSecret(SECRET_A + "x");
check(
  webhookKeyFor("stalled-invoices") !== underA[0],
  "a secret differing by one appended character derives a different key",
);
restore();

// ── 4. An unset secret must throw, never derive from "" ───────────────────
//
// The dangerous failure is not the throw, it is the alternative: HMAC with an
// empty key is a perfectly valid HMAC. Were the guard missing, a deploy that
// forgot the env var would produce keys anyone could recompute from this
// public file alone, and every webhook URL in the product would be openable by
// a stranger with no sign that anything was wrong.
const throws = (fn) => {
  try { fn(); return false; } catch { return true; }
};
setSecret(undefined);
check(throws(() => webhookKeyFor("stalled-invoices")), "webhookKeyFor throws when the secret is unset");
setSecret("");
check(throws(() => webhookKeyFor("stalled-invoices")), "webhookKeyFor throws when the secret is empty");
setSecret("   ");
check(throws(() => webhookKeyFor("stalled-invoices")), "webhookKeyFor throws when the secret is only whitespace");

/* And the value that would have been produced had the guard not been there is
   not the value produced with a real secret — i.e. nothing silently falls back
   to it. Computed here independently rather than taken from the module. */
setSecret(SECRET_A);
const emptySecretKey = createHmac("sha256", "").update("automation-webhook:stalled-invoices").digest("hex").slice(0, 32);
check(
  webhookKeyFor("stalled-invoices") !== emptySecretKey,
  "a real secret does not derive the same key an empty secret would have",
);
restore();

// ── 5. webhookKeyMatches ──────────────────────────────────────────────────
setSecret(SECRET_A);
const good = webhookKeyFor("stalled-invoices");

check(webhookKeyMatches("stalled-invoices", good), "the correct key matches");

/* THE case that actually exercises timingSafeEqual.
 *
 * webhookKeyMatches returns early on a length mismatch, so a wrong key of a
 * *different* length never reaches the constant-time comparison at all — it
 * would pass even if timingSafeEqual had been replaced with `===`. Only a
 * wrong key of the same length proves the comparison itself rejects. Both
 * variants below are 32 hex characters, same as the real key: one differs in
 * its first character, one only in its last, because a comparison that stopped
 * early on either end would be caught by exactly one of them. */
const flip = (c) => (c === "0" ? "1" : "0");
const wrongFirst = flip(good[0]) + good.slice(1);
const wrongLast = good.slice(0, -1) + flip(good.at(-1));
check(wrongFirst.length === good.length && wrongLast.length === good.length, "the same-length wrong keys really are the same length");
check(!webhookKeyMatches("stalled-invoices", wrongFirst), "a same-length wrong key differing in its first character is refused");
check(!webhookKeyMatches("stalled-invoices", wrongLast), "a same-length wrong key differing in its last character is refused");
check(!webhookKeyMatches("stalled-invoices", "0".repeat(good.length)), "a same-length string of zeroes is refused");

/* The length-mismatch case, which is why the guard in front of timingSafeEqual
 * exists at all: node's timingSafeEqual *throws* on buffers of unequal length.
 * Without the guard, a caller sending ?k=x would not be refused — the route
 * handler would throw, and a thrown handler is a 500, which is both a
 * different answer from the 404 everything else gets (so it tells a prober
 * their key was the wrong *length*, and by elimination what the right length
 * is) and an error page where a refusal was intended. So each of these must
 * come back false, and none of them may throw. */
const noThrowFalse = (presented, label) => {
  let result;
  try { result = webhookKeyMatches("stalled-invoices", presented); }
  catch (e) { fail++; console.log(`FAIL ${label} — threw ${e.message}`); return; }
  check(result === false, label);
};
noThrowFalse(good.slice(0, -1), "a key one character too short is refused without throwing");
noThrowFalse(good + "0", "a key one character too long is refused without throwing");
noThrowFalse("x", "a one-character key is refused without throwing");
noThrowFalse(good + good, "a doubled key is refused without throwing");
noThrowFalse("é".repeat(good.length), "a same-character-count but longer-in-bytes key is refused without throwing");

/* The falsy inputs. `?k=` absent entirely gives null from searchParams, and
   `?k=` present but empty gives "" — the route passes both straight through,
   so both have to be a plain false rather than a crash or, worse, a match
   against something equally empty. */
noThrowFalse(null, "a null key is refused without throwing");
noThrowFalse(undefined, "an undefined key is refused without throwing");
noThrowFalse("", "an empty key is refused without throwing");

/* One automation's key must not open another — the whole point of the change.
   Checked against a near-miss name too, since those are the pairs most likely
   to collide if the derivation ever loses part of its input. */
check(
  !webhookKeyMatches("high-value-refunds", good),
  "the key for one automation does not open a different automation",
);
check(
  !webhookKeyMatches("stalled-invoicez", good),
  "nor does it open an automation whose name differs by one character",
);
check(
  !webhookKeyMatches("stalled-invoices", webhookKeyFor("high-value-refunds")),
  "and the reverse direction is refused too",
);

/* Case variants of a correct key. The digest is lower-case hex, and the
   comparison is over raw bytes, so an upper-cased copy — the kind of thing a
   URL that has been through a case-normalising proxy or a hand-retyped support
   ticket produces — must be refused rather than quietly accepted. It is also a
   same-length wrong key, so it goes through timingSafeEqual. */
check(!webhookKeyMatches("stalled-invoices", good.toUpperCase()), "an upper-cased correct key is refused");
check(
  good !== good.toUpperCase(),
  "and that is a real test — the key contains at least one hex letter to upper-case",
);
/* A correct key with whitespace around it, which is what a copied-and-pasted
   URL or a trailing newline in a cron-job.org field produces. Nothing trims it
   — and since the padding makes it longer, these go through the length guard
   rather than the comparison, so they must not throw either. */
noThrowFalse(` ${good}`, "a leading space on a correct key is refused without throwing");
noThrowFalse(`${good} `, "a trailing space on a correct key is refused without throwing");

// ── 6. Shape: hex, and exactly the expected length ────────────────────────
//
// The length is load-bearing twice over. It is what a brute-force attempt has
// to search, and it is what the length guard above compares against, so a
// change to it silently changes both. 32 hex characters is 128 bits, taken
// from the front of a SHA-256 digest.
for (const name of NAMES) {
  const k = webhookKeyFor(name);
  check(k.length === 32, `key for ${JSON.stringify(name)} is 32 characters`);
  check(/^[0-9a-f]{32}$/.test(k), `key for ${JSON.stringify(name)} is lower-case hex`);
}
check(
  !webhookKeyFor("stalled-invoices").includes(SECRET_A),
  "the derived key does not contain the shared secret",
);
check(
  webhookKeyFor("stalled-invoices") !== SECRET_A,
  "and is not the shared secret",
);

/* The label is real domain separation, not decoration: the derived key is the
   HMAC of "automation-webhook:" + name, so a value derived from the same
   secret for some other purpose — including the bare automation name — cannot
   collide with a webhook key. Recomputed here from node:crypto directly rather
   than asserted against the module's own output, which would prove nothing. */
const expectedFor = (n) =>
  createHmac("sha256", SECRET_A).update("automation-webhook:" + n).digest("hex").slice(0, 32);
check(
  NAMES.every((n) => webhookKeyFor(n) === expectedFor(n)),
  "the key is HMAC-SHA256(secret, \"automation-webhook:\" + name) truncated to 32 hex",
);
const unlabelled = createHmac("sha256", SECRET_A).update("stalled-invoices").digest("hex").slice(0, 32);
check(
  webhookKeyFor("stalled-invoices") !== unlabelled,
  "the label participates — the key is not the HMAC of the bare name",
);

/* The label is a prefix glued on with plain concatenation, with no separator
 * length and no length prefix. That is safe today because there is exactly one
 * label, so the map from name to input is injective. It stops being safe the
 * moment a second label is added that could be a prefix of this one: a future
 * HMAC(secret, "automation-" + x) would collide with this one at
 * x = "webhook:<name>". Asserted rather than described, so that a second label
 * added later lands on a red test instead of a silent cross-domain collision. */
const ambiguous = createHmac("sha256", SECRET_A).update("automation-" + "webhook:stalled-invoices").digest("hex").slice(0, 32);
check(
  webhookKeyFor("stalled-invoices") === ambiguous,
  "concatenation is unambiguous only while this is the sole label — see report",
);
restore();

// ── 7. With no secret, matching refuses rather than throws ────────────────
//
// webhookKeyFor throws here (case 4), and webhookKeyMatches is called from a
// route handler where a throw is a 500. The whole design of that handler is
// that a bad key gets the same 404 an unknown automation gets, so a caller
// cannot learn which automations exist. A 500 on a misconfigured deploy would
// break that: it would answer "the secret is missing" to anyone who asked, and
// would do it for every automation name — including ones that do not exist.
setSecret(undefined);
noThrowFalse(good, "with the secret unset, a previously-correct key is refused without throwing");
noThrowFalse("anything", "with the secret unset, any key is refused without throwing");
setSecret("");
noThrowFalse(good, "with the secret empty, a previously-correct key is refused without throwing");
setSecret("   ");
noThrowFalse(good, "with the secret only whitespace, a previously-correct key is refused without throwing");
restore();

/* And the env really is back where it started, so a later file in the `npm
   test` chain does not inherit a secret this one invented. */
check(process.env.AUTOPILOT_TICK_SECRET === ORIGINAL, "AUTOPILOT_TICK_SECRET is restored");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
