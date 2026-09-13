/**
 * The MSG91 schema, read from the dump in schema/msg91-schema.sql.
 *
 * Why a file when lib/pulse/schema.ts can introspect the live database: the
 * introspected index gives a table's name, its row estimate and MSG91's own
 * description of it — and not one column. For the 112 allowlisted tables that
 * left the planner knowing five of them in detail (SCHEMA_GLOSSARY) and the
 * other 107 by name alone, so every rule that touched one had to guess what
 * its columns were called.
 *
 * It guessed, and it guessed plausibly, which is the worst kind. A batch of
 * forty-five real rules produced `Unknown column 'tb.user_pid' in 'WHERE'`,
 * `'uh.owner_user_pid'`, `'v.verification_status'`, `'a.sender_senderid'` —
 * six failures in the first ten rules, every one of them on a table outside
 * those five, and every one caught only by the dry run.
 *
 * The dump answers that completely: 509 CREATE TABLE statements, every column
 * of every table. It is also schema-only — no INSERT, no row of anybody's
 * data — which is what makes it safe to keep in the repository at all.
 *
 * Read once and cached for the life of the process. It is 366KB of text and
 * the parse is a scan, so the cost is paid on the first rule built after a
 * cold start and never again. Nothing here reaches the database, so it also
 * works while the database is asleep, which the free tier does.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type DumpColumn = {
  name: string;
  type: string;
  nullable: boolean;
  key: boolean;
  /** The column's character set — the table's own DEFAULT CHARSET unless the
   *  column overrides it with its own CHARACTER SET clause. Empty for a
   *  non-text type, which cannot mismatch on collation at all. */
  charset: string;
};
export type DumpTable = { table: string; columns: DumpColumn[] };

let CACHE: Map<string, DumpTable> | null = null;

/** Column types that carry a character set and can therefore collide with a
 *  differently-charset column in a JOIN or WHERE comparison. Everything else
 *  (int, decimal, datetime, …) compares by value and never hits this. */
const TEXTUAL = /^(char|varchar|tinytext|text|mediumtext|longtext|enum|set)\b/i;

/**
 * Parse the dump into a table-name → columns map.
 *
 * Deliberately a scan rather than a SQL parser: the only thing needed from
 * each CREATE TABLE is its column lines, and those have a fixed shape in
 * mysqldump output — a backticked name, a type, and the rest of the line.
 * Keys, constraints and engine clauses are skipped by the same rule that finds
 * columns, since they do not begin with a backticked identifier at that
 * indent.
 */
export function parse(sql: string): Map<string, DumpTable> {
  const out = new Map<string, DumpTable>();
  /* The closing line is captured too, now: "') ENGINE=InnoDB … DEFAULT
     CHARSET=latin1;" names the table's default character set, which is what
     every column below inherits unless it overrides it. */
  const createRe = /^CREATE TABLE `([^`]+)` \(\n([\s\S]*?)\n\) ENGINE[^\n;]*;/gm;
  let m: RegExpExecArray | null;

  while ((m = createRe.exec(sql))) {
    const table = m[1];
    const body = m[2];
    const tail = m[0];
    const columns: DumpColumn[] = [];
    const primary = new Set<string>();

    const tableCharset = (/DEFAULT CHARSET=(\w+)/i.exec(tail) ?? [])[1] ?? "";

    for (const line of body.split("\n")) {
      const t = line.trim().replace(/,$/, "");
      const pk = /^PRIMARY KEY \(([^)]*)\)/i.exec(t);
      if (pk) {
        for (const c of pk[1].split(",")) primary.add(c.trim().replace(/`/g, ""));
        continue;
      }
      /* Anything that is not a backticked column name at the start of the line
         is a key, a constraint or an index — none of which the planner needs
         and all of which would only add noise to the prompt. */
      const col = /^`([^`]+)`\s+([^\s,]+(?:\([^)]*\))?(?:\s+unsigned)?)(.*)$/i.exec(t);
      if (!col) continue;
      const type = col[2];
      const rest = col[3] ?? "";
      /* A column may name its own charset ("CHARACTER SET utf8") ahead of the
         table's default — approved_senderid.senderid does exactly this, one
         utf8 column on an otherwise-latin1 table. Falls back to the table's
         own default for everything else, and to "" for a type that carries no
         charset at all (an int, a date, …), which can never collide. */
      const own = /CHARACTER SET (\w+)/i.exec(rest)?.[1];
      const charset = TEXTUAL.test(type) ? (own ?? tableCharset) : "";
      columns.push({
        name: col[1],
        type,
        nullable: !/\bNOT NULL\b/i.test(t),
        key: false,
        charset,
      });
    }
    for (const c of columns) if (primary.has(c.name)) c.key = true;
    out.set(table.toLowerCase(), { table, columns });
  }
  return out;
}

function load(): Map<string, DumpTable> {
  if (CACHE) return CACHE;
  /* process.cwd() is the project root under `next dev`, `next start` and on
     Vercel alike. A missing or unreadable dump is not fatal — the caller falls
     back to live introspection, which is what it used before this existed. */
  const path = join(process.cwd(), "schema", "msg91-schema.sql");
  CACHE = parse(readFileSync(path, "utf8"));
  return CACHE;
}

/** Every table the dump describes. */
export function dumpTableNames(): string[] {
  try {
    return [...load().values()].map((t) => t.table);
  } catch {
    return [];
  }
}

/** The columns of one table, or null when the dump does not describe it. */
export function dumpColumns(table: string): DumpTable | null {
  try {
    return load().get(table.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Look a table up in an explicit map rather than the cached real dump.
 *
 * `renderDumpDetail` and `mixedCharsets` take an optional map for exactly
 * this reason: tests build a small fixture with `parse()` and need those two
 * functions to read it instead of the real 509-table file, without either
 * function reaching past its caller to the module-level cache to do it.
 */
function columnsIn(map: Map<string, DumpTable> | undefined, table: string): DumpTable | null {
  if (map) return map.get(table.toLowerCase()) ?? null;
  return dumpColumns(table);
}

/**
 * The named tables, rendered for a prompt.
 *
 * Same compact CREATE-like shape lib/pulse/schema.ts uses for its own detail,
 * so a planner prompt reads consistently whichever source answered.
 */
export function renderDumpDetail(tables: string[], map?: Map<string, DumpTable>): string {
  const blocks: string[] = [];
  for (const name of tables) {
    const t = columnsIn(map, name);
    if (!t) continue;
    const cols = t.columns
      .map((c) => {
        /* utf8mb4 is the modern, unremarkable default — calling it out on
           every column would be noise. Anything else (mostly latin1, plus a
           handful of plain utf8/utf8_bin tables) is named explicitly, because
           it is exactly the fact that turns "Illegal mix of collations" from
           a mystery into something the planner can see coming. */
        const cs = c.charset && c.charset !== "utf8mb4" ? ` [charset:${c.charset}]` : "";
        return `  ${c.name} ${c.type}${c.key ? " [PK]" : ""}${c.nullable ? "" : " NOT NULL"}${cs}`;
      })
      .join("\n");
    blocks.push(`TABLE ${t.table} (\n${cols}\n)`);
  }
  return blocks.join("\n\n");
}

/**
 * Whether any two of the named tables mix character sets on their text
 * columns — the shape behind "Illegal mix of collations (latin1_swedish_ci,
 * IMPLICIT) and (utf8mb4_general_ci, IMPLICIT)", which MySQL raises only at
 * query time, long after a plausible-looking plan has already been written.
 *
 * Returns the distinct charsets found, so the caller can decide whether the
 * warning is worth the prompt space — one rule joining two latin1 tables has
 * nothing to warn about; one joining a latin1 table to a utf8mb4 table does.
 */
export function mixedCharsets(tables: string[], map?: Map<string, DumpTable>): string[] {
  const found = new Set<string>();
  for (const name of tables) {
    const t = columnsIn(map, name);
    if (!t) continue;
    for (const c of t.columns) if (c.charset) found.add(c.charset);
  }
  return [...found];
}
