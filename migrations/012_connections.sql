-- ---------------------------------------------------------------------------
-- 012_connections.sql — who has connected Google (mail + calendar) through
-- ViaSocket, on Pulse's own side.
--
-- The connect popup (lib/pulse/viasocket.ts, public/pulse.js) is ViaSocket's:
-- it proves the OAuth happened and hands the browser a connection id, but that
-- lives on ViaSocket's server, not ours. Without a row here, Pulse would only
-- know "connected" for as long as a browser tab kept its own in-memory state —
-- gone on reload, different on another device. This table is what makes a
-- connection an account fact rather than a tab fact.
--
-- `member_email` rather than an ms_user id, same reasoning as
-- pulse_commercial_reveal (010): this is about the person signed in to Pulse,
-- keyed the same way as pulse_member.email.
--
-- One row per (member, service) — a second connect just overwrites
-- connected_at and the id ViaSocket returned. `disconnected_at` is set instead
-- of deleting the row, so "was this ever connected, and when did it stop"
-- survives a disconnect.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pulse_connection (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_email     VARCHAR(190) NOT NULL COMMENT 'pulse_member.email — whose connection this is',
  service          VARCHAR(32)  NOT NULL COMMENT '"gmail" or "cal" — matches the ME.* flags in public/pulse.js',
  viasocket_id     VARCHAR(190) NULL     COMMENT 'the connection id ViaSocket handed back on success',
  connected_at     DATETIME     NULL,
  disconnected_at  DATETIME     NULL,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_service (member_email, service)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
