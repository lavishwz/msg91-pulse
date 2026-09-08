/**
 * GTWY client.
 *
 * All AI calls in Pulse go through GTWY (api.gtwy.ai) — MSG91's own AI gateway.
 * No model provider is called directly: which model answers, and under what
 * system prompt, is configured on the GTWY agent rather than here.
 *
 * Contract, from AI-middleware:
 *
 *   POST {base}/api/v2/model/chat/completion
 *   headers: pauthkey, Content-Type: application/json
 *   body:    { user, agent_id, thread_id, response_type, variables }
 *
 *   200 { success: true, response: { data: { content, model, finish_reason, … },
 *                                    usage: { input_tokens, output_tokens, … } } }
 *   200 { success: false, error: "…" }
 *
 * A non-default response_format on the agent makes the gateway queue the
 * request and reply `{ success: true, message_id, message: "Your response will
 * be sent through configured means." }` instead of answering inline. Pulse needs
 * the answer in the request, so that case is reported as a configuration problem
 * rather than being mistaken for an empty answer.
 */

const DEFAULT_BASE_URL = "https://api.gtwy.ai";

/** The agent MSG91 provisioned for Pulse. Overridable per environment. */
const DEFAULT_AGENT_ID = "6a9ebec00869a6b2a232c53f";

export type GtwyUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cached_tokens?: number;
};

export type GtwyReply = {
  content: string;
  model: string | null;
  finishReason: string | null;
  usage: GtwyUsage;
  threadId: string;
};

export class GtwyError extends Error {
  readonly code: string;
  readonly status: number | null;

  constructor(message: string, code: string, status: number | null = null) {
    super(message);
    this.name = "GtwyError";
    this.code = code;
    this.status = status;
  }
}

export function isConfigured(): boolean {
  return Boolean((process.env.GTWY_PAUTHKEY ?? "").trim());
}

function config() {
  const pauthkey = (process.env.GTWY_PAUTHKEY ?? "").trim();
  if (!pauthkey) {
    throw new GtwyError(
      "GTWY_PAUTHKEY is not set. Add it to .env.local and restart.",
      "NO_PAUTHKEY",
    );
  }
  return {
    pauthkey,
    baseUrl: ((process.env.GTWY_BASE_URL ?? "").trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    agentId: (process.env.GTWY_AGENT_ID ?? "").trim() || DEFAULT_AGENT_ID,
  };
}

/**
 * A thread id GTWY can group a conversation under.
 *
 * Pulse asks each question independently by default: a fresh thread means no
 * history is replayed, which keeps the call cheap and stops an earlier question
 * from colouring a later answer. Pass a stable id to deliberately keep context
 * across follow-ups.
 */
export function newThreadId(prefix = "pulse"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type ChatOptions = {
  /** The question or instruction. Goes in the `user` field. */
  user: string;
  threadId?: string;
  /** Values for variables declared in the agent's prompt. */
  variables?: Record<string, unknown>;
  agentId?: string;
  /** Milliseconds before the request is abandoned. */
  timeoutMs?: number;
};

/** Send one chat completion and return the assistant's text. */
export async function chat(opts: ChatOptions): Promise<GtwyReply> {
  const { pauthkey, baseUrl, agentId } = config();
  const threadId = opts.threadId ?? newThreadId();
  const url = `${baseUrl}/api/v2/model/chat/completion`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { pauthkey, "Content-Type": "application/json" },
      body: JSON.stringify({
        user: opts.user,
        agent_id: opts.agentId ?? agentId,
        thread_id: threadId,
        response_type: "text",
        variables: opts.variables ?? {},
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    if (e.name === "AbortError") {
      throw new GtwyError("GTWY did not respond in time.", "TIMEOUT");
    }
    throw new GtwyError(`Could not reach GTWY: ${e.message ?? String(err)}`, "UNREACHABLE");
  } finally {
    clearTimeout(timeout);
  }

  const raw = await res.text();
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    throw new GtwyError(
      `GTWY returned ${res.status} with a non-JSON body: ${raw.slice(0, 200)}`,
      "BAD_RESPONSE",
      res.status,
    );
  }

  const b = body as {
    success?: boolean;
    error?: unknown;
    detail?: unknown;
    message?: string;
    message_id?: string;
    response?: { data?: { content?: unknown; model?: unknown; finish_reason?: unknown }; usage?: GtwyUsage };
  };

  if (!res.ok || b.success === false) {
    const detail =
      typeof b.error === "string"
        ? b.error
        : typeof b.detail === "string"
          ? b.detail
          : JSON.stringify(b.error ?? b.detail ?? b.message ?? raw.slice(0, 200));
    const code =
      res.status === 401 || res.status === 403
        ? "AUTH"
        : res.status === 429
          ? "RATE_LIMIT"
          : "GTWY_ERROR";
    throw new GtwyError(`GTWY error (${res.status}): ${detail}`, code, res.status);
  }

  // The agent is configured to deliver asynchronously — no inline answer.
  if (b.message_id && !b.response) {
    throw new GtwyError(
      `Agent ${opts.agentId ?? agentId} is configured to deliver responses out of band ` +
        `("${b.message}"). Pulse needs the answer inline — set the agent's response format to default.`,
      "ASYNC_AGENT",
      res.status,
    );
  }

  const data = b.response?.data;
  const content = typeof data?.content === "string" ? data.content : "";
  if (!content.trim()) {
    throw new GtwyError("GTWY returned an empty answer.", "EMPTY", res.status);
  }

  return {
    content,
    model: typeof data?.model === "string" ? data.model : null,
    finishReason: typeof data?.finish_reason === "string" ? data.finish_reason : null,
    usage: b.response?.usage ?? {},
    threadId,
  };
}

/**
 * Pull a JSON object out of an assistant reply.
 *
 * `response_type: "text"` means the answer arrives as prose, so the JSON may be
 * fenced or have a sentence in front of it. Brace matching is used rather than a
 * greedy regex so a `{` inside a SQL string literal does not truncate the object.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const candidate = (fenced ? fenced[1] : trimmed).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // fall through to brace scanning
  }

  const start = candidate.indexOf("{");
  if (start === -1) throw new GtwyError("No JSON object in the reply.", "NO_JSON");

  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const slice = candidate.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch (err) {
          throw new GtwyError(
            `The reply contained JSON that would not parse: ${(err as Error).message}`,
            "BAD_JSON",
          );
        }
      }
    }
  }
  throw new GtwyError("The JSON object in the reply was never closed.", "TRUNCATED_JSON");
}
