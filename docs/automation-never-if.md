# Turning on `never_if` — code-enforced "don't do this" rules

## What's already shipped (this repo)

A dynamically built automation (`pulse_automation`) can now carry a
`never_if_json` column: a list of `[field, op, value]` conditions — the same
shape `pulse_policy.stop_if` already uses for the four fixed motions (see
[lib/pulse/autopilot/rules.ts](../lib/pulse/autopilot/rules.ts)).

Before any row an automation finds is handed to its executor agent,
[automation-runner.ts](../lib/pulse/autopilot/automation-runner.ts)'s
`neverIfHit()` checks it against `never_if` in code. If any condition
matches, the agent is **never called** for that row — it's recorded as a
`"blocked"` decision and the automation moves on. This is a hard stop, not a
prompt the agent could talk itself out of.

The build pipeline, the save path, and the UI (the "Add rule" popup shows
`never_if` in the "Now running" confirmation once it's set) are all wired up
and shipped. **It is currently inert**, because of the one piece that isn't
in this repo:

## The one remaining step — on db.gtwy.ai, not in this codebase

`AutomationPlanSchema` (in [lib/pulse/agents.ts](../lib/pulse/agents.ts)) now
accepts an optional `never_if` field, but the **automation-planner** agent
(slug `automation-planner`, id from `GTWY_AGENT_AUTOMATION_PLANNER` or the
fallback in `AGENTS.automationPlanner`) doesn't know to populate it — its
system prompt is configured on db.gtwy.ai, outside this repo, and predates
this field. Until that prompt is updated, `never_if` comes back empty and
every automation runs exactly as it did before this change (the field is
`.optional().default([])`, so nothing breaks — it just doesn't do anything
yet).

**To turn it on**, add something like this to the automation-planner agent's
system prompt on db.gtwy.ai:

> If the rule's English contains an explicit prohibition — "never act on
> accounts that already have an owner", "don't message enterprise accounts",
> "must not do X" — extract each one as a condition in `never_if`: a
> `[field, op, value]` triple using a column your `find_sql` actually
> selects, with `op` one of `>= > <= < == != in`. Only extract conditions
> that are genuinely absolute negatives, not soft preferences ("try not to",
> "prefer to avoid") — those stay in `executor_prompt` for the agent to
> weigh, since they're judgment calls, not hard stops. If the rule has no
> such prohibition, return an empty array.

Once that's live, rebuild an existing automation whose English contains a
"don't"/"never" clause (retire and re-add it, or use the rewrite flow) and
its `never_if` should show up in the confirmation popup and in
`pulse_automation.never_if_json`.

## Why this couldn't be finished end-to-end in one pass

This session's sandbox has no access to db.gtwy.ai (the agent runtime is a
separate hosted platform) and no working local MySQL to run the new
migration ([migrations/028_automation_never_if.sql](../migrations/028_automation_never_if.sql))
against — `scripts/local-db/up.sh` is currently broken in this environment
(MariaDB rejects `provider_bzip2=force_plus_permanent` and similar options
at startup — unrelated to this change). Both the migration and the
automation-runner enforcement should be tested against a real build before
relying on them in production.
