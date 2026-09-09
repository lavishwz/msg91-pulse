-- ---------------------------------------------------------------------------
-- "Gone quiet" needs an upper bound as well as a lower one.
--
-- The first live run of auto.partner.silence raised cards for accounts that
-- had not paid in 6,012 days. They had not gone quiet; they stopped in 2010
-- and never came back. The query asked for "no payment in 60 days or more"
-- and then sorted by the longest silence first, so it found the deadest rows
-- in the database and spent an agent call on each.
--
-- A rep can do something about an account that went quiet last month. Nobody
-- can do anything about one that went quiet before the company had a mobile
-- app. The window is now 60 to 365 days, newest silence first, which is the
-- order somebody would work them in.
-- ---------------------------------------------------------------------------
UPDATE pulse_automation
   SET find_sql = 'SELECT u.user_pid AS subject_id, TRIM(CONCAT(COALESCE(u.user_fname,''''),'' '',COALESCE(u.user_lname,''''))) AS company, TRIM(CONCAT(COALESCE(p.user_fname,''''),'' '',COALESCE(p.user_lname,''''))) AS partner, p.user_email AS partner_email, DATEDIFF(NOW(), MAX(t.trans_date)) AS days_quiet, MAX(t.trans_date) AS last_payment_at, COUNT(t.trans_pid) AS payments_all_time, ROUND(SUM(t.trans_amt)) AS total_paid FROM ms_user u JOIN ms_user p ON p.user_pid = u.user_userid AND p.user_type = 2 JOIN ms_trans t ON t.trans_tuserid = u.user_pid WHERE u.user_userid <> 2 AND u.user_type = 3 GROUP BY u.user_pid, company, partner, partner_email HAVING days_quiet BETWEEN 60 AND 365 ORDER BY days_quiet ASC',
       agent_task = 'Say whether this partner-sourced account has really gone quiet and the partner should be told. Name the partner in the headline. An account that stopped years ago is not news — say so and do not alert.'
 WHERE automation_key = 'auto.partner.silence';

-- The six cards the first run produced were all from that dead tail. Clear
-- them rather than leave a rep to work out why Pulse is asking about 2010.
DELETE FROM pulse_signal
 WHERE kind = 'automation'
   AND signal_key LIKE 'auto:auto.partner.silence:%';

-- The watermark went with them: it had advanced to a 2010 payment date, which
-- would have hidden every genuinely recent one.
DELETE FROM pulse_watermark WHERE stream = 'automation:auto.partner.silence';
