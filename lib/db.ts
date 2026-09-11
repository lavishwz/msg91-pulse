import mysql from "mysql2/promise";

/**
 * MySQL access for MSG91 Pulse.
 *
 * One pool per process. Next.js reloads modules on every edit in dev, so the
 * pool is stashed on globalThis — without that, each save would leak a pool and
 * the server would run out of connections within a few edits.
 *
 * Server-only: never import this from a client component. Credentials come from
 * .env.local (see .env.example).
 */

type Env = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  poolLimit: number;
};

const PLACEHOLDER = /^<.*>$/;

function readEnv(): Env {
  const required = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_DATABASE"] as const;

  const missing = required.filter((k) => {
    const v = process.env[k];
    return !v || PLACEHOLDER.test(v.trim());
  });

  if (missing.length) {
    throw new Error(
      `MySQL is not configured: ${missing.join(", ")} ${
        missing.length === 1 ? "is" : "are"
      } missing or still a placeholder. Fill in .env.local (see .env.example).`,
    );
  }

  const password = process.env.MYSQL_PASSWORD ?? "";

  return {
    host: process.env.MYSQL_HOST!.trim(),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER!.trim(),
    // An empty password is legal; a leftover placeholder is not.
    password: PLACEHOLDER.test(password.trim()) ? "" : password,
    database: process.env.MYSQL_DATABASE!.trim(),
    ssl: (process.env.MYSQL_SSL ?? "").toLowerCase() === "true",
    poolLimit: Number(process.env.MYSQL_POOL_LIMIT ?? 10),
  };
}

function createPool(): mysql.Pool {
  const env = readEnv();

  return mysql.createPool({
    host: env.host,
    port: env.port,
    user: env.user,
    password: env.password,
    database: env.database,
    ...(env.ssl ? { ssl: { rejectUnauthorized: true } } : {}),
    waitForConnections: true,
    connectionLimit: env.poolLimit,
    queueLimit: 0,
    // Keep MySQL's own types rather than driver coercions, so money and ids
    // survive round-trips intact.
    decimalNumbers: false,
    dateStrings: false,
    timezone: "Z",
    charset: "utf8mb4_general_ci",
    /* Same remote-MySQL problem the store hit, and the same fix — see the
       note in lib/store.ts. A remote server closes idle connections on its
       own schedule, and mysql2 hands a closed one straight back out of the
       pool: every call then fails with ECONNRESET until the process
       restarts, which reads as "MSG91 is down" while the host answers the
       command line perfectly. This pool had the keepalive half and not the
       idleTimeout half, so it could still be holding a connection the server
       had already hung up on. Every automation query, every board scoring
       pass and every Ask answer goes through here.

       maxIdle matters more here than it did for the store: on serverless
       each concurrent invocation is its own process with its own pool, so
       "ten connections" is ten per instance. Retiring idle ones keeps a
       burst of traffic from leaving a long tail of frozen instances each
       holding connections open against a shared read-only host. */
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    idleTimeout: 60_000,
    maxIdle: 2,
  });
}

const globalForDb = globalThis as unknown as {
  __pulsePool?: mysql.Pool;
  __pulsePoolKey?: string;
};

/**
 * A fingerprint of the connection settings. The pool is cached across dev
 * reloads, which means a pool built from the *old* .env.local outlives an edit
 * to it — switching between the remote database and the local one then fails
 * with a stale-host timeout that looks like a network fault. Keying the cache on
 * the settings makes the switch just work.
 */
function configKey(): string {
  const e = readEnv();
  return [e.host, e.port, e.user, e.database, e.ssl, e.poolLimit].join("|");
}

export function pool(): mysql.Pool {
  const key = configKey();
  if (globalForDb.__pulsePool && globalForDb.__pulsePoolKey === key) {
    return globalForDb.__pulsePool;
  }
  if (globalForDb.__pulsePool) {
    // Settings changed under us. Let the old pool drain and drop it.
    void globalForDb.__pulsePool.end().catch(() => {});
  }
  globalForDb.__pulsePool = createPool();
  globalForDb.__pulsePoolKey = key;
  return globalForDb.__pulsePool;
}

/** A value that can be bound to a `?` placeholder. */
export type Param = string | number | boolean | null | Date | Buffer;

/**
 * Run a parameterised SELECT. Always pass values via `params` — never build SQL
 * by string concatenation.
 */
export async function query<T = mysql.RowDataPacket>(
  sql: string,
  params: readonly Param[] = [],
): Promise<T[]> {
  const [rows] = await pool().execute(sql, params as Param[]);
  return rows as T[];
}

/** Same as `query`, but returns the first row (or null). */
export async function queryOne<T = mysql.RowDataPacket>(
  sql: string,
  params: readonly Param[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export type DbStatus =
  | {
      ok: true;
      database: string;
      serverVersion: string;
      tableCount: number;
      latencyMs: number;
    }
  | { ok: false; error: string; code?: string };

/** Connectivity probe — used by /api/health/db and scripts/db-check.mjs. */
export async function dbStatus(): Promise<DbStatus> {
  const started = Date.now();
  try {
    const row = await queryOne<{
      db: string;
      version: string;
      tables: number;
    }>(
      `SELECT DATABASE() AS db,
              VERSION()  AS version,
              (SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = DATABASE()) AS tables`,
    );

    return {
      ok: true,
      database: row?.db ?? "",
      serverVersion: row?.version ?? "",
      tableCount: Number(row?.tables ?? 0),
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    const e = err as { message?: string; code?: string };
    return { ok: false, error: e.message ?? String(err), code: e.code };
  }
}
