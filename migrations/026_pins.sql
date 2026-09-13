-- ---------------------------------------------------------------------------
-- 026_pins.sql — a member's pinned questions, on the server.
--
-- public/pulse.js kept this in localStorage only, justified in its own
-- comment by "the database connection is SELECT-only" — true of MSG91's
-- schema, never true of Pulse's own store, where pulse_account_tag and every
-- other pulse_* table already live. A pin made on a phone was invisible on a
-- laptop, and cleared entirely the moment someone cleared site data.
--
-- One row per member. The whole client-side PINS shape ({q, typed}) is kept
-- as one JSON document rather than split into rows, on purpose: it is a
-- single person's small preference blob, read and written whole every time,
-- never queried by anything other than "give me this member's pins" — the
-- shape pulse_account_tag needs (many rows, queried by account, written one
-- at a time by many people) does not apply here.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pulse_pin (
  member_email  VARCHAR(190) NOT NULL COMMENT 'pulse_member.email',
  data          JSON         NOT NULL COMMENT '{"q":{questionId:0|1},"typed":[text,...]}',
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (member_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
