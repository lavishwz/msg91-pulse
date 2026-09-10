-- ---------------------------------------------------------------------------
-- 009_account_owner.sql — who owns a company, when Pulse is the one who said so.
--
-- Reassign was the last button on the card that did nothing. It opened a sheet,
-- listed the real reps, let you click one — and "Reassign →" closed the sheet
-- and threw the answer away. Worse, the sheet was honest-looking: it said "the
-- new owner picks up every open mission and promise on this account", and none
-- of that happened.
--
-- ── Why a table here rather than a write over there ────────────────────────
-- Ownership in MSG91's schema is `user_handled_by` (account → admin). Pulse has
-- SELECT on that database and nothing else, by design — see lib/db.ts. So a
-- reassignment cannot be written where it is read from, and the choice is
-- between not shipping the feature and recording the decision on Pulse's side
-- as an override that is layered on at read time.
--
-- This is the override. `pulse_account_owner` holds at most one row per
-- account: the current answer. `pulse_account_owner_event` holds every change
-- ever made, including the ones since undone.
--
-- Three things this deliberately does:
--
--   **Keeps what was there before.** `previous_owner_id` on the event row is
--     what `user_handled_by` said at the moment somebody overrode it. Without
--     it there is no way to undo an override, and no way to tell a
--     reassignment from a re-statement of what was already true.
--
--   **Allows "nobody".** `owner_id` is nullable and NULL means deliberately
--     unowned — an account taken off a rep who left, not yet given to anyone.
--     That is a different fact from "no row here", which means Pulse has never
--     had an opinion and MSG91's answer stands.
--
--   **Denormalises the name.** `owner_name` and `owner_email` are copied in.
--     They are read from MSG91's database, which is on another server and may
--     be unreachable when this row is read; an audit trail that cannot say who
--     an account was given to is not one.
--
-- `account_id` and `owner_id` are ms_user.user_pid values and are deliberately
-- NOT foreign keys, for the same reason as pulse_account_tag (005): the rows
-- they point at live on a server this database cannot see, so the reference
-- cannot be enforced and pretending otherwise would be a lie in the schema.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pulse_account_owner (
  account_id    VARCHAR(64)  NOT NULL COMMENT 'ms_user.user_pid of the company — read-only elsewhere, so no FK',
  owner_id      VARCHAR(64)  NULL     COMMENT 'ms_user.user_pid of the rep; NULL means deliberately unowned',
  owner_name    VARCHAR(190) NULL     COMMENT 'copied from MSG91 at the time, so the record survives that server',
  owner_email   VARCHAR(190) NULL,
  note          VARCHAR(255) NULL     COMMENT 'why, in the words of whoever did it',
  assigned_by   VARCHAR(190) NOT NULL COMMENT 'pulse_member.email',
  assigned_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  -- "Every account owned by X" is the query the standings and the reassign
  -- suggestion both run, and it is the only one that is not by primary key.
  KEY ix_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every change, kept. The current row above is a cache of the newest event
-- here, and could be rebuilt from it if it ever disagreed.
CREATE TABLE IF NOT EXISTS pulse_account_owner_event (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id        VARCHAR(64)  NOT NULL,
  account_name      VARCHAR(190) NULL COMMENT 'copied, like owner_name, so the log reads without MSG91',
  owner_id          VARCHAR(64)  NULL COMMENT 'who it went to; NULL for taken off everybody',
  owner_name        VARCHAR(190) NULL,
  previous_owner_id VARCHAR(64)  NULL COMMENT 'who had it, from user_handled_by or a prior override',
  previous_owner_name VARCHAR(190) NULL,
  -- `cleared` is a reassignment back to whatever MSG91 says — the override is
  -- withdrawn, which is not the same as assigning to nobody.
  action            ENUM('assigned','unassigned','cleared') NOT NULL,
  note              VARCHAR(255) NULL,
  -- One press of "Apply the suggested split" writes one row per account and
  -- shares a batch id, so the log can show it as the single act it was.
  batch             CHAR(32)     NULL,
  actor             VARCHAR(190) NOT NULL,
  at                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_account (account_id, id),
  KEY ix_batch (batch),
  KEY ix_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
