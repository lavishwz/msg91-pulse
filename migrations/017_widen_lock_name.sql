-- Same class of bug as 014/015: pulse_lock.name was VARCHAR(60), fine for
-- fixed names like "automations", too small for "automation:<dynamic key>"
-- (the per-automation lock the webhook now takes before running in the
-- background — see app/api/pulse/autopilot/webhook/[key]/route.ts).

ALTER TABLE pulse_lock MODIFY COLUMN name VARCHAR(150) NOT NULL;
