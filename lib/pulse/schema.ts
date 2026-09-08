import { query } from "@/lib/db";
import { cached } from "./cache";
import { ALLOWED_TABLES, ALLOWED_TABLE_NAMES } from "./schema-notes";

export { CORE_TABLES } from "./schema-notes";

/**
 * Schema introspection for text-to-SQL.
 *
 * The agent only ever sees the 112 tables allowlisted in schema-notes.ts —
 * never the other 397, which are backups, dumps and internal plumbing. That
 * file is the single source of truth for both membership and descriptions.
 *
 * Within the allowlist the schema is offered at two resolutions:
 *
 *   index()   — every allowed table: name, row estimate, MSG91's description.
 *   detail()  — full column list for a named handful of them.
 *
 * The agent picks tables from the index; only those get column detail. A table
 * outside the allowlist cannot be fetched even if the agent asks for it.
 */

const SCHEMA_TTL_MS = 30 * 60_000; // schema barely changes; 30 minutes is plenty

export type TableIndexEntry = { table: string; rows: number; note: string };

/**
 * Every allowed table, with its live row estimate and MSG91's description.
 *
 * Row counts come from the database so the agent knows which tables are big
 * enough to need care and which are empty in this environment. A table in the
 * allowlist that does not exist here is dropped rather than advertised.
 */
export async function index(): Promise<TableIndexEntry[]> {
  return cached("schema:index", SCHEMA_TTL_MS, async () => {
    const names = [...ALLOWED_TABLE_NAMES];
    const rows = await query<{ name: string; approx: number | null }>(
      `SELECT table_name AS name, table_rows AS approx
         FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_type = 'BASE TABLE'
          AND table_name IN (${names.map(() => "?").join(",")})
        ORDER BY table_name`,
      names,
    );
    return rows.map((r) => ({
      table: r.name,
      rows: Number(r.approx ?? 0),
      note: ALLOWED_TABLES[r.name] ?? "",
    }));
  });
}

export type ColumnInfo = {
  column: string;
  type: string;
  nullable: boolean;
  key: string;
};

export type TableDetail = { table: string; note: string; columns: ColumnInfo[] };

/**
 * Column detail for specific tables.
 *
 * Names are checked against the allowlist before they reach a query. That is
 * both a scope rule and a safety one: a table name cannot be a bind parameter,
 * so it must never be text the agent chose freely.
 */
export async function detail(tables: string[], max = 12): Promise<TableDetail[]> {
  const known = new Set((await index()).map((t) => t.table));
  const wanted = [...new Set(tables)]
    .filter((t) => ALLOWED_TABLE_NAMES.has(t) && known.has(t))
    .slice(0, max);
  if (!wanted.length) return [];

  const rows = await query<{
    table_name: string;
    column_name: string;
    column_type: string;
    is_nullable: string;
    column_key: string;
  }>(
    `SELECT table_name, column_name, column_type, is_nullable, column_key
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name IN (${wanted.map(() => "?").join(",")})
      ORDER BY table_name, ordinal_position`,
    wanted,
  );

  const byTable = new Map<string, ColumnInfo[]>();
  for (const r of rows) {
    const list = byTable.get(r.table_name) ?? [];
    list.push({
      column: r.column_name,
      type: r.column_type,
      nullable: r.is_nullable === "YES",
      key: r.column_key,
    });
    byTable.set(r.table_name, list);
  }

  return wanted.map((t) => ({
    table: t,
    note: ALLOWED_TABLES[t] ?? "",
    columns: byTable.get(t) ?? [],
  }));
}

/** Render the index as compact lines for the prompt. */
export function renderIndex(entries: TableIndexEntry[]): string {
  return entries
    .map((e) => {
      const rows = e.rows ? `~${e.rows.toLocaleString("en-US")} rows` : "empty";
      return `${e.table} (${rows})${e.note ? ` — ${e.note}` : ""}`;
    })
    .join("\n");
}

/** Render column detail as compact CREATE-like blocks for the prompt. */
export function renderDetail(details: TableDetail[]): string {
  return details
    .map((d) => {
      const head = d.note ? `-- ${d.note}\n` : "";
      const cols = d.columns
        .map((c) => {
          const flags = [
            c.key === "PRI" ? "PK" : c.key === "UNI" ? "UNIQUE" : c.key === "MUL" ? "INDEX" : "",
            c.nullable ? "" : "NOT NULL",
          ]
            .filter(Boolean)
            .join(" ");
          return `  ${c.column} ${c.type}${flags ? ` [${flags}]` : ""}`;
        })
        .join("\n");
      return `${head}TABLE ${d.table} (\n${cols}\n)`;
    })
    .join("\n\n");
}
