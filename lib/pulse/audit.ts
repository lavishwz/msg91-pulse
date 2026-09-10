import { query } from "@/lib/db";
import { limitClause, page, toPaged, type Page, type Paged } from "./paginate";
import { accountName, ago, USER_TYPE } from "./domain";
import { recentOwnerEvents } from "./ownership";

/**
 * Autopilot → Audit log (handover §7.4).
 *
 * "Every human act. Separate store, separate audience, separate retention."
 * Legacy MySQL already keeps exactly that in two tables, both live:
 *
 *   admin_updation_log     — what MSG91 staff changed (126,729 rows, 356 admins)
 *   ms_user_updation_logs  — what customers changed on their own accounts
 *
 * The AI log is deliberately *not* sourced from these. It records decisions
 * Pulse itself made, and Pulse has made none yet — inventing entries would
 * undermine the one surface whose whole purpose is trust.
 */

export type AuditEntry = {
  id: number;
  when: string;
  at: string;
  actor: string;
  actorId: number;
  account: { id: number; name: string } | null;
  what: string;
  detail: string;
  /** Maps onto the prototype's tag styling: act | ok | warn | "". */
  tag: string;
  typeCode: number;
  /** The exact moment, ISO. `when` and `at` are for reading; this is for sorting. */
  ts: string;
};

/**
 * `admin_updation_log.type` is a numeric code and this database carries no
 * lookup table for it, so a code Pulse cannot name is reported as a code rather
 * than guessed at. These are the ones whose meaning is unambiguous from the
 * before/after values across the live rows.
 */
const TYPE_LABEL: Record<number, string> = {
  1: "changed account routing",
  2: "changed account settings",
};

function label(type: number): string {
  return TYPE_LABEL[type] ?? `made a change (type ${type})`;
}

/**
 * Pulse's own reassignments, in the same shape as MSG91's change log.
 *
 * The reassign sheet promises "anyone can do this — it writes an audit event
 * either way", and it does: `pulse_account_owner_event`, one row per account
 * moved. Nothing read that table, so the promise was kept in the database and
 * broken on the screen — every reassignment Pulse made was invisible in the one
 * surface that exists to answer "who changed what".
 *
 * Ids are negated so they cannot collide with `admin_updation_log.id`, and the
 * actor is a Pulse member's email rather than an `ms_user`, so `actorId` is 0:
 * these are acts by a person signed in to Pulse, not by an MSG91 admin.
 */
async function ownerAudit(window: number): Promise<AuditEntry[]> {
  const events = await recentOwnerEvents(window);
  return events.map((e) => {
    const account = e.accountName ?? `account ${e.accountId}`;
    const what =
      e.action === "cleared"
        ? `withdrew Pulse's owner for ${account}`
        : e.ownerName
          ? `reassigned ${account} to ${e.ownerName}`
          : `took ${account} off its owner`;
    return {
      id: -e.id,
      when: e.at.slice(11, 16),
      at: ago(new Date(e.at)),
      actor: e.actor,
      actorId: 0,
      account: { id: Number(e.accountId) || 0, name: account },
      what,
      detail: [
        e.previousOwnerName ? `was ${e.previousOwnerName}` : "had no owner before",
        e.note,
        e.batch ? "part of one bulk reassignment" : null,
        "In Pulse's own record — MSG91's user_handled_by is read-only to Pulse.",
      ]
        .filter(Boolean)
        .join(" · "),
      tag: e.action === "assigned" ? "ok" : "warn",
      typeCode: 0,
      ts: e.at,
    };
  });
}

/**
 * A page of staff actions, newest first — both databases in one feed.
 *
 * MSG91's `admin_updation_log` and Pulse's reassignments live on different
 * servers, so they are merged here by time rather than joined in SQL. Both are
 * read `offset + limit` deep and the merge is sliced to the page, which is
 * exact for the first few screens and is where the reader ever gets to; past
 * WINDOW rows the feed is MSG91's alone rather than silently missing Pulse's,
 * and that boundary is stated in the code rather than guessed at from the gaps.
 */
const MERGE_WINDOW = 200;

export async function staffAudit(req: Page = page({ limit: 25 })): Promise<Paged<AuditEntry>> {
  /* Both sources are read from the top down to the end of the requested page,
     because which rows fall on page three depends on how the two interleave. */
  const deep: Page = { limit: Math.max(1, Math.min(MERGE_WINDOW, req.offset + req.limit)), offset: 0 };

  const rows = await query<{
    id: number;
    admin_id: number;
    type: number;
    upt_id: number;
    date: Date;
    before_val: string | null;
    after_val: string | null;
    actor_fname: string | null;
    actor_lname: string | null;
    actor_uname: string | null;
    acct_fname: string | null;
    acct_lname: string | null;
    acct_uname: string | null;
  }>(
    `SELECT l.id, l.admin_id, l.type, l.upt_id, l.date, l.before_val, l.after_val,
            act.user_fname AS actor_fname, act.user_lname AS actor_lname, act.user_uname AS actor_uname,
            acc.user_fname AS acct_fname,  acc.user_lname AS acct_lname,  acc.user_uname AS acct_uname
       FROM admin_updation_log l
       LEFT JOIN ms_user act ON act.user_pid = l.admin_id
       LEFT JOIN ms_user acc ON acc.user_pid = l.upt_id
      ORDER BY l.date DESC, l.id DESC ${limitClause(deep)}`,
  );

  /* Pulse's own reassignments, folded in. Degraded rather than fatal: if the
     store is unreachable the log is MSG91's alone, which is what it was before
     this existed, and the warning says which half is missing. */
  let mine: AuditEntry[] = [];
  try {
    mine = await ownerAudit(MERGE_WINDOW);
  } catch (err) {
    console.warn("[pulse] reassignments missing from the audit log:", (err as Error).message);
  }

  const theirs = rows.map((r) => {
      const before = (r.before_val ?? "").trim();
      const after = (r.after_val ?? "").trim();
      const acct = accountName({
        user_fname: r.acct_fname,
        user_lname: r.acct_lname,
        user_uname: r.acct_uname,
      });
      return {
        id: Number(r.id),
        when: new Date(r.date).toISOString().slice(11, 16),
        at: ago(r.date),
        actor:
          accountName({
            user_fname: r.actor_fname,
            user_lname: r.actor_lname,
            user_uname: r.actor_uname,
          }) || `admin ${r.admin_id}`,
        actorId: Number(r.admin_id),
        account: r.upt_id ? { id: Number(r.upt_id), name: acct } : null,
        what: `${label(Number(r.type))} on ${acct}`,
        detail:
          before && after
            ? `${before} → ${after}`
            : after
              ? `set to ${after}`
              : "no value recorded",
        tag: Number(r.type) === 1 ? "act" : "",
        typeCode: Number(r.type),
        ts: new Date(r.date).toISOString(),
      };
    });

  /* Newest first, and ties broken by id so a page boundary never shows the
     same row twice or skips one — two events in the same second are common
     inside one bulk reassignment. */
  const merged = [...theirs, ...mine].sort(
    (a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : b.id - a.id),
  );
  return toPaged(merged.slice(req.offset, req.offset + req.limit + 1), req);
}

/**
 * Anomaly detection over the audit stream (§5): bulk activity, off-hours
 * access, one admin touching an unusual number of accounts.
 *
 * Scoped to the last 24 hours and grouped in the database, so this reads a
 * handful of rows rather than the log.
 */
export type Anomaly = {
  actor: string;
  actorId: number;
  changes: number;
  accounts: number;
  window: string;
  offHours: number;
  note: string;
} | null;

export async function auditAnomaly(): Promise<Anomaly> {
  const rows = await query<{
    admin_id: number;
    n: number;
    accounts: number;
    off_hours: number;
    first: Date;
    last: Date;
    user_fname: string | null;
    user_lname: string | null;
    user_uname: string | null;
  }>(
    `SELECT l.admin_id, COUNT(*) n, COUNT(DISTINCT l.upt_id) accounts,
            SUM(HOUR(l.date) < 7 OR HOUR(l.date) >= 21) off_hours,
            MIN(l.date) first, MAX(l.date) last,
            a.user_fname, a.user_lname, a.user_uname
       FROM admin_updation_log l
       LEFT JOIN ms_user a ON a.user_pid = l.admin_id
      WHERE l.date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY l.admin_id, a.user_fname, a.user_lname, a.user_uname
      ORDER BY accounts DESC, n DESC
      LIMIT 1`,
  );

  const top = rows[0];
  if (!top) return null;

  const accounts = Number(top.accounts ?? 0);
  const offHours = Number(top.off_hours ?? 0);
  // Only worth a person's attention if it is broad or out of hours.
  if (accounts < 10 && offHours === 0) return null;

  const actor =
    accountName({
      user_fname: top.user_fname,
      user_lname: top.user_lname,
      user_uname: top.user_uname,
    }) || `admin ${top.admin_id}`;

  return {
    actor,
    actorId: Number(top.admin_id),
    changes: Number(top.n ?? 0),
    accounts,
    window: `${new Date(top.first).toISOString().slice(11, 16)}–${new Date(top.last)
      .toISOString()
      .slice(11, 16)}`,
    offHours,
    note:
      offHours > 0
        ? `${offHours} of ${top.n} changes landed outside 07:00–21:00.`
        : `${accounts} different accounts touched in one day.`,
  };
}

/** What customers changed on their own accounts — the other half of the log. */
export async function customerAudit(req: Page = page({ limit: 25 })): Promise<Paged<AuditEntry>> {
  const rows = await query<{
    id: number;
    admin_id: number;
    updater_id: number;
    prev_val: string | null;
    curr_val: string | null;
    type: number;
    action_time: Date;
    comment: string | null;
    acct_fname: string | null;
    acct_lname: string | null;
    acct_uname: string | null;
  }>(
    `SELECT l.id, l.admin_id, l.updater_id, l.prev_val, l.curr_val, l.type,
            l.action_time, l.comment,
            acc.user_fname AS acct_fname, acc.user_lname AS acct_lname, acc.user_uname AS acct_uname
       FROM ms_user_updation_logs l
       LEFT JOIN ms_user acc ON acc.user_pid = l.admin_id
      ORDER BY l.action_time DESC, l.id DESC ${limitClause(req)}`,
  );

  return toPaged(
    rows.map((r) => {
      const acct = accountName({
        user_fname: r.acct_fname,
        user_lname: r.acct_lname,
        user_uname: r.acct_uname,
      });
      const prev = (r.prev_val ?? "").trim();
      const curr = (r.curr_val ?? "").trim();
      return {
        id: Number(r.id),
        when: new Date(r.action_time).toISOString().slice(11, 16),
        at: ago(r.action_time),
        actor: acct || `account ${r.admin_id}`,
        actorId: Number(r.updater_id),
        account: { id: Number(r.admin_id), name: acct },
        what: (r.comment ?? "").trim() || label(Number(r.type)),
        detail: prev && curr ? `${prev} → ${curr}` : curr ? `set to ${curr}` : "no value recorded",
        tag: "",
        typeCode: Number(r.type),
        ts: new Date(r.action_time).toISOString(),
      };
    }),
    req,
  );
}

/** Filtered — signups MSG91 suppressed, and why (§7.4). */
export async function filteredSignups(
  req: Page = page({ limit: 20 }),
): Promise<Paged<{ when: string; what: string; why: string; tag: string }>> {
  const rows = await query<{ id: number; email: string | null; mobile: string | null; ip: string | null; status: number | null; step: string | null; last_updated_at: Date | null }>(
    `SELECT id, email, mobile, ip, status, step, last_updated_at
       FROM signup_tracking
      WHERE status <> 1
      ORDER BY last_updated_at DESC ${limitClause(req)}`,
  );

  return toPaged(
    rows.map((r) => ({
      when: r.last_updated_at ? new Date(r.last_updated_at).toISOString().slice(11, 16) : "—",
      what: (r.email ?? r.mobile ?? "an anonymous attempt").trim(),
      why: `Abandoned at step ${r.step ?? "?"} of signup${r.ip ? ` · from ${r.ip}` : ""}.`,
      tag: "junk",
    })),
    req,
  );
}
