/**
 * The overnight batch: build 45 automations on production and report what broke.
 *
 * Every rule comes from the run plan, and every table named in one is a real
 * table — that is deliberate. The planner's worst failure mode is inventing a
 * column for a table it was never told about, so the rules are written against
 * the schema on purpose to give it a correct anchor.
 *
 * Runs against the deployed app only. Builds go through POST
 * /api/pulse/autopilot/build, the same endpoint the Rules page's own box calls,
 * with a session minted locally from JWT_SECRET (scripts/live-http.mjs) — the
 * route needs a real signed-in super_admin and no machine secret opens it.
 *
 *   node --experimental-strip-types scripts/run-batch45.mjs            # all 45
 *   node --experimental-strip-types scripts/run-batch45.mjs --only=17  # the tiers
 *   node --experimental-strip-types scripts/run-batch45.mjs --gap=20   # seconds
 *
 * Resumable by design. State is written after every single case, so a killed
 * run, a dropped connection or a rate limit that outlasts its retries all leave
 * the work done so far intact — re-running skips what already succeeded rather
 * than paying for it twice. Nothing is deleted at the end: the point is to have
 * something to inspect in the morning.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { loadEnv, session, api, base } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const ARGS = process.argv.slice(2);
const val = (n, d) => {
  const hit = ARGS.find((a) => a.startsWith(`--${n}=`));
  return hit === undefined ? d : hit.slice(n.length + 3);
};
const CASES_PATH = val("cases", "/tmp/claude-1000/-home-lavish-Desktop-MSG91-Pulse-pulse-next/e10f958b-5cc2-4689-ab45-284b54320a43/scratchpad/batch45.json");
const STATE_PATH = val("state", "/tmp/claude-1000/-home-lavish-Desktop-MSG91-Pulse-pulse-next/e10f958b-5cc2-4689-ab45-284b54320a43/scratchpad/batch45-state.json");
const ONLY = Number(val("only", "0"));
/* Seconds between builds. cron-job.org rate-limits job registration and Pulse
   registers one per scheduled rule; the client retries a 429 now, but not
   tripping it at all is cheaper than backing off forty times. */
const GAP_MS = Number(val("gap", "15")) * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString().slice(11, 19);

const all = JSON.parse(readFileSync(CASES_PATH, "utf8"));

/** One low, one med, one high per motion, plus every event — the tiers that matter. */
function tiers(cases) {
  const picked = [];
  for (const motion of ["inbound", "outbound", "startup", "partner"]) {
    for (const level of ["low", "med", "high"]) {
      const hit = cases.find((c) => c.motion === motion && c.level === level && c.kind === "schedule");
      if (hit) picked.push(hit);
    }
  }
  return picked.concat(cases.filter((c) => c.kind === "event"));
}

const cases = ONLY ? tiers(all).slice(0, ONLY) : all;

function loadState() {
  if (!existsSync(STATE_PATH)) return { started: new Date().toISOString(), results: {} };
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}
function saveState(s) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 1));
}

const state = loadState();

/**
 * A fresh session per build, not one for the whole run.
 *
 * signSession() mints a token with the app's real TTL, and a 45-case batch at
 * ~35s a build plus a 25s gap runs well past it. The first run of this died at
 * case 36 with "401 Not signed in" and then failed the last ten in a fifth of a
 * second each — which reads exactly like the app rejecting the work, and is
 * actually the clock.
 *
 * Minting is local JWT signing against a secret already in memory, so it costs
 * nothing next to a 35-second build.
 */
const freshToken = () => session();

console.log(`base   : ${base()}`);
console.log(`cases  : ${cases.length}${ONLY ? ` (tiers of ${all.length})` : ""}`);
console.log(`gap    : ${GAP_MS / 1000}s between builds`);
console.log(`state  : ${STATE_PATH}`);
console.log(`${"═".repeat(74)}`);

let built = 0, failed = 0, skipped = 0;

for (const [i, c] of cases.entries()) {
  const prior = state.results[c.id];
  if (prior && prior.ok) {
    skipped++;
    console.log(`${stamp()}  ${String(i + 1).padStart(2)}/${cases.length}  ${c.id.padEnd(20)} already built — skipping`);
    continue;
  }

  const body = { english: c.english, motion: c.motion };
  if (c.kind === "event") body.eventName = c.eventName;

  const t0 = Date.now();
  let res;
  try {
    res = await api(await freshToken(), "POST", "/api/pulse/autopilot/build", body);
  } catch (err) {
    res = { status: 0, json: null, text: String(err && err.message) };
  }
  const ms = Date.now() - t0;
  const ok = Boolean(res.json && res.json.ok);

  state.results[c.id] = {
    ok,
    at: new Date().toISOString(),
    ms,
    status: res.status,
    motion: c.motion,
    level: c.level,
    kind: c.kind,
    english: c.english,
    key: ok ? res.json.key : null,
    mode: ok ? res.json.mode : null,
    findSql: ok ? (res.json.findSql || "") : null,
    /* The step matters more than the message: "plan" is the model, "guard" and
       "dry_run" are the query, "cron" is cron-job.org, "save" is us. */
    step: ok ? null : (res.json && res.json.step) || null,
    error: ok ? null : (res.json && res.json.error) || res.text?.slice(0, 400) || `HTTP ${res.status}`,
  };
  saveState(state);

  if (ok) {
    built++;
    console.log(`${stamp()}  ${String(i + 1).padStart(2)}/${cases.length}  ${c.id.padEnd(20)} ok    ${String(ms / 1000).slice(0, 4)}s  ${res.json.key}`);
  } else {
    failed++;
    const s = state.results[c.id];
    console.log(`${stamp()}  ${String(i + 1).padStart(2)}/${cases.length}  ${c.id.padEnd(20)} FAIL  ${String(ms / 1000).slice(0, 4)}s  [${s.step || res.status}] ${String(s.error).slice(0, 130)}`);
  }

  if (i < cases.length - 1) await sleep(GAP_MS);
}

console.log(`${"═".repeat(74)}`);
console.log(`built ${built} · failed ${failed} · already done ${skipped}`);

/* Group the failures by step, because that is the actionable axis: every rule
   that died at "plan" is one story about the model, every rule that died at
   "cron" is one story about a third party, and they need different fixes. */
const byStep = {};
for (const r of Object.values(state.results)) {
  if (r.ok) continue;
  (byStep[r.step || "http"] ||= []).push(r);
}
if (Object.keys(byStep).length) {
  console.log(`\nfailures by step:`);
  for (const [step, rows] of Object.entries(byStep)) {
    console.log(`\n  ${step} — ${rows.length}`);
    for (const r of rows) console.log(`    ${r.motion}/${r.level}: ${String(r.error).slice(0, 150)}`);
  }
}
process.exit(0);
