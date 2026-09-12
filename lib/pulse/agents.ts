/**
 * Autopilot agents — typed callers for the four GTWY agents.
 *
 * Each agent is a prompt, a JSON schema and a model, configured on the GTWY
 * platform rather than here (docs/autopilot-agent-prompts.md). This module is
 * the only place Pulse names them, and it does three things per call:
 *
 *   1. assembles the facts into GTWY `variables` — the agent never queries
 *   2. calls the agent through the shared gateway client
 *   3. validates the reply with Zod before any caller sees it
 *
 * Step 3 matters. The gateway enforces the schema when the agent is configured
 * with `response_type: json_schema`, but a misconfigured agent, a model that
 * ignores the schema, or a gateway that queues the request instead of answering
 * would otherwise surface as a plausible wrong object. A failed parse throws
 * `BAD_AGENT_REPLY` and names the agent, so it fails loudly rather than
 * quietly writing nonsense into pulse_decision.
 */

import { z } from "zod";
import { chat, GtwyError, isConfigured as gatewayConfigured } from "./gtwy";

/* ── which agent is which ────────────────────────────────────────────────── */

export const AGENTS = {
  signupTriage: {
    slug: "signup-triage",
    env: "GTWY_AGENT_SIGNUP_TRIAGE",
    fallback: "6aa03694b54ce2b5442e110b",
  },
  outreachDrafter: {
    slug: "outreach-drafter",
    env: "GTWY_AGENT_OUTREACH_DRAFTER",
    fallback: "6aa037fa0869a6b2a235587c",
  },
  accountReview: {
    slug: "account-review",
    env: "GTWY_AGENT_ACCOUNT_REVIEW",
    fallback: "6aa037ff125b5dfba6805695",
  },
  portfolioDigest: {
    slug: "portfolio-digest",
    env: "GTWY_AGENT_PORTFOLIO_DIGEST",
    fallback: "6aa03802b54ce2b5442e1346",
  },
  ruleCompiler: {
    slug: "rule-compiler",
    env: "GTWY_AGENT_RULE_COMPILER",
    fallback: "6aa0eba5b54ce2b5442f3601",
  },
  /* One worker for every automation, rather than an agent per rule. The rule
     goes in as a variable, so a new rule is a new row in pulse_automation and
     no change on GTWY at all. */
  ruleWorker: {
    slug: "rule-worker",
    env: "GTWY_AGENT_RULE_WORKER",
    fallback: "6aa1ad3d48d38ff06b16dcf1",
  },
  /* Turns an English rule into a full execution plan: a schedule, a query, a
     prompt for its own dynamically-created executor agent. See build.ts. */
  automationPlanner: {
    slug: "automation-planner",
    env: "GTWY_AGENT_AUTOMATION_PLANNER",
    fallback: "6aa25c73d03482378797b8ea",
  },
  /* Decides the health band. The weighted formula in health.ts still runs —
     its four components are what this agent is *given* — but the band an
     account lands in, and the sentence explaining it, are this agent's call.
     No fallback id: until somebody creates the agent on GTWY and sets the
     env, health.ts keeps its own arithmetic rather than calling a stranger. */
  accountHealth: {
    slug: "account-health",
    env: "GTWY_AGENT_ACCOUNT_HEALTH",
    fallback: "",
  },
} as const;

export type AgentKey = keyof typeof AGENTS;

function agentId(key: AgentKey): string {
  const a = AGENTS[key];
  return (process.env[a.env] ?? "").trim() || a.fallback;
}

export function isConfigured(): boolean {
  return gatewayConfigured();
}

/* ── the four response shapes ────────────────────────────────────────────── */

export const TriageResultSchema = z.object({
  user_pid: z.string(),
  score: z.number().int().min(0).max(100),
  verdict: z.enum(["human_now", "nurture", "suppress"]),
  reasons: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  suppress_reason: z
    .enum(["partner customer", "competitor", "test signup", "no intent"])
    .nullable(),
  needs: z.array(z.string()),
});

export const TriageSchema = z.object({ results: z.array(TriageResultSchema) });

export const DraftSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  subject: z.string(),
  body: z.string(),
  send: z.boolean(),
  hold_reason: z
    .enum([
      "mentions a price",
      "partner customer",
      "sending paused",
      "outside messaging hours",
      "low confidence",
    ])
    .nullable(),
  confidence: z.number().min(0).max(1),
  facts_used: z.array(z.string()),
});

export const AccountReviewSchema = z.object({
  headline: z.string(),
  why: z.string(),
  recommended_move: z.string(),
  expected_effect: z.string(),
  evidence: z.array(z.array(z.string())),
  movement: z.enum(["climbed", "slipped", "held", "noise"]),
  confidence: z.number().min(0).max(1),
});

/**
 * One account's health, as the agent decides it.
 *
 * `score_now` / `score_prior` are 0–100 on the same axis the formula uses, so
 * the two are comparable and the caller can clamp a wild answer back toward
 * the arithmetic. `band` is deliberately *not* asked for: it is derived from
 * the score by `bandOf`, so a reply cannot claim a score of 80 and a band of
 * "risk" and leave the surface contradicting itself.
 */
export const HealthVerdictSchema = z.object({
  id: z.number(),
  score_now: z.number().min(0).max(100),
  score_prior: z.number().min(0).max(100),
  /** One sentence, in a rep's words, naming the evidence that decided it. */
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const HealthSchema = z.object({ verdicts: z.array(HealthVerdictSchema) });

export type HealthVerdict = z.infer<typeof HealthVerdictSchema>;

export const PortfolioDigestSchema = z.object({
  narrative: z.string(),
  plays: z.array(
    z.object({ worth: z.string(), what: z.string(), why: z.string(), cta: z.string() }),
  ),
  watch: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const ConditionSchema = z.object({
  field: z.string(),
  op: z.enum([">=", ">", "<=", "<", "==", "!=", "in"]),
  value: z.string(),
});

export const CompiledRuleSchema = z.object({
  can_compile: z.boolean(),
  when: z.string(),
  conditions: z.array(ConditionSchema),
  stop_if: z.array(ConditionSchema),
  act: z.enum(["act", "card", ""]),
  do: z.enum(["score", "raise_card", "nurture", "suppress", "draft", "wait", "notify", ""]),
  reason: z
    .enum(["your_judgment", "your_voice", "your_hands", "your_approval", "your_knowledge"])
    .nullable(),
  sla_minutes: z.number().int().nullable(),
  days: z.number().int().nullable(),
  plain_english: z.string(),
  missing: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type CompiledRule = z.infer<typeof CompiledRuleSchema>;

/** What the planner returns for one English rule: a full, runnable build plan. */
export const AutomationPlanSchema = z.object({
  mode: z.enum(["cron", "event"]),
  when_event: z.string().optional().default(""),
  cron_schedule: z.string(),
  find_sql: z.string(),
  subject_col: z.string(),
  watermark_col: z.string(),
  max_rows: z.number().int().positive(),
  executor_prompt: z.string(),
  optimized_rule_prompt: z.string(),
});
export type AutomationPlan = z.infer<typeof AutomationPlanSchema>;

/**
 * A confidence the worker reported, read as generously as it can honestly be.
 *
 * `z.number()` rejects Infinity and NaN, and JSON.parse turns an oversized
 * exponent — `1e999`, which a model does emit — straight into Infinity. That
 * made one unreadable field cost the entire pass: the schema threw, runOne
 * recorded the row as failed, `last_error` landed on the automation, and the
 * row was left to be re-judged and fail the same way on the next fire. Seen
 * live, on the first real cron fire of a rule built for this test:
 * "confidence Invalid input: expected number, received Infinity".
 *
 * Confidence gates nothing — `should_alert` decides whether an alert is
 * written, and this is recorded beside it — so a number that cannot be read
 * is not worth discarding a judgement over. In range it is kept, out of range
 * it is clamped, and unreadable it becomes null: pulse_decision.confidence is
 * already nullable and the Log already renders that as "no confidence given",
 * which is the true statement. Guessing a number here would be the one
 * outcome worse than not having one.
 */
const Confidence = z.preprocess((v) => {
  /* Explicitly before Number(): Number(null) and Number("") are both 0, and
     zero confidence is a claim — "certain, and certain it is not worth
     alerting on" — not the absence of one. A worker that said nothing about
     its confidence must not be recorded as having said zero. */
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(1, Math.max(0, n));
}, z.number().min(0).max(1).nullable());

/** What the worker says about one row an automation found. */
export const RuleWorkerSchema = z.object({
  subject_id: z.string().nullable(),
  should_alert: z.boolean(),
  headline: z.string().nullable(),
  detail: z.string().nullable(),
  reasons: z.array(z.string()),
  confidence: Confidence,
  needs: z.array(z.string()),
});
export type RuleWorkerResult = z.infer<typeof RuleWorkerSchema>;

export type TriageResult = z.infer<typeof TriageResultSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type AccountReview = z.infer<typeof AccountReviewSchema>;
export type PortfolioDigest = z.infer<typeof PortfolioDigestSchema>;

/** What every call returns alongside the parsed answer, for the decision row. */
export type AgentCall<T> = {
  data: T;
  agent: string;
  agentId: string;
  model: string | null;
  usage: Record<string, unknown>;
};

/* ── the call ────────────────────────────────────────────────────────────── */

/**
 * A reply may arrive as a bare object, or as text with a fence around it if the
 * agent's response type was left as plain text. Both are accepted; anything
 * else is a configuration problem worth reporting.
 */
function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  try {
    return JSON.parse(unfenced);
  } catch {
    const first = unfenced.indexOf("{");
    const last = unfenced.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(unfenced.slice(first, last + 1));
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

async function callAgent<T>(
  key: AgentKey,
  schema: z.ZodType<T>,
  user: string,
  variables: Record<string, string>,
  timeoutMs = 120_000,
): Promise<AgentCall<T>> {
  const id = agentId(key);
  const reply = await chat({ user, agentId: id, variables, timeoutMs });

  const parsed = schema.safeParse(extractJson(reply.content));
  if (!parsed.success) {
    throw new GtwyError(
      `The ${AGENTS[key].slug} agent's reply did not match its schema: ` +
        parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"} ${i.message}`)
          .join("; ") +
        `. Check the agent's prompt and JSON schema — see docs/autopilot-agent-prompts.md.`,
      "BAD_AGENT_REPLY",
    );
  }

  return {
    data: parsed.data,
    agent: AGENTS[key].slug,
    agentId: id,
    model: reply.model,
    usage: reply.usage as Record<string, unknown>,
  };
}

const today = () => new Date().toISOString().slice(0, 10);

/* ── Agent 2 · signup-triage ─────────────────────────────────────────────── */

export type SignupFacts = {
  user_pid: string;
  company_name: string | null;
  email_domain: string | null;
  is_free_mail: boolean;
  mobile_present: boolean;
  entity: string | null;
  motion: string;
  signup_step_reached: number | null;
  accounts_on_domain: number;
  domain_monthly_spend: string;
  domain_matches_known_customer: boolean;
  domain_matches_competitor: boolean;
  industry: string | null;
  owner_auto_assigned: boolean;
  ip_country: string | null;
};

/**
 * Triage a batch of signups. Up to ten per call — a spike put 21 in one day,
 * and one call for the batch is both cheaper and more consistent than ten.
 */
export async function triageSignups(
  signups: SignupFacts[],
  policyVersion: string,
): Promise<AgentCall<TriageResult[]>> {
  const call = await callAgent(
    "signupTriage",
    TriageSchema,
    "Triage these signups.",
    {
      today: today(),
      policy_version: policyVersion,
      signups_json: JSON.stringify(signups),
    },
  );

  // The agent is told to return them in order with the ids copied back. Trust
  // the id, not the position: a dropped entry would otherwise shift every
  // verdict onto the wrong company.
  const asked = new Set(signups.map((s) => s.user_pid));
  const got = call.data.results.filter((r) => asked.has(r.user_pid));
  if (got.length !== signups.length) {
    throw new GtwyError(
      `signup-triage returned ${got.length} usable verdicts for ${signups.length} signups.`,
      "BAD_AGENT_REPLY",
    );
  }

  return { ...call, data: got };
}

/* ── Agent 3 · outreach-drafter ──────────────────────────────────────────── */

export type DraftRequest = {
  accountFacts: Record<string, unknown>;
  triageReasons: string[];
  channel: "email" | "whatsapp";
  sequenceStep: 1 | 2 | 3;
  ownerName: string;
  ownerTitle: string;
  ownerWritingSamples: string;
  rateCardBounds: string;
  sendingPaused: boolean;
};

/**
 * Draft one message.
 *
 * The price rule is enforced twice on purpose: the prompt tells the agent to
 * hold anything with a price in it, and the caller must check `send` before
 * releasing. A prompt is guidance; the check is the control.
 */
export async function draftOutreach(req: DraftRequest): Promise<AgentCall<Draft>> {
  const call = await callAgent("outreachDrafter", DraftSchema, "Draft this message.", {
    today: today(),
    account_facts_json: JSON.stringify(req.accountFacts),
    triage_reasons_json: JSON.stringify(req.triageReasons),
    channel: req.channel,
    sequence_step: String(req.sequenceStep),
    owner_name: req.ownerName,
    owner_title: req.ownerTitle,
    owner_writing_samples: req.ownerWritingSamples,
    rate_card_bounds: req.rateCardBounds,
    sending_paused: String(req.sendingPaused),
  });

  // Belt and braces. If the kill switch is on, nothing leaves, whatever the
  // agent decided.
  const data = req.sendingPaused
    ? { ...call.data, send: false, hold_reason: "sending paused" as const }
    : call.data;

  return { ...call, data };
}

/* ── Agent 4 · account-review ────────────────────────────────────────────── */

export async function reviewAccount(
  health: Record<string, unknown>,
  period: string,
): Promise<AgentCall<AccountReview>> {
  return callAgent("accountReview", AccountReviewSchema, "Review this account.", {
    today: today(),
    period,
    account_health_json: JSON.stringify(health),
  });
}

/* ── Agent 10 · account-health ───────────────────────────────────────────── */

/** True only when the gateway *and* an account-health agent id are both set. */
export function healthAgentConfigured(): boolean {
  return gatewayConfigured() && Boolean(agentId("accountHealth"));
}

/**
 * Score a batch of accounts.
 *
 * The signals go in as JSON — one object per account, carrying the same four
 * components the formula weighs plus the raw spend windows behind them. The
 * agent is asked to judge, not to fetch: it has no database access, exactly
 * like every other agent here.
 */
export async function judgeHealth(
  signals: Record<string, unknown>[],
): Promise<AgentCall<z.infer<typeof HealthSchema>>> {
  return callAgent(
    "accountHealth",
    HealthSchema,
    "Decide the health of each account.",
    {
      today: today(),
      accounts_json: JSON.stringify(signals),
    },
    // A batch of 25 accounts is a bigger answer than a single draft, so the
    // default 120s is left alone rather than tightened.
  );
}

/* ── Agent 5 · portfolio-digest ──────────────────────────────────────────── */

export async function digestPortfolio(
  board: Record<string, unknown>,
  scope: "me" | "team" | "company",
  period: string,
  previousDigest = "",
): Promise<AgentCall<PortfolioDigest>> {
  return callAgent(
    "portfolioDigest",
    PortfolioDigestSchema,
    "Write the month-end digest.",
    {
      today: today(),
      period,
      scope,
      board_json: JSON.stringify(board),
      previous_digest: previousDigest,
    },
    150_000, // the widest input of the four, and the slowest reply measured
  );
}


/* ── Agent 8 · rule-compiler ─────────────────────────────────────────────── */

/**
 * Fields a rule may test. This list is the contract.
 *
 * The agent is given exactly these and told that nothing else exists, because
 * an invented field name produces a rule that silently never fires — and nobody
 * finds out. Adding a field here is what makes it available to rule writers;
 * the runner must also know how to supply it.
 */
export const RULE_FIELDS: Record<string, string> = {
  score: "the signup's score, 0-100",
  confidence: "how sure the AI was, 0.0-1.0",
  verdict: "what the AI decided: human_now, nurture or suppress",
  motion: "how they arrived: direct, or partner:<id>",
  entity: "which MSG91 entity: India, UAE, US, Singapore, UK, EU",
  is_free_mail: "true when the email is a free mailbox like gmail",
  mobile_present: "true when a mobile number was given",
  accounts_on_domain: "how many MSG91 accounts share this email domain",
  domain_matches_known_customer: "true when the domain already pays MSG91",
  domain_matches_competitor: "true when the domain is a messaging competitor",
  signup_step_reached: "how far through signup they got",
  industry: "the industry they typed at signup, when they gave one",
  owner_auto_assigned: "true when somebody already owns the account",
  days_since_signup: "days since the account was created",
  messages_sent: "messages the account has sent",
  days_since_payment: "days since the last real customer payment",
  spend_change_pct: "spend this window against the one before, as a percentage",
};

/**
 * Compile one sentence into something the runner can evaluate.
 *
 * Called when a rule is saved, never at decision time. The result is shown to
 * the person who wrote it, in plain English, and nothing runs until they
 * confirm — the agent proposes, a person decides.
 */
export async function compileRule(
  english: string,
  motion: string,
): Promise<AgentCall<CompiledRule>> {
  return callAgent("ruleCompiler", CompiledRuleSchema, "Translate this rule.", {
    today: today(),
    motion,
    english,
    fields: Object.entries(RULE_FIELDS)
      .map(([k, v]) => `- ${k} — ${v}`)
      .join("\n"),
  });
}

/* ── the rule worker ────────────────────────────────────────────────────── */

/**
 * Judge one row an automation found.
 *
 * The rule's own words go in as a variable, not as part of the prompt, so
 * every automation in the product shares this one agent and adding a rule
 * needs no change on GTWY.
 */
export async function judgeRow(
  ruleEnglish: string,
  agentTask: string,
  row: Record<string, unknown>,
): Promise<AgentCall<RuleWorkerResult>> {
  return callAgent("ruleWorker", RuleWorkerSchema, "Judge this row.", {
    today: today(),
    rule_english: ruleEnglish,
    agent_task: agentTask,
    row_json: JSON.stringify(row),
  });
}

/* ── Agent 9 · automation-planner ────────────────────────────────────────── */

/**
 * The real schema, hand-verified against information_schema — not GTWY's
 * knowledge-base attachment, which turned out to be inert: `doc_ids` on an
 * agent is stored but never read by the model-call path (checked the
 * AI-middleware source directly), so a document uploaded there sits unused
 * unless a retrieval tool is also wired up, which this agent has none of.
 * Passed as a plain prompt variable instead — the same mechanism `{{fields}}`
 * already uses successfully on every call.
 *
 * Keep this in sync with reality, not with what would be convenient: the
 * first three automations built without it guessed `accounts`/`signups`/
 * `leads`, none of which exist.
 */
const SCHEMA_GLOSSARY = `
Real, queryable MySQL tables (read-only) — use ONLY these tables and columns,
never invent one:

ms_user — one row per account (customer or admin)
  user_pid (id, the account/subject id), user_email, user_mobno (mobile
  number — presence test: user_mobno IS NOT NULL AND user_mobno <> ''),
  user_fname, user_lname, user_bal (wallet balance), user_date (signup
  timestamp), user_type (1=admin/rep, 3=customer), user_status,
  user_country_code (an INTEGER code, NOT a country name string — do not
  write entity = 'India' against this column)
  There is NO company-name column anywhere in this schema. A rule that needs
  "company name" cannot be answered literally — either find the closest
  honest proxy and say so in executor_prompt, or mark the plan accordingly.

ms_trans — one row per transaction/payment
  trans_pid, trans_fuserid, trans_tuserid (both reference ms_user.user_pid),
  trans_amt, trans_date, trans_type, currency (ISO code: INR, AED, USD, SGD,
  GBP, EUR), cost, account_manager

"Entity" (India/UAE/US/Singapore/UK/EU) is NOT a column on any table — it is
derived from ms_trans.currency: INR→India, AED→UAE, USD→US, SGD→Singapore,
GBP→UK, EUR→EU. To filter by entity, join to ms_trans and check currency,
or accept that an account with no transactions has no known entity yet.

ms_signup_log — email, numbers, count, created_at (signup attempts, not accounts)
ms_sender — sender_pid, sender_userid, sender_senderid (SMS sender IDs)
ms_domain — subsite_userid, subsite_dname, signup_enabled (branded sub-sites)
`.trim();

/**
 * Compile one English rule into a full build plan: schedule, query, and a
 * standalone prompt for a dedicated executor agent (created afterwards via
 * gtwyAdmin.createExecutorAgent, not here — this call only plans).
 */
export async function planAutomation(
  english: string,
  motion: string,
): Promise<AgentCall<AutomationPlan>> {
  const { eventsCatalogueForPlanner } = await import("./autopilot/events");
  return callAgent("automationPlanner", AutomationPlanSchema, "Translate this rule.", {
    today: today(),
    motion,
    english,
    schema: SCHEMA_GLOSSARY,
    fields: Object.entries(RULE_FIELDS)
      .map(([k, v]) => `- ${k} — ${v}`)
      .join("\n"),
    events: eventsCatalogueForPlanner(),
  });
}

