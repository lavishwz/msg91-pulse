-- 001_store.sql — Pulse's own tables.
--
-- Applied automatically at server start (lib/migrate.ts), so a fresh deploy
-- creates them without anyone running anything by hand. Every statement is
-- written to be safe to run twice: this file is not a one-shot script, it is
-- the description of a schema that may already be there.
--
-- No CREATE DATABASE and no USE here — the database is chosen by
-- PULSE_STORE_DATABASE, and a migration that names its own schema cannot be
-- pointed at a different one.

-- ---------------------------------------------------------------------------
-- pulse_policy — the rules, versioned.
--
-- The manifest and the thresholds live here rather than in a hardcoded array,
-- because a decision has to cite the policy that produced it. Changing a
-- threshold writes a new row; it never edits an old one, or every decision made
-- under the old rule becomes unexplainable.
--
-- `state` is deliberately not a boolean: a rule that is being trialled is not
-- the same as one that is live, and the Rules tab draws that difference.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_policy (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version         VARCHAR(32)     NOT NULL COMMENT 'e.g. v1, v2 — what a decision cites',
  policy_key      VARCHAR(120)    NOT NULL COMMENT 'stable name, e.g. triage.threshold.human_now',
  kind            ENUM('threshold','manifest_yes','manifest_no','switch','rule') NOT NULL,
  body            JSON            NOT NULL COMMENT 'the rule itself; shape varies by kind',
  note            TEXT            NULL COMMENT 'why this rule exists, in a person''s words',
  state           ENUM('active','proposed','retired') NOT NULL DEFAULT 'active',
  source          ENUM('seed','human','learned') NOT NULL DEFAULT 'seed',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retired_at      DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_policy_version_key (version, policy_key),
  KEY ix_policy_state (state, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_signal — one row per thing worth acting on, de-duplicated.
--
-- `signal_key` is the spine of the whole store. It is stable and derived from
-- what the signal is about (`signup:302621`, `month:2026-09:account:302621`),
-- so a re-run, a retry, or two runners racing produce the same key and the
-- unique index refuses the second one. Without this, one signup becomes three
-- cards and nobody trusts the board.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_signal (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  signal_key      VARCHAR(190)    NOT NULL COMMENT 'stable, e.g. signup:302621',
  kind            VARCHAR(60)     NOT NULL COMMENT 'signup | account_review | wallet_dry | …',
  subject_type    ENUM('account','signup','portfolio') NOT NULL,
  subject_id      VARCHAR(64)     NULL COMMENT 'user_pid, or null for portfolio-wide',
  source          ENUM('scanner','agent','human') NOT NULL DEFAULT 'scanner',
  state           ENUM('open','held','resolved','suppressed','expired') NOT NULL DEFAULT 'open',
  evidence        JSON            NULL COMMENT 'the facts behind it, as shown on the card',
  owner_admin_id  VARCHAR(64)     NULL COMMENT 'ms_user.user_pid of the rep, when owned',
  sla_due_at      DATETIME        NULL COMMENT 'set when a signal needs a human by a time',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at     DATETIME        NULL,
  resolution      VARCHAR(120)    NULL COMMENT 'how it ended: acted, ignored, auto-resolved, overridden',
  PRIMARY KEY (id),
  UNIQUE KEY uq_signal_key (signal_key),
  KEY ix_signal_state (state, kind),
  KEY ix_signal_subject (subject_type, subject_id),
  KEY ix_signal_sla (sla_due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_decision — one row per decision the AI made. THIS TABLE IS THE LOG TAB.
--
-- Every branch writes one, including suppressions and failures: a gateway
-- timeout is a decision row with held = 1 and an error code, never a silent
-- skip. That is the difference between a log a manager can audit and a feed of
-- the things that happened to work.
--
-- input_digest is a hash of the facts sent to the agent. Two decisions with the
-- same digest and different outputs mean the agent drifted, which is the
-- signal Agent 7 is eventually built to read.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_decision (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  signal_key      VARCHAR(190)    NOT NULL COMMENT 'what this decision was about',
  agent           VARCHAR(60)     NOT NULL COMMENT 'signup-triage | outreach-drafter | …',
  agent_id        VARCHAR(64)     NULL COMMENT 'the GTWY agent id that answered',
  model           VARCHAR(80)     NULL,
  policy_version  VARCHAR(32)     NULL COMMENT 'the pulse_policy version in force',
  input_digest    CHAR(64)        NOT NULL COMMENT 'sha256 of the facts sent — drift detection',
  input_json      JSON            NULL COMMENT 'the facts themselves, for replay',
  output_json     JSON            NULL COMMENT 'the agent reply, schema-validated',
  verdict         VARCHAR(40)     NULL COMMENT 'human_now | nurture | suppress | climbed | …',
  score           SMALLINT        NULL,
  confidence      DECIMAL(3,2)    NULL,
  action_taken    VARCHAR(80)     NULL COMMENT 'what Pulse did as a result',
  held            TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = waiting on a person',
  hold_reason     VARCHAR(120)    NULL,
  error_code      VARCHAR(40)     NULL COMMENT 'TIMEOUT | AUTH | RATE_LIMIT | BAD_AGENT_REPLY',
  actor_admin_id  VARCHAR(64)     NULL COMMENT 'the person who approved or overrode it',
  acted_at        DATETIME        NULL,
  usage_json      JSON            NULL COMMENT 'tokens, for cost per decision',
  at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- One decision per agent per signal. A retry updates; it never duplicates.
  UNIQUE KEY uq_decision_signal_agent (signal_key, agent),
  KEY ix_decision_at (at),
  KEY ix_decision_agent (agent, at),
  KEY ix_decision_held (held, at),
  KEY ix_decision_digest (input_digest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_draft — messages written by Agent 3, and what happened to them.
--
-- `body` is what the agent wrote and never changes. `released_body` is what
-- the rep actually sent. Keeping both is the only way to measure the edit rate,
-- which is the drafter's real metric — a draft released unedited is the goal,
-- and a draft rewritten every time is a prompt problem.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_draft (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  decision_id     BIGINT UNSIGNED NULL COMMENT 'the decision row that produced it',
  signal_key      VARCHAR(190)    NOT NULL,
  account_pid     VARCHAR(64)     NULL COMMENT 'ms_user.user_pid it is addressed to',
  channel         ENUM('email','whatsapp') NOT NULL,
  sequence_step   TINYINT         NOT NULL DEFAULT 1,
  subject         VARCHAR(255)    NULL,
  body            MEDIUMTEXT      NOT NULL COMMENT 'as written by the agent, immutable',
  released_body   MEDIUMTEXT      NULL COMMENT 'as actually sent, if a person edited it',
  status          ENUM('held','released','sent','discarded','failed') NOT NULL DEFAULT 'held',
  hold_reason     VARCHAR(120)    NULL COMMENT 'mentions a price | partner customer | …',
  confidence      DECIMAL(3,2)    NULL,
  facts_used      JSON            NULL COMMENT 'each claim traced to its fact, for review',
  released_by     VARCHAR(64)     NULL COMMENT 'the person — this is the approve row in audit',
  released_at     DATETIME        NULL,
  sent_at         DATETIME        NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- One draft per step per signal. Two runners racing, or a retried tick, must
  -- not put two messages in front of the same customer — the same reasoning as
  -- the unique signal key, applied where the cost of a duplicate is highest.
  UNIQUE KEY uq_draft_signal_step (signal_key, sequence_step),
  KEY ix_draft_status (status, created_at),
  KEY ix_draft_signal (signal_key),
  KEY ix_draft_account (account_pid),
  CONSTRAINT fk_draft_decision FOREIGN KEY (decision_id)
    REFERENCES pulse_decision (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_timer — what the agent decided to do later.
--
-- "If nothing changes by Thursday, act or hand it back" needs somewhere to
-- live. The runner reads due timers on every tick; `timer_key` is unique for
-- the same reason signal_key is, so setting the same follow-up twice is a
-- no-op rather than two chases to the same customer.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_timer (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  timer_key       VARCHAR(190)    NOT NULL COMMENT 'stable, e.g. nurture:302621:step2',
  signal_key      VARCHAR(190)    NULL,
  fires_at        DATETIME        NOT NULL,
  action          VARCHAR(80)     NOT NULL COMMENT 'what to do when it fires',
  payload         JSON            NULL,
  -- 'firing' is a real state, not a transient one: the runner claims a row
  -- before acting on it so two overlapping passes cannot both send the same
  -- follow-up. Leaving it out of the enum makes MariaDB write an empty string
  -- instead of raising, and the claim silently matches nothing.
  state           ENUM('pending','firing','fired','cancelled','failed') NOT NULL DEFAULT 'pending',
  attempts        TINYINT         NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fired_at        DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_timer_key (timer_key),
  KEY ix_timer_due (state, fires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_outcome — what actually happened afterwards.
--
-- The only table that makes any of this improve rather than merely run. A
-- decision with no outcome after 30 days is a decision nobody can defend, and
-- that count is meant to be visible in the Rules tab.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_outcome (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  decision_id     BIGINT UNSIGNED NULL,
  signal_key      VARCHAR(190)    NOT NULL,
  kind            ENUM('replied','paid','churned','overridden','ignored','no_response','unsuppressed') NOT NULL,
  detail          TEXT            NULL,
  value_amount    DECIMAL(18,4)   NULL COMMENT 'money, when there is any',
  value_currency  VARCHAR(8)      NULL COMMENT 'never summed across currencies',
  actor_admin_id  VARCHAR(64)     NULL COMMENT 'who overrode, when a person did',
  occurred_at     DATETIME        NOT NULL COMMENT 'when it happened in the world',
  recorded_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_outcome_signal (signal_key),
  KEY ix_outcome_kind (kind, occurred_at),
  CONSTRAINT fk_outcome_decision FOREIGN KEY (decision_id)
    REFERENCES pulse_decision (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_watermark — how far the runner has read.
--
-- A tick must cost the same in month twelve as in week one, which means polling
-- `WHERE user_date > :watermark` rather than scanning. One row per stream; the
-- runner advances it only after the decisions for that batch are written, so a
-- crash mid-batch re-reads rather than skips. Re-reading is safe because every
-- signal key is unique (§2.1); skipping would lose a customer silently.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_watermark (
  stream          VARCHAR(60)     NOT NULL COMMENT 'e.g. signups',
  position        VARCHAR(64)     NOT NULL COMMENT 'a datetime or id, as text',
  last_run_at     DATETIME        NULL,
  last_count      INT             NOT NULL DEFAULT 0,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stream)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_lock — only one runner at a time.
--
-- The run endpoint is called on a fixed schedule from outside, so nothing stops
-- a second call arriving while the first is still working. Duplicate work would
-- not corrupt anything (every key is unique) but it would spend AI calls twice
-- and hold the same rows, so the second caller takes the lock or goes home.
--
-- `expires_at` rather than a boolean: a runner that dies mid-pass must not hold
-- the lock forever. A stale lock is reclaimed once it expires.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_lock (
  name            VARCHAR(60)     NOT NULL,
  holder          VARCHAR(64)     NOT NULL COMMENT 'a random id per run, so only the holder can release it',
  acquired_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME        NOT NULL,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_question — questions people have asked, and the SQL that answered them.
--
-- Ask sends a question to an agent, which writes one SELECT. The same question
-- asked twice produces the same SQL, so the second call is money and ten
-- seconds spent to learn something already known.
--
-- The cache is on the *question*, never on the answer: the SQL is re-run every
-- time, so the numbers are always current. Only the translation is remembered.
--
-- `asked_count` and `last_asked_at` are not bookkeeping — the Asked tab shows
-- "asked 22 times by 5 people", and the handover's rule that unpinned questions
-- fade after 30 days needs a date to fade against.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_question (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fingerprint     CHAR(64)        NOT NULL COMMENT 'sha256 of the normalised question',
  question        TEXT            NOT NULL COMMENT 'as the person typed it, for the Asked list',
  sql_text        MEDIUMTEXT      NOT NULL,
  headline        VARCHAR(500)    NULL,
  shape           VARCHAR(20)     NULL,
  confidence      VARCHAR(10)     NULL,
  columns_json    JSON            NULL,
  tables_json     JSON            NULL,
  caveats_json    JSON            NULL,
  model           VARCHAR(80)     NULL,
  schema_version  VARCHAR(40)     NULL COMMENT 'invalidates the cache when the allowlist changes',
  asked_count     INT             NOT NULL DEFAULT 1,
  first_asked_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_asked_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_asked_by   VARCHAR(64)     NULL,
  -- A cached plan a person marked wrong is never served again. One bad answer
  -- repeated fifty times is worse than fifty fresh calls.
  retired         TINYINT(1)      NOT NULL DEFAULT 0,
  retired_reason  VARCHAR(200)    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_question_fingerprint (fingerprint),
  KEY ix_question_recent (last_asked_at),
  KEY ix_question_popular (asked_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
