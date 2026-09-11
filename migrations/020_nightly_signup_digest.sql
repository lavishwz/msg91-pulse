-- ---------------------------------------------------------------------------
-- auto.nightly.signup_digest — the daily counterpart to
-- auto.monthly.signup_digest (018/019): same shape, windowed to yesterday
-- instead of last calendar month, scheduled nightly instead of monthly.
--
-- Company-wide only, on purpose. "Team" is not a real distinction in this
-- schema — every other scope in this app (board/route.ts) already treats
-- "team" and "company" as the exact same unrestricted account list, so a
-- separate "team" section here would just be the same numbers under a
-- different label. A personal "me" section is not meaningful for raw signup
-- counts either: a signup has no owner until someone claims it, so there is
-- nothing per-rep to report at the moment it happens.
--
-- COALESCE(...,0) throughout: unlike the monthly version (which always has
-- signups to report), a single day can genuinely have zero, and SUM() over
-- zero matching rows returns NULL, not 0 — checked against a real quiet day.
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO pulse_automation
  (automation_key, rule_key, motion, scope, owner_email, english, summary,
   trigger_kind, when_event, every_minutes, find_sql, subject_col, watermark_col,
   agent_task, max_rows, capability, live)
VALUES
('auto.nightly.signup_digest', NULL, 'any', 'company', NULL,
 'Every night, tell me how many new signups we got yesterday, broken down by entity, and how many are still unowned.',
 'Every midnight, totals the previous day''s signups by billing entity and flags how many have no owner yet.',
 'schedule', 'daily', 1440,
 'SELECT
      DATE_SUB(CURDATE(), INTERVAL 1 DAY) AS report_date,
      COALESCE(COUNT(*), 0) AS total_signups,
      COALESCE(SUM(CASE WHEN d.currency=''INR'' THEN 1 ELSE 0 END), 0) AS india_signups,
      COALESCE(SUM(CASE WHEN d.currency=''AED'' THEN 1 ELSE 0 END), 0) AS uae_signups,
      COALESCE(SUM(CASE WHEN d.currency=''USD'' THEN 1 ELSE 0 END), 0) AS us_signups,
      COALESCE(SUM(CASE WHEN d.currency=''GBP'' THEN 1 ELSE 0 END), 0) AS uk_signups,
      COALESCE(SUM(CASE WHEN d.currency=''SGD'' THEN 1 ELSE 0 END), 0) AS singapore_signups,
      COALESCE(SUM(CASE WHEN d.currency IS NULL OR d.currency='''' THEN 1 ELSE 0 END), 0) AS no_entity_signups,
      COALESCE(SUM(CASE WHEN h.admin_id IS NULL THEN 1 ELSE 0 END), 0) AS unowned_signups
    FROM ms_user u
    LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
    LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
    WHERE u.user_type = 3
      AND u.user_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND u.user_date <  CURDATE()
    LIMIT 1',
 NULL, NULL,
 'Decide whether yesterday''s signup numbers are worth flagging — this is a real judgment call, not a forced report. A quiet day (even zero) is normal and not automatically bad; use recent days as a rough sense of what is typical rather than a fixed number. Consider: is the total unusually high or low, is the unowned count a meaningful share of the total, and is any one entity unusually dominant. If nothing stands out, set should_alert to false and say briefly why. When you do alert, lead with the total and the entity split, and name the unowned count if it looks high enough to matter.',
 5, 'ready', 1);
