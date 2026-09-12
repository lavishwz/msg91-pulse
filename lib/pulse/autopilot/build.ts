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
import { query, columnsOf } from "@/lib/db";
import { write } from "@/lib/store";
import { createCronJob, deleteCronJob, cronIntervalMinutes } from "@/lib/pulse/cronjob";
import { saveAutomation, type Motion, type Scope } from "./automations";
import { EVENTS, isEventName, type EventName } from "./events";
import { publicBaseUrl } from "@/lib/pulse/baseUrl";

export type BuildStep = "plan" | "guard" | "dry_run" | "cron" | "save";

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
  | { ok: false; message: string; error: string; step: BuildStep };

/**
 * What a person sees when a build fails — never the raw error, which is a
 * database message, a GTWY error body, or a stack-shaped string meant for
 * whoever fixes this, not for whoever typed a rule. The real error still goes
 * to `pulse_automation_build_failure` (see logFailure) for that person to
 * read later; the UI gets a sentence that says what to try next.
 */
const FRIENDLY_MESSAGE: Record<BuildStep, string> = {
  plan: "Pulse couldn't work out a plan for that rule. Try rewording it — shorter, more concrete sentences plan more reliably.",
  guard: "That rule would need a query Pulse won't run for safety reasons. Try being more specific about what it should check.",
  dry_run: "The plan referenced data that doesn't actually exist. Try rewording which field or condition the rule depends on.",
  cron: "This rule needs a schedule, and something's wrong with how Pulse reaches the outside world right now — this isn't about your rule. Try again shortly, or tell whoever manages Pulse.",
  save: "Everything about the rule checked out, but saving it failed. Try again — if it keeps happening, tell whoever manages Pulse.",
};

/** Kept for whoever debugs this later — never shown to the person who typed the rule. */
async function logFailure(english: string, motion: Motion, ownerEmail: string, step: BuildStep, error: string): Promise<void> {
  try {
    await write(
      `INSERT INTO pulse_automation_build_failure (english, motion, owner_email, step, error) VALUES (?,?,?,?,?)`,
      [english, motion, ownerEmail, step, error.slice(0, 4000)],
    );
  } catch {
    /* Logging the failure must never be the reason the failure isn't reported. */
  }
}

async function fail(
  english: string,
  motion: Motion,
  ownerEmail: string,
  step: BuildStep,
  error: string,
): Promise<BuildResult> {
  await logFailure(english, motion, ownerEmail, step, error);
  return { ok: false, step, error, message: FRIENDLY_MESSAGE[step] };
}

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
/**
 * Start a watermarked rule at "everything that already exists has been seen".
 *
 * Without this, a rule's first pass has no watermark — loadMark() returns null
 * and runOne() skips the freshness filter entirely — so it judges and alerts on
 * whatever its query happens to return first. For a query with no recency
 * filter ordered oldest-first, that is the oldest rows in the table, announced
 * as though they had just happened.
 *
 * That is not a hypothetical. A rule written as "whenever a new sign up comes,
 * check if the profile is filled" was planned as
 * `WHERE user_date IS NOT NULL ORDER BY user_date ASC LIMIT 50` — safe, legal,
 * passes the guard and the dry run — and raised eight alerts about the oldest
 * accounts on the system, none of which was a new signup.
 *
 * Seeding from the query's own current maximum rather than from NOW() keeps
 * this honest about types: the watermark column is usually a datetime but
 * nothing guarantees it, and markOf() compares as strings, so writing an ISO
 * timestamp into a rule watermarked on a numeric id would filter every row out
 * forever. Taking the max *of the same expression the rule will compare
 * against* cannot have that mismatch.
 *
 * The trailing LIMIT is stripped because the query has one (the guard appends
 * it) and the maximum of the first fifty oldest rows is not the maximum — it
 * is the fiftieth oldest, which would leave the rule to walk forward from
 * there exactly as before, just starting later.
 *
 * Best-effort: a rule that saved is a rule that exists, and failing to seed it
 * is the old behaviour rather than a new failure, so it is logged and not
 * raised.
 */
async function seedWatermark(
  key: string,
  findSql: string,
  watermarkCol: string | null,
): Promise<void> {
  if (!watermarkCol) return;
  const unlimited = findSql
    .replace(/;\s*$/, "")
    .replace(/\blimit\s+\d+\s*(?:,\s*\d+\s*)?$/i, "");
  try {
    const rows = await query<{ m: unknown }>(
      `SELECT MAX(\`${watermarkCol}\`) AS m FROM (${unlimited}) __seed`,
    );
    const max = rows[0]?.m;
    /* Nothing there yet: leave the watermark unset. An empty table means the
       first real row is genuinely new, which is the answer we want anyway. */
    if (max === null || max === undefined) return;
    const position = max instanceof Date ? max.toISOString() : String(max);
    await write(
      `INSERT INTO pulse_watermark (stream, position, last_run_at, last_count)
       VALUES (?, ?, NOW(), 0)
       ON DUPLICATE KEY UPDATE position = GREATEST(position, VALUES(position))`,
      ["automation:" + key, position],
    );
  } catch (err) {
    console.warn(
      `[pulse] could not seed the watermark for ${key} — its first pass will judge whatever ` +
        `its query returns: ${(err as Error).message}`,
    );
  }
}

async function dryRun(sql: string): Promise<{ ok: true; columns: string[] } | { ok: false; error: string }> {
  const wrapped = `SELECT * FROM (${sql.replace(/;\s*$/, "")}) __dry_run LIMIT 0`;
  try {
    await query(wrapped);
    /* The same plan, asked for its field list rather than its rows — what
       subject_col and watermark_col are checked against below. */
    return { ok: true, columns: await columnsOf(sql) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Keep subject_col and watermark_col honest about the query they belong to.
 *
 * Both name a column of the plan's own find_sql, and the planner names one
 * the query does not actually return often enough to matter — it writes
 * `SELECT u.user_pid AS subject_id …` and then answers "user_pid", or selects
 * an aggregate and names the column it aggregated. Nothing checked, and
 * neither failure announces itself at run time:
 *
 *   subject_col missing — `row[subjectCol]` is undefined, so every row in the
 *     pass falls back to the same "portfolio" signal key. pulse_decision and
 *     pulse_signal both dedupe on that key, so an automation that judged
 *     twenty-three rows leaves one row behind and the Log reads "Scored
 *     Account ?". Found live on a rule with 101 runs and exactly one visible
 *     decision.
 *
 *   watermark_col missing — `markOf(undefined)` is "", which is falsy, so the
 *     mark never advances and the watermark quietly does nothing at all. The
 *     rule still runs; it just re-judges the same rows forever while the UI
 *     says it is watermarked.
 *
 * Repaired rather than refused: the query is sound and the rule is what the
 * person asked for — it is only the column name that is wrong, and a plausible
 * id column in the result is a better answer than failing the build. When
 * there is nothing to fall back to the column is cleared, which puts the rule
 * on the no-watermark rotation path instead of a silently broken one.
 */
function columnNamed(wanted: string | null | undefined, columns: string[]): string | null {
  if (!wanted) return null;
  const exact = columns.find((c) => c === wanted);
  if (exact) return exact;
  const insensitive = columns.find((c) => c.toLowerCase() === wanted.toLowerCase());
  return insensitive ?? null;
}

/** A column that looks like it identifies the row, for a subject_col that named nothing. */
function idColumn(columns: string[]): string | null {
  return (
    columns.find((c) => /^(subject_id|user_pid)$/i.test(c)) ??
    columns.find((c) => /(^|_)pid$/i.test(c)) ??
    columns.find((c) => /(^|_)id$/i.test(c)) ??
    null
  );
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
 *
 * `eventName`, when given, comes from the person explicitly picking an event
 * off the Rules page's fixed dropdown (see `lib/pulse/autopilot/events.ts`) —
 * not from the planner's own `mode`/`when_event` guess. Tried relying on the
 * model to both decide event-vs-cron *and* name the exact event: it dropped
 * `when_event` from its JSON more often than not, and still wrote a find_sql
 * for "event" rules despite being told not to (caught by hand, replaying the
 * planner against a few sample rules before wiring this up). Routing is not
 * something worth trusting a model for when the caller already knows the
 * answer — so when `eventName` is set, it is authoritative and the planner's
 * own mode/when_event/find_sql/cron_schedule are only ever informational.
 */
export async function buildAutomation(
  english: string,
  motion: Motion,
  ownerEmail: string,
  scope: Scope = "company",
  eventName?: EventName,
): Promise<BuildResult> {
  const eventInfo = eventName && isEventName(eventName) ? EVENTS[eventName] : null;

  let plan;
  try {
    /* The planner still writes executor_prompt/optimized_rule_prompt for an
       event automation — it is good at turning "notify me if it looks bad"
       into a judging prompt — it is only not trusted to pick *which* event or
       to invent a query for one. Telling it the event and its payload shape
       up front is what makes the executor_prompt it writes actually reference
       the right field names. */
    const forPlanner = eventInfo
      ? `This automation reacts to the event "${eventName}" (${eventInfo.label}). ` +
        `Its payload has this shape: ${eventInfo.payload}. There is no database query — ` +
        `the payload itself is the one row to judge. What to do when it fires: ${english}`
      : english;
    const call = await planAutomation(forPlanner, motion);
    plan = call.data;
  } catch (err) {
    return fail(english, motion, ownerEmail, "plan", (err as Error).message);
  }

  const key = `dyn-${slugify(english)}-${Date.now().toString(36)}`;

  /* ── event automations: no query, no cron job, live the moment it saves ── */
  if (eventInfo) {
    const saved = await saveAutomation({
      key,
      motion,
      scope,
      ownerEmail,
      english,
      summary: plan.optimized_rule_prompt.slice(0, 252) + (plan.optimized_rule_prompt.length > 252 ? "…" : ""),
      triggerKind: "event",
      whenEvent: eventName,
      mode: "event",
      findSql: null,
      subjectCol: null,
      watermarkCol: null,
      agentTask: plan.executor_prompt,
      executorPrompt: plan.executor_prompt,
      optimizedPrompt: plan.optimized_rule_prompt,
      cronJobId: null,
      maxRows: plan.max_rows || 50,
      capability: "ready",
      live: true,
    });
    if (!saved.ok) {
      return fail(english, motion, ownerEmail, "save", saved.error);
    }
    return {
      ok: true,
      key,
      mode: "event",
      optimizedPrompt: plan.optimized_rule_prompt,
      findSql: "",
      executorPrompt: plan.executor_prompt,
      cronJobId: null,
      webhookUrl: null,
      cronSchedule: null,
    };
  }

  /* ── schedule automations: unchanged from before this feature ── */
  /* find_sql is optional on the plan schema so an event rule can be built
     without one (see AutomationPlanSchema). On this path it is the whole
     point, so its absence is caught here with a message that says what the
     planner actually did — rather than being handed to guard() as an empty
     string and coming back as a parse complaint about nothing. */
  if (!plan.find_sql?.trim()) {
    return fail(
      english, motion, ownerEmail, "plan",
      "the planner returned no query for a scheduled rule. Say more plainly what it should look for, " +
        "or pick an event instead if it should react to something happening inside Pulse.",
    );
  }
  const g = guard(plan.find_sql, Math.min(plan.max_rows || 50, 200));
  if (!g.ok) {
    return fail(english, motion, ownerEmail, "guard", "the planner's query is not safe to run: " + g.reason);
  }

  const dry = await dryRun(g.sql);
  if (!dry.ok) {
    return fail(
      english, motion, ownerEmail, "dry_run",
      "the planner's query does not run against the real database: " + dry.error,
    );
  }

  let cronJobId: string | null = null;
  let webhookUrl: string | null = null;
  const cronSchedule = plan.cron_schedule || "0 * * * *";
  {
    const base = publicBaseUrl();
    if (!base) {
      return fail(
        english, motion, ownerEmail, "cron",
        "PUBLIC_BASE_URL is not set and no Vercel production host was detected — cron-job.org needs a public URL to call. Set PUBLIC_BASE_URL in the environment.",
      );
    }
    const secret = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
    if (!secret) {
      return fail(
        english, motion, ownerEmail, "cron",
        "AUTOPILOT_TICK_SECRET is not set — the webhook refuses to be provisioned unprotected.",
      );
    }
    webhookUrl = `${base}/api/pulse/autopilot/webhook/${key}?secret=${encodeURIComponent(secret)}`;
    try {
      cronJobId = await createCronJob(`pulse: ${english.slice(0, 60)}`, webhookUrl, cronSchedule);
    } catch (err) {
      return fail(english, motion, ownerEmail, "cron", (err as Error).message);
    }
  }

  /* From here the job exists at cron-job.org and is already on its schedule,
     while the row it fires at does not exist yet. If the save below fails,
     that job keeps calling /webhook/<key> for a key nothing will ever match —
     forever, and invisibly, because a job firing into a 404 looks healthy from
     cron-job.org's side.

     This is not hypothetical: the automation inventory reports exactly one
     such job today ("firing at an automation that no longer exists"), which is
     what this leak leaves behind. The job is torn down on a failed save so the
     failure is total rather than half-committed. */

  const watermarkCol = columnNamed(plan.watermark_col, dry.columns);

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
    mode: "cron",
    /* The same cadence the cron job was just registered with.
       This was never set, so it landed NULL and recordRun fell back to its
       five-minute default when setting next_run_at — which is what `due()`
       reads. Every dynamically-built automation was therefore eligible for
       the internal tick every five minutes no matter what schedule the
       planner had chosen and actually registered. Storing it keeps the two
       halves of the automation's cadence agreeing with each other. */
    everyMinutes: cronIntervalMinutes(cronSchedule),
    findSql: plan.find_sql,
    subjectCol: columnNamed(plan.subject_col, dry.columns) ?? idColumn(dry.columns),
    watermarkCol,
    agentTask: plan.executor_prompt,
    executorPrompt: plan.executor_prompt,
    optimizedPrompt: plan.optimized_rule_prompt,
    cronJobId,
    maxRows: plan.max_rows || 50,
    capability: "ready",
    live: true,
  });
  if (!saved.ok) {
    /* Take the job back down — see the note above. Its own failure is reported
       alongside the save's rather than replacing it: the save error is what
       went wrong, and a job left behind is something a person has to know to
       go and delete by hand. */
    let orphan = "";
    if (cronJobId) {
      try {
        await deleteCronJob(cronJobId);
      } catch (err) {
        orphan =
          ` (and cron job ${cronJobId} could not be removed: ${(err as Error).message}` +
          ` — it will keep firing at a rule that was never saved, delete it at cron-job.org)`;
      }
    }
    return fail(english, motion, ownerEmail, "save", saved.error + orphan);
  }

  await seedWatermark(key, plan.find_sql, watermarkCol);

  return {
    ok: true,
    key,
    mode: "cron",
    optimizedPrompt: plan.optimized_rule_prompt,
    findSql: plan.find_sql,
    executorPrompt: plan.executor_prompt,
    cronJobId,
    webhookUrl,
    cronSchedule: plan.cron_schedule,
  };
}
