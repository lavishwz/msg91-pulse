import mysql from "mysql2/promise";
import { withColdStartRetry } from "./dbRetry";

/**
 * Pulse's own database — the writable half.
 *
 * `lib/db.ts` is MSG91's schema, and Pulse has SELECT on it and nothing else.
 * This is the other connection: the schema Pulse owns, where decisions, drafts,
 * timers, policy and outcomes are written (docs/pulse-store.md).
 *
 * Two pools rather than one, on purpose. They may not point at the same server
 * for long — production is expected to grant Pulse a schema elsewhere — and
 * keeping the write credentials separate means a bug in a read path cannot
 * write, whatever it tries.
 *
 * Host, port, user and password fall back to the MYSQL_* values when the
 * PULSE_STORE_* ones are unset, because in development both schemas live on the
 * same local server and repeating the credentials invites them to drift.
 */

type StoreEnv = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  poolLimit: number;
};

const PLACEHOLDER = /^<.*>$/;

function pick(specific: string, fallback: string, dflt = ""): string {
  const a = (process.env[specific] ?? "").trim();
  if (a && !PLACEHOLDER.test(a)) return a;
  const b = (process.env[fallback] ?? "").trim();
  if (b && !PLACEHOLDER.test(b)) return b;
  return dflt;
}

function readEnv(): StoreEnv {
  const database = pick("PULSE_STORE_DATABASE", "___none___", "pulse_store");
  const host = pick("PULSE_STORE_HOST", "MYSQL_HOST");
  const user = pick("PULSE_STORE_USER", "MYSQL_USER");

  if (!host || !user) {
    throw new Error(
      "Pulse's store is not configured: set PULSE_STORE_HOST/PULSE_STORE_USER, " +
        "or MYSQL_HOST/MYSQL_USER for a store on the same server. " +
        "See docs/pulse-store.md.",
    );
  }

  // The fallback to MYSQL_* is a convenience for development, where both
  // schemas live on one local server. Falling back to a *remote* host is never
  // what anyone meant: that is MSG91's database, Pulse has SELECT on it, and
  // every write would be aimed at a read-only user. Refuse, and say which four
  // variables are missing, rather than timing out and looking like a network
  // problem.
  const storeHostSet = Boolean((process.env.PULSE_STORE_HOST ?? "").trim());
  const local = host === "127.0.0.1" || host === "localhost" || host === "::1";
  if (!storeHostSet && !local) {
    throw new Error(
      `Pulse's store would fall back to ${host}, which is MSG91's database and read-only. ` +
        "Set PULSE_STORE_HOST, PULSE_STORE_PORT, PULSE_STORE_USER and PULSE_STORE_PASSWORD " +
        "to a database Pulse may write to. See docs/pulse-store.md.",
    );
  }

  /* Managed MySQL usually runs with require_secure_transport=ON, which rejects
     a plaintext connection outright — "Connections using insecure transport are
     prohibited". Nothing in the error names TLS as the fix, so it is worth
     being explicit: set PULSE_STORE_SSL=true for a hosted store. Falls back to
     MYSQL_SSL for the development case where both schemas sit on one server. */
  const ssl = pick("PULSE_STORE_SSL", "MYSQL_SSL", "false").toLowerCase() === "true";

  return {
    host,
    user,
    database,
    ssl,
    port: Number(pick("PULSE_STORE_PORT", "MYSQL_PORT", "3306")),
    password: pick("PULSE_STORE_PASSWORD", "MYSQL_PASSWORD"),
    poolLimit: Number(process.env.PULSE_STORE_POOL_LIMIT ?? 5),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __pulseStorePool: mysql.Pool | undefined;
}

export function storePool(): mysql.Pool {
  if (!globalThis.__pulseStorePool) {
    const env = readEnv();
    globalThis.__pulseStorePool = mysql.createPool({
      host: env.host,
      port: env.port,
      user: env.user,
      password: env.password,
      database: env.database,
      ...(env.ssl ? { ssl: { rejectUnauthorized: true } } : {}),
      waitForConnections: true,
      connectionLimit: env.poolLimit,
      /* The store is a remote MySQL that closes idle connections, and mysql2
         will hand a closed one straight back out of the pool — every call then
         fails with ECONNRESET until the process restarts. That happened twice
         while this was being built, and looked each time like the store being
         down when it was reachable from the command line throughout.
         Keepalive holds them open; idleTimeout retires them before the server
         does. */
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      idleTimeout: 60_000,
      /* Read DATETIME columns as UTC, which is what they are — lib/db.ts has
         always set this and this pool never did.

         Without it mysql2 defaults to "local" and labels every returned
         DATETIME with the *Node process's* timezone before building a Date.
         The store writes its timestamps with the server's own NOW(), so a row
         written at 19:15 UTC came back as a Date meaning 19:15 IST — 13:45
         UTC — and every last_run_at, next_run_at and decision timestamp the
         product showed was off by the host's offset. It reads as correct on
         Vercel only because Vercel runs in UTC, where the mislabelling is a
         no-op; it was five and a half hours wrong on a developer's machine,
         which is exactly where someone would be looking when trying to work
         out whether an automation had run. */
      timezone: "Z",
      // Decisions carry JSON columns; letting the driver hand back parsed
      // objects keeps every caller from JSON.parse-ing defensively.
      typeCast: true,
      dateStrings: false,
    });
  }
  return globalThis.__pulseStorePool;
}

export type Param = string | number | boolean | null | Date | Buffer;

export async function write(sql: string, params: Param[] = []): Promise<mysql.ResultSetHeader> {
  /* Not retried: a connection error here can arrive after the INSERT/UPDATE
     already reached the server, and retrying blind risks writing it twice.
     A read hitting the same cold start (below) is what actually wakes the
     instance in practice — writes come later in every real call path. */
  const [res] = await storePool().execute(sql, params);
  return res as mysql.ResultSetHeader;
}

export async function read<T = mysql.RowDataPacket>(sql: string, params: Param[] = []): Promise<T[]> {
  const [rows] = await withColdStartRetry(() => storePool().execute(sql, params));
  return rows as T[];
}

export async function readOne<T = mysql.RowDataPacket>(
  sql: string,
  params: Param[] = [],
): Promise<T | null> {
  const rows = await read<T>(sql, params);
  return rows[0] ?? null;
}

/* ── policy ──────────────────────────────────────────────────────────────── */

export type Policy = {
  version: string;
  thresholds: { humanNow: number; nurture: number; suppressConfidenceFloor: number };
  sendingPaused: boolean;
};

/**
 * The rules in force, read fresh.
 *
 * The runner reads this before it does anything else — the kill switch is only
 * a kill switch if nothing is cached in front of it.
 */
export async function activePolicy(): Promise<Policy> {
  const rows = await read<{ version: string; policy_key: string; body: unknown }>(
    `SELECT version, policy_key, body
       FROM pulse_policy
      WHERE state = 'active' AND kind IN ('threshold','switch')`,
  );

  const at = (key: string) => {
    const row = rows.find((r) => r.policy_key === key);
    if (!row) return {} as Record<string, number | boolean>;
    return (typeof row.body === "string" ? JSON.parse(row.body) : row.body) as Record<
      string,
      number | boolean
    >;
  };

  const version = rows[0]?.version ?? "v1";

  return {
    version,
    thresholds: {
      humanNow: Number(at("triage.threshold.human_now").min_score ?? 80),
      nurture: Number(at("triage.threshold.nurture").min_score ?? 40),
      suppressConfidenceFloor: Number(
        at("triage.floor.suppress_confidence").min_confidence ?? 0.6,
      ),
    },
    sendingPaused: Boolean(at("sending.paused").paused ?? false),
  };
}

/* ── watermarks ──────────────────────────────────────────────────────────── */

export async function watermark(stream: string, fallback: string): Promise<string> {
  const row = await readOne<{ position: string }>(
    `SELECT position FROM pulse_watermark WHERE stream = ?`,
    [stream],
  );
  return row?.position ?? fallback;
}

/**
 * Advance a watermark — only ever forwards.
 *
 * GREATEST() rather than a plain assignment: two runners overlapping must not
 * be able to move it backwards and re-process a batch that already completed.
 */
export async function advanceWatermark(
  stream: string,
  position: string,
  count: number,
): Promise<void> {
  await write(
    `INSERT INTO pulse_watermark (stream, position, last_run_at, last_count)
          VALUES (?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
          position    = GREATEST(VALUES(position), position),
          last_run_at = NOW(),
          last_count  = VALUES(last_count)`,
    [stream, position, count],
  );
}

export async function storeStatus(): Promise<
  { ok: true; database: string; tables: number } | { ok: false; error: string }
> {
  try {
    const env = readEnv();
    const rows = await read<{ n: number }>(
      `SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema = ?`,
      [env.database],
    );
    return { ok: true, database: env.database, tables: Number(rows[0]?.n ?? 0) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/* ── locks ───────────────────────────────────────────────────────────────── */

/**
 * Take a named lock, or fail.
 *
 * The endpoint is called on a schedule from outside, so a second call can
 * arrive while the first is still working. Duplicate work would not corrupt
 * anything — every key in this store is unique — but it would spend AI calls
 * twice, so the second caller is told to go home.
 *
 * A lock that has expired is taken over rather than waited on: a runner killed
 * mid-pass must not stop every future run.
 */
export async function acquireLock(name: string, holder: string, ttlSeconds: number): Promise<boolean> {
  const res = await write(
    `INSERT INTO pulse_lock (name, holder, acquired_at, expires_at)
          VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND))
     ON DUPLICATE KEY UPDATE
          holder     = IF(expires_at < NOW(), VALUES(holder), holder),
          acquired_at= IF(expires_at < NOW(), NOW(), acquired_at),
          expires_at = IF(expires_at < NOW(), VALUES(expires_at), expires_at)`,
    [name, holder, ttlSeconds],
  );
  // The row is ours only if we inserted it, or if we took over an expired one.
  const row = await readOne<{ holder: string }>(`SELECT holder FROM pulse_lock WHERE name = ?`, [name]);
  return row?.holder === holder;
}

/** Release a lock, but only if we still hold it. */
export async function releaseLock(name: string, holder: string): Promise<void> {
  await write(`DELETE FROM pulse_lock WHERE name = ? AND holder = ?`, [name, holder]);
}

export async function lockState(name: string) {
  return readOne<{ holder: string; acquired_at: Date; expires_at: Date }>(
    `SELECT holder, acquired_at, expires_at FROM pulse_lock WHERE name = ?`,
    [name],
  );
}
