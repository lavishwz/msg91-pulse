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
    /* Outside a literal: take the longest run up to the next quote and swap
       placeholders within it. */
    let j = i;
    while (j < sql.length && sql[j] !== "'" && sql[j] !== '"' && sql[j] !== "`") j++;
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
    const v = payload[n];
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
