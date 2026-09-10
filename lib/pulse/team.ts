import { query, queryOne } from "@/lib/db";
import { limitClause, page, toPaged, type Page, type Paged } from "./paginate";
import { accountName, ago, USER_TYPE } from "./domain";
import { healthFor } from "./health";
import { overrideCounts } from "./ownership";

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
 * MSG91's per-rep counts, corrected by Pulse's own reassignments.
 *
 * `user_handled_by` does not know about them — Pulse may only read that table —
 * so without this a rep who was handed thirty accounts this morning still shows
 * the book they had yesterday, and the standings quietly contradict the account
 * pages. Degraded to MSG91's raw count if the store is unreachable, like every
 * other place an override is layered on.
 *
 * An account moved *away* from a rep still counts in MSG91's own total, so the
 * losses are subtracted as well as the gains added. That needs to know who held
 * each overridden account before, which the counting query does not carry — one
 * small lookup, and only when there is anything to correct.
 */
async function ownerCorrections(): Promise<{
  gained: Map<string, number>;
  lost: Map<string, number>;
}> {
  let gained = new Map<string, number>();
  let moved = new Map<string, number | null>();
  try {
    ({ gained, moved } = await overrideCounts());
  } catch (err) {
    console.warn("[pulse] owner overrides unavailable for standings:", (err as Error).message);
    return { gained: new Map(), lost: new Map() };
  }

  const lost = new Map<string, number>();
  if (moved.size) {
    const ids = [...moved.keys()].map(Number).filter(Number.isFinite);
    if (ids.length) {
      const prior = await query<{ user_id: number; admin_id: number }>(
        `SELECT user_id, admin_id FROM user_handled_by
          WHERE user_id IN (${ids.map(() => "?").join(",")})`,
        ids,
      );
      for (const p of prior) {
        const now = moved.get(String(p.user_id));
        if (now === Number(p.admin_id)) continue; // restated, not moved
        lost.set(String(p.admin_id), (lost.get(String(p.admin_id)) ?? 0) + 1);
      }
    }
  }
  return { gained, lost };
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

  const { gained, lost } = await ownerCorrections();

  const corrected = rows.map((r) => {
    const key = String(r.admin_id);
    const name = accountName(r);
    return {
      id: Number(r.admin_id),
      name,
      initials: repInitials(name),
      email: (r.user_email ?? "").trim(),
      accounts: Math.max(0, Number(r.n) + (gained.get(key) ?? 0) - (lost.get(key) ?? 0)),
      isMe: Number(r.admin_id) === meId,
    };
  });

  /* Re-sorted, because the correction can change the order and the standings
     are a ranking — a list labelled "biggest book first" that is not is worse
     than one that is a day out of date. */
  corrected.sort((a, b) => b.accounts - a.accounts);
  return toPaged(corrected, req);
}

/**
 * Everyone an account may be handed to.
 *
 * Not the same list as `listReps`, and that difference was a bug you could not
 * see. `listReps` counts from `user_handled_by`, so it can only ever return
 * people who *already own something* — which is right for the standings and
 * wrong for the reassign sheet, where the whole point is often to give an
 * account to somebody who has none. On this database that hid 15 of 49 admins,
 * the new teammate on day one among them: the sheet offered no way to hand them
 * their first account, and nobody could tell from looking at it that anyone was
 * missing.
 *
 * So this reads the admins themselves and counts their book with a subquery
 * rather than a join, which keeps the ones on zero. The `EXISTS` arm is there
 * because ownership in this schema is not strictly type-1: two of the people
 * holding accounts today are resellers, and a list of "who may own an account"
 * that drops somebody who owns thirty is a worse lie than the one being fixed.
 */
export async function assignableReps(meId: number | null, cap = 500): Promise<Paged<Rep>> {
  /* Its own bound, not a caller's page. `page()` clamps every request to
     MAX_PAGE_SIZE, which is right for a feed and wrong for a list of people to
     choose from: it silently returned 50 of 51 and the picker had no way to
     show that somebody had been left off the end. This list is bounded by how
     many admins MSG91 has — tens — so it is read whole. */
  const req: Page = { limit: Math.max(1, Math.min(cap, 500)), offset: 0 };
  const rows = await query<{
    admin_id: number;
    n: number;
    user_fname: string | null;
    user_lname: string | null;
    user_uname: string | null;
    user_email: string | null;
  }>(
    `SELECT a.user_pid AS admin_id,
            a.user_fname, a.user_lname, a.user_uname, a.user_email,
            (SELECT COUNT(*)
               FROM user_handled_by h
               JOIN ms_user c ON c.user_pid = h.user_id AND c.user_type = ${USER_TYPE.CUSTOMER}
              WHERE h.admin_id = a.user_pid) n
       FROM ms_user a
      WHERE a.user_type = ${USER_TYPE.ADMIN}
         OR EXISTS (SELECT 1 FROM user_handled_by h2 WHERE h2.admin_id = a.user_pid)
      ORDER BY n DESC, a.user_fname ASC ${limitClause(req)}`,
  );

  const { gained, lost } = await ownerCorrections();
  const corrected = rows.map((r) => {
    const key = String(r.admin_id);
    const name = accountName(r);
    return {
      id: Number(r.admin_id),
      name,
      initials: repInitials(name),
      email: (r.user_email ?? "").trim(),
      accounts: Math.max(0, Number(r.n) + (gained.get(key) ?? 0) - (lost.get(key) ?? 0)),
      isMe: Number(r.admin_id) === meId,
    };
  });
  corrected.sort((a, b) => b.accounts - a.accounts || a.name.localeCompare(b.name));
  return toPaged(corrected, req);
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

/**
 * How each rep's book is holding up.
 *
 * The prototype's team band ranked people by *movement* — how many health
 * points they lifted this month. That needs a month of history Pulse has only
 * just started recording, so ranking by it today would mean inventing numbers
 * for the one board every rep will check against their own memory.
 *
 * What is measurable now is the standing itself: of the accounts you own, how
 * many are holding up. Ordered by the count of healthy accounts, and honest
 * about being a standing rather than a movement.
 */
export async function repStandings(
  limit = 6,
): Promise<{ name: string; initials: string; healthy: number; scored: number; isMe: boolean }[]> {
  const owners = await query<{ admin_id: number; name: string | null; accounts: number }>(
    `SELECT h.admin_id, a.user_fname AS name, COUNT(*) accounts
       FROM user_handled_by h
       JOIN ms_user u ON u.user_pid = h.user_id AND u.user_type = ${USER_TYPE.CUSTOMER}
       LEFT JOIN ms_user a ON a.user_pid = h.admin_id
      GROUP BY h.admin_id, a.user_fname
      ORDER BY accounts DESC
      LIMIT ?`,
    [limit],
  );
  if (!owners.length) return [];

  // One pass for every rep's accounts, then score them together — the same
  // constraint as everywhere else, since ms_trans has no useful index.
  const ids = owners.map((o) => Number(o.admin_id));
  const rows = await query<{ admin_id: number; user_pid: number; age_days: number }>(
    `SELECT h.admin_id, u.user_pid, DATEDIFF(NOW(), u.user_date) age_days
       FROM user_handled_by h
       JOIN ms_user u ON u.user_pid = h.user_id AND u.user_type = ${USER_TYPE.CUSTOMER}
      WHERE h.admin_id IN (${ids.map(() => "?").join(",")})
      LIMIT 400`,
    ids,
  );

  const health = await healthFor(
    rows.map((r) => ({ id: r.user_pid, hasOwner: true, ageDays: r.age_days })),
  );

  const me = String(process.env.PULSE_ME_USER_PID ?? "").trim();

  return owners
    .map((o) => {
      const mine = rows.filter((r) => Number(r.admin_id) === Number(o.admin_id));
      const scored = mine.filter((r) => health.has(r.user_pid));
      const healthy = scored.filter((r) => {
        const band = health.get(r.user_pid)?.band;
        return band === "thriving" || band === "steady";
      }).length;
      const name = accountName({ user_fname: o.name }) || `Rep ${o.admin_id}`;
      return {
        name,
        initials: name.slice(0, 2).toUpperCase(),
        healthy,
        scored: scored.length,
        isMe: me ? String(o.admin_id) === me : false,
      };
    })
    // Accounts nobody has scored yet say nothing, so they sort last.
    .sort((a, b) => b.healthy - a.healthy || b.scored - a.scored);
}
