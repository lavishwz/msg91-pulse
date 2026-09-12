/**
 * Drip real signup rows into ms_user, one at a time, and watch the signup
 * automations pick them up.
 *
 * The two rules built on the Rules page poll ms_user for rows that appeared
 * in the last few minutes. Nothing in Pulse can make a signup happen — the
 * write is on MSG91's side — so the only honest way to test a signup rule is
 * to create signups and wait for the rule's own cron job to find them. That
 * is what this does: one insert, then a poll of both automations to see
 * whether the run that followed it actually judged the new row.
 *
 * Every row it writes is marked three ways so it can always be found again:
 * the email is on the .invalid TLD (reserved by RFC 2606 — it can never be a
 * real address or be delivered to), the local part starts with the tag below,
 * and the run stamps its own id into it.
 *
 *   node --experimental-strip-types scripts/seed-test-signups.mjs --dry-run
 *   node --experimental-strip-types scripts/seed-test-signups.mjs --minutes=120
 *   node --experimental-strip-types scripts/seed-test-signups.mjs --cleanup=<runId>
 *
 * --dry-run prints the INSERT it would run and the grants it has, and writes
 * nothing. Run that first: Pulse is designed with SELECT-only access to
 * MSG91, so an INSERT that succeeds means those credentials carry more
 * privilege than the design assumes, and that is worth knowing before two
 * hours of writes rather than after.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { query } = await import("../lib/db.ts");
const { read } = await import("../lib/store.ts");

/* ── arguments ──────────────────────────────────────────────────────────── */

const ARGS = process.argv.slice(2);
const has = (n) => ARGS.includes(`--${n}`);
const val = (n, d) => {
  const hit = ARGS.find((a) => a.startsWith(`--${n}=`));
  return hit === undefined ? d : hit.slice(n.length + 3);
};

const DRY = has("dry-run");
const CLEANUP = val("cleanup", "");
const TOTAL_MINUTES = Number(val("minutes", "120"));
const COUNT = Number(val("count", "20"));
const TAG = "pulse-test-signup";

/* A stable id for this run, so cleanup can target exactly these rows and
   nothing else. Seconds since epoch in base36 — short, sortable, unique
   enough for a human-driven test. */
const RUN_ID = Math.floor(Date.now() / 1000).toString(36);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString().slice(11, 19);
const say = (...a) => console.log(a.join(" "));

/* ── the automations under test ─────────────────────────────────────────── */

/**
 * Found by what they are rather than by key, so this keeps working when the
 * rules are deleted and rebuilt — which is likely, since one of them needs
 * rebuilding.
 */
async function signupAutomations() {
  return read(
    `SELECT automation_key, english, every_minutes, cron_job_id, run_count, alert_count,
            last_run_at, last_error, find_sql
       FROM pulse_automation
      WHERE state <> 'retired' AND live = 1 AND trigger_kind = 'schedule'
        AND find_sql LIKE '%ms_user%'
        AND (english LIKE '%sign%up%' OR english LIKE '%signup%' OR english LIKE '%profile%')
      ORDER BY id DESC`,
  );
}

/* ── schema discovery ───────────────────────────────────────────────────── */

/**
 * Build the INSERT from what the table actually declares rather than from a
 * guess. Anything NOT NULL with no default has to be given a value or the
 * insert fails, and which columns those are is not knowable from outside.
 */
function zeroFor(type) {
  const t = String(type).toLowerCase();
  /* An ENUM's empty string is not one of its members, so "" is rejected
     outright — `user_delivery` is enum('0','1','2',…) NOT NULL with no
     default, and the first run died on exactly that. The only value known to
     be legal for an arbitrary enum is one it actually lists, so take the
     first. SET is the opposite: empty is always legal there. */
  if (t.startsWith("enum(")) {
    const first = /'((?:[^'\\]|\\.|'')*)'/.exec(type);
    return first ? first[1].replace(/''/g, "'").replace(/\\(.)/g, "$1") : "";
  }
  if (t.startsWith("set(")) return "";
  if (/int|bit|year/.test(t)) return 0;
  if (/decimal|numeric|float|double/.test(t)) return 0;
  if (/datetime|timestamp/.test(t)) return new Date();
  if (/date/.test(t)) return new Date();
  if (/time/.test(t)) return "00:00:00";
  return "";
}

async function buildRow(cols, n) {
  const byName = new Map(cols.map((c) => [c.Field, c]));
  const row = {};

  /* Start with every column that MySQL will not fill in for us. */
  for (const c of cols) {
    const auto = /auto_increment/i.test(c.Extra ?? "");
    const generated = /GENERATED/i.test(c.Extra ?? "");
    if (auto || generated) continue;
    if (c.Null === "YES") continue;
    if (c.Default !== null && c.Default !== undefined) continue;
    row[c.Field] = zeroFor(c.Type);
  }

  /* Then the fields the rules actually read. Half the rows are deliberately
     incomplete — no first name, last name or mobile — because that is exactly
     what the "is the profile fully filled" rule is meant to catch. A run where
     every row is complete cannot tell a working rule from one that never
     alerts. */
  const complete = n % 2 === 1;
  const set = (name, v) => { if (byName.has(name)) row[name] = v; };

  set("user_email", `${TAG}-${RUN_ID}-${n}@msg91-pulse-test.invalid`);
  set("user_type", 3);
  set("user_date", new Date());
  set("user_fname", complete ? "Testfirst" : "");
  set("user_lname", complete ? `Testlast${n}` : "");
  set("user_mobno", complete ? `9199${String(100000 + n).slice(-6)}` : "");
  set("user_status", 1);
  set("user_bal", 0);

  return { row, complete };
}

/* ── cleanup ────────────────────────────────────────────────────────────── */

async function cleanup(runId) {
  const like = `${TAG}-${runId}-%@msg91-pulse-test.invalid`;
  const found = await query("SELECT user_pid, user_email FROM ms_user WHERE user_email LIKE ?", [like]);
  say(`${found.length} row(s) match ${like}`);
  for (const r of found) say(`   ${r.user_pid}  ${r.user_email}`);
  if (!found.length) return;
  if (DRY) return say("dry run — nothing deleted");
  const res = await query("DELETE FROM ms_user WHERE user_email LIKE ?", [like]);
  say(`deleted ${res.affectedRows ?? "?"} row(s)`);
}

/* ── main ───────────────────────────────────────────────────────────────── */

say(`database : ${process.env.MYSQL_DATABASE}`);
say(`user     : ${process.env.MYSQL_USER}`);

try {
  const grants = await query("SHOW GRANTS");
  for (const g of grants) say(`grant    : ${Object.values(g)[0]}`);
} catch (err) {
  say(`grant    : could not read (${err.message})`);
}

if (CLEANUP) {
  await cleanup(CLEANUP);
  process.exit(0);
}

const cols = await query("SHOW COLUMNS FROM ms_user");
say(`\nms_user has ${cols.length} columns`);

const watching = await signupAutomations();
say(`\n${watching.length} live signup automation(s) under test:`);
for (const a of watching) {
  say(`  ${a.automation_key}`);
  say(`     every ${a.every_minutes ?? "?"}m · cron ${a.cron_job_id ?? "NONE"} · runs=${a.run_count} alerts=${a.alert_count}`);
}
if (!watching.length) say("  (none found — the inserts will still happen, but nothing is polling them)");

const { row: sample } = await buildRow(cols, 1);
say(`\nINSERT INTO ms_user (${Object.keys(sample).join(", ")})`);
say(`VALUES (${Object.keys(sample).map(() => "?").join(", ")})`);
say(`sample : ${JSON.stringify(sample)}`);

if (DRY) {
  say(`\ndry run — nothing written. Run without --dry-run to start.`);
  process.exit(0);
}

const gapMs = Math.max(1, Math.round((TOTAL_MINUTES * 60_000) / COUNT));
say(`\nrun id   : ${RUN_ID}`);
say(`plan     : ${COUNT} signups over ${TOTAL_MINUTES} minutes, one every ${Math.round(gapMs / 60000)} min`);
say(`cleanup  : node --experimental-strip-types scripts/seed-test-signups.mjs --cleanup=${RUN_ID}`);
say(`\n${"═".repeat(70)}`);

const before = new Map(watching.map((a) => [a.automation_key, Number(a.run_count)]));
const inserted = [];

for (let n = 1; n <= COUNT; n++) {
  const { row, complete } = await buildRow(cols, n);
  const names = Object.keys(row);
  const sql = `INSERT INTO ms_user (${names.map((c) => `\`${c}\``).join(", ")}) VALUES (${names.map(() => "?").join(", ")})`;

  try {
    const res = await query(sql, names.map((c) => row[c]));
    const pid = res.insertId ?? "?";
    inserted.push({ pid, email: row.user_email, complete });
    say(`${stamp()}  #${n}/${COUNT}  inserted user_pid=${pid}  ${complete ? "complete profile" : "INCOMPLETE profile"}`);
    say(`          ${row.user_email}`);
  } catch (err) {
    say(`${stamp()}  #${n}/${COUNT}  INSERT FAILED: ${err.message}`);
    if (/denied|permission|read.only/i.test(err.message)) {
      say(`\nThese credentials cannot write to ms_user — which is what the design says.`);
      say(`Nothing further to do; no rows were created.`);
      process.exit(1);
    }
  }

  /* Wait for the rules' own cron jobs rather than poking them. Poll while we
     wait so a fire that lands mid-gap is reported when it happens. */
  const until = Date.now() + gapMs;
  while (Date.now() < until) {
    await sleep(Math.min(60_000, Math.max(5_000, until - Date.now())));
    for (const a of await signupAutomations()) {
      const was = before.get(a.automation_key);
      if (was !== undefined && Number(a.run_count) > was) {
        before.set(a.automation_key, Number(a.run_count));
        say(`${stamp()}     ↑ ${a.automation_key.slice(0, 52)}`);
        say(`          runs ${was}→${a.run_count}  alerts=${a.alert_count}  ${a.last_error ? `error=${a.last_error}` : ""}`);
      } else if (was === undefined) {
        before.set(a.automation_key, Number(a.run_count));
      }
    }
    if (Date.now() >= until) break;
  }
}

say(`\n${"═".repeat(70)}`);
say(`inserted ${inserted.length} signup(s), run id ${RUN_ID}`);
for (const a of await signupAutomations()) {
  say(`\n${a.automation_key}`);
  say(`  runs=${a.run_count}  alerts=${a.alert_count}  last_run=${a.last_run_at}`);
  say(`  last_error=${a.last_error ?? "—"}`);
  const seen = await query(
    `SELECT COUNT(*) AS n FROM ms_user WHERE user_email LIKE ?`,
    [`${TAG}-${RUN_ID}-%@msg91-pulse-test.invalid`],
  );
  say(`  test rows still in ms_user: ${seen[0].n}`);
}
say(`\nremove them with:`);
say(`  node --experimental-strip-types scripts/seed-test-signups.mjs --cleanup=${RUN_ID}`);
process.exit(0);
