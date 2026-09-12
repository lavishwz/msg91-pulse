/**
 * Binding an event payload into an enrichment query — the failure and hostile
 * paths only. The happy path is covered by the build-time dry run in build.ts;
 * what is not covered anywhere else is what happens when the payload is not a
 * company called "Acme Co".
 *
 * enrich.ts exists so that a value out of an event payload can never become
 * SQL syntax. Those values are typed by people outside Pulse — accountName,
 * addedBy, email, tag — and the MSG91 connection in development is root with
 * GRANT ALL, so "the enrichment is only a SELECT" is not a defence: a stacked
 * statement appended to an interpolated SELECT runs as root. The only thing
 * standing between a hostile account name and a dropped table is that the
 * payload reaches the driver as a bind parameter and never reaches the SQL
 * string at all. That is the property this file attacks.
 *
 * Two checks below record bugs that are really there rather than the behaviour
 * anyone wanted — they are labelled "the bug", the same way watermark.test.mjs
 * pins the naive String(date) comparison it was written to prove wrong. If
 * enrich.ts is fixed, those two go red and should be rewritten, not deleted.
 */

import { bindPlaceholders, bindValues, placeholderNames } from "../lib/pulse/autopilot/enrich.ts";
import { EVENTS } from "../lib/pulse/autopilot/events.ts";

let pass = 0, fail = 0;
const check = (cond, label) => (cond ? pass++ : (fail++, console.log("FAIL " + label)));
const qmarks = (s) => (s.match(/\?/g) ?? []).length;

/* ------------------------------------------------------------------ *
 * 1. SQL injection: the payload must never appear in the SQL string.
 * ------------------------------------------------------------------ */

/* The canonical one from enrich.ts's own header comment. If this string ever
   comes back inside `sql`, every table the root connection can see is one
   automation fire away from gone. */
const DROP = "'; DROP TABLE ms_user; --";

const INJECT_SQL = "SELECT user_bal FROM ms_user WHERE user_fname = :accountName LIMIT 1";
const INJECT_EXPECT = "SELECT user_bal FROM ms_user WHERE user_fname = ? LIMIT 1";

const injected = bindPlaceholders(INJECT_SQL);
check(injected.sql === INJECT_EXPECT, `the placeholder becomes a positional ? (got ${JSON.stringify(injected.sql)})`);
check(!injected.sql.includes(DROP), "the hostile value is not in the sql");
check(!/drop/i.test(injected.sql), "the word DROP is not in the sql");
check(injected.sql.indexOf(";") === -1, "no statement separator was introduced");

const injectedValues = bindValues(injected.names, { accountName: DROP });
check(injectedValues.length === 1, "one value for one placeholder");
check(injectedValues[0] === DROP, "the hostile value survives intact — as a value, which is the point");

/* The stronger statement, and the one that actually makes injection
   impossible: `sql` is a pure function of the query text. The payload is not
   an argument to bindPlaceholders at all, so no payload — however it is
   spelled, whatever quoting or escaping trick it carries — can move a single
   byte of it. Each of these has broken a hand-rolled escaper somewhere. */
const HOSTILE = [
  DROP,
  "' OR 1=1 -- ",
  "' UNION SELECT user_pwd FROM ms_user -- ",
  "\\' OR '1'='1",                       // backslash-escaped quote
  "'' OR ''='",                          // doubled quote
  "\u0000'; DROP TABLE ms_user; --",     // embedded NUL ahead of the payload
  "`ms_user` -- ",                       // backtick identifier
  '" OR "a"="a',                         // double quote, for ANSI_QUOTES mode
  "0x27204f5220313d31",                  // hex literal
  "/*! DROP TABLE ms_user */",           // MySQL version-gated comment
  ":accountName",                        // a value that looks like a placeholder
  "?",                                   // a value that looks like a bound slot
];
for (const v of HOSTILE) {
  const b = bindPlaceholders(INJECT_SQL);
  check(b.sql === INJECT_EXPECT, `sql is unchanged by the payload ${JSON.stringify(v)}`);
  const bound = bindValues(b.names, { accountName: v });
  check(bound.length === 1 && bound[0] === v, `${JSON.stringify(v)} comes out bound, not interpolated`);
}

/* A value that itself spells ":accountName" must not be re-scanned. There is
   no second pass in enrich.ts, but a future "just re-bind the result" would
   reintroduce exactly the hole this file is about, so it is pinned. */
const echoed = bindPlaceholders(INJECT_SQL);
check(bindValues(echoed.names, { accountName: ":accountName" })[0] === ":accountName",
  "a payload that spells a placeholder is data, not a placeholder");

/* ------------------------------------------------------------------ *
 * 2-3. A colon inside a quoted run is text, not a placeholder.
 * ------------------------------------------------------------------ */

/* Rewriting one would do damage twice over: it corrupts the literal the query
   was comparing against, and it pushes a name onto the list for a `?` that
   MySQL will not count, so every value after it binds one slot to the left. */
for (const [sql, why] of [
  ["SELECT 1 FROM ms_user WHERE note = 'ask :them'", "single-quoted"],
  ['SELECT 1 FROM ms_user WHERE note = "ask :them"', "double-quoted"],
  ["SELECT 1 FROM ms_user WHERE `weird :them` = 1", "backtick-quoted"],
]) {
  const b = bindPlaceholders(sql);
  check(b.names.length === 0, `${why}: no placeholder found`);
  check(b.sql === sql, `${why}: the sql is returned byte-for-byte`);
}

/* The mixed case is the one that matters in practice: a literal containing a
   colon sitting beside a real placeholder. The literal must survive and the
   placeholder must still bind. */
const mixed = bindPlaceholders("SELECT 1 FROM ms_user WHERE note = 'ask :them' AND user_id = :accountId");
check(mixed.names.length === 1 && mixed.names[0] === "accountId", "a literal beside a real placeholder does not hide it");
check(mixed.sql.includes("'ask :them'"), "and the literal is left exactly as written");
check(qmarks(mixed.sql) === 1, "exactly one ? for exactly one name");

/* ------------------------------------------------------------------ *
 * 4. A time literal is not two placeholders.
 * ------------------------------------------------------------------ */

/* '12:30:00' reads as `:30` and `:00` to anything matching a bare colon. Two
   defences hold here and both are worth pinning, because either one alone
   would be enough today and neither is obviously permanent: the quotes make
   it a literal, and the digits after the colon are not identifier starts. */
const timeLit = bindPlaceholders("SELECT 1 FROM ms_user WHERE t > '12:30:00'");
check(timeLit.names.length === 0, "a quoted time literal yields no placeholders");
check(timeLit.sql === "SELECT 1 FROM ms_user WHERE t > '12:30:00'", "and is passed through unchanged");

const bareTime = bindPlaceholders("SELECT 1 FROM ms_user WHERE t > 12:30:00");
check(bareTime.names.length === 0, "an unquoted 12:30:00 is still not a placeholder — digits do not start a name");

const timeAndName = bindPlaceholders("SELECT 1 FROM ms_user WHERE t > '12:30:00' AND user_id = :accountId");
check(timeAndName.names.join(",") === "accountId", "a time literal does not displace the real placeholder");

/* ------------------------------------------------------------------ *
 * 5. An escaped quote must not end the literal early.
 * ------------------------------------------------------------------ */

/* If the scanner leaves the literal at the escaped quote it thinks it is back
   in open SQL, and the next :name — which MySQL will still be reading as part
   of the string — gets rewritten to a ? that MySQL never counts. The value
   list and the slot list then disagree, and the statement fails on every fire.
   Both of MySQL's escape forms are tested; the planner writes either. */
const bsEscape = bindPlaceholders("SELECT 1 FROM ms_user WHERE note = 'it\\'s :them' AND user_id = :accountId");
check(bsEscape.names.join(",") === "accountId", "backslash-escaped quote does not expose the :name after it");
check(qmarks(bsEscape.sql) === 1, "backslash-escaped quote: one slot, one name");
check(bsEscape.sql.includes("'it\\'s :them'"), "backslash-escaped literal is copied through verbatim");

const dblEscape = bindPlaceholders("SELECT 1 FROM ms_user WHERE note = 'it''s :them' AND user_id = :accountId");
check(dblEscape.names.join(",") === "accountId", "doubled quote does not expose the :name after it");
check(qmarks(dblEscape.sql) === 1, "doubled quote: one slot, one name");
check(dblEscape.sql.includes("'it''s :them'"), "doubled-quote literal is copied through verbatim");

/* An escaped backslash immediately before the closing quote is the opposite
   trap: here the quote really does close, and treating it as escaped would
   swallow the rest of the query. */
const bsbs = bindPlaceholders("SELECT 1 FROM ms_user WHERE note = 'ends\\\\' AND user_id = :accountId");
check(bsbs.names.join(",") === "accountId", "an escaped backslash still lets the literal close");

/* An unterminated literal must fail closed — everything after the stray quote
   is treated as string, so nothing is rewritten and MySQL rejects the
   statement. Silently binding inside it would be the dangerous outcome. */
const unterminated = bindPlaceholders("SELECT 1 FROM ms_user WHERE note = 'oops :accountId");
check(unterminated.names.length === 0, "an unterminated literal binds nothing rather than guessing");

/* ------------------------------------------------------------------ *
 * 6. The same name twice is two slots and two values.
 * ------------------------------------------------------------------ */

/* MySQL's `?` is positional and has no memory: `a = ? OR b = ?` needs the
   value twice. Deduplicating here — which is what placeholderNames does, for
   a different purpose — would leave the second slot bound to whatever came
   next, which is how a lookup silently answers about the wrong account. */
const twice = bindPlaceholders(
  "SELECT 1 FROM ms_user WHERE a = :tag OR b = :accountId OR c = :tag",
);
check(twice.sql === "SELECT 1 FROM ms_user WHERE a = ? OR b = ? OR c = ?", "three slots for three uses");
check(twice.names.join(",") === "tag,accountId,tag", "names are in the order MySQL consumes them, repeats included");

const twiceValues = bindValues(twice.names, { tag: "at-risk", accountId: "12345" });
check(twiceValues.length === 3, "three values for three slots");
check(twiceValues.join(",") === "at-risk,12345,at-risk", "the repeated value is supplied twice, in position");
check(qmarks(twice.sql) === twice.names.length, "slot count and name count agree");

/* placeholderNames is the deduplicated view, used to ask "which fields does
   this query need" — a different question, and it must not be confused with
   the binding order above. */
check(placeholderNames("SELECT 1 FROM ms_user WHERE a = :tag OR b = :accountId OR c = :tag").join(",")
  === "tag,accountId", "placeholderNames answers the distinct-fields question");

/* ------------------------------------------------------------------ *
 * 7. A name the payload does not carry binds NULL.
 * ------------------------------------------------------------------ */

/* Not a throw: the planner naming a field the event does not carry is caught
   at build time, so reaching here means a row was edited, restored or
   migrated under a live rule. A NULL makes the query match nothing and the
   pass reports an empty enrichment; a throw would take the whole automation
   down over a supporting lookup. And not `undefined`, which mysql2 rejects
   outright with "Bind parameters must not contain undefined" — the same
   failure, with a worse message. */
const missing = bindValues(["accountId", "nosuchfield", "tag"], { accountId: "12345", tag: "at-risk" });
check(missing[1] === null, "a missing key binds null");
check(missing[1] !== undefined, "and specifically not undefined, which mysql2 refuses to bind");
check(missing[0] === "12345" && missing[2] === "at-risk", "the neighbouring values are unaffected");

check(bindValues(["x"], {})[0] === null, "an empty payload binds null rather than throwing");
check(bindValues(["x"], { x: null })[0] === null, "an explicit null binds null");
check(bindValues(["x"], { x: undefined })[0] === null, "an explicit undefined is normalised to null");
check(bindValues([], { a: 1 }).length === 0, "no names means no values");

/* THE BUG. `payload[n]` is a plain property read, so a placeholder naming
   anything on Object.prototype finds an inherited member instead of missing.
   `:constructor` finds a function; JSON.stringify of a function returns
   undefined, so the guard clauses are all skipped and `undefined` is what
   comes back — the one value the signature promises never to return and the
   one mysql2 refuses. `:__proto__` is the milder version: it binds the string
   "{}" instead of null. Both should be null. Reachability is limited today
   because checkEnrichment in build.ts rejects any name not in the event's
   example payload, but withEnrichment does not re-check names at runtime, so
   an edited row reaches this. The fix is a hasOwnProperty test on the payload
   before the lookup; enrich.ts is not modified here. */
check(bindValues(["constructor"], { accountId: "1" })[0] === undefined,
  "the bug: :constructor finds Object.prototype.constructor and binds undefined");
check(bindValues(["__proto__"], { accountId: "1" })[0] === "{}",
  "the bug: :__proto__ binds \"{}\" instead of null");
check(bindValues(["toString"], {})[0] === undefined, "the bug: so does :toString");
check(bindValues(["hasOwnProperty"], {})[0] === undefined, "the bug: and :hasOwnProperty");

/* ------------------------------------------------------------------ *
 * 8. Everything that comes back must be something mysql2 can bind.
 * ------------------------------------------------------------------ */

/* A payload is JSON that arrived from emitEvent, so a field can hold an object
   or an array, and a field read back off a row can hold a Date. Handing any of
   those to the driver throws mid-pass — which is the worst place for it,
   because the event has already been consumed. Everything is flattened to a
   string, a number or null before it leaves. */
const flatNames = ["obj", "arr", "date", "yes", "no", "nan", "inf", "ninf", "big", "circ", "empty", "deep"];
const circular = { name: "loop" };
circular.self = circular;
const flat = bindValues(flatNames, {
  obj: { user_bal: 12, nested: { a: 1 } },
  arr: [1, "two", null],
  date: new Date("2026-01-01T00:00:00.000Z"),
  yes: true,
  no: false,
  nan: NaN,
  inf: Infinity,
  ninf: -Infinity,
  big: 10n,
  circ: circular,
  empty: "",
  deep: [{ a: [1, 2] }],
});

for (let i = 0; i < flatNames.length; i++) {
  const v = flat[i];
  const ok = v === null || typeof v === "string" || typeof v === "number";
  check(ok, `${flatNames[i]} flattens to a bindable primitive (got ${typeof v}: ${String(v)})`);
  check(typeof v !== "object" || v === null, `${flatNames[i]} is never handed over as a raw object`);
}

check(flat[0] === '{"user_bal":12,"nested":{"a":1}}', "an object is stringified as JSON, not [object Object]");
check(flat[1] === '[1,"two",null]', "an array is stringified as JSON");
check(flat[2] === "2026-01-01T00:00:00.000Z", "a Date becomes an ISO string, which MySQL compares correctly");
check(flat[3] === 1 && flat[4] === 0, "booleans become 1 and 0, as MySQL stores them");
/* NaN and Infinity are numbers that mysql2 cannot serialise; they become
   strings so the statement runs and matches nothing, rather than throwing. */
check(flat[5] === "NaN", "NaN becomes a string rather than an unserialisable number");
check(flat[6] === "Infinity" && flat[7] === "-Infinity", "so do both infinities");
check(flat[8] === "10", "a BigInt — which JSON.stringify throws on — falls back to String()");
check(flat[9] === "[object Object]", "a circular object falls back to String() instead of throwing");
check(flat[10] === "", "an empty string stays an empty string, not null — absent and blank differ");
check(typeof flat[11] === "string", "a nested array survives");

/* Finite numbers pass through as numbers: turning 12345 into "12345" would
   defeat an index on an integer column on every fire. */
const nums = bindValues(["a", "b", "c"], { a: 12345, b: 0, c: -1.5 });
check(nums[0] === 12345 && nums[1] === 0 && nums[2] === -1.5, "finite numbers stay numbers");
check(typeof nums[1] === "number", "zero stays a number and does not collapse to null");

/* ------------------------------------------------------------------ *
 * 9. Against the real event payloads in events.ts.
 * ------------------------------------------------------------------ */

/* The names a query may use are not open-ended: emitEvent only ever fires the
   seven events in EVENTS, each with a fixed payload. This walks the catalogue
   itself rather than a copy of it, so adding an eighth event without thinking
   about enrichment shows up here. */
const eventNames = Object.keys(EVENTS);
check(eventNames.length === 7, `the catalogue still has 7 events (got ${eventNames.length})`);

/* A field no event carries, used as the negative case everywhere below. */
const ABSENT = "user_pwd";
for (const name of eventNames) {
  const example = EVENTS[name].example;
  const keys = Object.keys(example);
  check(keys.length > 0, `${name} has a non-empty example payload`);

  /* Every field the event does carry resolves, in a query shaped like one the
     planner would write. */
  for (const k of keys) {
    const b = bindPlaceholders(`SELECT 1 FROM ms_user WHERE col = :${k} LIMIT 1`);
    check(b.names.join(",") === k, `${name}: :${k} is recognised as a placeholder`);
    check(b.sql === "SELECT 1 FROM ms_user WHERE col = ? LIMIT 1", `${name}: :${k} becomes a ?`);
    const v = bindValues(b.names, example)[0];
    check(v === example[k], `${name}: :${k} binds the payload's own value`);
    check(v !== null, `${name}: :${k} is not mistaken for a missing field`);

    /* The example payloads are the ones checkEnrichment validates against at
       build time, so they must be bindable as they stand. */
    check(typeof v === "string" || typeof v === "number", `${name}: :${k}'s example value is a primitive`);
  }

  /* And one the event does not carry binds null, per case 7 — which is what
     makes a mis-planned query answer "nothing found" instead of exploding. */
  check(!keys.includes(ABSENT), `${name} genuinely does not carry :${ABSENT}`);
  const absent = bindPlaceholders(`SELECT 1 FROM ms_user WHERE col = :${ABSENT} LIMIT 1`);
  check(bindValues(absent.names, example)[0] === null, `${name}: :${ABSENT} binds null`);

  /* A field belonging to a different event is the realistic mistake — the
     planner reaching for `:tag` on member.invited, say — and it has to behave
     the same way as a name nobody defined. */
  const foreign = eventNames
    .flatMap((other) => Object.keys(EVENTS[other].example))
    .find((k) => !keys.includes(k));
  if (foreign) {
    const f = bindPlaceholders(`SELECT 1 FROM ms_user WHERE col = :${foreign} LIMIT 1`);
    check(bindValues(f.names, example)[0] === null, `${name}: :${foreign} belongs to another event and binds null`);
  }
}

/* A query using every field of the largest payload at once, to prove the order
   holds across more than two slots. account.reassigned carries six. */
const reassigned = EVENTS["account.reassigned"].example;
const sixKeys = Object.keys(reassigned);
const sixSql = "SELECT 1 FROM ms_user WHERE " + sixKeys.map((k) => `${k} = :${k}`).join(" AND ");
const six = bindPlaceholders(sixSql);
check(six.names.join(",") === sixKeys.join(","), "six placeholders keep their written order");
check(qmarks(six.sql) === 6, "six slots");
check(bindValues(six.names, reassigned).join("|") === sixKeys.map((k) => reassigned[k]).join("|"),
  "six values line up with six slots");

/* ------------------------------------------------------------------ *
 * 10. Things that look like placeholders and are not.
 * ------------------------------------------------------------------ */

/* `::` is a cast in other dialects and shows up in planner output copied from
   Postgres examples; `@var` is a MySQL user variable, which the guard rejects
   separately. Neither is a payload field, and rewriting either would push a
   phantom name onto the list. */
for (const [sql, why] of [
  ["SELECT db::col FROM ms_user", "a :: cast is not a placeholder"],
  ["SELECT 1 FROM ms_user WHERE a = ::tag", "a leading :: is not a placeholder"],
  ["SELECT @var FROM ms_user", "an @variable is not a placeholder"],
  ["SELECT @@version FROM ms_user", "a @@system variable is not a placeholder"],
  ["SELECT 1 FROM ms_user WHERE url = 'http://x/y'", "a URL's // inside a literal is not a placeholder"],
  ["SELECT 1 FROM ms_user WHERE a = :", "a bare trailing colon is not a placeholder"],
  ["SELECT 1 FROM ms_user WHERE a = :1", "a colon before a digit is not a placeholder"],
  ["SELECT 1 FROM ms_user WHERE a = : tag", "a colon followed by a space is not a placeholder"],
]) {
  const b = bindPlaceholders(sql);
  check(b.names.length === 0, why);
  check(b.sql === sql, `${why} — and the sql is unchanged`);
}

/* Mixed in with a real one, so "found nothing" is not passing by accident. */
const mixedColons = bindPlaceholders("SELECT db::col, @var FROM ms_user WHERE user_id = :accountId");
check(mixedColons.names.join(",") === "accountId", ":: and @var beside a real placeholder leave only the real one");
check(mixedColons.sql === "SELECT db::col, @var FROM ms_user WHERE user_id = ?", "and only the real one is rewritten");

/* ------------------------------------------------------------------ *
 * Invariant: for every well-formed query above, ? count === name count.
 * ------------------------------------------------------------------ */

/* This is the property withEnrichment depends on. If it ever breaks, mysql2
   raises "Incorrect arguments to EXECUTE" on every fire of the rule. */
for (const sql of [
  INJECT_SQL,
  "SELECT 1 FROM ms_user WHERE note = 'ask :them' AND user_id = :accountId",
  "SELECT 1 FROM ms_user WHERE a = :tag OR b = :accountId OR c = :tag",
  "SELECT 1 FROM ms_user WHERE t > '12:30:00' AND user_id = :accountId",
  "SELECT 1 FROM ms_user WHERE note = 'it''s :them' AND user_id = :accountId",
  "SELECT db::col, @var FROM ms_user WHERE user_id = :accountId",
  sixSql,
]) {
  const b = bindPlaceholders(sql);
  check(qmarks(b.sql) === b.names.length, `slot/name parity holds for ${JSON.stringify(sql.slice(0, 48))}`);
}

/* THE OTHER BUG. A comment is not a literal, so the scanner walks straight
   into it and rewrites the :name inside — but the guard strips comments
   afterwards (checkEnrichment and withEnrichment both bind first, then
   guard), so that `?` disappears from the statement MySQL receives while its
   name stays in the value list. Parity breaks, and the rule's enrichment fails
   on every fire with "Incorrect arguments to EXECUTE". It fails closed rather
   than mis-binding, because pool().execute is a real prepared statement and
   the server counts the slots — nothing is injected, the lookup is just dead.
   A perfectly ordinary commented SELECT out of the planner is rejected at
   build time for a reason nobody reading the message would guess. The fix is
   to skip line comments and block comments the way literals are skipped; enrich.ts
   is not modified here. */
const lineComment = bindPlaceholders("SELECT user_bal FROM ms_user WHERE user_id = :accountId -- by :addedBy");
check(lineComment.names.length === 2, "the bug: a :name inside a -- comment is counted as a placeholder");
check(lineComment.sql.includes("-- by ?"), "the bug: and is rewritten to a ? the guard will then strip");

const blockComment = bindPlaceholders("SELECT /* :addedBy */ user_bal FROM ms_user WHERE user_id = :accountId");
check(blockComment.names.join(",") === "addedBy,accountId", "the bug: a :name inside a block comment is counted too");
check(blockComment.sql.includes("/* ? */"), "the bug: and rewritten, ahead of the real one, so the order shifts");

/* The saving grace, and the reason this is a correctness bug and not a
   security one: even in the broken case the payload never reaches the sql. */
const commentValues = bindValues(blockComment.names, { addedBy: DROP, accountId: "12345" });
check(!blockComment.sql.includes(DROP), "even so, the hostile value is still nowhere in the sql");
check(commentValues[0] === DROP, "it is still only ever a bound value");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
