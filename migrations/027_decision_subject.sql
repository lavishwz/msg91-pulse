-- ---------------------------------------------------------------------------
-- 027_decision_subject.sql — which account a decision was about, on the row
-- itself.
--
-- pulse_decision never stored who a row was about; the log page (log.ts)
-- worked it out by joining pulse_signal on signal_key. Live testing found
-- what that quietly meant: pulse_signal only gets a row when writeAlert()
-- fires, so any "quiet" verdict — the overwhelmingly common outcome, a rule
-- that ran and found nothing worth raising — had no signal row to join
-- against, and the feed rendered it as "Scored Account ?" no matter which
-- real account the rule had actually judged. 20 of 22 quiet decisions checked
-- in one live run showed the placeholder instead of the account.
--
-- The rule-worker and the row it just judged both already know the subject
-- (rowSubject in automation-runner.ts, straight off the query result — not
-- the model's echo of it) at the moment the decision is written; this column
-- is that value, kept on the row it belongs to rather than reconstructed
-- later from a table that may not have one.
-- ---------------------------------------------------------------------------

ALTER TABLE pulse_decision
  ADD COLUMN subject_id VARCHAR(64) NULL COMMENT 'the account/subject this decision judged, straight off the row — not the signal join' AFTER error_code;
