-- ---------------------------------------------------------------------------
-- 010_reveal_and_voice.sql — two things Pulse promised and did not keep.
--
-- ── pulse_commercial_reveal ────────────────────────────────────────────────
-- The company page hides payments and rates behind a button whose tooltip
-- reads: "Payments, wallet and rates are hidden by default. Opening them
-- writes an audit event against your name." Nothing was ever written. The
-- figures came back, the button changed its label, and no record of who had
-- looked at a customer's commercials existed anywhere.
--
-- That is the one claim in the product where being wrong is worse than not
-- making it: the whole reason the reveal is a deliberate act rather than
-- ambient data is that somebody can be asked about it later. This is the row
-- that makes the sentence true.
--
-- One row per reveal, not one per account — "who has looked at this, and how
-- often" is the question, and collapsing repeat views would answer it wrongly.
-- Nothing about the figures themselves is stored: what was revealed is
-- reconstructable from MSG91 at any time, and copying a customer's payment
-- history into a second database to prove somebody read it would be a
-- strange way to protect it.
--
-- ── pulse_user_voice ───────────────────────────────────────────────────────
-- "This is how you write" — onboarding step 3 — showed five traits from a
-- hardcoded array. Every person saw the same five, editing them changed a
-- variable in the tab, and reloading put them back. It is a per-person
-- setting stored per person now.
--
-- `member_email` rather than an ms_user id: this is about the Pulse member
-- who is signed in and writes the mail, not about an MSG91 account. It
-- matches pulse_member.email, and like every other id in Pulse's schema that
-- points somewhere else, it is not a foreign key.
--
-- `seeded` marks the five defaults a new person starts with, so "I have not
-- touched this yet" stays distinguishable from "I chose exactly these" — and
-- so the defaults can be changed later for people who never edited them
-- without overwriting anybody's own list.
--
-- `position` keeps the order somebody put them in. A list of traits that
-- reshuffles itself on every load reads as a system that is guessing.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pulse_commercial_reveal (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id   VARCHAR(64)  NOT NULL COMMENT 'ms_user.user_pid — read-only elsewhere, so no FK',
  account_name VARCHAR(190) NULL     COMMENT 'copied, so the log reads without MSG91',
  member_email VARCHAR(190) NOT NULL COMMENT 'pulse_member.email — who looked',
  at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- "who has seen this company's commercials" — the account page's question.
  KEY ix_account (account_id, id),
  -- "what has this person been looking at" — the audit tab's question.
  KEY ix_member (member_email, id),
  KEY ix_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pulse_user_voice (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_email VARCHAR(190) NOT NULL COMMENT 'pulse_member.email',
  trait        VARCHAR(120) NOT NULL COMMENT 'free text, as typed',
  trait_key    VARCHAR(120) NOT NULL COMMENT 'lowercased — what uniqueness is judged on',
  seeded       TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = one of the defaults, never edited',
  position     INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- One of each per person, however it is capitalised — the same rule as
  -- pulse_account_tag, for the same reason.
  UNIQUE KEY uq_member_trait (member_email, trait_key),
  KEY ix_member (member_email, position, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
