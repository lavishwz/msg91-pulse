-- pulse_watermark.stream was VARCHAR(60) — fine for short streams like
-- "signups", too small for "automation:<dynamic automation key>", where the
-- key itself can run to 60+ characters (see slugify() in
-- lib/pulse/autopilot/build.ts). Found live: the first dynamically built
-- automation to actually run failed at advanceMark() with
-- ER_DATA_TOO_LONG the moment it tried to record a watermark.

ALTER TABLE pulse_watermark MODIFY COLUMN stream VARCHAR(150) NOT NULL COMMENT 'e.g. signups, or automation:<key>';
