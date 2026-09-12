-- ---------------------------------------------------------------------------
-- 025_event_enrichment.sql — let an event automation look something up before
-- it judges.
--
-- An event automation sees only the payload it was fired with. For
-- account.tag_added that is { accountId, accountName, tag, addedBy }, and the
-- judge has nothing else to reason from — so the most it can honestly say is
-- that an account was tagged, which is the thing the person reading it just
-- did. Six of the seven events in lib/pulse/autopilot/events.ts are in that
-- position; only member.invited carries enough in its payload (the role) to
-- answer a real question unaided.
--
-- The sharpest case is a rule that already exists and cannot do its job:
-- "when somebody is removed from Pulse, flag it so their accounts can be
-- reassigned" is live, and cannot name a single account, because the payload
-- is { email, removedBy } and nothing else.
--
-- `enrich_sql` is one optional SELECT, run when the event fires, with the
-- payload's own fields bound into it. Its rows are handed to the judge beside
-- the payload.
--
--   NULL — the overwhelming majority, and every automation that exists today.
--          The behaviour is exactly what it was: judge the payload alone.
--
-- Placeholders are written as :name and refer to keys of the payload. They are
-- turned into positional ? and bound — never interpolated. That matters more
-- than usual here: a payload carries accountName, addedBy and email, which are
-- values a person outside Pulse can influence, and the MSG91 connection in
-- development is root. A company named "'; SELECT ..." must be a string, not
-- syntax.
--
-- Scheduled automations do not use this. They already have find_sql, which is
-- the same idea with a wider scope, and nothing about this column applies to
-- them.
-- ---------------------------------------------------------------------------

ALTER TABLE pulse_automation
  ADD COLUMN enrich_sql TEXT NULL
    COMMENT 'event automations only: a SELECT run with the payload bound, whose rows are judged alongside it'
    AFTER find_sql;
