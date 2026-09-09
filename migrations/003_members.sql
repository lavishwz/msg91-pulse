-- 003_members.sql — who is allowed to sign in to Pulse.
--
-- Pulse is invite-only. A Proxy login proves who you are; this table decides
-- whether that person may in. It lives in Pulse's own schema (never MSG91's)
-- and is applied at boot like every other migration here.
--
-- The one exception to invite-only is the first login against an empty table:
-- somebody has to be able to reach the invite screen to begin with, and a
-- deploy where nobody can get in is worse than a deploy where the first person
-- through the door is recorded as the bootstrap member. Once a single row
-- exists that grace is gone for good — see lib/pulse/members.ts.

CREATE TABLE IF NOT EXISTS pulse_member (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(190)    NOT NULL COMMENT 'lowercased; the identity Proxy reports',
  name            VARCHAR(190)    NULL COMMENT 'display name, backfilled from Proxy on login',
  status          ENUM('invited','active') NOT NULL DEFAULT 'invited'
                  COMMENT 'invited until the first successful login',
  invited_by      VARCHAR(190)    NULL COMMENT 'email of the member who invited them, or bootstrap',
  proxy_user_id   VARCHAR(64)     NULL COMMENT 'Proxy user id, recorded on first login',
  invited_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at   DATETIME        NULL,
  PRIMARY KEY (id),
  -- The gate is keyed on email, so the uniqueness of email is the gate. Two
  -- rows for one person would mean removing one of them does not lock them out.
  UNIQUE KEY uq_member_email (email),
  KEY ix_member_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
