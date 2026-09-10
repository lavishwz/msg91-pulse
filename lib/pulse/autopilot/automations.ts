/**
 * Automations — the rules that actually run.
 *
 * A rule is a sentence somebody typed. An automation is that sentence
 * compiled: a query that finds rows, a task for the agent that reads them, and
 * a schedule. This module owns the row; runner.ts owns the running.
 *
 * Two invariants are enforced here rather than left to the caller:
 *
 *   a guard never runs. `trigger_kind = 'guard'` describes a constraint on an
 *   action — "never open a price conversation without the partner on the
 *   thread". Schedule it and it either does nothing or does the thing it
 *   forbids. `due()` will not return one, whatever else is set on the row.
 *
 *   find_sql is re-checked at run time, not only when it was saved. The guard
 *   is cheap and the alternative is trusting a string in a table that a
 *   migration, a restore or a person with database access could have changed
 *   since.
 */

import { read, write } from "@/lib/store";
import { guard } from "@/lib/pulse/sqlguard";

export type TriggerKind = "schedule" | "event" | "branch" | "guard";
export type Motion = "inbound" | "outbound" | "startup" | "partner" | "any";
export type Scope = "me" | "team" | "company";

export type Automation = {
  id: number;
  key: string;
  ruleKey: string | null;
  motion: Motion;
  scope: Scope;
  ownerEmail: string | null;
  english: string;
  summary: string | null;
  triggerKind: TriggerKind;
  whenEvent: string | null;
  parentKey: string | null;
  everyMinutes: number | null;
  findSql: string | null;
  subjectCol: string | null;
  watermarkCol: string | null;
  agentTask: string | null;
  mode: "cron" | "event";
  gtwyAgentId: string | null;
  cronJobId: string | null;
  executorPrompt: string | null;
  optimizedPrompt: string | null;
  maxRows: number;
  capability: "ready" | "blocked";
  blockedReason: string | null;
  state: "active" | "paused" | "retired";
  live: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  runCount: number;
  alertCount: number;
};

type Row = Record<string, unknown>;

function toAutomation(r: Row): Automation {
  return {
    id: Number(r.id),
    key: String(r.automation_key),
    ruleKey: (r.rule_key as string) ?? null,
    motion: (r.motion as Motion) ?? "any",
    scope: (r.scope as Scope) ?? "company",
    ownerEmail: (r.owner_email as string) ?? null,
    english: String(r.english ?? ""),
    summary: (r.summary as string) ?? null,
    triggerKind: (r.trigger_kind as TriggerKind) ?? "schedule",
    whenEvent: (r.when_event as string) ?? null,
    parentKey: (r.parent_key as string) ?? null,
    everyMinutes: r.every_minutes == null ? null : Number(r.every_minutes),
    findSql: (r.find_sql as string) ?? null,
    subjectCol: (r.subject_col as string) ?? null,
    watermarkCol: (r.watermark_col as string) ?? null,
    agentTask: (r.agent_task as string) ?? null,
    mode: (r.mode as Automation["mode"]) ?? "cron",
    gtwyAgentId: (r.gtwy_agent_id as string) ?? null,
    cronJobId: (r.cron_job_id as string) ?? null,
    executorPrompt: (r.executor_prompt as string) ?? null,
    optimizedPrompt: (r.optimized_prompt as string) ?? null,
    maxRows: Number(r.max_rows ?? 50),
    capability: (r.capability as "ready" | "blocked") ?? "ready",
    blockedReason: (r.blocked_reason as string) ?? null,
    state: (r.state as Automation["state"]) ?? "active",
    live: Boolean(r.live),
    lastRunAt: r.last_run_at ? new Date(r.last_run_at as string).toISOString() : null,
    nextRunAt: r.next_run_at ? new Date(r.next_run_at as string).toISOString() : null,
    lastError: (r.last_error as string) ?? null,
    runCount: Number(r.run_count ?? 0),
    alertCount: Number(r.alert_count ?? 0),
  };
}

const COLUMNS = `id, automation_key, rule_key, motion, scope, owner_email, english, summary,
  trigger_kind, when_event, parent_key, every_minutes, find_sql, subject_col, watermark_col,
  agent_task, mode, gtwy_agent_id, cron_job_id, executor_prompt, optimized_prompt,
  max_rows, capability, blocked_reason, state, live, last_run_at, next_run_at,
  last_error, run_count, alert_count`;

/** Everything not retired, newest first. What the Rules tab lists. */
export async function listAutomations(motion?: Motion): Promise<Automation[]> {
  const where = motion && motion !== "any" ? " AND motion = ?" : "";
  const rows = await read<Row>(
    `SELECT ${COLUMNS} FROM pulse_automation WHERE state <> 'retired'${where} ORDER BY motion, id`,
    motion && motion !== "any" ? [motion] : [],
  );
  return rows.map(toAutomation);
}

export async function getAutomation(key: string): Promise<Automation | null> {
  const rows = await read<Row>(
    `SELECT ${COLUMNS} FROM pulse_automation WHERE automation_key = ? LIMIT 1`,
    [key],
  );
  return rows.length ? toAutomation(rows[0]) : null;
}

/**
 * The automations a pass should run now.
 *
 * Schedule only. Events have no scheduler yet, branches wait on their parent's
 * result, and guards are never run at all — see the note at the top.
 */
export async function due(now = new Date(), limit = 20): Promise<Automation[]> {
  const rows = await read<Row>(
    `SELECT ${COLUMNS} FROM pulse_automation
      WHERE live = 1
        AND state = 'active'
        AND capability = 'ready'
        AND trigger_kind = 'schedule'
        AND (next_run_at IS NULL OR next_run_at <= ?)
      ORDER BY next_run_at IS NOT NULL, next_run_at
      LIMIT ?`,
    [now.toISOString().slice(0, 19).replace("T", " "), limit],
  );
  return rows.map(toAutomation);
}

export type NewAutomation = {
  key: string;
  ruleKey?: string | null;
  motion: Motion;
  scope?: Scope;
  ownerEmail: string;
  english: string;
  summary?: string | null;
  triggerKind: TriggerKind;
  whenEvent?: string | null;
  parentKey?: string | null;
  everyMinutes?: number | null;
  findSql?: string | null;
  subjectCol?: string | null;
  watermarkCol?: string | null;
  agentTask?: string | null;
  mode?: "cron" | "event";
  gtwyAgentId?: string | null;
  cronJobId?: string | null;
  executorPrompt?: string | null;
  optimizedPrompt?: string | null;
  maxRows?: number;
  capability?: "ready" | "blocked";
  blockedReason?: string | null;
  live?: boolean;
};

/**
 * Save one. Refuses rather than storing something the runner would choke on:
 * a schedule with no query, a query the guard rejects, a branch with no
 * parent. A row that reaches the table is a row the runner can trust.
 */
export async function saveAutomation(
  a: NewAutomation,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  if (!a.key.trim()) return { ok: false, error: "an automation needs a key" };
  if (!a.english.trim()) return { ok: false, error: "an automation needs the sentence it came from" };

  if (a.triggerKind === "branch" && !a.parentKey)
    return { ok: false, error: "a branch runs on another automation's result, so it needs a parent" };

  /* A guard is stored so the manifest can show it, and is never given a query
     or a schedule — there is nothing for either to do. */
  const isRunnable = a.triggerKind === "schedule";

  if (isRunnable && a.capability !== "blocked") {
    if (!a.findSql?.trim())
      return { ok: false, error: "a scheduled automation needs a query to find its rows" };
    const g = guard(a.findSql, Math.min(a.maxRows ?? 50, 200));
    if (!g.ok) return { ok: false, error: "that query cannot be run safely: " + g.reason };
    a.findSql = g.sql;
  }

  await write(
    `INSERT INTO pulse_automation
       (automation_key, rule_key, motion, scope, owner_email, english, summary,
        trigger_kind, when_event, parent_key, every_minutes, find_sql, subject_col,
        watermark_col, agent_task, mode, gtwy_agent_id, cron_job_id, executor_prompt,
        optimized_prompt, max_rows, capability, blocked_reason, live, next_run_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, NOW())
     ON DUPLICATE KEY UPDATE
        motion=VALUES(motion), scope=VALUES(scope), english=VALUES(english),
        summary=VALUES(summary), trigger_kind=VALUES(trigger_kind),
        when_event=VALUES(when_event), parent_key=VALUES(parent_key),
        every_minutes=VALUES(every_minutes), find_sql=VALUES(find_sql),
        subject_col=VALUES(subject_col), watermark_col=VALUES(watermark_col),
        agent_task=VALUES(agent_task), mode=VALUES(mode),
        gtwy_agent_id=VALUES(gtwy_agent_id), cron_job_id=VALUES(cron_job_id),
        executor_prompt=VALUES(executor_prompt), optimized_prompt=VALUES(optimized_prompt),
        max_rows=VALUES(max_rows), capability=VALUES(capability),
        blocked_reason=VALUES(blocked_reason),
        live=VALUES(live), state='active', retired_at=NULL`,
    [
      a.key, a.ruleKey ?? null, a.motion, a.scope ?? "company", a.ownerEmail,
      a.english, a.summary ?? null, a.triggerKind, a.whenEvent ?? null,
      a.parentKey ?? null, a.everyMinutes ?? null, a.findSql ?? null,
      a.subjectCol ?? null, a.watermarkCol ?? null, a.agentTask ?? null,
      a.mode ?? "cron", a.gtwyAgentId ?? null, a.cronJobId ?? null,
      a.executorPrompt ?? null, a.optimizedPrompt ?? null,
      a.maxRows ?? 50, a.capability ?? "ready", a.blockedReason ?? null,
      a.live && isRunnable && (a.capability ?? "ready") === "ready" ? 1 : 0,
    ],
  );
  return { ok: true, key: a.key };
}

/**
 * Retire one. For a dynamically built automation this also tears down what
 * was provisioned for it — the cron-job.org job and the GTWY executor agent
 * — so retiring a rule stops it everywhere, not just in this table. Both
 * teardown calls are best-effort: a dead external service must not stop the
 * row itself from being retired.
 */
export async function retireAutomation(key: string): Promise<boolean> {
  const existing = await getAutomation(key);
  if (existing?.cronJobId) {
    const { deleteCronJob } = await import("@/lib/pulse/cronjob");
    await deleteCronJob(existing.cronJobId).catch(() => {});
  }
  if (existing?.gtwyAgentId) {
    const { deleteAgent } = await import("@/lib/pulse/gtwyAdmin");
    await deleteAgent(existing.gtwyAgentId).catch(() => {});
  }

  const res = await write(
    `UPDATE pulse_automation SET state='retired', live=0, retired_at=NOW()
      WHERE automation_key = ? AND state <> 'retired'`,
    [key],
  );
  return res.affectedRows > 0;
}

export async function setLive(key: string, live: boolean): Promise<boolean> {
  const res = await write(
    `UPDATE pulse_automation SET live = ?
      WHERE automation_key = ? AND state='active' AND capability='ready'
        AND trigger_kind='schedule'`,
    [live ? 1 : 0, key],
  );
  return res.affectedRows > 0;
}

/** After a pass: when to look again, and what happened. */
export async function recordRun(
  key: string,
  opts: { alerts: number; error?: string | null; everyMinutes: number | null },
): Promise<void> {
  const mins = Math.max(1, opts.everyMinutes ?? 5);
  await write(
    `UPDATE pulse_automation
        SET last_run_at = NOW(),
            next_run_at = DATE_ADD(NOW(), INTERVAL ? MINUTE),
            run_count = run_count + 1,
            alert_count = alert_count + ?,
            last_error = ?
      WHERE automation_key = ?`,
    [mins, opts.alerts, opts.error ?? null, key],
  );
}
