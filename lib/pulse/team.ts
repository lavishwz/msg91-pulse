import { query, queryOne } from "@/lib/db";
import { limitClause, page, toPaged, type Page, type Paged } from "./paginate";
import { accountName, ago, USER_TYPE } from "./domain";

/**
 * The MSG91 team.
 *
 * Reps are `ms_user` rows with `user_type = 1` that appear as `admin_id` in
 * `user_handled_by` — that table is the only place ownership is recorded
 * ("stores account manager and deal breaker of a company").
 */

export type Rep = {
  id: number;
  name: string;
  initials: string;
  email: string;
  accounts: number;
  /** True for whoever the session is acting as. */
  isMe: boolean;
};

function repInitials(name: string): string {
  const w = name.replace(/[^A-Za-z ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "??";
  return ((w[0][0] ?? "") + (w[1]?.[0] ?? w[0][1] ?? "")).toUpperCase();
}

/**
 * Every rep who owns at least one account, biggest book first.
 *
 * One grouped query over `user_handled_by` (5,416 rows, 53 admins) — small
 * enough to group in the database and capped at a page regardless.
 */
export async function listReps(meId: number | null, req: Page = page({ limit: 30 })): Promise<Paged<Rep>> {
  const rows = await query<{
    admin_id: number;
    n: number;
    user_fname: string | null;
    user_lname: string | null;
    user_uname: string | null;
    user_email: string | null;
  }>(
    `SELECT h.admin_id, COUNT(*) n,
            a.user_fname, a.user_lname, a.user_uname, a.user_email
       FROM user_handled_by h
       JOIN ms_user a ON a.user_pid = h.admin_id
       JOIN ms_user c ON c.user_pid = h.user_id AND c.user_type = ${USER_TYPE.CUSTOMER}
      GROUP BY h.admin_id, a.user_fname, a.user_lname, a.user_uname, a.user_email
      ORDER BY n DESC ${limitClause(req)}`,
  );

  return toPaged(
    rows.map((r) => {
      const name = accountName(r);
      return {
        id: Number(r.admin_id),
        name,
        initials: repInitials(name),
        email: (r.user_email ?? "").trim(),
        accounts: Number(r.n),
        isMe: Number(r.admin_id) === meId,
      };
    }),
    req,
  );
}

/** One rep by id. */
export async function getRep(id: number): Promise<Rep | null> {
  const row = await queryOne<{
    user_pid: number;
    user_fname: string | null;
    user_lname: string | null;
    user_uname: string | null;
    user_email: string | null;
    n: number;
  }>(
    `SELECT a.user_pid, a.user_fname, a.user_lname, a.user_uname, a.user_email,
            (SELECT COUNT(*)
               FROM user_handled_by h
               JOIN ms_user c ON c.user_pid = h.user_id AND c.user_type = ${USER_TYPE.CUSTOMER}
              WHERE h.admin_id = a.user_pid) n
       FROM ms_user a
      WHERE a.user_pid = ? LIMIT 1`,
    [id],
  );
  if (!row) return null;
  const name = accountName(row);
  return {
    id: Number(row.user_pid),
    name,
    initials: repInitials(name),
    email: (row.user_email ?? "").trim(),
    accounts: Number(row.n),
    isMe: true,
  };
}

/**
 * Who Pulse is acting as.
 *
 * Pulse has no auth yet and cannot store a session (SELECT-only database), so
 * "me" is resolved in this order:
 *   1. `PULSE_ME_USER_PID` in the environment, if set — the deliberate choice.
 *   2. otherwise the rep with the largest book, so the app opens on somebody
 *      with real work rather than an empty screen.
 * This is the one place that decision lives; everything else takes `meId`.
 */
export async function resolveMe(): Promise<Rep | null> {
  const pinned = Number(process.env.PULSE_ME_USER_PID);
  if (Number.isFinite(pinned) && pinned > 0) {
    const rep = await getRep(pinned);
    if (rep) return rep;
  }
  const { rows } = await listReps(null, page({ limit: 1 }));
  return rows[0] ? { ...rows[0], isMe: true } : null;
}

/**
 * Standings — all reps ordered, everyone visible, you highlighted
 * (handover §8 feature 15: transparent by decision, top movers not bottom).
 *
 * Ranked by accounts owned, which is the only per-rep outcome legacy MySQL can
 * evidence. Promises kept and recoveries are Pulse-owned and unavailable until
 * Pulse has its own store.
 */
export type Standing = Rep & { rank: number; share: number };

export async function standings(meId: number | null, limit = 25): Promise<Standing[]> {
  const { rows } = await listReps(meId, page({ limit }));
  const top = rows[0]?.accounts || 1;
  return rows.map((r, i) => ({ ...r, rank: i + 1, share: r.accounts / top }));
}

/**
 * Per-rep recent activity, used by the "whose accounts are flat" answer
 * (handover §7.3). `admin_updation_log` is the human action log and is live, so
 * "last acted" is a real number rather than an inference.
 */
export async function repActivity(
  req: Page = page({ limit: 25 }),
): Promise<Paged<{ id: number; name: string; lastActed: string | null; daysQuiet: number | null; actions30d: number }>> {
  const rows = await query<{
    admin_id: number;
    user_fname: string | null;
    user_lname: string | null;
    user_uname: string | null;
    last_acted: Date | null;
    n30: number;
  }>(
    `SELECT l.admin_id,
            a.user_fname, a.user_lname, a.user_uname,
            MAX(l.date) last_acted,
            SUM(l.date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) n30
       FROM admin_updation_log l
       JOIN ms_user a ON a.user_pid = l.admin_id AND a.user_type = ${USER_TYPE.ADMIN}
      WHERE l.date >= DATE_SUB(NOW(), INTERVAL 180 DAY)
      GROUP BY l.admin_id, a.user_fname, a.user_lname, a.user_uname
      ORDER BY last_acted DESC ${limitClause(req)}`,
  );

  return toPaged(
    rows.map((r) => {
      const t = r.last_acted ? new Date(r.last_acted).getTime() : NaN;
      return {
        id: Number(r.admin_id),
        name: accountName(r),
        lastActed: r.last_acted ? ago(r.last_acted) : null,
        daysQuiet: Number.isFinite(t) ? Math.floor((Date.now() - t) / 86_400_000) : null,
        actions30d: Number(r.n30 ?? 0),
      };
    }),
    req,
  );
}
