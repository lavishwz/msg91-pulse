-- ---------------------------------------------------------------------------
-- 031_health_correction.sql — a rep flagging a health score as wrong.
--
-- The account-health agent (lib/pulse/healthJudge.ts) carries confidence and
-- a reason, and the board says whether a score came from the agent or the
-- formula (lib/pulse/health.ts) — but nothing let the person actually looking
-- at an account say "this is wrong" back to Pulse. A score a rep disagrees
-- with and cannot correct or even flag is a score they quietly stop trusting
-- and stop using, with no record that it ever happened.
--
-- Deliberately a flag, not a rewrite: this does not change score_of_record —
-- correcting the formula or the agent's judgment is a bigger, separate
-- decision. This is the smallest honest step: capture the disagreement,
-- who raised it and why, against the score and band as shown at the time, so
-- a person reviewing the account-health agent's accuracy later has real
-- disagreements to look at instead of silence that might mean "always right"
-- or might mean "nobody could tell it anything."
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_health_correction (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_pid   VARCHAR(64)     NOT NULL COMMENT 'ms_user.user_pid of the flagged account',
  shown_score   SMALLINT        NOT NULL COMMENT 'the score on screen when flagged',
  shown_band    VARCHAR(16)     NOT NULL COMMENT 'the band on screen when flagged',
  decided_by    ENUM('ai','formula') NOT NULL COMMENT 'who produced shown_score, per lib/pulse/health.ts',
  note          VARCHAR(500)    NULL COMMENT 'optional — why the rep thinks it is wrong',
  raised_by     VARCHAR(190)    NOT NULL COMMENT 'pulse_member.email of whoever flagged it',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_health_correction_account (account_pid, created_at),
  KEY ix_health_correction_raised_by (raised_by, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
