-- ---------------------------------------------------------------------------
-- auto.monthly.signup_digest — a monthly recap of new signups.
--
-- One portfolio-wide row per run rather than one row per account, the same
-- shape as auto.partner.digest (007_seed_automations.sql): every_minutes =
-- 43200 (30 days) is how every other "monthly" automation in this codebase
-- schedules itself — there is no native calendar-month trigger, so this drifts
-- slightly against calendar months over a year the same way auto.partner.digest
-- already does. subject_col and watermark_col are both NULL on purpose: there
-- is nothing to advance a watermark over (one aggregate row, not new rows
-- appearing over time) and no single account this is about — runOne() treats
-- a row with no subject as a portfolio-level signal, which is what this is.
--
-- find_sql was checked against the real MSG91 schema before this migration was
-- written: it returns exactly one row (total signups last month, split by
-- billing entity, plus how many still have no owner in user_handled_by).
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO pulse_automation
  (automation_key, rule_key, motion, scope, owner_email, english, summary,
   trigger_kind, when_event, every_minutes, find_sql, subject_col, watermark_col,
   agent_task, max_rows, capability, live)
VALUES
('auto.monthly.signup_digest', NULL, 'any', 'company', NULL,
 'Every month, tell me how many new signups we got last month, broken down by entity, and how many are still unowned.',
 'Once a month, totals new signups from the previous calendar month by billing entity and flags how many have no owner yet.',
 'schedule', 'monthly', 43200,
 'SELECT
      DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), ''%Y-%m'') AS report_month,
      COUNT(*) AS total_signups,
      SUM(CASE WHEN d.currency=''INR'' THEN 1 ELSE 0 END) AS india_signups,
      SUM(CASE WHEN d.currency=''AED'' THEN 1 ELSE 0 END) AS uae_signups,
      SUM(CASE WHEN d.currency=''USD'' THEN 1 ELSE 0 END) AS us_signups,
      SUM(CASE WHEN d.currency=''GBP'' THEN 1 ELSE 0 END) AS uk_signups,
      SUM(CASE WHEN d.currency=''SGD'' THEN 1 ELSE 0 END) AS singapore_signups,
      SUM(CASE WHEN d.currency IS NULL OR d.currency='''' THEN 1 ELSE 0 END) AS no_entity_signups,
      SUM(CASE WHEN h.admin_id IS NULL THEN 1 ELSE 0 END) AS unowned_signups
    FROM ms_user u
    LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
    LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
    WHERE u.user_type = 3
      AND u.user_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), ''%Y-%m-01'')
      AND u.user_date <  DATE_FORMAT(CURDATE(), ''%Y-%m-01'')
    LIMIT 1',
 NULL, NULL,
 'This is a monthly recap, not a judgment call — always set should_alert to true, even when the numbers are small or zero. Write the headline as the total signups last month and the entity split (only mention entities with at least one signup), and note how many are still unowned if that number is greater than zero.',
 5, 'ready', 1);
