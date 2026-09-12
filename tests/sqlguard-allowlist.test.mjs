/**
 * Attack surface: the TABLE ALLOWLIST half of lib/pulse/sqlguard.ts.
 *
 * tests/sqlguard.test.mjs covers the statement-shape rules — one SELECT, no
 * stacked statements, no file functions, the row cap. It touches the allowlist
 * only in passing. This file exists because the allowlist is now the part that
 * actually matters: the connection Pulse uses is `root` with GRANT ALL
 * PRIVILEGES ON *.*, so MySQL will happily read any of the 509 tables in the
 * schema. `disallowedTable()` deciding that a name is fine is the whole of the
 * boundary, not a second line behind a read-only grant. A miss here is a hole,
 * not a missed nicety.
 *
 * So the cases below are written as attacks rather than as examples. Each one
 * says which reader of disallowedTable() it is aimed at — the literal blanking,
 * the CTE collector, the FROM/JOIN regex, the db-qualifier split — because a
 * case whose purpose is not written down gets deleted the first time someone
 * changes that regex and cannot tell what it was protecting.
 *
 * Loader note, same as tests/sqlguard.test.mjs: sqlguard imports "./schema-notes"
 * with no file extension. Webpack resolves that, bare Node does not, so the
 * loader the scripts already use is registered before the dynamic import.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register(new URL("../scripts/event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

const { guard } = await import("../lib/pulse/sqlguard.ts");
const { ALLOWED_TABLE_NAMES } = await import("../lib/pulse/schema-notes.ts");

/* Stand-ins for the 397 tables that exist in the database and are not on the
   list. clientManagement, ms_user_balance and signup_tracking are real ones —
   schema-notes.ts names them as deliberately absent — so a regression that
   waves them through is not hypothetical. */
const cases = [
  // ── 1. an unknown table, from FROM and from every JOIN flavour ──────────
  /* The base case. If this ever passes, nothing below matters. */
  ["SELECT * FROM secret_table", false, "unknown table in FROM"],
  ["SELECT * FROM clientManagement", false, "real non-allowlisted table (clientManagement)"],
  ["SELECT * FROM ms_user_balance", false, "real non-allowlisted table (ms_user_balance)"],
  ["SELECT * FROM signup_tracking", false, "real non-allowlisted table (signup_tracking)"],
  /* Every join spelling the regex claims to cover, one case each, because the
     alternation is one edit away from losing a branch and the loss would be
     silent — the guard would simply stop looking at the joined table. */
  ["SELECT * FROM ms_user JOIN secret_table ON 1=1", false, "bare JOIN"],
  ["SELECT * FROM ms_user INNER JOIN secret_table ON 1=1", false, "INNER JOIN"],
  ["SELECT * FROM ms_user LEFT JOIN secret_table ON 1=1", false, "LEFT JOIN"],
  ["SELECT * FROM ms_user RIGHT JOIN secret_table ON 1=1", false, "RIGHT JOIN"],
  ["SELECT * FROM ms_user FULL JOIN secret_table ON 1=1", false, "FULL JOIN"],
  ["SELECT * FROM ms_user CROSS JOIN secret_table", false, "CROSS JOIN"],
  ["SELECT * FROM ms_user LEFT OUTER JOIN secret_table ON 1=1", false, "LEFT OUTER JOIN"],
  ["SELECT * FROM ms_user RIGHT OUTER JOIN secret_table ON 1=1", false, "RIGHT OUTER JOIN"],
  ["SELECT * FROM ms_user FULL OUTER JOIN secret_table ON 1=1", false, "FULL OUTER JOIN"],
  ["SELECT * FROM ms_user NATURAL JOIN secret_table", false, "NATURAL JOIN"],
  /* The stranger in the first position rather than the second: a query is not
     safe just because it joins something allowed onto something that is not. */
  ["SELECT * FROM secret_table JOIN ms_user ON 1=1", false, "stranger first, allowed second"],
  /* Third table along — the regex is global, so it must keep matching past the
     first two and not stop at the first name it recognises. */
  ["SELECT * FROM ms_user JOIN ms_trans ON 1=1 JOIN secret_table ON 1=1", false, "stranger in the third position"],

  // ── 2. an allowed table passes ──────────────────────────────────────────
  /* The guard has to be usable, not merely safe. A rule that refuses the 112
     tables Pulse is built on is an outage, and an outage gets the guard
     loosened by whoever is on call. */
  ["SELECT user_fname FROM ms_user", true, "allowlisted table passes"],
  ["SELECT * FROM ms_trans", true, "second allowlisted table passes"],
  ["SELECT * FROM ms_user JOIN ms_trans ON 1=1", true, "two allowlisted tables joined"],
  ["SELECT * FROM ms_user u LEFT JOIN user_handled_by h ON 1=1", true, "aliased allowlisted join"],
  ["SELECT 1", true, "no table at all"],

  // ── 3. database qualifiers ──────────────────────────────────────────────
  /* Documented behaviour: the db half is dropped and the table half checked,
     on the grounds that the dangerous databases are refused outright by
     FORBIDDEN_PATTERNS. Both halves of that bargain are tested — the allowed
     table still passes when qualified, and the qualifier does not launder a
     stranger. */
  ["SELECT * FROM clonemsg.ms_user", true, "db-qualified allowed table"],
  ["SELECT * FROM clonemsg.secret_table", false, "db-qualified stranger"],
  ["SELECT * FROM clonemsg . ms_user", true, "spaces around the qualifier dot"],
  ["SELECT * FROM clonemsg . secret_table", false, "spaced qualifier does not launder a stranger"],
  /* The reverse shape: an allowlisted name used as the *database* half must not
     make the table half acceptable. `ms_user.secret_table` reads secret_table. */
  ["SELECT * FROM ms_user.secret_table", false, "allowed name as the db half does not excuse the table half"],

  // ── 4. CTEs ─────────────────────────────────────────────────────────────
  /* A CTE name is not a table, and reporting it as an unknown one would refuse
     every correct query that uses WITH. */
  ["WITH x AS (SELECT user_fname FROM ms_user) SELECT * FROM x", true, "CTE name is not an unknown table"],
  /* …and the exemption stops at the name. The body is real SQL reading a real
     table, so wrapping a stranger in a CTE must not hide it. This is the whole
     reason CTE names are collected before the FROM scan rather than instead of
     it. */
  ["WITH x AS (SELECT * FROM secret_table) SELECT * FROM x", false, "stranger inside a CTE body"],
  /* Naming the CTE after the stranger is the obvious next try: if the collector
     ran after the scan, or if it swallowed the body, this would pass. */
  ["WITH secret_table AS (SELECT 1) SELECT * FROM secret_table", true, "CTE may be named anything — it shadows nothing real"],
  ["WITH secret_table AS (SELECT * FROM other_secret) SELECT * FROM secret_table", false, "CTE named after the target still cannot hide its body"],

  // ── 5. several CTEs, nested CTEs, WITH RECURSIVE ────────────────────────
  /* The collector keys off `WITH` *or* a comma, so the second and later
     bindings in a chain need their own cases — they match by a different
     branch of the same regex. */
  ["WITH a AS (SELECT 1), b AS (SELECT * FROM a) SELECT * FROM b", true, "two CTEs, the second reading the first"],
  ["WITH a AS (SELECT 1), b AS (SELECT * FROM secret_table) SELECT * FROM b", false, "stranger in the second CTE"],
  ["WITH a AS (SELECT 1), b AS (SELECT 2), c AS (SELECT * FROM b) SELECT * FROM c", true, "three CTEs chained"],
  ["WITH a AS (SELECT 1), b AS (SELECT 2), c AS (SELECT * FROM secret_table) SELECT * FROM c", false, "stranger in the third CTE"],
  /* Nested: a WITH inside a CTE body. The inner binding is reached by the
     `\bwith\b` branch again, mid-statement rather than at the start. */
  ["WITH outer_q AS (WITH inner_q AS (SELECT * FROM ms_user) SELECT * FROM inner_q) SELECT * FROM outer_q", true, "nested WITH"],
  ["WITH outer_q AS (WITH inner_q AS (SELECT * FROM secret_table) SELECT * FROM inner_q) SELECT * FROM outer_q", false, "stranger inside a nested WITH"],
  /* RECURSIVE goes through the same shape with an extra keyword in the middle;
     a self-reference is the CTE name, not a table. */
  ["WITH RECURSIVE t AS (SELECT 1 AS n UNION ALL SELECT n+1 FROM t WHERE n<5) SELECT * FROM t", true, "WITH RECURSIVE self-reference"],
  ["WITH RECURSIVE t AS (SELECT * FROM secret_table) SELECT * FROM t", false, "stranger inside a RECURSIVE CTE"],

  // ── 6. subqueries ───────────────────────────────────────────────────────
  /* `FROM (` names no table at that position; the tables inside are caught by
     their own FROM. Both directions of that claim are worth holding down. */
  ["SELECT * FROM (SELECT user_fname FROM ms_user) t", true, "derived table over an allowed table"],
  ["SELECT * FROM (SELECT * FROM secret_table) t", false, "derived table over a stranger"],
  ["SELECT * FROM ms_user WHERE id IN (SELECT id FROM secret_table)", false, "stranger in an IN subquery"],
  ["SELECT (SELECT c FROM secret_table) FROM ms_user", false, "stranger in a scalar subquery in the select list"],
  ["SELECT * FROM ms_user WHERE EXISTS (SELECT 1 FROM secret_table)", false, "stranger in an EXISTS subquery"],
  ["SELECT * FROM (SELECT * FROM (SELECT * FROM secret_table) a) b", false, "stranger two subqueries deep"],
  /* UNION is a second SELECT in one statement, not a second statement — the
     table list of each arm has to be read. */
  ["SELECT * FROM ms_user UNION SELECT * FROM secret_table", false, "stranger in the second arm of a UNION"],
  ["SELECT * FROM ms_user UNION ALL SELECT * FROM ms_trans", true, "UNION of two allowed tables"],

  // ── 7. a table name that is only a string ───────────────────────────────
  /* Literals are blanked before the scan precisely so prose in a WHERE clause
     is not read as schema. Without this, any query filtering on user-supplied
     text that happens to contain the word "from" would be refused. */
  ["SELECT * FROM ms_user WHERE note = 'from secret_table'", true, "table name only inside a string literal"],
  ["SELECT * FROM ms_user WHERE note = 'join secret_table'", true, "join keyword only inside a string literal"],
  ['SELECT * FROM ms_user WHERE note = "from secret_table"', true, "double-quoted string literal blanked too"],
  ["SELECT * FROM ms_user WHERE note = 'it''s from secret_table'", true, "doubled-quote escape inside the literal"],
  ["SELECT * FROM ms_user WHERE note = 'a\\' from secret_table'", true, "backslash-escaped quote inside the literal"],
  /* The converse: blanking must not run so far that it eats a real FROM. If the
     literal regex mis-tracked the closing quote, the table after it would
     disappear from the scan and the stranger would pass. */
  ["SELECT * FROM ms_user WHERE a = 'x' AND b IN (SELECT c FROM secret_table)", false, "a literal earlier in the query does not blank a later stranger"],
  ["SELECT 'from ms_user' AS lbl FROM secret_table", false, "decoy literal before the real FROM"],
  /* FORBIDDEN_PATTERNS run against the statement *before* literals are blanked,
     so a string that merely mentions mysql.something is refused. That is an
     over-refusal rather than a hole, and the docstring says erring toward
     refusal is the intended bias — pinned here so the behaviour is a decision
     and not a surprise. */
  ["SELECT * FROM ms_user WHERE note = 'see mysql.user'", false, "string mentioning mysql.x is over-refused (patterns run before blanking)"],

  // ── 8. comments ─────────────────────────────────────────────────────────
  /* A comment is not SQL. Guard strips comments before anything else and runs
     the stripped text, so what is in a comment is neither checked nor executed. */
  ["SELECT * FROM ms_user /* from secret_table */", true, "block comment naming a stranger is not a table read"],
  ["SELECT * FROM ms_user -- from secret_table", true, "line comment naming a stranger is not a table read"],
  ["SELECT * FROM ms_user # from secret_table", true, "hash comment naming a stranger is not a table read"],
  ["SELECT * FROM ms_user /* ; DROP TABLE ms_user */", true, "a statement inside a comment is stripped, not executed"],
  /* …and the reverse, which is the dangerous direction: a comment must not be
     able to sit between FROM and the real table name and split it out of the
     regex's reach. Comments collapse to a space, so the name is still there. */
  ["SELECT * FROM /* x */ secret_table", false, "block comment between FROM and the stranger"],
  ["SELECT * FROM -- x\n secret_table", false, "line comment between FROM and the stranger"],
  ["SELECT * FROM # x\n secret_table", false, "hash comment between FROM and the stranger"],
  ["SELECT * FROM ms_user JOIN /* x */ secret_table ON 1=1", false, "comment between JOIN and the stranger"],
  /* MySQL executes the body of a /*! ... *\/ version comment. Guard removes it
     entirely, so the body is removed from what runs as well — the smuggled
     table never reaches the server. */
  ["SELECT * FROM ms_user /*!50000 , secret_table */", true, "version comment is stripped from the executed SQL too"],

  // ── 9. backticked identifiers ───────────────────────────────────────────
  /* Backticks are dropped before the scan so `ms_user` and ms_user are one
     name. Both halves need holding: the quoting must not break a legal query,
     and must not launder an illegal one. */
  ["SELECT * FROM `ms_user`", true, "backticked allowed table"],
  ["SELECT * FROM `secret_table`", false, "backticked stranger"],
  ["SELECT * FROM `clonemsg`.`ms_user`", true, "backticked db-qualified allowed table"],
  ["SELECT * FROM `clonemsg`.`secret_table`", false, "backticked db-qualified stranger"],
  ["SELECT * FROM ms_user JOIN `secret_table` ON 1=1", false, "backticked stranger in a JOIN"],

  // ── 10. case and whitespace ─────────────────────────────────────────────
  /* Table names are compared lowercased, and the keyword regexes are /i. A
     query typed by a model in any casing must land on the same verdict. */
  ["SELECT * FROM MS_USER", true, "upper-case allowed table"],
  ["SELECT * FROM Ms_User", true, "mixed-case allowed table"],
  ["select * from ms_user", true, "lower-case everything"],
  ["SELECT * FROM SECRET_TABLE", false, "upper-case stranger"],
  ["SELECT * FROM Secret_Table", false, "mixed-case stranger"],
  ["SELECT * FROM\n\n  ms_user", true, "newlines between FROM and the table"],
  ["SELECT * FROM\n\n  secret_table", false, "newlines do not hide a stranger"],
  ["SELECT * FROM\tms_user", true, "tab between FROM and the table"],
  ["SELECT * FROM ms_user\n  LEFT  JOIN\n  ms_trans ON 1=1", true, "wrapped join with doubled spaces"],
  ["SELECT * FROM ms_user\n  LEFT  JOIN\n  secret_table ON 1=1", false, "wrapped join does not hide a stranger"],

  // ── 11. the system databases ────────────────────────────────────────────
  /* These are the tables worth stealing from a root connection: credential
     hashes, grants, and the statement history of every other session. They are
     covered twice over — by FORBIDDEN_PATTERNS and, where the pattern misses,
     by the plain table name not being on the list. Both layers are exercised
     here rather than assumed. */
  ["SELECT * FROM mysql.user", false, "mysql.user"],
  ["SELECT * FROM mysql . user", false, "mysql.user with spaces around the dot"],
  ["SELECT * FROM mysql.db", false, "mysql.db"],
  ["SELECT * FROM `mysql`.`user`", false, "backticked mysql.user (pattern misses, table name catches)"],
  ["SELECT * FROM performance_schema.threads", false, "performance_schema.threads"],
  ["SELECT * FROM performance_schema . events_statements_history", false, "performance_schema with spaces around the dot"],
  ["SELECT * FROM `performance_schema`.`threads`", false, "backticked performance_schema"],
  ["SELECT * FROM information_schema.user_privileges", false, "information_schema.user_privileges"],
  ["SELECT * FROM information_schema.schema_privileges", false, "information_schema.schema_privileges"],
  ["SELECT * FROM information_schema . user_privileges", false, "spaced information_schema privilege table (pattern misses, table name catches)"],
  /* The rest of information_schema is not in FORBIDDEN_PATTERNS at all, so the
     allowlist is the only thing refusing it — and it must, because
     information_schema.tables is how an attacker enumerates the other 397. */
  ["SELECT * FROM information_schema.tables", false, "information_schema.tables — allowlist is the only layer here"],
  ["SELECT * FROM information_schema.columns", false, "information_schema.columns"],
  ["SELECT * FROM sys.session", false, "sys schema"],

  // ── 12. statement shape, at the allowlist's edge ────────────────────────
  /* Covered in tests/sqlguard.test.mjs; repeated here in the shapes that carry
     an allowlisted table, because "it names ms_user" must never be enough on
     its own to get a statement through. */
  ["DELETE FROM ms_user", false, "DELETE naming an allowed table"],
  ["UPDATE ms_user SET user_bal = 0", false, "UPDATE naming an allowed table"],
  ["INSERT INTO ms_user (id) VALUES (1)", false, "INSERT naming an allowed table"],
  ["DROP TABLE ms_user", false, "DROP naming an allowed table"],
  ["TRUNCATE ms_user", false, "TRUNCATE naming an allowed table"],
  ["SELECT * FROM ms_user; SELECT * FROM ms_trans", false, "two statements, both allowlisted"],
  ["SELECT * FROM ms_user; SELECT * FROM secret_table", false, "stacked statement carrying the stranger"],
  ["SELECT * FROM ms_user INTO OUTFILE '/tmp/x'", false, "INTO OUTFILE from an allowed table"],
  ["SELECT * FROM ms_user INTO DUMPFILE '/tmp/x'", false, "INTO DUMPFILE from an allowed table"],
  ["SELECT LOAD_FILE('/etc/passwd') FROM ms_user", false, "LOAD_FILE alongside an allowed table"],
  ["SELECT @@datadir FROM ms_user", false, "server variable alongside an allowed table"],
  ["SELECT *, SLEEP(30) FROM ms_user", false, "SLEEP alongside an allowed table"],
  ["SHOW TABLES", false, "SHOW is not a SELECT"],
  ["DESCRIBE ms_user", false, "DESCRIBE is not a SELECT"],
];

let pass = 0;
let fail = 0;

for (const [sql, expect, label] of cases) {
  const r = guard(sql);
  if (r.ok === expect) {
    pass++;
  } else {
    fail++;
    console.log(
      `FAIL  ${label}\n      sql=${JSON.stringify(sql)}\n` +
        `      expected ok=${expect} got ok=${r.ok} ${r.ok ? "sql=" + r.sql : "reason=" + r.reason}`,
    );
  }
}

/* ── the refusal has to name the right table ────────────────────────────────
   A refusal that blames the CTE name, or the alias, or the database, reads to
   whoever wrote the rule as "the guard is broken" rather than "this table is
   off limits", and the usual response to the first reading is to widen the
   allowlist until the message goes away. */
const blames = [
  ["WITH x AS (SELECT * FROM secret_table) SELECT * FROM x", "secret_table", "CTE body, not the CTE name"],
  ["SELECT * FROM clonemsg.secret_table", "secret_table", "table half, not the database"],
  ["SELECT * FROM ms_user JOIN secret_table s ON 1=1", "secret_table", "table, not the alias"],
  ["SELECT * FROM (SELECT * FROM secret_table) t", "secret_table", "subquery's table, not the derived alias"],
];
for (const [sql, expected, why] of blames) {
  const r = guard(sql);
  if (r.ok || !r.reason.includes(`"${expected}"`)) {
    fail++;
    console.log(`FAIL  refusal should blame the ${why}\n      sql=${JSON.stringify(sql)}\n      got ${r.ok ? "ok" : r.reason}`);
  } else {
    pass++;
  }
}

/* ── every allowlisted table must actually be queryable ─────────────────────
   Swept rather than sampled. The allowlist is the agent's whole world; a name
   on it that the guard refuses is a question Pulse cannot answer at all, and
   nothing else in the suite would notice.

   Six of the 112 keys are written with capitals (ms_Onlinetransaction,
   cashfreeWebhookLogs, ms_dialplanPrefix, WhiteListIp, IpLogsSecrty,
   loginLogNew). disallowedTable lowercases the name it extracts and then tests
   it against a Set built from those keys verbatim, so those six can never
   match and are refused as strangers — on Linux MySQL, where table names are
   case-sensitive, those capitals are the real table names. It is a defect and
   it is reported below, but it is a *closed* door rather than an open one, so
   it does not fail the run. What does fail the run is a lower-case allowlisted
   name being refused, because that would mean the matching itself had broken. */
const refusedButAllowed = [];
for (const name of ALLOWED_TABLE_NAMES) {
  const r = guard(`SELECT * FROM ${name} LIMIT 1`);
  if (!r.ok) refusedButAllowed.push(name);
}
const unexplained = refusedButAllowed.filter((n) => n === n.toLowerCase());
if (unexplained.length) {
  fail++;
  console.log(`FAIL  allowlisted tables refused for no reason the guard documents: ${unexplained.join(", ")}`);
} else {
  pass++;
}

/* ── holes that are open right now ──────────────────────────────────────────
   Found by attacking disallowedTable() rather than by reading it. Each one
   reads a table that is not on the allowlist and gets ok:true out of guard().
   They are recorded here, not fixed — sqlguard.ts is deliberately untouched by
   this file — and they are reported rather than failed so the suite stays
   honest about the difference between "this is checked" and "we know about
   this". If one starts being refused, the line flips to FIXED and the case
   should move up into `cases` with expect=false.

   The first is the one that matters: the FROM/JOIN regex reads exactly one
   name per FROM, so in a comma-separated table list only the first table is
   ever checked. Comma joins are ordinary SQL that any model writes unprompted,
   which means this is reachable by accident as well as on purpose. */
const holes = [
  [
    "SELECT * FROM ms_user, secret_table",
    "comma table list — only the first table after FROM is read",
  ],
  [
    "SELECT * FROM ms_user, clientManagement",
    "comma list reaching a real non-allowlisted table",
  ],
  [
    "SELECT * FROM ms_user a, ms_user_balance b WHERE a.id = b.id",
    "comma list with aliases — the ordinary way this gets written",
  ],
  [
    "SELECT * FROM ms_user, ms_trans, signup_tracking",
    "comma list where only the last of three is a stranger",
  ],
  [
    "SELECT * FROM ms_user, `mysql`.`user`",
    "comma list plus backticks reaches mysql.user — FORBIDDEN_PATTERNS wants mysql, optional-space, dot, and a backtick is neither a space nor part of \\w",
  ],
  [
    "SELECT * FROM ms_user, `performance_schema`.`threads`",
    "same trick against performance_schema",
  ],
  [
    "SELECT * FROM ms_user, information_schema . user_privileges",
    "comma list plus a spaced dot reaches the privilege tables — that pattern has no \\s* around its dot",
  ],
  [
    "SELECT * FROM ms_user, information_schema.tables",
    "comma list reaching information_schema.tables, which is how the other 397 get enumerated",
  ],
  [
    "SELECT * FROM ms_user STRAIGHT_JOIN secret_table",
    "STRAIGHT_JOIN — \\bjoin cannot match inside STRAIGHT_JOIN because the underscore before it is a word character",
  ],
  [
    "SELECT * FROM (secret_table)",
    "parenthesised table reference — FROM ( looks like a derived table to the regex, so no name is read at that position",
  ],
  [
    "SELECT * FROM ms_user JOIN (secret_table) s ON 1=1",
    "same parenthesis trick on the JOIN side",
  ],
  [
    "SELECT * FROM `123secret`",
    "identifier starting with a digit — the capture group insists on [a-z_] first, so the name is not read at all",
  ],
];

const open = [];
const closed = [];
for (const [sql, why] of holes) {
  if (guard(sql).ok) open.push([sql, why]);
  else closed.push([sql, why]);
}

console.log(`\n${pass} passed, ${fail} failed`);

if (open.length) {
  console.log(`\n${open.length} KNOWN BYPASS${open.length === 1 ? "" : "ES"} — these read a non-allowlisted table and guard() returns ok:`);
  for (const [sql, why] of open) console.log(`  · ${sql}\n      ${why}`);
}
if (closed.length) {
  console.log(`\n${closed.length} previously-known bypass${closed.length === 1 ? "" : "es"} now FIXED — move into \`cases\` with expect=false:`);
  for (const [sql] of closed) console.log(`  · ${sql}`);
}
if (refusedButAllowed.length) {
  console.log(
    `\n${refusedButAllowed.length} allowlisted table${refusedButAllowed.length === 1 ? " is" : "s are"} refused by the guard ` +
      `(names compared lowercased against a case-sensitive Set): ${refusedButAllowed.join(", ")}`,
  );
}

process.exit(fail ? 1 : 0);
