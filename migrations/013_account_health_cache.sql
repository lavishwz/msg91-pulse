-- Account health, precomputed on a schedule instead of on every page load.
--
-- Before this, /api/pulse/board called healthFor() live on every request,
-- which meant a GTWY call to the account-health agent every time anyone
-- opened Now — slow, and it spent an agent call per page view rather than
-- per scoring pass. This table is what a cron pass (lib/pulse/healthCron.ts)
-- writes to, and what the board reads from instead.
--
-- One row per account, always overwritten in place — this is a cache of the
-- last pass, not a history. pulse_decision already has the append-only
-- record of what an agent said, when that matters.

CREATE TABLE IF NOT EXISTS pulse_account_health (
  account_id      INT             NOT NULL PRIMARY KEY,
  score           INT             NOT NULL,
  prior_score     INT             NOT NULL,
  band            ENUM('thriving','steady','wobbling','risk') NOT NULL,
  delta           INT             NOT NULL,
  moved           ENUM('up','down') NULL,
  spend30         DOUBLE          NOT NULL DEFAULT 0,
  components_json JSON            NULL,
  decided_by      ENUM('ai','formula') NOT NULL DEFAULT 'formula',
  reason          TEXT            NULL,
  confidence      DOUBLE          NULL,
  formula_score   INT             NOT NULL,
  computed_at     DATETIME        NOT NULL,
  INDEX idx_computed_at (computed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
