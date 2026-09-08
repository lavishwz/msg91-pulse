import { guard, MAX_ROWS } from "../lib/pulse/sqlguard.ts";

const cases = [
  // [sql, shouldPass, label]
  ["SELECT 1", true, "trivial select"],
  ["select user_fname from ms_user limit 10", true, "lowercase select"],
  ["```sql\nSELECT 1 LIMIT 5\n```", true, "markdown fence stripped"],
  ["SELECT * FROM ms_user LIMIT 999", true, "limit lowered to cap"],
  ["SELECT * FROM ms_user LIMIT 10, 999", true, "offset form lowered"],
  ["SELECT * FROM ms_user LIMIT 20", true, "limit under cap kept"],
  ["SELECT name FROM t WHERE x = 'a;b' LIMIT 5", true, "semicolon inside string"],
  ["DROP TABLE ms_user", false, "drop"],
  ["DELETE FROM ms_user", false, "delete"],
  ["UPDATE ms_user SET user_bal = 0", false, "update"],
  ["SELECT 1; DROP TABLE ms_user", false, "stacked statements"],
  ["SELECT 1 -- ; DROP TABLE x\n; DROP TABLE y", false, "comment then stacked"],
  ["SELECT /* hi */ 1 ; TRUNCATE t", false, "block comment then stacked"],
  ["SELECT * FROM ms_user INTO OUTFILE '/tmp/x'", false, "into outfile"],
  ["SELECT LOAD_FILE('/etc/passwd')", false, "load_file"],
  ["SELECT SLEEP(30)", false, "sleep"],
  ["SELECT BENCHMARK(1000000, MD5('x'))", false, "benchmark"],
  ["SELECT @@version", false, "server variable"],
  ["SELECT * FROM mysql.user", false, "mysql db"],
  ["SELECT * FROM performance_schema.threads", false, "performance_schema"],
  ["SET SESSION x = 1", false, "set"],
  ["CALL some_proc()", false, "call"],
  ["", false, "empty"],
  ["SHOW TABLES", false, "show is not select"],
];

let pass = 0, fail = 0;
for (const [sql, expect, label] of cases) {
  const r = guard(sql);
  const got = r.ok;
  if (got === expect) { pass++; }
  else { fail++; console.log(`FAIL  ${label}\n      sql=${JSON.stringify(sql)}\n      expected ok=${expect} got ok=${got} ${r.ok ? "sql="+r.sql : "reason="+r.reason}`); }
}
// Check the cap is really applied
const capped = guard("SELECT * FROM ms_user LIMIT 5000");
if (!capped.ok || !capped.sql.endsWith(`LIMIT ${MAX_ROWS}`)) { fail++; console.log("FAIL  cap not applied:", capped); } else pass++;
const added = guard("SELECT 1");
if (!added.ok || !added.sql.endsWith(`LIMIT ${MAX_ROWS}`) || !added.addedLimit) { fail++; console.log("FAIL  limit not added:", added); } else pass++;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
