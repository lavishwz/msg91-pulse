/**
 * Building a dynamic automation.
 *
 * Plan the English rule, validate the query with the same guard every
 * automation's find_sql goes through, dry-run it against the real database,
 * subscribe a cron-job.org job if the plan calls for one, then save the row.
 *
 * No agent is created here. An earlier version of this minted a new GTWY
 * agent per automation — unnecessary: the shared `ruleWorker` agent already
 * takes a rule's own words as a variable per call (see agents.ts, and how
 * the four built-in automations have always worked). `executor_prompt` is
 * stored as the automation's `agent_task` and passed to that one shared
 * agent at run time — one call reaching an agent that already exists, not a
 * new agent minted for every rule somebody writes.
 */

import { planAutomation } from "@/lib/pulse/agents";
import { guard } from "@/lib/pulse/sqlguard";
import { query } from "@/lib/db";
import { createCronJob } from "@/lib/pulse/cronjob";
import { saveAutomation, type Motion, type Scope } from "./automations";

export type BuildResult =
  | {
      ok: true;
      key: string;
      mode: "cron" | "event";
      optimizedPrompt: string;
      findSql: string;
      executorPrompt: string;
      cronJobId: string | null;
      webhookUrl: string | null;
      cronSchedule: string | null;
    }
  | { ok: false; error: string; step: "plan" | "guard" | "dry_run" | "cron" | "save" };

/**
 * Actually run the plan's query, LIMIT 0, before anything else is built.
 *
 * The planner has a real schema glossary now (see agents.ts) and mostly gets
 * table names right, but it still occasionally invents a column that isn't
 * there — caught once, live, when it wrote `industry` onto ms_user. The
 * guard only checks that a query is *safe* to run (single SELECT, no writes);
 * it says nothing about whether the tables and columns in it exist. A dry
 * run against the real read-only connection is the only check that does,
 * and it is cheap: LIMIT 0 means MySQL plans the query and returns no rows.
 */
async function dryRun(sql: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const wrapped = `SELECT * FROM (${sql.replace(/;\s*$/, "")}) __dry_run LIMIT 0`;
  try {
    await query(wrapped);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function publicBaseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Build one automation end to end. Never throws — every step reports which
 * step it was, so the caller can show exactly where a build failed rather
 * than a bare 500.
 */
export async function buildAutomation(
  english: string,
  motion: Motion,
  ownerEmail: string,
  scope: Scope = "company",
): Promise<BuildResult> {
  let plan;
  try {
    const call = await planAutomation(english, motion);
    plan = call.data;
  } catch (err) {
    return { ok: false, error: (err as Error).message, step: "plan" };
  }

  const g = guard(plan.find_sql, Math.min(plan.max_rows || 50, 200));
  if (!g.ok) {
    return { ok: false, error: "the planner's query is not safe to run: " + g.reason, step: "guard" };
  }

  const dry = await dryRun(g.sql);
  if (!dry.ok) {
    return {
      ok: false,
      error: "the planner's query does not run against the real database: " + dry.error,
      step: "dry_run",
    };
  }

  const key = `dyn-${slugify(english)}-${Date.now().toString(36)}`;

  let cronJobId: string | null = null;
  let webhookUrl: string | null = null;
  if (plan.mode === "cron") {
    const base = publicBaseUrl();
    if (!base) {
      return {
        ok: false,
        error: "PUBLIC_BASE_URL is not set — cron-job.org needs a public URL to call. Set it in .env.local.",
        step: "cron",
      };
    }
    webhookUrl = `${base}/api/pulse/autopilot/webhook/${key}`;
    try {
      cronJobId = await createCronJob(`pulse: ${english.slice(0, 60)}`, webhookUrl, plan.cron_schedule || "0 * * * *");
    } catch (err) {
      return { ok: false, error: (err as Error).message, step: "cron" };
    }
  }

  const saved = await saveAutomation({
    key,
    motion,
    scope,
    ownerEmail,
    english,
    // summary is VARCHAR(255); optimized_prompt (TEXT, below) carries the
    // full restatement. Truncated rather than left to the database to reject
    // the whole insert over a display-only field.
    summary: plan.optimized_rule_prompt.slice(0, 252) + (plan.optimized_rule_prompt.length > 252 ? "…" : ""),
    triggerKind: "schedule",
    mode: plan.mode,
    findSql: plan.find_sql,
    subjectCol: plan.subject_col || null,
    watermarkCol: plan.watermark_col || null,
    agentTask: plan.executor_prompt,
    executorPrompt: plan.executor_prompt,
    optimizedPrompt: plan.optimized_rule_prompt,
    cronJobId,
    maxRows: plan.max_rows || 50,
    capability: "ready",
    live: plan.mode === "cron",
  });
  if (!saved.ok) {
    return { ok: false, error: saved.error, step: "save" };
  }

  return {
    ok: true,
    key,
    mode: plan.mode,
    optimizedPrompt: plan.optimized_rule_prompt,
    findSql: plan.find_sql,
    executorPrompt: plan.executor_prompt,
    cronJobId,
    webhookUrl,
    cronSchedule: plan.mode === "cron" ? plan.cron_schedule : null,
  };
}
