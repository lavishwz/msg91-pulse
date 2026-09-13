-- Structured "never do this" conditions, alongside the free-text agent_task
-- an automation's executor agent still gets.
--
-- Today a prohibition in a rule's English ("don't message enterprise
-- accounts", "never act on an account somebody already owns") is just more
-- text inside agent_task — a request the executor agent reads and is asked
-- to honour, with nothing in code stopping it if it doesn't. never_if_json
-- gives the same rule a second, code-enforced form: the same [field, op,
-- value] triples pulse_policy's stop_if already uses for the four fixed
-- motions (see rules.ts), evaluated in automation-runner.ts before a row's
-- verdict is acted on, regardless of what the agent decided.
--
-- Nullable and additive: existing rows get NULL and run exactly as before.
-- Populated only once the automation-planner agent on GTWY is told to
-- extract these (its prompt lives on db.gtwy.ai, not in this repo — see
-- docs/automation-never-if.md) — until then this column stays empty and the
-- check in automation-runner.ts is a no-op.
ALTER TABLE pulse_automation
  ADD COLUMN never_if_json TEXT NULL AFTER agent_task;
