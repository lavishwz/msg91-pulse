-- ---------------------------------------------------------------------------
-- auto.monthly.signup_digest — let the worker actually decide.
--
-- 018 shipped this with agent_task saying "always set should_alert to true" —
-- which is not a judgment, it is a forced report with an AI-shaped wrapper
-- around it. Every other digest automation in this codebase (auto.partner.digest,
-- 007_seed_automations.sql) gives its worker real discretion — "only alert when
-- there is something worth sending" — and this should match that rather than
-- being the one exception that only pretends to decide.
--
-- Only agent_task changes. find_sql, the schedule and everything else about
-- the row are unchanged.
-- ---------------------------------------------------------------------------

UPDATE pulse_automation
   SET agent_task = 'Decide whether this month''s signup numbers are worth flagging — this is a real judgment call, not a forced report. A normal month for this account base is roughly a few dozen to a couple hundred signups; use that as a rough baseline, not a hard rule. Consider: is the total notably high or low against that baseline, is the unowned count a large share of the total (worth a flag on its own if so, since nobody is going to call those people), and is any one entity unusually dominant or unusually absent compared to the others. If nothing about the month stands out, set should_alert to false and say briefly why in the detail rather than staying silent. When you do alert, lead the headline with the total and the entity split, and call out the unowned count by name if it looks high enough to matter.'
 WHERE automation_key = 'auto.monthly.signup_digest';
