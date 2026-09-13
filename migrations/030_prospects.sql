-- ---------------------------------------------------------------------------
-- 030_prospects.sql — manually added potential customers.
--
-- PRD §8.4 requires "Add a potential customer/company manually" as a V1
-- function, and the handover's ⌘K "add a company" / "add accounts in bulk"
-- (feature 21, 35) both assume somewhere to put a company that is not yet an
-- MSG91 customer. Nothing existed: every "account" Pulse could show was a row
-- that already had an `ms_user.user_pid`, so a prospect had nowhere to live —
-- confirmed against the running app, where the bulk-add sheet's own save
-- button did not call anything (see docs/dev-notes/*).
--
-- Data path: option 3 (Pulse standalone) — pre-approved in the AI build
-- instructions' known-decisions table for anything Pulse owns itself that has
-- no existing source. A prospect is exactly that: it does not exist in
-- ms_user by definition, so there is no table to read it from.
--
-- `domain` is the dedup key. Not unique-constrained, on purpose: two people at
-- the same company (two emails, one domain) legitimately produce two rows
-- until a human merges them, the same reasoning pulse_account_contact (021)
-- uses for people. Dedup is therefore a *check* the API runs before insert,
-- not a database constraint — the same "checked against what we already
-- have" promise the bulk-add sheet's copy already made, now actually true.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_prospect (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_name      VARCHAR(190)    NOT NULL,
  domain            VARCHAR(190)    NULL COMMENT 'lowercased, from the email/domain given — the dedup key',
  email             VARCHAR(190)    NULL,
  status            ENUM('new','contacted','converted','suppressed') NOT NULL DEFAULT 'new',
  note              VARCHAR(255)    NULL COMMENT 'why it was classified this way — shown next to the row',
  source            ENUM('bulk_add','manual','cmdk') NOT NULL DEFAULT 'manual',
  owner_admin_id    VARCHAR(64)     NULL COMMENT 'ms_user.user_pid of the rep, once assigned',
  added_by          VARCHAR(190)    NOT NULL COMMENT 'pulse_member.email',
  /* Set once this prospect actually signs up and gets a real user_pid — the
     identity-resolution link the handover calls "new person at a lapsed
     account" in reverse: a prospect that converted, not a duplicate. */
  linked_account_pid VARCHAR(64)    NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_prospect_domain (domain),
  KEY ix_prospect_email (email),
  KEY ix_prospect_status (status, created_at),
  KEY ix_prospect_owner (owner_admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
