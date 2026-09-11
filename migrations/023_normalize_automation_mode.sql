-- mode must agree with trigger_kind.
--
-- Two rows were built by the version of build.ts that trusted the planner's
-- own `mode` field. The planner answered "event" for both, so they were
-- stored as mode='event' — while trigger_kind stayed 'schedule', when_event
-- stayed NULL, and a find_sql was written anyway. That combination describes
-- nothing the runner can act on:
--
--   automationsForEvent() filters on trigger_kind='event', so they never
--   listen for anything; when_event is NULL, so there is no event to listen
--   for even if they did.
--
--   due() filters on trigger_kind='schedule', so they *are* schedule rows as
--   far as the runner is concerned — which is the honest reading, since they
--   have a query and no event.
--
-- The row is therefore a schedule automation wearing an event label. This
-- corrects the label rather than the trigger_kind: the query is real and was
-- guarded, and rewriting trigger_kind would instead leave an event automation
-- with no event, which is the one shape saveAutomation explicitly refuses.
--
-- build.ts no longer trusts the planner for routing (the Rules page's event
-- dropdown is authoritative), so nothing can produce this state again.

UPDATE pulse_automation
   SET mode = 'cron'
 WHERE mode = 'event'
   AND trigger_kind <> 'event';

-- The mirror of the same disagreement, for completeness: an event automation
-- must be mode='event'. None exist in this state today; this keeps a future
-- hand-written INSERT from reintroducing the split.
UPDATE pulse_automation
   SET mode = 'event'
 WHERE trigger_kind = 'event'
   AND mode <> 'event';
