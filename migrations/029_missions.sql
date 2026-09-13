-- ---------------------------------------------------------------------------
-- 029_missions.sql — missions and work items, the piece the PRD calls the
-- reason Pulse is not a CRM.
--
-- Before this migration nothing in the store held a mission or a work item as
-- a record: "cards" (lib/pulse/cards.ts) are computed fresh from ms_trans and
-- pulse_signal on every request and vanish the moment the query changes, and
-- there was nowhere for a promise extracted from "Log what happened" to live.
-- The PRD's data model (msg91-pulse-prd.md §11) and the handover (§9) both
-- require `mission` and `work_item` as Pulse-owned, persistent concepts. This
-- is that table pair.
--
-- Data path: option 3 (Pulse standalone data), per the AI build instructions
-- — already pre-approved in that document's known-decisions table ("Pulse
-- missions, work, people added by employees... = Pulse standalone data"). No
-- question needed before building this.
--
-- Two tables, not one, because the decisions doc is explicit that there are
-- exactly four work-item types (next action, promise, approval, watch) and
-- that a work item is not the same size of thing as the outcome it serves —
-- several work items can belong to one mission over its life, and a mission
-- can exist with none yet.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- pulse_mission — an outcome worth achieving for a customer.
--
-- `mission_key` is the merge point. "Create, merge, update, pause, or close
-- revenue missions from signals" (PRD §8.4) only works if two signals about
-- the same underlying situation land on the same row instead of opening a
-- second mission — the engine notes (handover §10) call this "idempotent
-- mission management" and name card fatigue from duplicate missions as the
-- top way this product dies. Callers derive the key from account + type
-- (+ product, where a type can run once per product — grow_product on two
-- products at once is two missions).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_mission (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mission_key       VARCHAR(190)    NOT NULL COMMENT 'stable, e.g. protect_revenue:302621 or grow_product:302621:whatsapp',
  account_pid       VARCHAR(64)     NOT NULL COMMENT 'ms_user.user_pid — read-only elsewhere, so no FK',
  type              ENUM('qualify','first_value','activate_product','grow_product',
                          'protect_revenue','solve_issue','repair_relationship',
                          'startup_progress','partner_growth','outbound_discovery') NOT NULL,
  state             ENUM('active','waiting','blocked','completed','stopped') NOT NULL DEFAULT 'active',
  title             VARCHAR(255)    NOT NULL COMMENT 'a plain sentence — "Protect Nova Retail''s SMS revenue"',
  reason            TEXT            NULL COMMENT 'why it matters, in a sentence',
  evidence          JSON            NULL COMMENT 'signal_keys and facts that justified opening it',
  owner_admin_id    VARCHAR(64)     NULL COMMENT 'ms_user.user_pid of the rep; NULL means unowned',
  expected_outcome  VARCHAR(255)    NULL,
  actual_outcome    VARCHAR(255)    NULL,
  source            ENUM('ai','human') NOT NULL DEFAULT 'ai',
  created_by        VARCHAR(190)    NULL COMMENT 'pulse_member.email, when source = human',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at         DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mission_key (mission_key),
  KEY ix_mission_account (account_pid, state),
  KEY ix_mission_owner (owner_admin_id, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- pulse_work_item — the only four useful work-item types (decisions doc):
-- next_action, promise, approval, watch. This is what My Work / Today reads.
--
-- `work_key` gives it the same idempotency guarantee as pulse_signal and
-- pulse_mission: reprocessing the same source (a re-run scanner, a retried
-- extraction from "Log what happened") updates the same row rather than
-- opening a second task for the same promise.
--
-- `waiting_on` backs the My Work "Waiting" view (PRD §7.1) and the handover's
-- "In flight" THEM/BLOCKED/PULSE distinction — who currently holds the ball,
-- not a pipeline stage nobody is meant to type by hand.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse_work_item (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  work_key          VARCHAR(190)    NOT NULL COMMENT 'stable — see pulse_signal.signal_key for the pattern',
  mission_id        BIGINT UNSIGNED NULL COMMENT 'the mission this serves, if any',
  account_pid       VARCHAR(64)     NOT NULL,
  type              ENUM('next_action','promise','approval','watch') NOT NULL,
  title             VARCHAR(255)    NOT NULL COMMENT 'e.g. "Send the revised rate"',
  reason            TEXT            NULL COMMENT 'why it matters — shown with the item, never a bare title',
  evidence          JSON            NULL,
  owner_admin_id    VARCHAR(64)     NULL COMMENT 'ms_user.user_pid; NULL surfaces in the unowned scanner',
  team              VARCHAR(60)     NULL COMMENT 'owner''s team at creation time, for the Team view when unowned',
  due_at            DATETIME        NULL,
  status            ENUM('open','done','snoozed','stopped') NOT NULL DEFAULT 'open',
  priority_reason   VARCHAR(255)    NULL COMMENT 'why this is ranked where it is, for the row copy',
  waiting_on        ENUM('them','us','teammate') NULL COMMENT 'who holds the ball right now',
  source            ENUM('ai','human') NOT NULL DEFAULT 'ai',
  created_by        VARCHAR(190)    NULL COMMENT 'pulse_member.email, when source = human',
  outcome           VARCHAR(120)    NULL COMMENT 'kept | missed | done | stopped — set on close',
  snoozed_until     DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at      DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_work_key (work_key),
  KEY ix_work_account (account_pid, status),
  KEY ix_work_owner (owner_admin_id, status),
  KEY ix_work_due (due_at),
  KEY ix_work_mission (mission_id),
  CONSTRAINT fk_work_mission FOREIGN KEY (mission_id)
    REFERENCES pulse_mission (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
