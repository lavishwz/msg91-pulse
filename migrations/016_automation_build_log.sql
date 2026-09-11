-- Every failed attempt to build a dynamic automation, kept for whoever is
-- debugging later — not shown to the person who typed the rule, who gets a
-- plain-English message instead (see build.ts). The raw error and which step
-- it failed at are what a developer actually needs; a customer-facing
-- automation form is not the place to put a stack-trace-shaped string.

CREATE TABLE IF NOT EXISTS pulse_automation_build_failure (
  id          INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
  english     TEXT            NOT NULL COMMENT 'the sentence that was typed',
  motion      VARCHAR(20)     NOT NULL,
  owner_email VARCHAR(190)    NULL,
  step        VARCHAR(20)     NOT NULL COMMENT 'plan | guard | dry_run | cron | save',
  error       TEXT            NOT NULL COMMENT 'the real error, for a developer',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_step (step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
