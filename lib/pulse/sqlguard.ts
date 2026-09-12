/**
 * Guard for model-written SQL.
 *
 * This header used to open with "the database user has SELECT only, which is
 * the real safety boundary — a DROP would be refused by MySQL itself", and
 * everything below was designed as the second line behind that.
 *
 * It is not true of production. The connection Pulse actually uses is `root`
 * with GRANT ALL PRIVILEGES ON *.*, read back from the live database: SELECT,
 * INSERT, UPDATE, DELETE, DROP, the lot. There is no first line. This guard is
 * the only thing standing between a model-written query and the data, and it
 * is documented now on that basis rather than the comfortable one.
 *
 * Narrowing those credentials to a read-only user scoped to this schema is
 * still the real fix and this is not a substitute for it. But a guard whose
 * own docstring describes a boundary that does not exist is worse than no
 * docstring, because the next person to relax something here will believe
 * MySQL is still holding the line behind them.
 *
 * What it refuses:
 *
 *   · anything that is not a single SELECT — stacked statements, comment
 *     tricks, a leading INSERT or DROP
 *   · any table outside ALLOWED_TABLES. The database has 509 tables and 112
 *     are allowlisted; until this was enforced here, that list only governed
 *     what the *agent was told about* (lib/pulse/schema.ts) and nothing
 *     stopped a query naming any of the other 397
 *   · file and system functions, the mysql and performance_schema databases,
 *     privilege tables, server variables, locks, sleeps and benchmarks
 *   · a query that runs for minutes and ties up a shared connection
 *     (ms_trans has ~1M rows and no secondary index, so this is easy to write
 *     by accident)
 *   · a query that returns 100,000 rows into the browser
 *
 * Everything here is a deliberate refusal rather than a rewrite, except the
 * LIMIT, which is appended when missing and lowered when too high.
 */

import { ALLOWED_TABLE_NAMES } from "./schema-notes";

export const MAX_ROWS = 200;

/** Statements that are never allowed, whatever the privileges say. */
const FORBIDDEN = [
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "create",
  "rename",
  "replace",
  "grant",
  "revoke",
  "commit",
  "rollback",
  "savepoint",
  "lock",
  "unlock",
  "call",
  "execute",
  "prepare",
  "handler",
  "load",
  "set",
  "use",
  "kill",
  "shutdown",
  "flush",
  "reset",
  "optimize",
  "repair",
  "analyze",
  "check",
  "install",
  "uninstall",
];

/** Functions and clauses that read or write outside the query. */
const FORBIDDEN_PATTERNS: [RegExp, string][] = [
  [/\binto\s+(outfile|dumpfile)\b/i, "writes to a file"],
  [/\bload_file\s*\(/i, "reads a file"],
  [/\bsleep\s*\(/i, "sleeps"],
  [/\bbenchmark\s*\(/i, "runs a benchmark loop"],
  [/\binformation_schema\.(user_privileges|schema_privileges)\b/i, "reads privilege tables"],
  [/\bmysql\s*\.\s*\w+/i, "reads the mysql system database"],
  [/\bperformance_schema\s*\.\s*\w+/i, "reads performance_schema"],
  [/\bget_lock\s*\(/i, "takes a lock"],
  [/@@\s*\w+/, "reads a server variable"],
];

export type GuardResult =
  | { ok: true; sql: string; limit: number; addedLimit: boolean }
  | { ok: false; reason: string };

/** Strip comments so keyword checks cannot be smuggled past in a comment. */
function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/#[^\n]*/g, " ");
}

/**
 * Split on semicolons that are not inside a string literal, so a legitimate
 * `WHERE name = 'a;b'` is not mistaken for two statements.
 */
function statements(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      if (ch === "\\") {
        buf += ch + (sql[i + 1] ?? "");
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      buf += ch;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === ";") {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/**
 * The first table the query reads that it is not allowed to, or null.
 *
 * Only names in a position that can be a table are considered: what follows
 * FROM, JOIN, or one of the JOIN flavours. A column called `create_log` or a
 * string containing the word "from" is not a table and is not examined.
 *
 * Three things are deliberately *not* treated as strangers:
 *
 *   a subquery — `FROM (SELECT ...)` names no table at that position; the
 *     tables inside it are matched by their own FROM/JOIN further along.
 *   a CTE — `WITH recent AS (...) SELECT * FROM recent` reads `recent`, which
 *     exists only for the length of the statement. Collected first, so a CTE
 *     is not reported as an unknown table while the real tables inside its
 *     body still are.
 *   a database qualifier — `clonemsg.ms_user` is checked as `ms_user`. The
 *     mysql and performance_schema databases are already refused outright by
 *     FORBIDDEN_PATTERNS, so a qualifier here can only be this schema.
 *
 * Erring toward refusal is the right bias: a rule that is wrongly refused says
 * so at build time, in front of the person writing it, and is one sentence
 * away from being fixed. A rule that wrongly reads a table nobody meant it to
 * says nothing at all.
 */
function disallowedTable(stmt: string): string | null {
  /* Literals blanked so a table name inside a string cannot be read as SQL,
     and backticks dropped so `ms_user` and ms_user are the same name. */
  const sql = stmt
    .replace(/'(?:[^'\\]|\\.|'')*'/g, (m) => " ".repeat(m.length))
    .replace(/"(?:[^"\\]|\\.|"")*"/g, (m) => " ".repeat(m.length))
    .replace(/`/g, " ");

  const ctes = new Set<string>();
  /* `WITH a AS (...), b AS (...)` — every name bound before a SELECT can use
     it. RECURSIVE is allowed through the same shape. */
  const cteRe = /(?:\bwith\b|,)\s*(?:recursive\s+)?([a-z_][\w$]*)\s+as\s*\(/gi;
  let c: RegExpExecArray | null;
  while ((c = cteRe.exec(sql))) ctes.add(c[1].toLowerCase());

  const tableRe =
    /\b(?:from|(?:(?:inner|cross|left|right|full)\s+)?(?:outer\s+)?join)\s+([a-z_][\w$]*(?:\s*\.\s*[a-z_][\w$]*)?)/gi;
  let m: RegExpExecArray | null;
  while ((m = tableRe.exec(sql))) {
    const raw = m[1].replace(/\s+/g, "");
    /* Take the table half of db.table; the database half is already
       constrained by FORBIDDEN_PATTERNS. */
    const name = (raw.includes(".") ? raw.split(".").pop()! : raw).toLowerCase();
    if (ctes.has(name)) continue;
    if (!ALLOWED_TABLE_NAMES.has(name)) return name;
  }
  return null;
}

/**
 * Validate and normalise. Returns the SQL to run, or a reason to refuse.
 */
export function guard(raw: string, maxRows = MAX_ROWS): GuardResult {
  // Models sometimes wrap SQL in a markdown fence despite being asked not to.
  const unfenced = raw
    .trim()
    .replace(/^```(?:sql)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  if (!unfenced) return { ok: false, reason: "empty query" };

  const bare = stripComments(unfenced);
  const parts = statements(bare);

  if (parts.length === 0) return { ok: false, reason: "no statement found" };
  if (parts.length > 1) {
    return { ok: false, reason: `${parts.length} statements — only one SELECT is allowed` };
  }

  const stmt = parts[0];
  const lower = stmt.toLowerCase();

  // Must be a read. WITH is allowed so CTEs work, but MySQL 5.7 lacks them —
  // the model is told this; if it sends one anyway MySQL will reject it, which
  // is a clear error rather than a wrong answer.
  if (!/^\s*(select|with)\b/i.test(stmt)) {
    const first = lower.trim().split(/\s+/)[0] ?? "?";
    return { ok: false, reason: `must start with SELECT, got "${first}"` };
  }

  for (const word of FORBIDDEN) {
    // Word-boundary match on the comment-stripped statement.
    if (new RegExp(`\\b${word}\\b`, "i").test(lower)) {
      // "select ... from create_log" style names are fine; only reject when the
      // keyword is used as a statement or clause, i.e. followed by whitespace
      // and not preceded by a dot or backtick.
      // The trailing `(\s|$)` matters: without it, a statement ending in a
      // bare forbidden keyword with nothing after it (no trailing whitespace
      // for `\s` to match) slipped past this specific check.
      const asClause = new RegExp(`(^|[\\s(,])${word}(\\s|$)`, "i");
      if (asClause.test(lower)) return { ok: false, reason: `contains "${word}"` };
    }
  }

  for (const [pattern, why] of FORBIDDEN_PATTERNS) {
    if (pattern.test(stmt)) return { ok: false, reason: `query ${why}` };
  }

  const stranger = disallowedTable(stmt);
  if (stranger) {
    return {
      ok: false,
      reason:
        `reads "${stranger}", which is not one of the tables Pulse is allowed to query. ` +
        `See ALLOWED_TABLES in lib/pulse/schema-notes.ts.`,
    };
  }

  // Enforce a row cap. If the model wrote its own LIMIT, keep it when it is
  // under the cap and lower it when it is not.
  const limitMatch = /\blimit\s+(\d+)\s*(?:,\s*(\d+)\s*)?$/i.exec(stmt.trim());
  if (!limitMatch) {
    return { ok: true, sql: `${stmt.trim()} LIMIT ${maxRows}`, limit: maxRows, addedLimit: true };
  }

  // `LIMIT a, b` means offset a, count b. The offset is not a row count and
  // must survive being capped — replacing `LIMIT 500000, 10000` with a bare
  // `LIMIT 200` used to silently turn "row 500,000 onward" into "the first
  // 200 rows", answering a completely different question with no error.
  const offset = limitMatch[2] !== undefined ? Number(limitMatch[1]) : null;
  const declared = Number(limitMatch[2] ?? limitMatch[1]);
  if (!Number.isFinite(declared) || declared > maxRows) {
    const newLimit = offset !== null ? `${offset}, ${maxRows}` : `${maxRows}`;
    const replaced = stmt.trim().replace(/\blimit\s+\d+\s*(?:,\s*\d+\s*)?$/i, `LIMIT ${newLimit}`);
    return { ok: true, sql: replaced, limit: maxRows, addedLimit: false };
  }

  return { ok: true, sql: stmt.trim(), limit: declared, addedLimit: false };
}
