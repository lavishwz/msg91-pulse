-- ---------------------------------------------------------------------------
-- The sixteen rules, as automations.
--
-- Every rule already in the Rules tab gets a row here, including the ones that
-- cannot run. A rule that is written down and not running is a normal, honest
-- state — the product already says so on the card — and recording *why* is
-- more useful than leaving it out and letting somebody rediscover the reason.
--
-- The verdicts come from reading MSG91's schema against each rule:
--
--   ready   — the data exists and the query below returns rows today
--   blocked — it does not, and blocked_reason says what is missing
--
-- Four are blocked for one shared reason: MSG91's database records what
-- customers do, not what MSG91 does. There is no table of messages the sales
-- team sent, no inbound mail, no prospect list. Those four become buildable
-- the day Pulse owns an outbox, and not before.
--
-- Guards are stored with no query and no schedule. A guard constrains an
-- action; running it on a timer would at best do nothing.
-- ---------------------------------------------------------------------------

-- ── partner · the two that work today ──────────────────────────────────────

INSERT INTO pulse_automation
  (automation_key, rule_key, motion, scope, owner_email, english, summary,
   trigger_kind, when_event, every_minutes, find_sql, subject_col, watermark_col,
   agent_task, max_rows, capability, live)
VALUES
('auto.partner.silence', 'partner.silence', 'partner', 'company', NULL,
 'A partner-sourced account goes quiet → route it through the partner.',
 'Finds partner-sourced accounts with no payment for 60 days and names the partner to route through.',
 'schedule', 'daily', 1440,
 'SELECT u.user_pid AS subject_id, TRIM(CONCAT(COALESCE(u.user_fname,''''),'' '',COALESCE(u.user_lname,''''))) AS company, TRIM(CONCAT(COALESCE(p.user_fname,''''),'' '',COALESCE(p.user_lname,''''))) AS partner, p.user_email AS partner_email, DATEDIFF(NOW(), MAX(t.trans_date)) AS days_quiet, MAX(t.trans_date) AS last_payment_at, COUNT(t.trans_pid) AS payments_all_time, ROUND(SUM(t.trans_amt)) AS total_paid FROM ms_user u JOIN ms_user p ON p.user_pid = u.user_userid AND p.user_type = 2 JOIN ms_trans t ON t.trans_tuserid = u.user_pid WHERE u.user_userid <> 2 AND u.user_type = 3 GROUP BY u.user_pid, company, partner, partner_email HAVING days_quiet >= 60 ORDER BY days_quiet DESC',
 'subject_id', 'last_payment_at',
 'Say whether this partner-sourced account has really gone quiet and the partner should be told. Name the partner in the headline.',
 25, 'ready', 1),

('auto.partner.digest', 'partner.digest', 'partner', 'company', NULL,
 'Monthly digest to each partner of sourced accounts and outcomes.',
 'Once a month, totals each partner''s sourced accounts and what they paid, ready for a digest.',
 'schedule', 'monthly', 43200,
 'SELECT p.user_pid AS subject_id, TRIM(CONCAT(COALESCE(p.user_fname,''''),'' '',COALESCE(p.user_lname,''''))) AS partner, p.user_email AS partner_email, COUNT(DISTINCT u.user_pid) AS accounts_sourced, COUNT(t.trans_pid) AS payments_12m, ROUND(COALESCE(SUM(t.trans_amt),0)) AS paid_12m, MAX(t.trans_date) AS last_payment_at FROM ms_user p JOIN ms_user u ON u.user_userid = p.user_pid AND u.user_type = 3 LEFT JOIN ms_trans t ON t.trans_tuserid = u.user_pid AND t.trans_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH) WHERE p.user_type = 2 AND p.user_pid <> 2 GROUP BY p.user_pid, partner, partner_email HAVING accounts_sourced > 0 ORDER BY paid_12m DESC',
 'subject_id', NULL,
 'Write the month''s digest line for this partner: how many accounts they sourced and what those accounts paid. Only alert when there is something worth sending.',
 20, 'ready', 0);

-- ── reframed · the rule as written cannot run, a near neighbour can ────────

INSERT INTO pulse_automation
  (automation_key, rule_key, motion, scope, owner_email, english, summary,
   trigger_kind, when_event, every_minutes, find_sql, subject_col, watermark_col,
   agent_task, max_rows, capability, blocked_reason, live)
VALUES
('auto.startup.low_balance', 'startup.credit80', 'startup', 'company', NULL,
 'Free credit at 80% used → send the upgrade path.',
 'Finds accounts whose balance has fallen low. Not the same as 80% of a grant — nothing records the grant.',
 'schedule', 'daily', 1440,
 'SELECT u.user_pid AS subject_id, TRIM(CONCAT(COALESCE(u.user_fname,''''),'' '',COALESCE(u.user_lname,''''))) AS company, u.user_email AS email, u.user_bal AS balance, u.user_date AS signed_up_at, DATEDIFF(NOW(), u.user_date) AS days_since_signup FROM ms_user u WHERE u.user_type = 3 AND u.user_bal > 0 AND u.user_bal < 500 AND u.user_date >= DATE_SUB(NOW(), INTERVAL 365 DAY) ORDER BY u.user_bal ASC',
 'subject_id', NULL,
 'Say whether this account is running out of credit and would benefit from the upgrade path. Be explicit that this is a low balance, not a measured percentage of a grant.',
 25, 'ready',
 'Reframed. No table records how much free credit an account was given, so "80% of it" cannot be computed — user_default_bal is 0 or NULL on all 10,083 customers. This watches the balance instead.',
 0);

-- ── blocked · the data does not exist ──────────────────────────────────────

INSERT INTO pulse_automation
  (automation_key, rule_key, motion, scope, owner_email, english, summary,
   trigger_kind, when_event, capability, blocked_reason, live)
VALUES
('auto.outbound.icp', 'outbound.icp', 'outbound', 'company', NULL,
 'Research fit against ICP before any contact. No contact without a named reason.',
 'Would score an outbound prospect before anyone contacts them.',
 'event', 'prospect_added', 'blocked',
 'There is no prospect list. ms_leads is the only candidate and its most recent row is from 2015-07-02.', 0),

('auto.outbound.reply', 'outbound.reply', 'outbound', 'company', NULL,
 'Any reply from a named decision maker → same-day human contact.',
 'Would raise a card the moment a decision maker replies.',
 'event', 'reply_received', 'blocked',
 'Two things are missing: no inbound email is stored anywhere, and no person record carries a job title, so "decision maker" cannot be evaluated.', 0),

('auto.outbound.cooloff', 'outbound.cooloff', 'outbound', 'company', NULL,
 'No reply after two touches → cool off 90 days, then score again.',
 'Would rest a prospect who has not answered.',
 'event', 'sequence_ended', 'blocked',
 'Needs a count of touches and a count of replies. Neither is recorded.', 0),

('auto.startup.eligibility', 'startup.eligibility', 'startup', 'company', NULL,
 'Confirm programme eligibility from the signup form.',
 'Would read the signup form and confirm the account qualifies for the startup programme.',
 'event', 'signup_seen', 'blocked',
 'The signup form is captured and live in signup_tracking, but it has no programme field — "startup" appears zero times in requestData. The flag Pulse treats as one, ms_user_paid_signup, has status = 0 on 3,192 of its 3,200 rows.', 0),

('auto.startup.first_message', 'startup.first_message', 'startup', 'company', NULL,
 'Day 12 with no first message → a person takes over.',
 'Would catch a startup that signed up and never sent anything.',
 'schedule', 'daily', 'blocked',
 'There is no live record of messages sent. The per-account report tables stopped being written in 2022, and microservice_payment_log covers WhatsApp, email and voice but not SMS — so a startup sending SMS would look silent.', 0),

('auto.startup.dlt', 'startup.dlt', 'startup', 'company', NULL,
 'Track days to first message. Chase DLT and sender ID daily.',
 'Would chase a startup stuck waiting on DLT or a sender ID.',
 'schedule', 'daily', 'blocked',
 'The DLT half is live (verify_dlt is written to daily), but a pending sender ID cannot be aged or attributed: sender_id_configuration has no date column and pending_senderid has no user column at all.', 0),

('auto.partner.volume', 'partner.volume', 'partner', 'company', NULL,
 'Partner-sourced volume down 20% → tell the partner manager.',
 'Would notice a partner''s accounts slowing down.',
 'schedule', 'monthly', 'blocked',
 'The query runs, but the base is 4 to 16 transactions a month across 1 to 3 partners. A 20% threshold on that fires when one payment lands a day late.', 0);

-- ── guards · stored, never run ─────────────────────────────────────────────

INSERT INTO pulse_automation
  (automation_key, rule_key, motion, scope, owner_email, english, summary,
   trigger_kind, when_event, capability, blocked_reason, live)
VALUES
('auto.outbound.two_touches', 'outbound.cadence', 'outbound', 'company', NULL,
 'At most two touches in 14 days.',
 'A limit on how often anyone may contact a prospect.',
 'guard', 'before_send', 'blocked',
 'A guard, not a job: it constrains sending rather than starting anything. It also has nothing to count — no outbound contact is recorded.', 0),

('auto.partner.no_price', 'partner.price', 'partner', 'company', NULL,
 'Never open a price conversation without the partner on the thread.',
 'A limit on what may be said to a partner-sourced account without the partner present.',
 'guard', 'before_send', 'blocked',
 'A guard, not a job. Running it on a schedule would at best do nothing and at worst send the very message it forbids.', 0);

-- ── inbound · one automation, three branches ───────────────────────────────
--
-- signup_scored is not an external event. It is the score the first rule
-- produces, which is why these three are branches of it rather than three
-- automations that happen to share a trigger.

INSERT INTO pulse_automation
  (automation_key, rule_key, motion, scope, owner_email, english, summary,
   trigger_kind, when_event, parent_key, capability, blocked_reason, live)
VALUES
('auto.inbound.score', 'inbound.score', 'inbound', 'company', NULL,
 'Score every signup on domain history, signup progress and entity.',
 'Scores each new signup. Already running as Autopilot''s signup triage.',
 'event', 'signup_seen', NULL, 'blocked',
 'Already running, as the hard-wired signup triage in lib/pulse/autopilot/runner.ts. Listed here so the picture is complete; it is not run twice.', 0),

('auto.inbound.hot', 'inbound.hot', 'inbound', 'company', NULL,
 'Quality 80+ → a person calls within 10 minutes.',
 'The branch taken when the score is high.',
 'branch', 'signup_scored', 'auto.inbound.score', 'blocked',
 'A branch of the scoring automation, handled inside signup triage today.', 0),

('auto.inbound.nurture', 'inbound.nurture', 'inbound', 'company', NULL,
 'Quality 40-79 → a three-message sequence. No person unless they reply.',
 'The branch taken when the score is middling.',
 'branch', 'signup_scored', 'auto.inbound.score', 'blocked',
 'A branch of the scoring automation, handled inside signup triage today.', 0),

('auto.inbound.suppress', 'inbound.suppress', 'inbound', 'company', NULL,
 'Below 40 → suppress, with the reasons, reviewable under Suppressed.',
 'The branch taken when the score is low.',
 'branch', 'signup_scored', 'auto.inbound.score', 'blocked',
 'A branch of the scoring automation, handled inside signup triage today.', 0);
