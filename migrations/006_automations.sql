-- ---------------------------------------------------------------------------
-- pulse_automation — a rule that runs.
--
-- A rule in the Rules tab is a sentence. An automation is that sentence turned
-- into something the runner can execute: a query that finds rows, a task for
-- the agent that reads them, and a schedule. One row here per rule that has
-- been compiled; rules that cannot be compiled never get one.
--
-- Three things are recorded that the product learned the hard way:
--
--   trigger_kind — not every rule is a job. "Never open a price conversation
--     without the partner on the thread" is a guard: it constrains an action,
--     it does not start one. Run it on a schedule and it either does nothing
--     or does the opposite of what it says. Guards are stored and never run.
--
--   capability + blocked_reason — of the sixteen rules shipped in 002_seed,
--     four can never fire against this database: MSG91's schema holds no
--     record of MSG91 contacting anybody, so there is no touch log, no reply,
--     no prospect list. Those are written down with the reason rather than
--     left to fail every five minutes in the dark.
--
--   find_sql — the query is stored, not a scanner name. A new rule is a new
--     query, not new code. Everything here goes through lib/pulse/sqlguard
--     before it is saved and again before it is run: one bounded SELECT, on
--     the read-only connection, under a statement timeout.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_automation (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  automation_key  VARCHAR(190)    NOT NULL COMMENT 'stable name, e.g. auto.partner.silence',
  rule_key        VARCHAR(120)    NULL COMMENT 'the pulse_policy row this came from',
  motion          ENUM('inbound','outbound','startup','partner','any') NOT NULL DEFAULT 'any',
  scope           ENUM('me','team','company') NOT NULL DEFAULT 'company' COMMENT 'whose accounts it looks at',
  owner_email     VARCHAR(190)    NULL COMMENT 'who wrote it — from the session, never the body',

  english         TEXT            NOT NULL COMMENT 'what the person actually typed',
  summary         VARCHAR(255)    NULL COMMENT 'one line of what this does, for the agent that answers whether anything already covers a new rule',

  trigger_kind    ENUM('schedule','event','branch','guard') NOT NULL,
  when_event      VARCHAR(60)     NULL COMMENT 'daily | signup_seen | before_send | …',
  parent_key      VARCHAR(190)    NULL COMMENT 'branch only: the automation whose result it reads',
  every_minutes   INT UNSIGNED    NULL COMMENT 'schedule only',

  find_sql        TEXT            NULL COMMENT 'one bounded SELECT, sqlguard-checked',
  subject_col     VARCHAR(64)     NULL COMMENT 'which column is the account id',
  watermark_col   VARCHAR(64)     NULL COMMENT 'which column advances, so a row fires once',
  agent_task      TEXT            NULL COMMENT 'what the worker agent is asked to do per row',
  max_rows        INT UNSIGNED    NOT NULL DEFAULT 50 COMMENT 'ceiling per pass, so a rule over every account cannot spend ten thousand agent calls on its first run',

  capability      ENUM('ready','blocked') NOT NULL DEFAULT 'ready',
  blocked_reason  VARCHAR(255)    NULL COMMENT 'in plain words, shown in the UI',
  state           ENUM('active','paused','retired') NOT NULL DEFAULT 'active',
  live            TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'ready and switched on; written down but not running is the normal state for a rule the data cannot answer yet',

  last_run_at     DATETIME        NULL,
  next_run_at     DATETIME        NULL,
  last_error      VARCHAR(500)    NULL,
  run_count       INT UNSIGNED    NOT NULL DEFAULT 0,
  alert_count     INT UNSIGNED    NOT NULL DEFAULT 0,

  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  retired_at      DATETIME        NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_automation_key (automation_key),
  KEY ix_automation_due (live, state, next_run_at),
  KEY ix_automation_motion (motion, state),
  KEY ix_automation_rule (rule_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
