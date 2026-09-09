-- 005_account_tags.sql — tags on a company, kept by Pulse.
--
-- Tags were the last thing on the company page still living in the browser:
-- the prototype's TAGS object, lost on reload and private to whoever's tab it
-- was. They are notes one person leaves for the next — "price sensitive",
-- "warm intro available" — so they belong in the store, where the next person
-- to open that company sees them.
--
-- Pulse's schema, not MSG91's. `account_id` is an ms_user.user_pid and is
-- deliberately NOT a foreign key: MSG91's tables live on another server that
-- Pulse only ever reads, so the reference cannot be enforced by the database
-- and pretending otherwise would be a lie in the schema.
--
-- `source` is the whole reason the page can draw two kinds of tag: a solid one
-- somebody typed, a dashed one Pulse inferred from evidence. Keeping them in
-- one table with a column between them means a tag can be filtered on without
-- caring who added it, and shown differently when it matters.

CREATE TABLE IF NOT EXISTS pulse_account_tag (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    VARCHAR(64)     NOT NULL COMMENT 'ms_user.user_pid — read-only elsewhere, so no FK',
  tag           VARCHAR(60)     NOT NULL COMMENT 'free text, trimmed and collapsed; case kept as typed',
  tag_key       VARCHAR(60)     NOT NULL COMMENT 'lowercased tag — what uniqueness is judged on',
  source        ENUM('human','pulse') NOT NULL DEFAULT 'human'
                COMMENT 'human tags show solid, Pulse-inferred ones dashed',
  added_by      VARCHAR(190)    NULL COMMENT 'member email, or null when Pulse added it',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- One tag per company, however it is capitalised. "Enterprise" and
  -- "enterprise" are the same note, and two of them on one company is a bug
  -- somebody would have to clean up by hand.
  UNIQUE KEY uq_account_tag (account_id, tag_key),
  -- The company page reads by account; Ask reads by tag across accounts.
  KEY ix_tag_key (tag_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
