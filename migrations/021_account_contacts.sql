-- ---------------------------------------------------------------------------
-- 021_account_contacts.sql — people at a company, added by hand.
--
-- The company page's People section reads MSG91's own invited-member list
-- (`d.people`, via lib/pulse/accounts.ts) — real, but read-only: Pulse has
-- SELECT on that schema and nothing else, so a stakeholder MSG91 never
-- invited (a finance contact, a decision-maker who never logged in) had
-- nowhere to go. "＋ Add a person" existed on the page and opened the
-- unrelated "Log what happened" sheet instead — it pointed at the wrong
-- sheet because there was never a table behind the real one.
--
-- This is that table. Same shape as pulse_account_tag (005): free text,
-- attributed to whoever added it, listed alongside — not instead of —
-- MSG91's own list, so the two are never confused for each other on screen.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pulse_account_contact (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id  VARCHAR(64)  NOT NULL COMMENT 'ms_user.user_pid of the company — read-only elsewhere, so no FK',
  name        VARCHAR(190) NOT NULL,
  role        VARCHAR(120) NULL COMMENT 'their role at the company, in the adder''s own words',
  added_by    VARCHAR(190) NOT NULL COMMENT 'pulse_member.email',
  added_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_account (account_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
