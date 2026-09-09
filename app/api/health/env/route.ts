import { NextResponse } from "next/server";

/**
 * GET /api/health/env?secret=… — is the host handing us any configuration?
 *
 * Written for one question that is otherwise very hard to answer from outside a
 * deploy: did the platform actually inject the environment, or is the app
 * running on defaults? A missing variable and a variable set to the wrong thing
 * fail identically from the browser, and the app's own error messages can only
 * say "not set".
 *
 * It reports whether each name is populated, how long the value is, and a short
 * fingerprint — never the value. A deploy URL is reachable by anyone who knows
 * it, and half of these are credentials; an endpoint that echoed them back
 * would be a worse problem than the one it diagnoses. The fingerprint is enough
 * to confirm two environments hold the *same* value without revealing either.
 *
 * The middleware lets this through on AUTOPILOT_TICK_SECRET, so it is reachable
 * before anyone can sign in — which is the point, since a broken login is
 * exactly when it is needed.
 */

import { createHash } from "node:crypto";

/** Grouped so a reader can see at a glance which subsystem is unconfigured. */
const GROUPS: { group: string; needed: "required" | "optional"; names: string[] }[] = [
  {
    group: "MSG91 read connection",
    needed: "required",
    names: ["MYSQL_HOST", "MYSQL_PORT", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"],
  },
  {
    group: "Pulse store (writable)",
    needed: "required",
    names: [
      "PULSE_STORE_HOST",
      "PULSE_STORE_PORT",
      "PULSE_STORE_USER",
      "PULSE_STORE_PASSWORD",
      "PULSE_STORE_DATABASE",
      "PULSE_STORE_SSL",
    ],
  },
  {
    group: "Sign-in",
    needed: "required",
    names: ["REFERENCEID", "JWT_SECRET"],
  },
  {
    group: "Autopilot runner",
    needed: "required",
    names: ["AUTOPILOT_TICK_SECRET"],
  },
  {
    group: "AI gateway",
    needed: "optional",
    names: [
      "GTWY_PAUTHKEY",
      "GTWY_BASE_URL",
      "GTWY_AGENT_ID",
      "GTWY_AGENT_SIGNUP_TRIAGE",
      "GTWY_AGENT_OUTREACH_DRAFTER",
      "GTWY_AGENT_ACCOUNT_REVIEW",
      "GTWY_AGENT_PORTFOLIO_DIGEST",
      "GTWY_AGENT_RULE_COMPILER",
    ],
  },
  {
    group: "Optional tuning",
    needed: "optional",
    /* All of these have working defaults in code — PROXY_BASE_URL falls back to
       routes.msg91.com, MYSQL_SSL to false, PROXY_ADMIN_TOKEN to the
       no-admin-key login path. Listing them as required made the check report
       a failure while everything it actually needs was present. */
    names: [
      "PROXY_BASE_URL",
      "PROXY_ADMIN_TOKEN",
      "MYSQL_SSL",
      "PULSE_ME_USER_PID",
      "PULSE_OWNER_NAME",
      "PULSE_SKIP_MIGRATE",
      "MYSQL_POOL_LIMIT",
      "PULSE_STORE_POOL_LIMIT",
      "PORT",
    ],
  },
];

/** Eight hex characters of a salted digest: comparable, not reversible. */
function fingerprint(v: string): string {
  return createHash("sha256").update(`pulse-env::${v}`).digest("hex").slice(0, 8);
}

/* A value that is only a placeholder is worse than an unset one — it looks
   configured and fails at connect time. Same check lib/db.ts makes. */
const PLACEHOLDER = /^<.*>$/;

export async function GET() {
  const secretSet = Boolean((process.env.AUTOPILOT_TICK_SECRET ?? "").trim());
  if (!secretSet) {
    return NextResponse.json(
      { ok: false, error: "AUTOPILOT_TICK_SECRET is not set, so this endpoint refuses to answer." },
      { status: 503 },
    );
  }

  let anySet = 0;
  let missingRequired: string[] = [];

  const groups = GROUPS.map((g) => ({
    group: g.group,
    needed: g.needed,
    vars: g.names.map((name) => {
      const raw = process.env[name];
      const value = (raw ?? "").trim();
      const set = value.length > 0;
      if (set) anySet++;
      const placeholder = set && PLACEHOLDER.test(value);
      if (g.needed === "required" && !set) missingRequired.push(name);
      return {
        name,
        set,
        placeholder,
        length: set ? value.length : 0,
        fingerprint: set ? fingerprint(value) : null,
      };
    }),
  }));

  return NextResponse.json({
    ok: missingRequired.length === 0,
    /* The headline. Zero populated variables means the platform is not
       injecting configuration at all, which is a different fix from a typo in
       one name. */
    injecting: anySet > 0,
    populated: anySet,
    missingRequired,
    runtime: {
      NODE_ENV: process.env.NODE_ENV ?? null,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME ?? null,
      node: process.version,
    },
    note:
      "Values are never returned. `fingerprint` is 8 hex characters of a salted " +
      "digest — equal fingerprints mean equal values, which is enough to check " +
      "that two environments agree.",
    groups,
  });
}

export const dynamic = "force-dynamic";
