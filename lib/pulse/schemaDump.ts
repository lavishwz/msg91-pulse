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

export type DumpColumn = { name: string; type: string; nullable: boolean; key: boolean };
export type DumpTable = { table: string; columns: DumpColumn[] };

let CACHE: Map<string, DumpTable> | null = null;

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
function parse(sql: string): Map<string, DumpTable> {
  const out = new Map<string, DumpTable>();
  const createRe = /^CREATE TABLE `([^`]+)` \(\n([\s\S]*?)\n\) ENGINE/gm;
  let m: RegExpExecArray | null;

  while ((m = createRe.exec(sql))) {
    const table = m[1];
    const body = m[2];
    const columns: DumpColumn[] = [];
    const primary = new Set<string>();

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
      const col = /^`([^`]+)`\s+([^\s,]+(?:\([^)]*\))?(?:\s+unsigned)?)/i.exec(t);
      if (!col) continue;
      columns.push({
        name: col[1],
        type: col[2],
        nullable: !/\bNOT NULL\b/i.test(t),
        key: false,
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
 * The named tables, rendered for a prompt.
 *
 * Same compact CREATE-like shape lib/pulse/schema.ts uses for its own detail,
 * so a planner prompt reads consistently whichever source answered.
 */
export function renderDumpDetail(tables: string[]): string {
  const blocks: string[] = [];
  for (const name of tables) {
    const t = dumpColumns(name);
    if (!t) continue;
    const cols = t.columns
      .map((c) => `  ${c.name} ${c.type}${c.key ? " [PK]" : ""}${c.nullable ? "" : " NOT NULL"}`)
      .join("\n");
    blocks.push(`TABLE ${t.table} (\n${cols}\n)`);
  }
  return blocks.join("\n\n");
}
