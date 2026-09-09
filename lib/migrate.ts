import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { storePool, write, read } from "@/lib/store";

/**
 * Migrations for Pulse's own schema.
 *
 * The deploy platform does not run anything before the app starts — there is no
 * release phase and no migration step — so the app brings its own schema up on
 * boot. `instrumentation.ts` calls `migrate()` once per server start, before
 * any request is served.
 *
 * ── The rules this follows ─────────────────────────────────────────────────
 * - **Only forward.** Files are applied in filename order and never re-applied.
 *   There is no down migration: rolling a schema backwards on a live system is
 *   how data gets lost, and reverting is a new migration like any other.
 * - **Recorded by checksum.** If a file changes after it has been applied, that
 *   is reported rather than silently ignored — a migration edited in place
 *   means two environments have different schemas and neither knows.
 * - **One at a time.** A lock stops two instances migrating the same database
 *   at once, which on MySQL means two conflicting DDL statements.
 * - **Never touches MSG91's schema.** Everything runs through the store pool,
 *   which points at PULSE_STORE_DATABASE.
 */

const DIR = path.join(process.cwd(), "migrations");

export type MigrationResult = {
  applied: string[];
  skipped: string[];
  changed: string[];
  error?: string;
};

async function ensureTable(): Promise<void> {
  await write(
    `CREATE TABLE IF NOT EXISTS pulse_migration (
       name        VARCHAR(190) NOT NULL,
       checksum    CHAR(64)     NOT NULL,
       applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
       ms          INT          NOT NULL DEFAULT 0,
       PRIMARY KEY (name)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
}

/**
 * Split a file into statements.
 *
 * Naive on purpose — semicolon at the end of a line, outside a comment. The
 * migrations here are DDL and inserts, not stored procedures, so there are no
 * semicolons inside bodies to worry about. If that ever changes, this is the
 * thing that has to get smarter, and it will fail loudly rather than quietly.
 */
function statements(sql: string): string[] {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Bring the store's schema up to date.
 *
 * Safe to call on every boot: already-applied files are skipped by name, and
 * every statement in them is written to be re-runnable anyway.
 */
export async function migrate(): Promise<MigrationResult> {
  const out: MigrationResult = { applied: [], skipped: [], changed: [] };

  let files: string[];
  try {
    files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();
  } catch {
    // No migrations directory is not an error — a checkout without one simply
    // has nothing to apply.
    return out;
  }
  if (!files.length) return out;

  await ensureTable();

  // MySQL's own advisory lock: held for the connection, released when it goes.
  // 60 seconds is longer than these files take and short enough that a crashed
  // instance does not block the next deploy for long.
  const conn = await storePool().getConnection();
  try {
    const [lockRows] = await conn.query<never[] & { got: number }[]>(
      `SELECT GET_LOCK('pulse_migrate', 60) AS got`,
    );
    if (!Number((lockRows as unknown as { got: number }[])[0]?.got)) {
      out.error = "another instance is migrating; skipped";
      return out;
    }

    const done = new Map(
      (await read<{ name: string; checksum: string }>(`SELECT name, checksum FROM pulse_migration`)).map(
        (r) => [r.name, r.checksum],
      ),
    );

    for (const file of files) {
      const sql = await readFile(path.join(DIR, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const already = done.get(file);

      if (already) {
        // Applied before. If the file has changed since, say so — two
        // environments now disagree about what this migration did.
        if (already !== checksum) out.changed.push(file);
        else out.skipped.push(file);
        continue;
      }

      const started = Date.now();
      for (const statement of statements(sql)) {
        await conn.query(statement);
      }
      await conn.query(
        `INSERT INTO pulse_migration (name, checksum, ms) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE checksum = VALUES(checksum), applied_at = NOW(), ms = VALUES(ms)`,
        [file, checksum, Date.now() - started],
      );
      out.applied.push(file);
    }
  } catch (err) {
    out.error = (err as Error).message;
  } finally {
    await conn.query(`SELECT RELEASE_LOCK('pulse_migrate')`).catch(() => {});
    conn.release();
  }

  return out;
}

/** What has been applied, for the health endpoint. */
export async function migrationStatus() {
  try {
    const rows = await read<{ name: string; applied_at: Date; ms: number }>(
      `SELECT name, applied_at, ms FROM pulse_migration ORDER BY name`,
    );
    return rows.map((r) => ({ name: r.name, at: r.applied_at.toISOString(), ms: Number(r.ms) }));
  } catch {
    return [];
  }
}
