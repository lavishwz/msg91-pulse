import { z } from "zod";
import { chat, extractJson, GtwyError, isConfigured as gtwyConfigured } from "./gtwy";
import { CORE_TABLES, detail, index, renderDetail, renderIndex } from "./schema";
import { ALLOWED_TABLES } from "./schema-notes";

/**
 * Free-text question → SQL, via GTWY.
 *
 * Handover §10 is "deterministic first, LLM second": the eight curated Ask
 * answers are hand-written SQL and carry the questions the team asks daily.
 * This is the second half — anything else someone types.
 *
 * The AI call goes through GTWY, MSG91's own gateway, so the choice of model
 * and the agent's own system prompt are managed on the platform rather than in
 * this repo. Two things keep the result honest:
 *
 *   1. The generated SQL is returned to the caller and shown in the UI. A number
 *      nobody can trace is worse than no number (§12 blocks payment display for
 *      exactly this reason), so the query is part of the answer.
 *   2. The prompt states the semantics MSG91's columns actually carry, and —
 *      importantly — that ms_trans has no usable index, because the obvious
 *      correlated subquery against it takes 37 seconds.
 */

/** The shape the reply must contain. Validated, never trusted as-is. */
const PlanSchema = z.object({
  answerable: z.boolean(),
  /** Drives how the answer renders: one number, a table, or a per-key breakdown. */
  shape: z.enum(["single_value", "table", "breakdown", "none"]).default("table"),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  sql: z.string(),
  headline: z.string(),
  columns: z.array(z.string()).default([]),
  tables_used: z.array(z.string()).default([]),
  caveats: z.array(z.string()).default([]),
  needs_schema_for: z.array(z.string()).default([]),
});

export type Plan = z.infer<typeof PlanSchema>;

export function isConfigured(): boolean {
  return gtwyConfigured();
}

/**
 * The three values the GTWY agent's prompt expects.
 *
 * The rules live in the agent's prompt on the GTWY platform (see
 * docs/gtwy-agent.md) rather than in this repo, so MSG91 can tune the wording
 * without a deploy. This code supplies only what changes per request:
 *
 *   schema_index   every table with its row count — which ones are big enough
 *                  to need care, which are empty in this environment
 *   schema_detail  full columns for every allowlisted table
 *   today          the current date, because the agent has no clock and
 *                  "last quarter" is unanswerable without one
 *
 * If a variable is missing, GTWY leaves the literal `{{name}}` in the prompt,
 * so all three are always sent.
 */
async function buildVariables(
  extraTables: string[],
): Promise<Record<string, string>> {
  const [idx, cols] = await Promise.all([
    index(),
    // Full columns for every allowlisted table, not just the core twelve.
    // Measured: 108 tables is ~7,200 tokens against ~810 for twelve. Holding
    // back the other hundred saved 6,400 tokens and cost a second round trip
    // whenever the question touched anything outside the core — which is
    // exactly the least routine question, and the worst one to slow down.
    // CORE_TABLES goes first so the tables most answers need lead the block.
    detail(orderedTables(extraTables), 200),
  ]);

  return {
    schema_index: renderIndex(idx),
    schema_detail: renderDetail(cols),
    today: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Every allowed table, with the core ones first. `extraTables` is kept for the
 * needs_schema_for path, which should now never fire — a table the agent asks
 * for was already sent — but the round trip stays as a safety valve.
 */
function orderedTables(extraTables: string[]): string[] {
  const rest = Object.keys(ALLOWED_TABLES).filter((t) => !CORE_TABLES.includes(t)).sort();
  return [...new Set([...CORE_TABLES, ...extraTables, ...rest])];
}

async function askOnce(
  question: string,
  extraTables: string[],
): Promise<{ plan: Plan; model: string | null; usage: Record<string, unknown> }> {
  const variables = await buildVariables(extraTables);

  // The question goes in `user`; the schema goes in variables the agent's
  // prompt interpolates. Keeping them separate is what lets GTWY treat the
  // prompt as the stable part.
  const reply = await chat({ user: question, variables, timeoutMs: 120_000 });

  const parsed = PlanSchema.safeParse(extractJson(reply.content));
  if (!parsed.success) {
    throw new GtwyError(
      `The agent's reply did not match the expected shape: ${parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"} ${i.message}`)
        .join("; ")}. ` +
        `Check that the Pulse agent's prompt and JSON schema are configured — see docs/gtwy-agent.md.`,
      "BAD_PLAN",
    );
  }

  return { plan: parsed.data, model: reply.model, usage: reply.usage as Record<string, unknown> };
}

export type PlanResult = Plan & {
  rounds: number;
  model: string | null;
  usage: Record<string, unknown>;
};

/**
 * Turn a question into a query plan.
 *
 * Runs at most twice: if the agent asks for column detail on tables it was not
 * given, it gets them and one more attempt. Beyond that the question is not
 * answerable from this schema.
 */
export async function plan(question: string): Promise<PlanResult> {
  const first = await askOnce(question, []);
  if (!first.plan.needs_schema_for.length || first.plan.sql) {
    return { ...first.plan, rounds: 1, model: first.model, usage: first.usage };
  }
  const second = await askOnce(question, first.plan.needs_schema_for.slice(0, 8));
  return { ...second.plan, rounds: 2, model: second.model, usage: second.usage };
}
