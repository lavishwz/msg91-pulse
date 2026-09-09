-- 004_member_roles.sql — member types, and the founding super admin.
--
-- Two changes, and the second is the reason for the first.
--
-- 1. `role` on pulse_member. Being invited says you may sign in; the role says
--    what you may do about *other people* signing in. Three levels and no more:
--    a member uses Pulse, an admin can bring somebody in, a super admin can
--    bring in an admin. Anything finer would be a permission system nobody has
--    asked for.
--
-- 2. lavishgehlod@gmail.com, seeded as the super admin.
--
-- That seed is what turns the door properly shut. `pulse_member` being empty
-- granted the first person to arrive a bootstrap pass, because otherwise nobody
-- could reach the invite screen on a fresh deploy. With a row here from the
-- moment the schema is created, the list is never empty, the grace is never
-- available, and nobody who has not been invited can sign in — including on a
-- brand new database.
--
-- ADD COLUMN is not re-runnable on its own, so it is guarded on
-- information_schema and prepared: applying this file twice is a no-op rather
-- than an error. lib/migrate.ts runs every statement on one connection, which
-- is what lets PREPARE and EXECUTE find each other.

SET @has_role := (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name   = 'pulse_member'
     AND column_name  = 'role'
);

SET @add_role := IF(
  @has_role = 0,
  "ALTER TABLE pulse_member
     ADD COLUMN role ENUM('super_admin','admin','member') NOT NULL DEFAULT 'member'
     COMMENT 'member uses Pulse; admin invites members; super admin invites admins'
     AFTER status,
     ADD KEY ix_member_role (role)",
  "DO 0"
);

PREPARE add_role FROM @add_role;
EXECUTE add_role;
DEALLOCATE PREPARE add_role;

-- The founding super admin. INSERT ... ON DUPLICATE KEY so re-applying this
-- restores the role if it was changed, and so an existing row for this person
-- (from a bootstrap login before this migration) is promoted rather than
-- duplicated. `status` is left alone on the update path — it becomes 'active'
-- at their first login like anyone else's.
INSERT INTO pulse_member (email, name, status, role, invited_by)
     VALUES ('lavishgehlod@gmail.com', 'Lavish Gehlod', 'invited', 'super_admin', 'system')
ON DUPLICATE KEY UPDATE role = 'super_admin', invited_by = COALESCE(invited_by, 'system');
