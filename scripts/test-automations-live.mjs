/**
 * Create automations of every motion on the *deployed* Pulse, fire them the
 * way a person or a schedule actually would, and report what broke.
 *
 * The difference between this and scripts/test-automations.mjs is where the
 * trigger comes from. That one calls `buildAutomation()`, `emitEvent()` and
 * `runOne()` in-process, which proves the runner works when something calls
 * it. This one never calls any of them:
 *
 *   · automations are built by POSTing /api/pulse/autopilot/build on the
 *     deployed app, exactly as the Rules page does;
 *   · event automations are fired by performing the real action — tagging an
 *     account, reassigning it, inviting a member, connecting a service —
 *     through the real routes, because `after()` lives in those routes and
 *     `after()` is what keeps a serverless invocation alive long enough for
 *     the automation to finish;
 *   · scheduled automations are fired by cron-job.org calling their webhook
 *     on the cadence they were registered with. Nothing here hits that
 *     webhook. It waits.
 *
 * That is slower and it is the point: the parts that break in production are
 * the parts an in-process test stubs out.
 *
 *   node --experimental-strip-types scripts/test-automations-live.mjs --build
 *   node --experimental-strip-types scripts/test-automations-live.mjs --events
 *   node --experimental-strip-types scripts/test-automations-live.mjs --watch=180
 *   node --experimental-strip-types scripts/test-automations-live.mjs --report
 *
 * Everything it builds is left live — there is no cleanup pass, by design.
 * The keys are recorded in the state file (--state=, or $PULSE_LIVE_STATE) so
 * a later phase can pick up where an earlier one stopped.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

import { loadEnv, session, api, base } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { read } = await import("../lib/store.ts");

/* ── arguments ──────────────────────────────────────────────────────────── */

const ARGS = process.argv.slice(2);
const has = (name) => ARGS.includes(name);
const valueOf = (name, fallback) => {
  const hit = ARGS.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};

const STATE_PATH =
  valueOf("state", process.env.PULSE_LIVE_STATE || join(tmpdir(), "pulse-live-run.json"));
const WATCH_MINUTES = Number(valueOf("watch", "0"));
const ONLY = valueOf("only", "");

/* No phase named means the whole run, in order. */
const PHASES = {
  build: has("--build") || (!has("--events") && !has("--report") && WATCH_MINUTES === 0),
  events: has("--events") || (!has("--build") && !has("--report") && WATCH_MINUTES === 0),
  watch: WATCH_MINUTES > 0 || (!has("--build") && !has("--events") && !has("--report")),
  report: has("--report"),
};
const DEFAULT_WATCH_MINUTES = WATCH_MINUTES || 180;

/* ── the cases ──────────────────────────────────────────────────────────── */

/**
 * One event automation per event in the catalogue, spread across all five
 * motions so every motion gets exercised and no event is left uncovered.
 * Motion is only a label on the row and a hint to the planner — but it is a
 * label that `listAutomations(motion)` filters the Rules page by, so a motion
 * that cannot round-trip is a motion whose rules are invisible.
 */
const EVENT_CASES = [
  { motion: "inbound",  event: "account.tag_added",       english: "When somebody tags an account at-risk, tell me so I can look at it before it churns." },
  { motion: "inbound",  event: "connection.connected",    english: "When somebody connects a service, confirm it so we know their accounts are being watched." },
  { motion: "outbound", event: "account.tag_removed",     english: "When an at-risk tag comes off an account, note that it recovered so the team can see what worked." },
  { motion: "outbound", event: "connection.disconnected", english: "When somebody disconnects a service, flag it — their accounts lose silence detection." },
  { motion: "startup",  event: "member.invited",          english: "When somebody is invited to Pulse, flag it if they were invited as an admin rather than a member." },
  { motion: "partner",  event: "member.removed",          english: "When somebody is removed from Pulse, flag it so their accounts can be reassigned." },
  { motion: "any",      event: "account.reassigned",      english: "When an account changes owner, flag it if the new owner already has a large book." },
];

/**
 * One scheduled automation per motion.
 *
 * The cadence is written into the sentence rather than left to the planner's
 * taste, because the whole point of the watch phase is to see cron-job.org
 * actually fire these — and a rule the planner decides to run daily proves
 * nothing inside one night. Narrow queries on purpose: every row a pass
 * fetches is an agent call, and these stay live after the run.
 */
const SCHEDULE_CASES = [
  { motion: "inbound",  english: "Every 15 minutes, list customer accounts created in the last hour that have not sent a single message yet, so somebody can greet them." },
  { motion: "outbound", english: "Every 30 minutes, find accounts whose balance has dropped below fifty rupees, so somebody can talk to them before they stop sending." },
  { motion: "startup",  english: "Every hour, find accounts that signed up in the last day and have still sent nothing, and tell me which ones look worth a call." },
  { motion: "partner",  english: "Every hour, find reseller accounts whose balance is close to zero, so their partner can be told before their customers are cut off." },
  { motion: "any",      english: "Every 15 minutes, list the accounts whose balance went negative, because that should never happen and somebody has to look." },
];

/* ── state ──────────────────────────────────────────────────────────────── */

function loadState() {
  if (!existsSync(STATE_PATH)) return { builtAt: null, event: [], schedule: [], findings: [] };
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

function saveState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 1));
}

const state = loadState();

/* ── output ─────────────────────────────────────────────────────────────── */

const findings = [];
function say(...a) { console.log(a.join(" ")); }
function finding(where, what) {
  findings.push({ where, what });
  say(`   ✗ ${what}`);
}
const stamp = () => new Date().toISOString().slice(11, 19);

/* ── store helpers ──────────────────────────────────────────────────────── */

const ROW_COLUMNS = `automation_key, motion, scope, trigger_kind, when_event, mode,
  every_minutes, find_sql, subject_col, watermark_col, agent_task, cron_job_id, live, state,
  capability, max_rows, run_count, alert_count, last_run_at, next_run_at, last_error`;

async function row(key) {
  const rows = await read(`SELECT ${ROW_COLUMNS} FROM pulse_automation WHERE automation_key = ?`, [key]);
  return rows[0] ?? null;
}

async function decisionsFor(key, limit = 5) {
  return read(
    `SELECT verdict, action_taken, error_code, at FROM pulse_decision
      WHERE policy_version = ? ORDER BY id DESC LIMIT ${Number(limit)}`,
    [key],
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * How many rows a stored find_sql matches right now, on the same read-only
 * connection the runner uses. Null when it cannot be counted at all — an
 * unknown is reported as an unknown rather than as a zero.
 */
async function countRows(sql) {
  if (!sql) return null;
  try {
    const { query } = await import("../lib/db.ts");
    const rows = await query(`SELECT COUNT(*) AS n FROM (${String(sql).replace(/;\s*$/, "")}) __count`);
    return Number(rows[0]?.n ?? 0);
  } catch {
    return null;
  }
}

/**
 * Wait for an automation's run_count to move past what it was.
 *
 * Every trigger here is asynchronous on the far side: a route answers before
 * its `after()` work finishes, and cron-job.org fires on its own clock. So a
 * check straight after the trigger reads the old number and calls a working
 * automation broken. Polling is the honest way to ask "did it run yet".
 */
async function waitForRun(key, was, timeoutMs, everyMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let last = was;
  while (Date.now() < deadline) {
    await sleep(everyMs);
    const r = await row(key);
    if (!r) return { moved: false, row: null };
    last = Number(r.run_count);
    if (last > was) return { moved: true, row: r };
  }
  return { moved: false, row: await row(key), last };
}

/* ── phase 1: build ─────────────────────────────────────────────────────── */

async function build(token) {
  say(`\n═══ BUILD — every motion, through the deployed Rules route ═══`);
  say(`base: ${base()}\n`);

  for (const c of [...EVENT_CASES, ...SCHEDULE_CASES]) {
    const kind = c.event ? "event" : "schedule";
    if (ONLY && !`${c.motion} ${c.event ?? ""} ${c.english}`.includes(ONLY)) continue;

    /* Already built on an earlier invocation — don't pay for it twice. */
    const done = [...state.event, ...state.schedule].find(
      (x) => x.motion === c.motion && (x.event ?? null) === (c.event ?? null),
    );
    if (done) { say(`── ${kind}/${c.motion}${c.event ? ` ${c.event}` : ""}: already built as ${done.key}`); continue; }

    say(`── ${kind}/${c.motion}${c.event ? ` ${c.event}` : ""}`);
    say(`   rule: ${c.english.slice(0, 90)}${c.english.length > 90 ? "…" : ""}`);

    const t0 = Date.now();
    const res = await api(token, "POST", "/api/pulse/autopilot/build", {
      english: c.english,
      motion: c.motion,
      ...(c.event ? { eventName: c.event } : {}),
    });
    const ms = Date.now() - t0;

    if (res.status !== 200 || !res.json?.ok) {
      finding(`build ${c.motion}/${kind}`, `build returned ${res.status} at step "${res.json?.step ?? "?"}": ${res.json?.error ?? res.text.slice(0, 200)}`);
      continue;
    }
    const key = res.json.key;
    say(`   built: ${key} (${ms}ms)`);

    const r = await row(key);
    if (!r) { finding(`build ${c.motion}/${kind}`, `${key}: build said ok but no row exists`); continue; }

    /* What the row has to look like for anything to ever run it. */
    if (r.motion !== c.motion) finding(key, `motion stored as "${r.motion}", asked for "${c.motion}"`);
    if (!r.live) finding(key, "saved but not live, so nothing will run it");
    if (r.capability !== "ready") finding(key, `capability is "${r.capability}"`);

    if (c.event) {
      if (r.trigger_kind !== "event") finding(key, `trigger_kind "${r.trigger_kind}", expected "event"`);
      if (r.when_event !== c.event) finding(key, `when_event "${r.when_event}", expected "${c.event}"`);
      if (r.find_sql) finding(key, "an event automation was given a find_sql, which it must not have");
      if (!r.agent_task) finding(key, "no agent_task, so the worker has no instruction to judge with");
      say(`   stored: trigger=${r.trigger_kind} event=${r.when_event} live=${r.live}`);
      state.event.push({ key, motion: c.motion, event: c.event, english: c.english });
    } else {
      if (r.trigger_kind !== "schedule") finding(key, `trigger_kind "${r.trigger_kind}", expected "schedule"`);
      if (!r.find_sql) finding(key, "a scheduled automation with no find_sql cannot find anything");
      if (!r.cron_job_id) finding(key, "no cron-job.org job, so nothing will ever call its webhook");
      /* The cadence has to be on the row as well as at cron-job.org: it is
         what recordRun turns into next_run_at, and therefore what the
         internal tick's due() honours. NULL means recordRun falls back to
         five minutes and the tick re-runs this far more often than its own
         schedule says. */
      if (r.every_minutes == null) {
        finding(key, "every_minutes is NULL — the internal tick will re-run this every five minutes regardless of its registered schedule");
      }
      say(`   stored: cron_job=${r.cron_job_id} every_minutes=${r.every_minutes} schedule=${res.json.cronSchedule}`);
      say(`   sql: ${String(r.find_sql).replace(/\s+/g, " ").slice(0, 110)}…`);
      state.schedule.push({
        key, motion: c.motion, english: c.english,
        cronJobId: r.cron_job_id, cronSchedule: res.json.cronSchedule,
        everyMinutes: r.every_minutes, runCountAtBuild: Number(r.run_count),
      });
    }
    state.builtAt = new Date().toISOString();
    saveState(state);
  }
}

/* ── phase 2: fire the events for real ──────────────────────────────────── */

/**
 * Pick the account and rep the reassignment case needs, off the deployed
 * app's own listing rather than by guessing an id out of the database.
 */
async function pickSubjects(token) {
  const accounts = await api(token, "GET", "/api/pulse/accounts?limit=5");
  const list = accounts.json?.accounts ?? accounts.json?.items ?? accounts.json?.rows ?? [];
  const account = list.find((a) => a?.id) ?? null;

  const reps = await api(token, "GET", "/api/pulse/team?view=assignable");
  const repList = reps.json?.reps ?? reps.json?.items ?? reps.json?.rows ?? [];
  return { account, reps: repList, accountsStatus: accounts.status, repsStatus: reps.status };
}

/**
 * Every trigger is written to put the world back the way it found it: the tag
 * is added and then removed, the owner is set and then set back, the invited
 * member is removed, the connected service is disconnected. Two of those
 * restores are themselves the trigger for another case, which is why the
 * pairs are run together rather than cleaned up at the end.
 */
async function fireEvents(token) {
  say(`\n═══ EVENTS — fired through the real routes ═══\n`);

  const { account, reps, accountsStatus, repsStatus } = await pickSubjects(token);
  if (!account) {
    finding("events", `could not read an account to test with (GET /api/pulse/accounts → ${accountsStatus})`);
    return;
  }
  say(`subject account: ${account.id} ${account.name ?? ""} (owner ${account.owner?.id ?? "none"})`);

  const byEvent = new Map(state.event.map((e) => [e.event, e]));

  /** Run one trigger and check that the automation listening for it moved. */
  async function trigger(eventName, label, fn) {
    const listener = byEvent.get(eventName);
    if (!listener) { say(`── ${eventName}: no automation built for it, skipping`); return; }

    const before = await row(listener.key);
    if (!before) { finding(listener.key, "row vanished before its event was fired"); return; }

    say(`── ${eventName}  (${listener.key})`);
    say(`   ${label}`);
    const res = await fn();
    if (res && res.status >= 400) {
      finding(eventName, `the real action failed: ${res.status} ${res.json?.error ?? res.text?.slice(0, 160)}`);
      return;
    }
    say(`   action: ${res?.status ?? "ok"}`);

    /* 150s: one judging call is 15-25s against the shared rule-worker, and
       the route's own maxDuration is 300. */
    const t0 = Date.now();
    const { moved, row: after } = await waitForRun(listener.key, Number(before.run_count), 150_000);
    if (!moved) {
      finding(listener.key, `the event fired but run_count never moved (still ${after?.run_count}) — the automation did not run in production`);
      return;
    }
    say(`   ran: ${Math.round((Date.now() - t0) / 1000)}s  run_count ${before.run_count}→${after.run_count}  alerts ${before.alert_count}→${after.alert_count}`);
    if (after.last_error) finding(listener.key, `ran with an error: ${after.last_error}`);

    const d = await decisionsFor(listener.key, 3);
    say(`   decisions: ${d.length} (${d.map((x) => x.verdict).join(", ") || "none"})`);
    if (!d.length) finding(listener.key, "no pulse_decision row was written, so the run is invisible in the Log");
  }

  const TAG = "pulse-live-test";

  await trigger("account.tag_added", `POST /api/pulse/accounts/${account.id}/tags {"${TAG}"}`, () =>
    api(token, "POST", `/api/pulse/accounts/${account.id}/tags`, { tag: TAG }));

  await trigger("account.tag_removed", `DELETE /api/pulse/accounts/${account.id}/tags?tag=${TAG}`, () =>
    api(token, "DELETE", `/api/pulse/accounts/${account.id}/tags?tag=${TAG}`));

  /* Reassignment: to somebody else, then straight back to whoever held it. */
  const currentOwner = account.owner?.id ?? null;
  const other = reps.find((r) => r.id && r.id !== currentOwner);
  if (!other) {
    finding("account.reassigned", `no second rep to reassign to (GET /api/pulse/team?view=assignable → ${repsStatus}, ${reps.length} reps)`);
  } else {
    await trigger("account.reassigned", `PUT /api/pulse/accounts/${account.id}/owner {ownerId:${other.id}}`, () =>
      api(token, "PUT", `/api/pulse/accounts/${account.id}/owner`, { ownerId: other.id, note: "live automation test" }));
    const back = await api(token, "PUT", `/api/pulse/accounts/${account.id}/owner`, {
      ownerId: currentOwner, note: "live automation test — restoring previous owner",
    });
    say(`   owner restored to ${currentOwner ?? "nobody"}: ${back.status}`);
  }

  /* Membership: invite a clearly-labelled test address, then remove it. */
  const testEmail = "pulse-automation-test@msg91.com";
  let invitedId = null;
  await trigger("member.invited", `POST /api/pulse/members {${testEmail}}`, async () => {
    const res = await api(token, "POST", "/api/pulse/members", { email: testEmail, role: "member" });
    invitedId = res.json?.member?.id ?? null;
    return res;
  });
  if (invitedId === null) {
    const all = await api(token, "GET", "/api/pulse/members");
    invitedId = (all.json?.members ?? []).find((m) => m.email === testEmail)?.id ?? null;
  }
  if (invitedId === null) {
    finding("member.removed", "the invited test member could not be found, so removal was not tested");
  } else {
    await trigger("member.removed", `DELETE /api/pulse/members/${invitedId}`, () =>
      api(token, "DELETE", `/api/pulse/members/${invitedId}`));
  }

  /* Connections: slack, because it is the one service with no OAuth side
     effects — the route only records state for the signed-in member. */
  await trigger("connection.connected", `POST /api/pulse/connections {slack, connected}`, () =>
    api(token, "POST", "/api/pulse/connections", { service: "slack", action: "connected" }));

  await trigger("connection.disconnected", `POST /api/pulse/connections {slack, disconnected}`, () =>
    api(token, "POST", "/api/pulse/connections", { service: "slack", action: "disconnected" }));
}

/* ── phase 3: wait for cron-job.org to fire the scheduled ones ──────────── */

async function watch(minutes) {
  say(`\n═══ WATCH — waiting for cron-job.org to fire the scheduled automations ═══`);
  say(`   nothing here calls the webhook; this only watches. up to ${minutes} minutes.\n`);

  const deadline = Date.now() + minutes * 60_000;
  const fired = new Set();

  while (Date.now() < deadline && fired.size < state.schedule.length) {
    for (const s of state.schedule) {
      if (fired.has(s.key)) continue;
      const r = await row(s.key);
      if (!r) { finding(s.key, "scheduled automation row disappeared"); fired.add(s.key); continue; }
      if (Number(r.run_count) > (s.runCountAtBuild ?? 0)) {
        fired.add(s.key);
        say(`${stamp()}  FIRED  ${s.key}`);
        say(`          every_minutes=${r.every_minutes} run_count=${r.run_count} alerts=${r.alert_count} last_run=${r.last_run_at}`);
        if (r.last_error) finding(s.key, `cron fire ran with an error: ${r.last_error}`);
        const d = await decisionsFor(s.key, 3);
        say(`          decisions: ${d.length} (${d.map((x) => x.verdict).join(", ") || "none"})`);
        /* No decision row is only a problem if there was something to decide.
           A rule whose query legitimately matched nothing writes none, and
           that is the rule working — so the query is re-counted here rather
           than reading the absence as a failure. */
        if (!d.length && !r.last_error) {
          const matched = await countRows(r.find_sql);
          if (matched === null) {
            say("          (its query could not be re-counted, so no decision row is not conclusive)");
          } else if (matched === 0) {
            say("          no decision row, and its query currently matches 0 rows — nothing to decide");
          } else {
            finding(s.key, `cron fired it and its query matches ${matched} rows, but no pulse_decision row was written`);
          }
        }
      }
    }
    if (fired.size >= state.schedule.length) break;
    say(`${stamp()}  ${fired.size}/${state.schedule.length} fired, still waiting…`);
    await sleep(120_000);
  }

  for (const s of state.schedule) {
    if (!fired.has(s.key)) {
      const r = await row(s.key);
      finding(s.key, `never fired in ${minutes} minutes — registered as "${s.cronSchedule}" with cron-job.org job ${s.cronJobId}; run_count is still ${r?.run_count}`);
    }
  }
}

/* ── report ─────────────────────────────────────────────────────────────── */

async function report() {
  say(`\n═══ WHAT IS LIVE NOW ═══\n`);
  for (const s of [...state.event, ...state.schedule]) {
    const r = await row(s.key);
    if (!r) { say(`MISSING  ${s.key}`); continue; }
    say(
      `${String(r.trigger_kind).padEnd(9)} ${String(r.motion).padEnd(9)} runs=${String(r.run_count).padEnd(4)} ` +
      `alerts=${String(r.alert_count).padEnd(4)} ${r.when_event ?? `every ${r.every_minutes}m`}  ${s.key}`,
    );
    if (r.last_error) say(`          last_error: ${r.last_error}`);
  }
}

/* ── main ───────────────────────────────────────────────────────────────── */

const token = await session();

if (PHASES.build) await build(token);
if (PHASES.events) await fireEvents(token);
if (PHASES.watch) await watch(DEFAULT_WATCH_MINUTES);
await report();

say(`\n═══ FINDINGS ═══\n`);
if (!findings.length) say("none — everything built, ran and recorded a decision.");
for (const f of findings) say(`· [${f.where}] ${f.what}`);

state.findings = [...(state.findings ?? []), ...findings];
saveState(state);
say(`\nstate: ${STATE_PATH}`);
process.exit(findings.length ? 1 : 0);
