#!/usr/bin/env node
/**
 * Dummy data for the local Pulse database.
 *
 * The production host is IP-bound, so local development runs against a MariaDB
 * loaded from Dump20260903.sql (schema only) plus this generator.
 *
 * The data is invented but the *shapes* are not. Every rule Pulse and the GTWY
 * agent rely on is reproduced faithfully, because a local database that
 * disagrees with production is worse than no local database — it teaches wrong
 * lessons:
 *
 *   · ms_user.user_type      1 = staff, 2 = reseller, 3 = customer
 *   · user_pid = 2           MSG91's own root reseller; a parent of 2 means a
 *                            direct customer, any other reseller parent means
 *                            partner-sourced
 *   · ms_user.user_fname     the company name (user_lname usually empty)
 *   · user_handled_by        the only place ownership lives; a missing row
 *                            means the account has no owner
 *   · ms_trans               type 1 credit / 2 debit, payment_mode 2 = gateway
 *                            (real customer cash) / 1 = admin or reseller move
 *   · ms_signup_history      present when the customer signed themselves up
 *
 * It also plants the situations each scanner looks for, so the UI has something
 * to show: unowned recent signups, accounts that never sent anything, stalled
 * verifications, wallets that ran dry after paying, a paying account with no
 * owner, and a second person signing up on a domain MSG91 already has.
 *
 *   npm run db:local:seed
 *   npm run db:local:seed -- --customers 300
 */

import mysql from "mysql2/promise";
import { existsSync } from "node:fs";

const ENV_FILE = ".env.local";
if (!existsSync(ENV_FILE)) {
  console.error(`✗ ${ENV_FILE} not found.`);
  process.exit(1);
}
process.loadEnvFile(ENV_FILE);

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]) || fallback;
};

const CUSTOMERS = arg("customers", 600);
const TRANSACTIONS = arg("transactions", 9000);

/* ── deterministic randomness ─────────────────────────────────────────────
   A fixed seed means two people running this get the same database, so a bug
   someone reports is a bug you can reproduce. */
let seedState = 0x2f6e2b1;
const rnd = () => {
  seedState ^= seedState << 13;
  seedState ^= seedState >>> 17;
  seedState ^= seedState << 5;
  seedState >>>= 0;
  return seedState / 0x100000000;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p) => rnd() < p;

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (d) => new Date(now - d * DAY);
const sql = (d) => d.toISOString().slice(0, 19).replace("T", " ");

/* ── name material ───────────────────────────────────────────────────────── */
const FIRST = ["Trellis", "Kanchan", "Falcon", "Bluebird", "Zippy", "Marigold", "Nova", "Orbit",
  "Aster", "Vega", "Saffron", "Meridian", "Kite", "Cobalt", "Dune", "Peartree", "Lantern",
  "Rapid", "Indigo", "Copperleaf", "Northwind", "Sable", "Juniper", "Quartz", "Beacon",
  "Harbour", "Cinder", "Verdant", "Halcyon", "Tamarind"];
const SECOND = ["Retail", "Pharma", "Pay", "Fintech", "Logistics", "Travel", "Foods", "Learning",
  "Labs", "Mobility", "Bank", "Health", "Insurance", "Energy", "Grocers", "Legal", "Kirana",
  "Systems", "Digital", "Networks", "Analytics", "Studios", "Ventures", "Motors", "Textiles"];
const SUFFIX = ["", " Pvt Ltd", " LLP", " Technologies", " India", " Group", ""];
const PEOPLE = ["Rhea Menon", "Sana Qureshi", "Arjun Nair", "Priya Sundaram", "Neha Kulkarni",
  "Farhan Ali", "Ritu Shah", "Vikas Menon", "Devika Rao", "Imran Shaikh", "Kavita Rao",
  "Rashid Al Mansoori", "Marcus Webb", "Wei Lin Tan", "Aditi Sharma", "Rohit Bhatt",
  "Meera Joshi", "Siti Rahman", "Elena Cruz", "Naina Shetty", "Dheeraj Tiwari", "Monika Kanathe"];
const INDUSTRY = ["Retail", "Pharmaceuticals", "Financial Services", "Logistics", "Travel",
  "Food & Beverage", "Education", "Healthcare", "Insurance", "Energy", "Legal", "Agriculture"];
const CITY = ["Indore", "Mumbai", "Bengaluru", "Delhi", "Pune", "Dubai", "Singapore", "London",
  "New York", "Chennai"];
const CURRENCIES = [
  ["INR", "India", 0.62], ["AED", "United Arab Emirates", 0.12], ["USD", "United States", 0.11],
  ["SGD", "Singapore", 0.06], ["GBP", "United Kingdom", 0.05], ["", "", 0.04],
];
const GATEWAYS = ["razorpay", "cashfree", "stripe", "paypal", "apple"];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
const weighted = (rows) => {
  let r = rnd();
  for (const row of rows) { r -= row[2]; if (r <= 0) return row; }
  return rows[0];
};

/* ── plan the accounts ───────────────────────────────────────────────────── */
const RESELLER_ROOT = 2;
const admins = [];   // user_type 1 — MSG91 staff
const resellers = [];// user_type 2
const customers = [];// user_type 3

let pid = 1;
const takePid = () => {
  pid += 1;
  if (pid === RESELLER_ROOT) pid += 1; // reserved for the root row below
  return pid;
};

// MSG91's own root account, exactly as production has it.
resellers.push({
  pid: RESELLER_ROOT, name: "msg91", uname: "msg91", email: "support@msg91.com", type: 2,
  date: daysAgo(5600), parent: 1, bal: 0, status: 1,
});

for (let i = 0; i < 22; i++) {
  const name = PEOPLE[i % PEOPLE.length];
  admins.push({
    pid: takePid(), name, uname: slug(name), email: `${slug(name)}@msg91.com`, type: 1,
    date: daysAgo(int(400, 3000)), parent: RESELLER_ROOT, bal: 0, status: 1,
  });
}

for (let i = 0; i < 7; i++) {
  const name = `${pick(FIRST)} Partners`;
  resellers.push({
    pid: takePid(), name, uname: slug(name), email: `ops@${slug(name)}.com`, type: 2,
    date: daysAgo(int(600, 2500)), parent: RESELLER_ROOT, bal: 0, status: 1,
  });
}
const otherResellers = resellers.filter((r) => r.pid !== RESELLER_ROOT);

const usedNames = new Set();
const usedDomains = new Map(); // domain → first customer, so a repeat is a real repeat

function companyName() {
  for (let i = 0; i < 60; i++) {
    const n = `${pick(FIRST)} ${pick(SECOND)}${pick(SUFFIX)}`.trim();
    if (!usedNames.has(n)) { usedNames.add(n); return n; }
  }
  return `${pick(FIRST)} ${pick(SECOND)} ${int(10, 999)}`;
}

for (let i = 0; i < CUSTOMERS; i++) {
  const name = companyName();
  const domain = `${slug(name)}.${pick(["com", "in", "co", "io", "net"])}`;
  const ageDays = int(1, 1400);
  const isPartner = chance(0.19);
  const c = {
    pid: takePid(),
    name,
    uname: slug(name) + int(1, 99),
    email: `${pick(["hello", "ops", "team", "billing", "admin"])}@${domain}`,
    domain,
    type: 3,
    date: daysAgo(ageDays),
    ageDays,
    parent: isPartner ? pick(otherResellers).pid : RESELLER_ROOT,
    bal: 0,
    status: 1,
    owner: null,
    startup: false,
    selfSignup: true,
    paid: false,
  };
  customers.push(c);
  if (!usedDomains.has(domain)) usedDomains.set(domain, c);
}

/* ── plant the situations each scanner looks for ──────────────────────────── */
const cohort = { unownedSignup: [], noFirstValue: [], unverified: [], walletDry: [], unownedPaying: [], newPerson: [] };

// 1. Recent signups with no owner — the ten-minute clock card.
for (const c of customers.filter((x) => x.ageDays <= 12).slice(0, 6)) {
  c.owner = null; c.locked = true; cohort.unownedSignup.push(c);
}
// 2. Signed up a while back, wallet empty, never transacted.
for (const c of customers.filter((x) => x.ageDays >= 5 && x.ageDays <= 40 && !x.locked).slice(0, 14)) {
  c.bal = 0; c.neverTransacted = true; c.locked = true;
  c.startup = chance(0.5);
  cohort.noFirstValue.push(c);
}
// 3. Verification stalled.
for (const c of customers.filter((x) => x.ageDays >= 3 && x.ageDays <= 28 && !x.locked).slice(0, 9)) {
  c.status = 2; c.locked = true; cohort.unverified.push(c);
}
// 4. Paid before, wallet empty, quiet 21–180 days.
for (const c of customers.filter((x) => x.ageDays > 200 && !x.locked).slice(0, 11)) {
  c.paid = true; c.bal = 0; c.quietFor = int(24, 170); c.locked = true; cohort.walletDry.push(c);
}
// 5. A paying account nobody owns.
for (const c of customers.filter((x) => x.ageDays > 90 && !x.locked).slice(0, 4)) {
  c.paid = true; c.recentPayer = true; c.owner = null; c.locked = true; cohort.unownedPaying.push(c);
}
// 6. A second person signing up on a domain MSG91 already has.
for (const anchor of customers.filter((x) => x.ageDays > 120).slice(0, 5)) {
  const ageDays = int(1, 22);
  const person = pick(PEOPLE).split(" ")[0].toLowerCase();
  const c = {
    pid: takePid(), name: `${anchor.name} — ${pick(["Growth", "Marketing", "Product", "Support"])}`,
    uname: slug(anchor.name) + int(100, 999), email: `${person}@${anchor.domain}`,
    domain: anchor.domain, type: 3, date: daysAgo(ageDays), ageDays,
    parent: anchor.parent, bal: 0, status: 1, owner: null, startup: false,
    selfSignup: true, paid: false, locked: true,
  };
  customers.push(c); cohort.newPerson.push(c);
}

// Everyone else: ownership, balances, payment history, signup provenance.
for (const c of customers) {
  if (c.owner === null && !c.locked) c.owner = chance(0.82) ? pick(admins).pid : null;
  else if (c.owner === null && c.locked && !cohort.unownedSignup.includes(c)
           && !cohort.unownedPaying.includes(c) && !cohort.newPerson.includes(c)) {
    c.owner = chance(0.82) ? pick(admins).pid : null;
  }
  if (!c.neverTransacted && c.bal === 0 && !c.paid && chance(0.55)) c.bal = int(500, 900000);
  if (!c.paid && !c.neverTransacted && chance(0.45)) c.paid = true;
  c.selfSignup = chance(0.72);
  if (!c.startup) c.startup = chance(0.14);
  const [code, country] = weighted(CURRENCIES);
  c.currency = code; c.billingCountry = country;
}

const all = [...admins, ...resellers, ...customers];
console.log(`planning ${all.length} accounts — ${customers.length} customers, ${admins.length} staff, ${resellers.length} resellers`);

/* ── write it ─────────────────────────────────────────────────────────────── */
const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: true,
});

const [[dbrow]] = await conn.query("SELECT DATABASE() db, VERSION() v");
if (!/^(pulse_local|test_betatest_local)/.test(dbrow.db ?? "")) {
  console.error(`✗ refusing to seed "${dbrow.db}" — this script only writes to a local database`);
  console.error(`  (expected the name to start with pulse_local; set MYSQL_DATABASE accordingly)`);
  await conn.end();
  process.exit(1);
}
console.log(`→ ${dbrow.db} on ${process.env.MYSQL_HOST} (${dbrow.v})\n`);

/** Insert in chunks so a big table does not become one enormous statement. */
async function insert(table, columns, rows, chunk = 400) {
  if (!rows.length) return;
  const cols = columns.map((c) => `\`${c}\``).join(",");
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const placeholders = slice.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
    await conn.query(
      `INSERT INTO \`${table}\` (${cols}) VALUES ${placeholders}`,
      slice.flat(),
    );
  }
  console.log(`  ${table.padEnd(30)} ${String(rows.length).padStart(6)} rows`);
}

const TRUNCATE = [
  "ms_user", "user_handled_by", "default_destination_country", "ms_trans", "ms_text_bal",
  "ms_mapping", "parent_chain", "admin_updation_log", "ms_user_updation_logs", "user_comment",
  "ms_signup_history", "ms_user_paid_signup", "ms_route", "clientManagement", "signup_tracking",
  "admin_user", "ms_user_login",
];
console.log("clearing:");
await conn.query("SET FOREIGN_KEY_CHECKS = 0");
for (const t of TRUNCATE) {
  try { await conn.query(`TRUNCATE TABLE \`${t}\``); } catch (e) { console.log(`  (skip ${t}: ${e.code})`); }
}
await conn.query("SET FOREIGN_KEY_CHECKS = 1");

console.log("\nwriting:");

// ms_user — the spine.
await insert("ms_user",
  ["user_pid", "user_fname", "user_lname", "user_uname", "user_pass", "user_mobno", "user_bal",
   "user_email", "user_date", "user_type", "user_status", "user_userid", "user_delivery", "is_space_user"],
  all.map((u) => [u.pid, u.name, "", u.uname, "d41d8cd98f00b204e9800998ecf8427e",
    `91${int(7000000000, 9999999999)}`, u.bal, u.email, sql(u.date), u.type, u.status, u.parent, "0", "0"]));

await insert("admin_user", ["admin_id"], admins.map((a) => [a.pid]));

// Ownership — the only place it lives.
await insert("user_handled_by", ["user_id", "admin_id", "deal_breaker"],
  customers.filter((c) => c.owner).map((c) => [c.pid, c.owner, 0]));

// Entity and currency.
await insert("default_destination_country",
  ["u_id", "default_country_code", "billing_country", "currency"],
  customers.filter((c) => c.currency).map((c) => [c.pid, pick(["91", "971", "1", "65", "44"]), c.billingCountry, c.currency]));

// Self-signup provenance, which is how motion is inferred.
await insert("ms_signup_history", ["user_id", "date", "ip"],
  customers.filter((c) => c.selfSignup).map((c) => [c.pid, sql(c.date), `${int(1,223)}.${int(0,255)}.${int(0,255)}.${int(1,254)}`]));

await insert("ms_user_paid_signup", ["userid", "admin_id", "status", "comment", "created_date", "date"],
  customers.filter((c) => c.startup).map((c) => [c.pid, c.owner ?? 1, 1, "startup programme", sql(c.date), sql(c.date)]));

await insert("parent_chain", ["user_pid", "upchain"],
  customers.map((c) => [c.pid, c.parent === RESELLER_ROOT ? "2" : `2,${c.parent}`]));

await insert("ms_mapping", ["c_id", "u_id", "type", "prv", "added_on"],
  customers.map((c) => [c.pid, c.pid, 1, "", sql(c.date)]));

// Routes, then per-route wallet balances.
const ROUTES = [[1, "Promotional"], [4, "Transactional"], [18, "OTP"], [19, "Intl"], [20, "Voice"],
  [28, "WhatsApp"], [113, "Email"], [114, "RCS"]];
await insert("ms_route", ["route_pid", "route_name", "route_delivery", "route_type", "route_balance", "cost"],
  ROUTES.map(([id, name]) => [id, name, 100, "dialplan", int(-5000, 90000), 0.08]));

const balances = [];
for (const c of customers) {
  for (const [routeId] of ROUTES) {
    if (chance(0.42)) balances.push([c.pid, routeId, c.neverTransacted ? 0 : int(0, 250000)]);
  }
}
await insert("ms_text_bal", ["userId", "route", "balance"], balances);

/* ms_trans — the money log. Two kinds of row, and the difference matters:
   gateway payments (type 1 / mode 2) are real customer cash; admin moves
   (type 1 / mode 1) are not. Debits are type 2. */
const trans = [];
const payers = customers.filter((c) => c.paid && !c.neverTransacted);
for (let i = 0; i < TRANSACTIONS && payers.length; i++) {
  const c = pick(payers);
  const quiet = c.quietFor ?? 0;
  const maxAge = Math.min(c.ageDays, 540);
  const minAge = quiet ? quiet : 0;
  if (maxAge <= minAge) continue;
  const when = daysAgo(int(minAge, maxAge));
  const gateway = chance(0.35);
  const debit = !gateway && chance(0.45);
  const amount = gateway ? int(500, 400000) : int(100, 90000);
  trans.push([
    c.pid, c.owner ?? 1,
    debit ? -amount : amount,
    debit ? -int(100, 40000) : int(100, 60000),
    sql(when),
    debit ? 2 : 1,
    gateway
      ? `Online payment done through ${pick(GATEWAYS)} : txn-id - ${Math.random().toString(36).slice(2, 14)}`
      : debit ? "deduction by admin" : "credit added by admin/reseller",
    gateway ? 2 : 1,
    c.owner ?? 0,
    c.currency || "INR",
  ]);
}
// The unowned payers need recent gateway payments or their card cannot fire.
for (const c of cohort.unownedPaying) {
  for (let i = 0; i < 3; i++) {
    trans.push([c.pid, 1, int(20000, 300000), int(1000, 50000), sql(daysAgo(int(2, 80))), 1,
      `Online payment done through ${pick(GATEWAYS)} : txn-id - ${Math.random().toString(36).slice(2, 14)}`,
      2, 0, c.currency || "INR"]);
  }
}
await insert("ms_trans",
  ["trans_tuserid", "trans_fuserid", "trans_amt", "trans_sms", "trans_date", "trans_type",
   "trans_desc", "payment_mode", "account_manager", "currency"], trans, 300);

// The human audit trail — live, and what Autopilot → Audit reads.
const auditRows = [];
for (let i = 0; i < 700; i++) {
  const c = pick(customers);
  auditRows.push([pick(admins).pid, pick([1, 1, 1, 2, 14, 23, 31, 62]), c.pid,
    sql(daysAgo(rnd() * 45)), String(int(600, 620)), String(int(600, 620))]);
}
// One admin touching many accounts out of hours, so the anomaly card has a subject.
const suspicious = pick(admins);
for (let i = 0; i < 14; i++) {
  const c = pick(customers);
  const d = new Date(now - int(1, 20) * 3600_000);
  d.setUTCHours(int(0, 5));
  auditRows.push([suspicious.pid, 1, c.pid, sql(d), "603", "606"]);
}
await insert("admin_updation_log", ["admin_id", "type", "upt_id", "date", "before_val", "after_val"], auditRows);

await insert("ms_user_updation_logs",
  ["admin_id", "updater_id", "prev_val", "curr_val", "type", "action_time", "comment", "row_identifier"],
  Array.from({ length: 400 }, () => {
    const c = pick(customers);
    return [c.pid, c.pid, String(int(1, 9)), String(int(1, 9)), int(1, 6), sql(daysAgo(rnd() * 60)),
      pick(["Auth Key Generated", "Sender ID added", "Template submitted", "Webhook updated",
        "Password changed", "Route preference changed"]), String(int(1, 9999))];
  }));

await insert("user_comment", ["admin_id", "user_id", "comment", "comment_date"],
  Array.from({ length: 220 }, () => {
    const c = pick(customers);
    return [pick(admins).pid, c.pid, Buffer.from(pick([
      "Asked for a rate revision, waiting on approval.",
      "Wants WhatsApp pricing — sending the deck.",
      "Volume dropped, said it is seasonal.",
      "DLT header stuck with the operator, chasing.",
      "Happy with delivery, considering a second product.",
      "Moved to a competitor on price. Worth a call in a quarter.",
      "Finance contact changed, updated the billing email.",
    ])), sql(daysAgo(rnd() * 400))];
  }));

await insert("clientManagement",
  ["userId", "userName", "name", "email", "mobile", "clientType", "signupDate", "industry", "city",
   "trueClient", "latestUpdate", "followupDate", "accMng", "accMngName", "source", "AvgConR1",
   "AvgConR4", "AvgConOTP", "lost", "lostReason", "lastPurchaseDate", "route1Bal", "route4Bal",
   "otpBal", "route1Amount", "route4Amount", "otpAmount"],
  customers.filter(() => chance(0.55)).map((c) => {
    const owner = admins.find((a) => a.pid === c.owner);
    return [c.pid, c.uname, c.name, c.email, `91${int(7000000000, 9999999999)}`,
      pick([1, 2, 3, 3, 3]), sql(c.date), pick(INDUSTRY), pick(CITY), chance(0.7) ? 1 : 0,
      "", sql(daysAgo(int(0, 30))).slice(0, 10), owner ? String(owner.pid) : "",
      owner ? owner.uname : "", pick(["inbound", "outbound", "partner", "referral"]),
      String(int(0, 400000)), String(int(0, 200000)), String(int(0, 90000)),
      "", "", sql(daysAgo(int(1, 400))), String(int(0, 90000)), String(int(0, 40000)),
      String(int(0, 20000)), String(int(0, 500000)), String(int(0, 300000)), String(int(0, 100000))];
  }));

await insert("signup_tracking", ["email", "mobile", "ip", "status", "step", "last_updated_at"],
  Array.from({ length: 140 }, () => {
    const abandoned = chance(0.65);
    return [`${pick(["rahul", "test", "amrita", "info", "sales"])}${int(1, 999)}@${pick(["gmail.com", "yopmail.com", "test.com"])}`,
      `91${int(7000000000, 9999999999)}`, `${int(1,223)}.${int(0,255)}.${int(0,255)}.${int(1,254)}`,
      abandoned ? 0 : 1, abandoned ? Number((int(10, 35) / 10).toFixed(1)) : 4.0, sql(daysAgo(rnd() * 30))];
  }));

/* ── report ───────────────────────────────────────────────────────────────── */
const [[counts]] = await conn.query(`
  SELECT (SELECT COUNT(*) FROM ms_user WHERE user_type = 3) customers,
         (SELECT COUNT(*) FROM ms_user u LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
           WHERE u.user_type = 3 AND h.admin_id IS NULL) unowned,
         (SELECT COUNT(*) FROM ms_trans WHERE trans_type = 1 AND payment_mode = 2) gateway_payments,
         (SELECT COUNT(*) FROM admin_updation_log) audit_rows`);

console.log(`\n✓ seeded`);
console.log(`  customers           ${counts.customers}`);
console.log(`  without an owner    ${counts.unowned}`);
console.log(`  gateway payments    ${counts.gateway_payments}`);
console.log(`  audit rows          ${counts.audit_rows}`);
console.log(`\n  planted for the scanners:`);
console.log(`    unowned recent signups   ${cohort.unownedSignup.length}`);
console.log(`    never sent anything      ${cohort.noFirstValue.length}`);
console.log(`    verification stalled     ${cohort.unverified.length}`);
console.log(`    wallet ran dry           ${cohort.walletDry.length}`);
console.log(`    paying, no owner         ${cohort.unownedPaying.length}`);
console.log(`    new person, known domain ${cohort.newPerson.length}`);

await conn.end();
