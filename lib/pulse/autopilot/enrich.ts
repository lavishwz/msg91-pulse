/**
 * Binding an event's payload into its enrichment query.
 *
 * An event automation may carry one optional SELECT (`enrich_sql`, added in
 * migrations/025) which is run when the event fires so the judge has facts
 * about the subject rather than only the fact that something happened.
 *
 * The query names payload fields as `:name`. This turns those into positional
 * `?` and returns the values in matching order, so the query is executed as a
 * prepared statement and the payload never becomes SQL syntax.
 *
 * That is the whole point of this file existing rather than a `.replace()` at
 * the call site. An event payload carries accountName, addedBy and email —
 * values that originate outside Pulse and can contain anything a person typed.
 * Interpolating them would be injection, and the MSG91 connection in
 * development is root with GRANT ALL, so "it is only a SELECT" would not be
 * true of what an attacker could append. Bound parameters make the question
 * moot: a company named "'; DROP TABLE ms_user; --" is a seventeen-character
 * string that matches nothing.
 */

/** `:name` — a colon followed by an identifier, not part of `::` or a time literal. */
const PLACEHOLDER = /(?<![:\w]):([a-z_][a-z0-9_]*)/gi;

export type BoundQuery = { sql: string; names: string[] };

/**
 * Rewrite `:name` to `?`, in the order MySQL will consume them.
 *
 * String literals are left alone: `WHERE note = 'ask :them'` contains no
 * placeholder, and treating it as one would both break the query and bind a
 * value into a position that does not exist.
 */
export function bindPlaceholders(sql: string): BoundQuery {
  const names: string[] = [];
  let out = "";
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'" || ch === '"' || ch === "`") {
      /* Copy the literal through verbatim, honouring backslash escapes and
         doubled quotes, so nothing inside it is ever scanned. */
      const quote = ch;
      out += ch;
      i++;
      while (i < sql.length) {
        if (sql[i] === "\\") { out += sql[i] + (sql[i + 1] ?? ""); i += 2; continue; }
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) { out += quote + quote; i += 2; continue; }
          out += quote; i++; break;
        }
        out += sql[i]; i++;
      }
      continue;
    }
    /* Comments are copied through untouched, for the same reason literals are.
     *
     * A :name inside one is not a placeholder, and rewriting it was worse than
     * merely wrong: both call sites bind first and guard second, and the guard
     * strips comments — so the ? vanished from the statement MySQL received
     * while its name stayed in the value list. lib/db.ts uses a real prepared
     * statement, so the server counted the slots and refused the call with
     * "Incorrect arguments to EXECUTE". Nothing was injected; the enrichment
     * was simply dead on every fire, rejected with a message nobody would
     * connect to a trailing comment on an otherwise ordinary SELECT. */
    if (sql[i] === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      const end = nl === -1 ? sql.length : nl;
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (sql[i] === "#") {
      const nl = sql.indexOf("\n", i);
      const end = nl === -1 ? sql.length : nl;
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (sql[i] === "/" && sql[i + 1] === "*") {
      const close = sql.indexOf("*/", i + 2);
      const end = close === -1 ? sql.length : close + 2;
      out += sql.slice(i, end);
      i = end;
      continue;
    }

    /* Outside a literal or a comment: take the run up to the next thing that
       starts one, and swap placeholders within it. */
    let j = i;
    while (
      j < sql.length &&
      sql[j] !== "'" && sql[j] !== '"' && sql[j] !== "`" &&
      !(sql[j] === "-" && sql[j + 1] === "-") &&
      sql[j] !== "#" &&
      !(sql[j] === "/" && sql[j + 1] === "*")
    ) j++;
    const chunk = sql.slice(i, j);
    out += chunk.replace(PLACEHOLDER, (_m, name: string) => {
      names.push(name);
      return "?";
    });
    i = j;
  }

  return { sql: out, names };
}

/**
 * The values for those placeholders, in order.
 *
 * A name the payload does not carry binds NULL rather than throwing. The
 * payloads are fixed per event (see events.ts) and the planner is told their
 * shape, so a missing key means the planner named something that does not
 * exist — which shows up as a query matching nothing, reported honestly as an
 * empty enrichment, rather than as a failed automation.
 *
 * Values are flattened to primitives because that is all a bind parameter may
 * be; an object or array in a payload field is stringified rather than handed
 * to the driver, which would otherwise throw mid-pass.
 */
export function bindValues(
  names: string[],
  payload: Record<string, unknown>,
): Array<string | number | null> {
  return names.map((n) => {
    /* An own-property check, not a bare read. `payload[n]` reaches
       Object.prototype, so a name like "constructor" or "toString" returned a
       function — and JSON.stringify of a function is `undefined`, the one value
       this function promises never to produce and the one mysql2 rejects
       outright ("Bind parameters must not contain undefined"). `__proto__`
       was worse: it returned "{}" as though the payload carried it.
       checkEnrichment rejects unknown names at build time, but withEnrichment
       does not re-check them at run time — and its own comment says the row may
       have been changed by a migration or a restore since. */
    const v = Object.prototype.hasOwnProperty.call(payload, n) ? payload[n] : undefined;
    if (v === undefined || v === null) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : String(v);
    if (typeof v === "string") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (v instanceof Date) return v.toISOString();
    try { return JSON.stringify(v); } catch { return String(v); }
  });
}

/** Every distinct payload field an enrichment query asks for. */
export function placeholderNames(sql: string): string[] {
  return [...new Set(bindPlaceholders(sql).names)];
}
