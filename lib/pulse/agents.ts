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
  /* "Log what happened" (PRD §8.4, handover §7.7) — the sheet that was
     nothing but a hardcoded sample and a save button that called nothing.
     One free-text note in, five nullable structured fields out: promise,
     decision, interest, risk, person. Configured and published on GTWY
     2026-09-13; fallback is that agent's id. */
  logExtract: {
    slug: "log-extract",
    env: "GTWY_AGENT_LOG_EXTRACT",
    fallback: "6aa0352bb54ce2b5442e0f39",
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

/**
 * What the planner returns for one English rule: a full, runnable build plan.
 *
 * The four query fields are optional, and that is not laxness — it is the only
 * way an event automation can be built at all.
 *
 * buildAutomation() tells the planner, for an event rule, "There is no
 * database query — the payload itself is the one row to judge". These fields
 * were nonetheless required, so a model that *obeyed* that instruction failed
 * this schema and the build died at step "plan" with "find_sql Invalid input".
 * A build could only succeed when the model disobeyed and invented a query —
 * which was then thrown away two lines later, because the event branch saves
 * findSql/subjectCol/watermarkCol as null regardless.
 *
 * Requiring them bought nothing even on the schedule path: an empty string
 * satisfies z.string() and would fail the guard immediately afterwards with a
 * better message than a schema error can give. So the real check stays where
 * it belongs — guard() and dryRun() for the query, and the event branch simply
 * ignores all four.
 */
export const AutomationPlanSchema = z.object({
  mode: z.enum(["cron", "event"]),
  when_event: z.string().optional().default(""),
  cron_schedule: z.string().optional().default(""),
  find_sql: z.string().optional().default(""),
  /* Event rules only: one SELECT run when the event fires, with the payload's
     fields named as :placeholders. Empty is the norm and means "judge the
     payload alone" — see migrations/025 and autopilot/enrich.ts. */
  enrich_sql: z.string().optional().default(""),
  subject_col: z.string().optional().default(""),
  watermark_col: z.string().optional().default(""),
  max_rows: z.number().int().positive(),
  executor_prompt: z.string(),
  optimized_rule_prompt: z.string(),
  /* Explicit prohibitions in the rule's own English ("never message an
     enterprise account", "don't act if somebody already owns it"), as
     [field, op, value] triples against the same row find_sql selects —
     checked in code in automation-runner.ts before anything the executor
     agent decided is acted on, not left for that agent's own prompt to
     honour or not.
     .optional().default([]): the automation-planner agent's prompt on GTWY
     predates this field, so it will not be in the response until that
     prompt is told to extract it (see docs/automation-never-if.md) —
     .optional() is what keeps a planner that has never heard of never_if
     from failing this schema on every single build. */
  never_if: z
    .array(z.tuple([z.string(), z.enum([">=", ">", "<=", "<", "==", "!=", "in"]), z.unknown()]))
    .optional()
    .default([]),
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

/**
 * "Log what happened" — one free-text note in, five nullable fields out.
 * Every field is null, not a guess, when the note does not say — the prompt
 * is explicit that a placeholder dressed up as fact is worse than admitting
 * nothing was there.
 */
export const LogExtractSchema = z.object({
  promise: z.object({ text: z.string(), due_date: z.string().nullable() }).nullable(),
  decision: z.object({ text: z.string() }).nullable(),
  interest: z.object({ product: z.string(), reason: z.string() }).nullable(),
  risk: z.object({ text: z.string(), chase_date: z.string().nullable() }).nullable(),
  person: z.object({ name: z.string(), role: z.string() }).nullable(),
  confidence: z.number().min(0).max(1),
});
export type LogExtract = z.infer<typeof LogExtractSchema>;

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

  /**
   * A reply that does not parse is retried; everything else is not.
   *
   * These are language models, so a malformed answer is a normal, occasional
   * outcome rather than a fault to report. One call with no retry meant a
   * single bad reply killed whatever asked for it — and building an automation
   * is the worst place for that, because the person watching has already
   * waited twenty-five seconds and gets a 502 with nothing saved. Seen live:
   * twelve automations built through the deployed route, eleven fine and one
   * dead on "expected object, received null" — the model had returned nothing
   * parseable at all. Retrying it once would have built it.
   *
   * Only BAD_AGENT_REPLY is retried. A timeout, a refusal or a transport error
   * is not something a second identical call fixes, and chat() already has its
   * own handling for those; retrying them would just spend the caller's
   * remaining budget before failing anyway.
   *
   * The parse error is fed back into the next attempt. Told what was wrong
   * with the last answer, the model tends to fix that specific field rather
   * than re-rolling the same mistake.
   */
  const ATTEMPTS = 3;
  let lastIssues = "";
  for (let attempt = 1; ; attempt++) {
    const ask =
      attempt === 1
        ? user
        : `${user}\n\nYour previous reply could not be used: ${lastIssues}. ` +
          `Reply again with JSON only, matching the schema exactly.`;
    const reply = await chat({ user: ask, agentId: id, variables, timeoutMs });
    const parsed = schema.safeParse(extractJson(reply.content));

    if (parsed.success) {
      return {
        data: parsed.data,
        agent: AGENTS[key].slug,
        agentId: id,
        model: reply.model,
        usage: reply.usage as Record<string, unknown>,
      };
    }

    lastIssues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"} ${i.message}`)
      .join("; ");

    if (attempt >= ATTEMPTS) {
      throw new GtwyError(
        `The ${AGENTS[key].slug} agent's reply did not match its schema after ${ATTEMPTS} attempts: ` +
          lastIssues +
          `. Check the agent's prompt and JSON schema — see docs/autopilot-agent-prompts.md.`,
        "BAD_AGENT_REPLY",
      );
    }
    console.warn(
      `[pulse] ${AGENTS[key].slug} reply did not parse (attempt ${attempt}/${ATTEMPTS}): ${lastIssues}`,
    );
  }
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
  /**
   * Set on the one retry build.ts makes after a dry run fails — the query
   * this same planner just wrote, and MySQL's own error rejecting it. Real
   * feedback ("Illegal mix of collations…") corrects a planner far more
   * reliably than a warning it saw once before writing anything, which is
   * what a bare advisory in `schema` turned out to be: partner-high-9 still
   * mixed latin1_swedish_ci and utf8mb4_general_ci with the warning present,
   * because a general "watch out for this" competes with everything else in
   * the prompt, while "this exact query, this exact rejection" does not.
   */
  repair?: { sql: string; error: string },
): Promise<AgentCall<AutomationPlan>> {
  const { eventsCatalogueForPlanner } = await import("./autopilot/events");

  /* The hand-written glossary plus the real table list.
   *
   * SCHEMA_GLOSSARY describes five tables. The database has 509, of which 112
   * are allowlisted — and the machinery to introspect them already exists and
   * is already trusted by the Ask path (lib/pulse/schema.ts, cached for thirty
   * minutes). agents.ts simply never imported it, so the one agent that writes
   * every automation query was working from a constant somebody typed.
   *
   * That is where the invented tables came from. `clonemsg.leads`,
   * `clonemsg.signups`, `accounts`, and `industry` on ms_user were not
   * carelessness — they are what guessing past the end of a five-table
   * glossary looks like. The glossary itself shows the cost: it has grown
   * defensive lines like "There is NO company-name column anywhere in this
   * schema", patching hallucinations by hand, one at a time, forever.
   *
   * The glossary stays, and stays first: it carries curated meaning the
   * schema cannot supply — that user_type 1 is an admin and 3 a customer, that
   * user_country_code is an integer and not a country name. The index adds
   * what exists. One says what the columns mean, the other says what there is.
   *
   * Best-effort. If introspection fails the planner gets the glossary alone,
   * which is exactly what it had before this, so a database hiccup degrades
   * the plan rather than failing the build. */
  let tableIndex = "";
  let tableDetail = "";
  let collationWarning = "";
  try {
    const { index, renderIndex, detail, renderDetail } = await import("./schema");
    const idx = await index();
    tableIndex = renderIndex(idx);

    /* The columns of the tables this rule actually names.
     *
     * The index says a table exists and what it holds. It does not say what
     * columns it has — the paragraph below used to admit that in as many
     * words — so for the 107 tables outside SCHEMA_GLOSSARY the planner had a
     * name and had to invent the rest. It duly did: "Unknown column
     * 'tb.user_pid' in 'WHERE'", "Unknown column 'user_pid' in 'SELECT'",
     * three times in the first seven rules of a batch, every one of them on a
     * rule that needed a join.
     *
     * A rule names its tables in the sentence somebody typed — "using
     * ms_signup_log", "using verify_dlt" — so the tables worth describing in
     * full are knowable before the planner runs. Matched on a word boundary
     * against the allowlist, which is both the safe set and the only set the
     * query may read anyway.
     *
     * Bounded at eight: detail() caps at twelve, the prompt should not become
     * mostly schema, and a rule naming more than eight tables has a bigger
     * problem than column names. */
    const named = idx
      .map((t) => t.table)
      .filter((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(english))
      .slice(0, 8);

    if (named.length) {
      /* The dump first, live introspection second.
       *
       * schema/msg91-schema.sql has all 509 tables and every column, costs no
       * round trip, and answers while the database is asleep — which the free
       * tier does. detail() is the fallback for a table the dump does not
       * describe, which is what a schema change since the dump looks like. */
      const { renderDumpDetail, dumpColumns, mixedCharsets } = await import("./schemaDump");
      const fromDump = named.filter((t) => dumpColumns(t));
      const missing = named.filter((t) => !dumpColumns(t));
      const parts = [
        fromDump.length ? renderDumpDetail(fromDump) : "",
        missing.length ? renderDetail(await detail(missing)) : "",
      ].filter(Boolean);
      tableDetail = parts.join("\n\n");

      /* This is where "Illegal mix of collations (latin1_swedish_ci, IMPLICIT)
       * and (utf8mb4_general_ci, IMPLICIT)" came from on partner-high-9: 427 of
       * the 509 tables still default to latin1 from whenever they were
       * created, a handful sit on plain utf8, and the rest (mostly what has
       * been touched more recently) are utf8mb4. None of that is visible in a
       * column list alone — `varchar(45)` reads the same whichever charset it
       * carries — so the planner had no way to know two joined columns would
       * collide until MySQL said so at query time, after the plan already
       * looked reasonable. Only raised when the rule's own tables actually
       * mix charsets: most rules touch tables that already agree, and a
       * warning that fires on every rule is one nobody reads on the rule that
       * needs it. */
      const charsets = mixedCharsets(fromDump);
      if (charsets.length > 1) {
        collationWarning =
          `These tables mix character sets on their text columns: ${charsets.join(", ")} ` +
          `(marked [charset:…] above where it isn't utf8mb4). Comparing or joining two text ` +
          `columns with different charsets fails at query time with "Illegal mix of collations" ` +
          `— it does not fail to plan, it fails to run. Wrap either side in ` +
          `CONVERT(column USING utf8mb4) before comparing or joining across a charset boundary, ` +
          `or when in doubt.`;
      }
    }
  } catch (err) {
    console.warn("[pulse] schema index unavailable to the planner:", (err as Error).message);
  }

  return callAgent("automationPlanner", AutomationPlanSchema, "Translate this rule.", {
    today: today(),
    motion,
    english,
    schema: [
      SCHEMA_GLOSSARY,
      tableDetail &&
        `The full columns of the tables this rule names. These are read from the\n` +
        `database itself — use these names exactly, and do not use a column that\n` +
        `is not listed here:\n\n${tableDetail}`,
      tableIndex &&
        `Every other table you may read. These lines give the table and what it\n` +
        `holds, not its columns — so do not reference a column of one of these\n` +
        `unless it also appears above:\n\n${tableIndex}`,
      collationWarning,
      repair &&
        `Your previous query for this exact rule failed against the real database ` +
        `and must not be repeated as written:\n\n${repair.sql}\n\nThe database's own error:\n` +
        `${repair.error}\n\nWrite a new find_sql that avoids this specific failure — if it names ` +
        `a column mixing character sets, wrap the offending side in CONVERT(column USING utf8mb4) ` +
        `rather than repeating the bare comparison.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    fields: Object.entries(RULE_FIELDS)
      .map(([k, v]) => `- ${k} — ${v}`)
      .join("\n"),
    events: eventsCatalogueForPlanner(),
  });
}

/* ── Agent 11 · log-extract ───────────────────────────────────────────────── */

/**
 * "Log what happened", for real. The rep writes what actually occurred; this
 * turns it into the five things Pulse can act on — never inventing a field
 * the note does not support.
 */
export async function extractLog(note: string, accountName: string): Promise<AgentCall<LogExtract>> {
  return callAgent("logExtract", LogExtractSchema, "Extract this.", {
    today: today(),
    account_name: accountName,
    note,
  });
}

