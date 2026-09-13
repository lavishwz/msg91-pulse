-- ---------------------------------------------------------------------------
-- ms-trans-index-recommendation.sql — run by whoever administers the MSG91
-- MySQL server, not by Pulse. Not run here; Pulse only has SELECT.
--
-- ms_trans has ~988,000 rows and nothing beyond its own PRIMARY KEY
-- (trans_pid) — confirmed against schema/msg91-schema.sql and live via
-- EXPLAIN. Any automation that looks up a user's transactions (by
-- trans_fuserid or trans_tuserid) or filters by recency (trans_date) forces
-- a full table scan, every time, on a shared connection.
--
-- Found live: an automation built during today's testing joined ms_user to
-- ms_trans to find accounts with no transaction in 30 days. EXPLAIN showed
-- `type: ALL` on both sides with no key at all. Its own per-run lock (a
-- 300-second budget) expired before the query finished and had to be
-- reclaimed before a second attempt could even start. Pulse's own build
-- pipeline now refuses to save a rule shaped like this (lib/pulse/autopilot/
-- build.ts's checkCost) rather than let it repeat — but refusing to save it
-- is not the same as making the underlying question answerable. The index
-- below is the actual fix; the guard is what stops the failure mode until it
-- lands.
--
-- Two separate indexes rather than one composite: trans_fuserid and
-- trans_tuserid are checked independently (a transaction FROM a user, or TO
-- one) in every real query seen so far, including the OR-joined one above —
-- and an OR across two columns cannot use a single composite index on both
-- anyway. trans_date is its own index because "how recent" is a filter that
-- shows up on its own just as often (see partner-high-9-style rules judging
-- a 48-hour or 30-day window).
-- ---------------------------------------------------------------------------

ALTER TABLE ms_trans ADD INDEX ix_trans_fuserid (trans_fuserid);
ALTER TABLE ms_trans ADD INDEX ix_trans_tuserid (trans_tuserid);
ALTER TABLE ms_trans ADD INDEX ix_trans_date (trans_date);
