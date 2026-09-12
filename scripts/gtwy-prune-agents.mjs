/**
 * Delete the GTWY agents Pulse minted per-rule and then stopped using.
 *
 * Before commit 83c9123 every dynamically-built automation got its own chatbot
 * agent on db.gtwy.ai. That design is gone — automations now share the one
 * ruleWorker agent — but the agents it created were never cleaned up, and
 * nothing in Pulse points at them any more. Twelve of them were still in org
 * 78192, referenced only by two retired rows.
 *
 * Deliberately narrow. It deletes agents whose name begins with
 * `pulse-auto-dyn-` and nothing else: those are unambiguously Pulse's own
 * leftovers. Anything else in the org — including the untitled agents — may
 * belong to another project and is left alone, because "not referenced by this
 * repo" is not the same as "unused" when an org is shared.
 *
 * It also refuses to delete an agent that any non-retired automation still
 * names, whatever it is called.
 *
 *   GTWY_TOKEN=<jwt> node --experimental-strip-types scripts/gtwy-prune-agents.mjs
 *   GTWY_TOKEN=<jwt> node --experimental-strip-types scripts/gtwy-prune-agents.mjs --apply
 *
 * The token is the one the browser sends as `authorization` on app.gtwy.ai —
 * it is short-lived, so it is read from the environment rather than stored.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./live-http.mjs";

loadEnv();
register(new URL("./event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const API = "https://db.gtwy.ai/api";
const TOKEN = (process.env.GTWY_TOKEN ?? "").trim();
const APPLY = process.argv.includes("--apply");
const PREFIX = "pulse-auto-dyn-";

if (!TOKEN) {
  console.error("GTWY_TOKEN is not set. Copy the `authorization` header from an app.gtwy.ai request.");
  process.exit(1);
}

async function api(method, path) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: TOKEN, accept: "application/json" },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { status: res.status, json, text };
}

const list = await api("GET", "/agent/");
if (list.status !== 200 || !list.json?.agent) {
  console.error(`could not list agents: ${list.status} ${list.text.slice(0, 200)}`);
  process.exit(1);
}
/* GTWY deletes softly: DELETE /agent/:id sets deletedAt and the list keeps
   returning the row (see deleteAgentController in AI-middleware). Counting by
   name alone therefore reports twelve orphans still present immediately after
   deleting twelve orphans, which reads as a total failure when nothing failed.
   Anything already carrying deletedAt is done. */
const all = list.json.agent;
const agents = all.filter((a) => !a.deletedAt);
const alreadyGone = all.length - agents.length;
console.log(
  `${all.length} agent(s) returned — ${agents.length} live, ${alreadyGone} already deleted`,
);

/* Whatever Pulse still points at, from its own config and its own rows —
   checked rather than assumed, because the whole reason these leaked is that
   nobody was checking. */
const pinned = new Set(
  Object.entries(process.env)
    .filter(([k]) => k.startsWith("GTWY_AGENT"))
    .map(([, v]) => (v ?? "").trim())
    .filter(Boolean),
);
const { read } = await import("../lib/store.ts");
const rows = await read(
  `SELECT DISTINCT gtwy_agent_id FROM pulse_automation
    WHERE gtwy_agent_id IS NOT NULL AND gtwy_agent_id <> '' AND state <> 'retired'`,
);
for (const r of rows) pinned.add(String(r.gtwy_agent_id));
console.log(`${pinned.size} agent id(s) are still referenced by config or a live rule`);

const doomed = agents.filter((a) => (a.name || "").startsWith(PREFIX) && !pinned.has(a._id));
const spared = agents.filter((a) => (a.name || "").startsWith(PREFIX) && pinned.has(a._id));

for (const s of spared) console.log(`keeping (still referenced): ${s._id}  ${s.name}`);
console.log(`\n${doomed.length} orphan(s) named ${PREFIX}*:`);
for (const d of doomed) console.log(`  ${d._id}  ${d.name}`);

if (!doomed.length) process.exit(0);
if (!APPLY) {
  console.log(`\nreport only — re-run with --apply to delete them.`);
  process.exit(0);
}

let gone = 0;
for (const d of doomed) {
  const res = await api("DELETE", `/agent/${d._id}`);
  const ok = res.status >= 200 && res.status < 300 && res.json?.success !== false;
  if (ok) gone++;
  console.log(`${ok ? "deleted" : "FAILED "}  ${res.status}  ${d._id}  ${d.name}`);
  if (!ok) console.log(`          ${res.text.slice(0, 160)}`);
}
console.log(`\ndeleted ${gone} of ${doomed.length}`);
process.exit(0);
