/**
 * Talk to the deployed Pulse as a signed-in super_admin.
 *
 * The session cookie is minted locally from JWT_SECRET rather than obtained
 * through the Proxy login widget — the same secret signs it, so the deployed
 * app accepts it exactly as it accepts a browser's. This is what lets a
 * script exercise the real routes (build, tags, owner, members, connections)
 * instead of calling the library functions those routes wrap: the routes are
 * where `after()` lives, and `after()` is what actually fires an event
 * automation in production.
 */
import { readFileSync } from "node:fs";

export function loadEnv(path = new URL("../.env.local", import.meta.url)) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

/* A function, not a const: the env file is loaded by the caller *after* this
   module is imported, so a constant evaluated at import time would always be
   the empty string. */
export function base() {
  return (process.env.PULSE_TEST_BASE || process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
}

export async function session(email = "lavishgehlod@gmail.com", name = "Lavish Gehlod") {
  const { signSession } = await import("../lib/pulse/auth.ts");
  return signSession({ user: { id: "live-test", name, email, initials: "LG" }, org: null });
}

/** One request to the deployed app, with the session cookie attached. */
export async function api(token, method, path, body) {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: {
      cookie: `pulse_session=${token}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { status: res.status, json, text };
}
