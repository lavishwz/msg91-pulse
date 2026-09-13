/**
 * schemaDump's charset tracking — what makes "Illegal mix of collations"
 * visible to the planner before it writes a query, instead of only after
 * MySQL rejects it. 427 of 509 real tables still default to latin1; a
 * handful sit on plain utf8; the rest are utf8mb4. A column list alone reads
 * the same regardless of which one a table carries, which is exactly why
 * partner-high-9 (verify_dlt + approved_senderid) failed at the dry run
 * with no warning beforehand.
 *
 *   node --experimental-strip-types tests/schema-dump-charset.test.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register(new URL("../scripts/event-check-loader.mjs", import.meta.url), pathToFileURL("./"));

import { strict as assert } from "node:assert";
const { parse, renderDumpDetail, mixedCharsets } = await import("../lib/pulse/schemaDump.ts");

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error("✗", name, "\n  ", e.message); }
};

// A small fixture standing in for the real 366KB dump — same mysqldump shape,
// three tables reproducing the real fault: verify_dlt (bare latin1),
// approved_senderid (latin1 table with one utf8-overridden column), and
// ms_user (utf8mb4, the modern default that should never be called out).
const FIXTURE = `
CREATE TABLE \`verify_dlt\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(45) NOT NULL,
  \`status\` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2961 DEFAULT CHARSET=latin1;

CREATE TABLE \`approved_senderid\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`senderid\` varchar(20) CHARACTER SET utf8 NOT NULL,
  \`route_pid\` int(11) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`senderid\` (\`senderid\`,\`route_pid\`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=latin1;

CREATE TABLE \`ms_user\` (
  \`user_pid\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_email\` varchar(190) NOT NULL,
  PRIMARY KEY (\`user_pid\`)
) ENGINE=InnoDB AUTO_INCREMENT=302655 DEFAULT CHARSET=utf8mb4;
`.trim();

const tables = parse(FIXTURE);

t("a bare table inherits its DEFAULT CHARSET on every text column", () => {
  const t1 = tables.get("verify_dlt");
  const userId = t1.columns.find((c) => c.name === "user_id");
  assert.equal(userId.charset, "latin1");
});

t("a non-text column never carries a charset, whatever the table default is", () => {
  const t1 = tables.get("verify_dlt");
  const id = t1.columns.find((c) => c.name === "id");
  const status = t1.columns.find((c) => c.name === "status");
  assert.equal(id.charset, "");
  assert.equal(status.charset, "");
});

t("a column's own CHARACTER SET overrides the table default", () => {
  const t2 = tables.get("approved_senderid");
  const senderid = t2.columns.find((c) => c.name === "senderid");
  const routePid = t2.columns.find((c) => c.name === "route_pid");
  assert.equal(senderid.charset, "utf8");
  assert.equal(routePid.charset, ""); // int — no charset regardless of override syntax nearby
});

t("renderDumpDetail calls out a non-utf8mb4 charset, but not utf8mb4 itself", () => {
  const out = renderDumpDetail(["verify_dlt", "ms_user"], tables);
  assert.ok(out.includes("user_id varchar(45) NOT NULL [charset:latin1]"), out);
  assert.ok(!out.includes("[charset:utf8mb4]"), out);
  assert.ok(!/user_pid.*\[charset/.test(out), "user_pid is an int and must carry no charset tag");
});

t("mixedCharsets is empty when every named table agrees", () => {
  assert.deepEqual(mixedCharsets(["verify_dlt"], tables), ["latin1"]);
});

t("mixedCharsets finds the real partner-high-9 clash: latin1 next to utf8", () => {
  const found = mixedCharsets(["verify_dlt", "approved_senderid"], tables).sort();
  assert.deepEqual(found, ["latin1", "utf8"]);
});

t("mixedCharsets across all three surfaces every distinct charset in play", () => {
  const found = mixedCharsets(["verify_dlt", "approved_senderid", "ms_user"], tables).sort();
  assert.deepEqual(found, ["latin1", "utf8", "utf8mb4"]);
});

t("an unknown table name is ignored rather than throwing", () => {
  assert.deepEqual(mixedCharsets(["not_a_real_table"]), []);
  assert.equal(renderDumpDetail(["not_a_real_table"]), "");
});

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
