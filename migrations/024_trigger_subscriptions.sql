-- ---------------------------------------------------------------------------
-- 024_trigger_subscriptions.sql — the listening half of the ViaSocket
-- integration.
--
-- Until now Pulse only ever *called* ViaSocket: connect an app (012), enable
-- it for a script_id (022), then run actions against that script_id on demand
-- (lib/pulse/gmail.ts). Every one of those is Pulse asking a question. None of
-- them lets Gmail tell Pulse that something happened.
--
-- A trigger subscription is the other direction. ViaSocket holds the watch on
-- the user's mailbox and POSTs to a URL we hand it when the event fires. Two
-- tables, because a subscription and the events it delivers have completely
-- different lifetimes: the subscription is long-lived and there is one per
-- (member, trigger), while events arrive forever and are only interesting for
-- as long as it takes a browser tab to notice them.
--
-- Why a `hook_key` rather than putting the subscription id in the URL: the
-- webhook is a public, unauthenticated endpoint — it has to be, ViaSocket
-- calls it from its own servers with no Pulse session. A sequential id in the
-- URL would let anyone POST fake mail events for any member by counting up.
-- The key is a random UUID, so the URL itself is the credential, and it is
-- what the event is attributed by.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pulse_trigger_subscription (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_email        VARCHAR(190) NOT NULL COMMENT 'pulse_member.email — whose subscription this is',
  service             VARCHAR(32)  NOT NULL COMMENT '"gmail" — matches pulse_connection.service',
  trigger_version_id  VARCHAR(190) NOT NULL COMMENT 'ViaSocket trigger_version_id this subscribes to',
  label               VARCHAR(190) NOT NULL COMMENT 'human name, so the UI need not re-look-up the catalogue',
  script_id           VARCHAR(190) NULL     COMMENT 'what subscribe-event returned; the handle for updatestatus',
  hook_key            CHAR(36)     NOT NULL COMMENT 'random UUID — the unguessable part of our webhook URL',
  hook_url            VARCHAR(400) NULL     COMMENT 'the hookUrl ViaSocket created on its side, for debugging',
  state               VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT 'active | paused',
  last_event_at       DATETIME     NULL,
  event_count         INT UNSIGNED NOT NULL DEFAULT 0,
  last_error          VARCHAR(400) NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- One subscription per person per trigger. Subscribing twice is a no-op that
  -- refreshes the existing row rather than a second watch delivering doubles.
  UNIQUE KEY uniq_member_trigger (member_email, trigger_version_id),
  UNIQUE KEY uniq_hook_key (hook_key),
  KEY idx_member (member_email, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- What actually arrived. The browser polls this to raise a toast, so the only
-- query that matters is "anything for me newer than the id I last saw" — hence
-- the (member_email, id) key rather than one on received_at.
--
-- `payload` is whatever ViaSocket posted, stored whole and untouched. We do
-- not yet know which fields of a Gmail event we will want, and a column per
-- guess would be wrong by the second trigger. Summary fields are pulled out
-- for display only; the raw body stays authoritative.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pulse_trigger_event (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subscription_id  BIGINT UNSIGNED NOT NULL,
  member_email     VARCHAR(190) NOT NULL COMMENT 'denormalised from the subscription so the poll is one table',
  service          VARCHAR(32)  NOT NULL,
  label            VARCHAR(190) NOT NULL COMMENT 'the trigger''s name, for the toast text',
  summary          VARCHAR(400) NULL     COMMENT 'best-effort one-liner pulled from the payload',
  payload          MEDIUMTEXT   NULL     COMMENT 'the raw JSON ViaSocket posted, kept whole',
  received_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_member_id (member_email, id),
  KEY idx_subscription (subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
