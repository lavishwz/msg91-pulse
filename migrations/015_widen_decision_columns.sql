-- Two more columns too small for a dynamic automation's long, auto-generated
-- key (see 014_widen_watermark_stream.sql for the same problem hitting
-- pulse_watermark first).
--
--   agent VARCHAR(60) — breakerAgent() in automation-runner.ts writes
--   "rule-worker:<automation key>" here so a runaway rule's breaker trips on
--   its own count, not the sum of every rule sharing the worker. That prefix
--   plus a 60+ character key overflows 60 characters on its own.
--
--   policy_version VARCHAR(32) — automation-runner.ts writes the automation's
--   own key here (what a decision cites), which is the same long key.

ALTER TABLE pulse_decision
  MODIFY COLUMN agent VARCHAR(150) NOT NULL COMMENT 'signup-triage | outreach-drafter | rule-worker:<automation key> | …',
  MODIFY COLUMN policy_version VARCHAR(150) NULL COMMENT 'the pulse_policy version in force, or an automation key';
