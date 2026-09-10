/**
 * GTWY admin client — legacy cleanup only.
 *
 * This used to provision a new GTWY agent per automation. That's gone: every
 * automation now runs through the shared `ruleWorker` agent (see agents.ts
 * and lib/pulse/autopilot/build.ts), the same way the original four
 * automations always have. Nothing creates an agent at build time anymore.
 *
 * What's left is `deleteAgent`, kept only so retiring an automation built
 * before this change can still clean up the dedicated agent it was given —
 * automations.ts calls it conditionally, only when a row still carries a
 * `gtwy_agent_id` from before. New automations never set that column, so
 * this function has a shrinking, not growing, set of callers.
 */

const DEFAULT_BASE_URL = "https://db.gtwy.ai";

export class GtwyAdminError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "GtwyAdminError";
    this.status = status;
  }
}

function config() {
  const token = (process.env.GTWY_ADMIN_TOKEN ?? "").trim();
  if (!token) {
    throw new GtwyAdminError("GTWY_ADMIN_TOKEN is not set.");
  }
  return {
    token,
    baseUrl: ((process.env.GTWY_ADMIN_BASE_URL ?? "").trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
  };
}

/** Best-effort: an automation being retired should not fail because GTWY is down. */
export async function deleteAgent(agentId: string): Promise<void> {
  try {
    const { token, baseUrl } = config();
    await fetch(`${baseUrl}/api/agent/${agentId}`, {
      method: "DELETE",
      headers: { authorization: token, "content-type": "application/json" },
      body: JSON.stringify({ restore: false }),
    });
  } catch {
    /* not fatal — the row is still retired locally, and GTWY_ADMIN_TOKEN may
       simply not be set in this environment, which is expected now. */
  }
}
