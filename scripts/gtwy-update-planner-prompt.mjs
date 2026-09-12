/**
 * Teach the automation planner about enrich_sql.
 *
 * The planner's prompt lives on GTWY (db.gtwy.ai), not in this repo. Pulse
 * passes it variables — {{today}}, {{motion}}, {{english}}, {{schema}},
 * {{fields}} — but the JSON contract it must answer with is written into the
 * agent itself. So adding a key to AutomationPlanSchema in agents.ts is only
 * half the change: until the prompt asks for enrich_sql, the planner will
 * never emit one and every event rule will carry an empty enrichment.
 *
 * This rewrites only `configuration.prompt.instruction` on the planner's
 * current version, leaving role, goal, model and everything else untouched.
 * It prints the before and after and changes nothing without --apply.
 *
 *   GTWY_TOKEN=<jwt> node scripts/gtwy-update-planner-prompt.mjs
 *   GTWY_TOKEN=<jwt> node scripts/gtwy-update-planner-prompt.mjs --apply
 *
 * The agent id comes from GTWY_AGENT_AUTOMATION_PLANNER in .env.local, so this
 * always edits the planner Pulse actually calls rather than one named like it.
 */

import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const API = "https://db.gtwy.ai/api";
const TOKEN = (process.env.GTWY_TOKEN ?? "").trim();
const AGENT = (process.env.GTWY_AGENT_AUTOMATION_PLANNER ?? "").trim();
const APPLY = process.argv.includes("--apply");

if (!TOKEN) { console.error("GTWY_TOKEN is not set."); process.exit(1); }
if (!AGENT) { console.error("GTWY_AGENT_AUTOMATION_PLANNER is not set in .env.local."); process.exit(1); }

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: TOKEN, "content-type": "application/json", accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { status: res.status, json, text };
}

const got = await api("GET", `/agent/${AGENT}`);
if (got.status !== 200 || !got.json?.agent) {
  console.error(`could not read the planner: ${got.status} ${got.text.slice(0, 200)}`);
  process.exit(1);
}
const agent = got.json.agent;
const prompt = agent.configuration?.prompt ?? {};
const versionId = (agent.versions ?? [])[0] ?? agent.published_version_id;
if (!versionId) { console.error("the planner has no version to update."); process.exit(1); }

console.log(`agent   : ${agent.name} (${agent._id})`);
console.log(`version : ${versionId}`);

if ((prompt.instruction ?? "").includes("enrich_sql")) {
  console.log("\nenrich_sql is already in the prompt — nothing to do.");
  process.exit(0);
}

/* Inserted rather than rewritten: the existing instruction carries hard-won
   detail (never invent a column, say so in optimized_rule_prompt when the
   schema cannot answer the rule) that must survive. */
const KEY_ANCHOR =
  `subject_col (the column identifying the row`;
const ENRICH_KEY =
  `enrich_sql (event rules ONLY — empty string for cron rules. One read-only MySQL SELECT, run at the ` +
  `moment the event fires, that fetches the facts the event payload does NOT carry. Refer to payload ` +
  `fields as :name placeholders, e.g. "SELECT user_bal, user_date FROM ms_user WHERE user_pid = :accountId". ` +
  `They are bound as query parameters, never pasted into the SQL, so a placeholder is the only way to use a ` +
  `payload value. Use ONLY placeholder names that appear in this event's payload shape. Prefer a query that ` +
  `returns exactly one row — the subject of the event — and select only the columns the rule actually needs. ` +
  `Leave it as an empty string when the payload alone is enough to decide), `;

if (!prompt.instruction?.includes(KEY_ANCHOR)) {
  console.error("\ncould not find the place to insert the key — the prompt has changed shape. Not touching it.");
  process.exit(1);
}

const GUIDANCE =
  `\n\nWhen mode=event, remember the payload is mostly identifiers. Decide honestly whether the rule can be ` +
  `answered from it alone. "Flag if they were invited as an admin" can — the role is in the payload. ` +
  `"Alert me if their balance is low", "flag if the new owner already has a large book", and "list the ` +
  `accounts they owned" cannot, and each needs enrich_sql. A rule that needs a fact it never fetched will ` +
  `only ever restate the event back to the person who caused it.`;

const instruction = prompt.instruction.replace(KEY_ANCHOR, ENRICH_KEY + KEY_ANCHOR) + GUIDANCE;

console.log(`\n--- instruction grows from ${prompt.instruction.length} to ${instruction.length} chars ---`);
console.log(`\ninserted key:\n${ENRICH_KEY.slice(0, 260)}…`);
console.log(`\nappended guidance:\n${GUIDANCE.trim().slice(0, 260)}…`);

if (!APPLY) {
  console.log(`\ndry run — nothing written. Re-run with --apply.`);
  process.exit(0);
}

const put = await api("PUT", `/versions/${versionId}`, {
  configuration: { prompt: { ...prompt, instruction } },
  agent_info: { variables_state: {} },
});
if (put.status < 200 || put.status >= 300 || put.json?.success === false) {
  console.error(`update failed: ${put.status} ${put.text.slice(0, 300)}`);
  process.exit(1);
}
/* A PUT writes the version as a draft; GET /agent returns the published
   snapshot, so without this the prompt looks unchanged everywhere Pulse
   actually reads it — the update appears to have silently done nothing.
   The empty body is required: this endpoint answers 411 to a POST with no
   Content-Length. */
const pub = await api("POST", `/versions/publish/${versionId}`, {});
if (pub.status < 200 || pub.status >= 300 || pub.json?.success === false) {
  console.error(`written, but publishing failed: ${pub.status} ${pub.text.slice(0, 300)}`);
  console.error(`The draft holds the change; publish version ${versionId} from the GTWY UI.`);
  process.exit(1);
}

console.log(`\nupdated and published. Re-reading to confirm…`);

const back = await api("GET", `/agent/${AGENT}`);
const now = back.json?.agent?.configuration?.prompt?.instruction ?? "";
console.log(now.includes("enrich_sql")
  ? "confirmed: enrich_sql is in the planner's prompt."
  : "WARNING: the read-back does not contain enrich_sql.");
process.exit(0);
