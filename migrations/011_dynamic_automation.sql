-- Dynamic, cron-job.org-driven automations: a rule can now get its own GTWY
-- agent and its own external cron subscription instead of sharing the one
-- ruleWorker agent and the one internal tick.
--
--   mode            — "cron" (cron-job.org calls our webhook on a schedule)
--                      or "event" (no external schedule; not run yet).
--   gtwy_agent_id   — the per-rule chatbot agent created via db.gtwy.ai,
--                      given `executor_prompt` as its system prompt. NULL
--                      means this automation still uses the shared ruleWorker.
--   cron_job_id     — the cron-job.org job id, so it can be paused/deleted
--                      when the automation is retired.
--   executor_prompt — what the per-rule agent was told to do. Kept alongside
--                      agent_task so the row is self-describing even if the
--                      GTWY agent is later deleted or recreated.
--   optimized_prompt — the planner's plain-English restatement, shown in the
--                      UI instead of the raw `english` the person typed.

ALTER TABLE pulse_automation
  ADD COLUMN mode ENUM('cron','event') NOT NULL DEFAULT 'cron' AFTER trigger_kind,
  ADD COLUMN gtwy_agent_id VARCHAR(64) NULL AFTER agent_task,
  ADD COLUMN cron_job_id VARCHAR(64) NULL AFTER gtwy_agent_id,
  ADD COLUMN executor_prompt TEXT NULL AFTER cron_job_id,
  ADD COLUMN optimized_prompt TEXT NULL AFTER executor_prompt;
