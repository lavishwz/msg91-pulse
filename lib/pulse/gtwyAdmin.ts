/**
 * GTWY admin client — creates and configures agents on db.gtwy.ai.
 *
 * Separate from gtwy.ts on purpose: gtwy.ts calls agents (api.gtwy.ai, a
 * pauthkey), this file provisions them (db.gtwy.ai, an org admin JWT). One
 * automation build needs both — create the agent here, then every run of
 * that automation calls it through gtwy.ts like any other.
 *
 * The free/shared key this org has only answers for gpt-5-nano. Any other
 * model comes back "Could not find api key or Agent is not Published" even
 * though the agent itself is published — found by testing, not documented.
 * So every agent created here is pinned to gpt-5-nano; do not make this
 * configurable without re-checking that first.
 */

const DEFAULT_BASE_URL = "https://db.gtwy.ai";
const MODEL = "gpt-5-nano";

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
    throw new GtwyAdminError(
      "GTWY_ADMIN_TOKEN is not set. Add the org admin JWT to .env.local.",
    );
  }
  return {
    token,
    baseUrl: ((process.env.GTWY_ADMIN_BASE_URL ?? "").trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
  };
}

async function call(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const { token, baseUrl } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { authorization: token, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await res.text();
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new GtwyAdminError(`GTWY admin API returned non-JSON: ${raw.slice(0, 200)}`, res.status);
  }
  const b = parsed as { success?: boolean; message?: string; error?: unknown };
  if (!res.ok || b.success === false) {
    throw new GtwyAdminError(
      `GTWY admin API error (${res.status}) on ${method} ${path}: ${b.message ?? JSON.stringify(b.error ?? parsed)}`,
      res.status,
    );
  }
  return parsed as Record<string, unknown>;
}

/**
 * Create a chatbot agent, give it a system prompt, and publish it — the
 * three calls a working agent needs (create, set-prompt-on-its-version,
 * publish). Returns the agent id every automation run will call.
 */
export async function createExecutorAgent(
  name: string,
  systemPrompt: string,
): Promise<{ agentId: string; versionId: string }> {
  const created = await call("POST", "/api/agent/", {
    service: "openai",
    model: MODEL,
    bridgeType: "chatbot",
    type: "chat",
    flag: true,
    name,
  });
  const agent = created.agent as { _id: string; versions: string[] };
  const agentId = agent._id;
  const versionId = agent.versions[0];
  if (!agentId || !versionId) {
    throw new GtwyAdminError(`Agent creation returned no id/version: ${JSON.stringify(created)}`);
  }

  // model is deliberately left out of this PUT: including it re-triggers
  // GTWY's "apply this model's defaults" path, which overwrites the prompt
  // we are setting in the same call with the default template. Found by
  // testing — the response echoed the default prompt back until model was
  // dropped from the body.
  await call("PUT", `/api/versions/${versionId}`, {
    configuration: {
      prompt: { role: name, goal: "Execute one Pulse automation.", instruction: systemPrompt },
    },
  });
  await call("POST", `/api/versions/publish/${versionId}`, {});

  return { agentId, versionId };
}

/** Best-effort: an automation being retired should not fail because GTWY is down. */
export async function deleteAgent(agentId: string): Promise<void> {
  try {
    await call("DELETE", `/api/agent/${agentId}`, { restore: false });
  } catch {
    /* not fatal — the row is still retired locally */
  }
}
