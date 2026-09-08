/**
 * Guard for model-written SQL.
 *
 * The database user has SELECT only, which is the real safety boundary — a
 * DROP would be refused by MySQL itself. This guard exists for the failures
 * that privilege does *not* cover:
 *
 *   · a query that runs for minutes and ties up a shared connection
 *     (ms_trans has ~1M rows and no secondary index, so this is easy to write
 *     by accident)
 *   · a query that returns 100,000 rows into the browser
 *   · stacked statements, comment tricks, or file/system functions
 *   · SELECT ... INTO OUTFILE, which writes even for a read-only user
 *
 * Everything here is a deliberate refusal rather than a rewrite, except the
 * LIMIT, which is appended when missing and lowered when too high.
 */

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
      const asClause = new RegExp(`(^|[\\s(,])${word}\\s`, "i");
      if (asClause.test(lower)) return { ok: false, reason: `contains "${word}"` };
    }
  }

  for (const [pattern, why] of FORBIDDEN_PATTERNS) {
    if (pattern.test(stmt)) return { ok: false, reason: `query ${why}` };
  }

  // Enforce a row cap. If the model wrote its own LIMIT, keep it when it is
  // under the cap and lower it when it is not.
  const limitMatch = /\blimit\s+(\d+)\s*(?:,\s*(\d+)\s*)?$/i.exec(stmt.trim());
  if (!limitMatch) {
    return { ok: true, sql: `${stmt.trim()} LIMIT ${maxRows}`, limit: maxRows, addedLimit: true };
  }

  // `LIMIT a, b` means offset a, count b.
  const declared = Number(limitMatch[2] ?? limitMatch[1]);
  if (!Number.isFinite(declared) || declared > maxRows) {
    const replaced = stmt.trim().replace(/\blimit\s+\d+\s*(?:,\s*\d+\s*)?$/i, `LIMIT ${maxRows}`);
    return { ok: true, sql: replaced, limit: maxRows, addedLimit: false };
  }

  return { ok: true, sql: stmt.trim(), limit: declared, addedLimit: false };
}
