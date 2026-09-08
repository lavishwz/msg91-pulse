#!/usr/bin/env node
/**
 * Connectivity + schema report for the Pulse MySQL database.
 *
 *   npm run db:check              # connect, list tables with row counts
 *   npm run db:check -- --columns # also print every column
 *   npm run db:check -- <table>   # columns + 3 sample rows for one table
 *
 * Reads .env.local. Prints no credentials except the host and user, so the
 * output is safe to paste into a chat or an issue.
 */

import mysql from "mysql2/promise";
import { existsSync } from "node:fs";

const ENV_FILE = ".env.local";

if (!existsSync(ENV_FILE)) {
  console.error(`✗ ${ENV_FILE} not found. Copy .env.example to ${ENV_FILE} and fill it in.`);
  process.exit(1);
}
process.loadEnvFile(ENV_FILE);

const args = process.argv.slice(2);
const wantColumns = args.includes("--columns");
const table = args.find((a) => !a.startsWith("-"));

const PLACEHOLDER = /^<.*>$/;
const cfg = {
  host: process.env.MYSQL_HOST?.trim(),
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER?.trim(),
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE?.trim(),
};

const unset = Object.entries(cfg)
  .filter(([k, v]) => k !== "password" && (!v || PLACEHOLDER.test(String(v))))
  .map(([k]) => `MYSQL_${k.toUpperCase()}`);

if (unset.length) {
  console.error(`✗ Still unfilled in ${ENV_FILE}: ${unset.join(", ")}`);
  process.exit(1);
}
if (PLACEHOLDER.test(cfg.password)) cfg.password = "";

if ((process.env.MYSQL_SSL ?? "").toLowerCase() === "true") {
  cfg.ssl = { rejectUnauthorized: true };
}

console.log(`→ ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}${cfg.ssl ? " (TLS)" : ""}`);

let conn;
try {
  const started = Date.now();
  conn = await mysql.createConnection(cfg);
  const [[info]] = await conn.query("SELECT VERSION() AS v, DATABASE() AS db");
  console.log(`✓ connected in ${Date.now() - started}ms — MySQL ${info.v}, database "${info.db}"\n`);
} catch (err) {
  console.error(`✗ connection failed: ${err.code ?? ""} ${err.message}`);
  const hints = {
    ECONNREFUSED: "Nothing is listening on that host/port. Check MYSQL_HOST and MYSQL_PORT.",
    ETIMEDOUT: "Host unreachable — a firewall may need to allow this machine's IP.",
    ENOTFOUND: "Host name does not resolve. Check MYSQL_HOST for typos.",
    ER_ACCESS_DENIED_ERROR: "Wrong user or password, or the user is not allowed from this host.",
    ER_BAD_DB_ERROR: "That database does not exist on the server. Check MYSQL_DATABASE.",
    ER_NOT_SUPPORTED_AUTH_MODE: "Server wants an auth plugin the client rejected; try MYSQL_SSL=true.",
    HANDSHAKE_NO_SSL_SUPPORT: "Server has no TLS; set MYSQL_SSL=false.",
  };
  if (hints[err.code]) console.error(`  ${hints[err.code]}`);
  process.exit(1);
}

const [tables] = await conn.query(
  `SELECT table_name AS name, table_rows AS approx_rows, engine, table_comment AS comment
     FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
    ORDER BY table_name`,
);

if (!tables.length) {
  console.log("(the database has no tables)");
} else if (table) {
  const hit = tables.find((t) => t.name.toLowerCase() === table.toLowerCase());
  if (!hit) {
    console.error(`✗ no table named "${table}". Run without arguments to list them.`);
    await conn.end();
    process.exit(1);
  }
  await printColumns(hit.name);
  const [rows] = await conn.query(`SELECT * FROM \`${hit.name}\` LIMIT 3`);
  console.log(`\nSample rows (${rows.length}):`);
  console.dir(rows, { depth: 4, maxStringLength: 120 });
} else {
  console.log(`${tables.length} table${tables.length === 1 ? "" : "s"}:`);
  const width = Math.max(...tables.map((t) => t.name.length));
  for (const t of tables) {
    const rows = t.approx_rows == null ? "?" : `~${Number(t.approx_rows).toLocaleString()}`;
    console.log(
      `  ${t.name.padEnd(width)}  ${rows.padStart(12)} rows${t.comment ? `   ${t.comment}` : ""}`,
    );
  }
  if (wantColumns) for (const t of tables) await printColumns(t.name);
}

async function printColumns(name) {
  const [cols] = await conn.query(
    `SELECT column_name AS col, column_type AS type, is_nullable AS nullable,
            column_key AS keyType, column_default AS dflt, extra
       FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ?
      ORDER BY ordinal_position`,
    [name],
  );
  console.log(`\n${name}`);
  const w = Math.max(...cols.map((c) => c.col.length));
  for (const c of cols) {
    const flags = [
      c.keyType === "PRI" ? "PK" : c.keyType === "UNI" ? "UNIQUE" : c.keyType === "MUL" ? "INDEX" : "",
      c.nullable === "YES" ? "null" : "not null",
      c.extra || "",
    ]
      .filter(Boolean)
      .join(" · ");
    console.log(`  ${c.col.padEnd(w)}  ${c.type}  [${flags}]`);
  }
}

await conn.end();
