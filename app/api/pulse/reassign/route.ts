/**
 * GET  /api/pulse/reassign  — the unowned pile, and who Pulse suggests for it
 * POST /api/pulse/reassign  — hand a set of accounts to reps, in one act
 *
 * The bulk half of reassignment. One account at a time goes through
 * /api/pulse/accounts/:id/owner; this is the sheet that opens on "these are
 * unowned, here is the split", and applying it writes one event per account
 * under a shared batch id so the log can show it as the single decision it
 * was rather than forty unrelated ones.
 *
 * Like the single-account route: any signed-in member may do this, and every
 * row records who.
 */

import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { countAccounts } from "@/lib/pulse/accounts";
import { suggestedSplit } from "@/lib/pulse/reassign";
import { assignableReps } from "@/lib/pulse/team";
import { assignOwner, newBatch } from "@/lib/pulse/ownership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Long enough for the event automations this route fires to actually finish.
 *
 * Every write here announces something through `emitEvent`, and `after()`
 * keeps the invocation alive for that work — but only up to `maxDuration`.
 * One event automation is one GTWY judging call, measured at 15-25 seconds
 * against the shared rule-worker, so the platform default (10-15s) kills the
 * invocation mid-call. Nothing reports it: the response already went out, so
 * the caller sees success while the automation never ran, wrote no alert and
 * wrote no decision row. Matches the 300 the scheduled runners already set
 * (tick, webhook, run, monthly) for exactly the same reason.
 */
export const maxDuration = 300;

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** One press of "apply" may not move more than this. A sheet, not a migration. */
const MAX_PER_CALL = 500;

export async function GET(req: Request) {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);

  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 200);

  try {
    const [split, total, reps] = await Promise.all([
      suggestedSplit(Number.isFinite(limit) ? limit : 200),
      countAccounts({ unownedOnly: true }),
      assignableReps(null),
    ]);
    return NextResponse.json({
      ok: true,
      /* `total` is the whole pile; `accounts` is the page of it this sheet can
         actually act on. They differ by thousands on this database, and the
         sheet has to say so rather than showing one number over the other's
         rows — the prototype's "Reassign 46 accounts" was exactly that lie. */
      total,
      showing: split.accounts.length,
      accounts: split.accounts,
      groups: split.groups,
      reps: reps.rows,
    });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}

type Assignment = { accountId: number; ownerId: number | null; accountName?: string };

export async function POST(req: Request) {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);

  const body = (await req.json().catch(() => ({}))) as {
    assignments?: unknown;
    note?: unknown;
  };

  if (!Array.isArray(body.assignments) || !body.assignments.length) {
    return bad("assignments is required — a list of { accountId, ownerId }");
  }
  if (body.assignments.length > MAX_PER_CALL) {
    return bad(`That is ${body.assignments.length} accounts. ${MAX_PER_CALL} is the most one press may move.`);
  }

  const wanted: Assignment[] = [];
  for (const raw of body.assignments) {
    const a = raw as { accountId?: unknown; ownerId?: unknown; accountName?: unknown };
    const accountId = Number(a.accountId);
    if (!Number.isInteger(accountId) || accountId <= 0) return bad(`bad accountId: ${String(a.accountId)}`);
    const ownerId =
      a.ownerId === null || a.ownerId === undefined ? null : Number(a.ownerId);
    if (ownerId !== null && (!Number.isInteger(ownerId) || ownerId <= 0)) {
      return bad(`bad ownerId: ${String(a.ownerId)}`);
    }
    wanted.push({
      accountId,
      ownerId,
      accountName: typeof a.accountName === "string" ? a.accountName : undefined,
    });
  }

  const note = typeof body.note === "string" ? body.note : null;

  try {
    /* Rep names are resolved once from MSG91 rather than per account or from
       the request: they are copied into the audit record, so they have to be
       the database's answer, and forty lookups for four distinct reps is
       forty round trips to a server that is 200ms away. */
    const repIds = [...new Set(wanted.map((w) => w.ownerId).filter((id): id is number => id !== null))];
    /* `assignableReps`, not `listReps`: the latter is built from who already
       owns something, so resolving against it turned "give these forty to the
       teammate who started on Monday" into a 404 naming a rep the sheet had
       just offered. */
    const reps = await assignableReps(null);
    const byId = new Map(reps.rows.map((r) => [r.id, r]));
    const unknown = repIds.filter((id) => !byId.has(id));
    if (unknown.length) return bad(`No rep with id ${unknown.join(", ")}`, 404);

    const batch = newBatch();
    /* Sequentially. These land on one primary key each, and a batch of a few
       hundred is not worth opening a few hundred connections for — the store
       pool would queue them anyway. */
    for (const w of wanted) {
      const rep = w.ownerId === null ? null : byId.get(w.ownerId);
      await assignOwner(
        {
          accountId: w.accountId,
          accountName: w.accountName ?? null,
          ownerId: w.ownerId,
          ownerName: rep?.name ?? null,
          ownerEmail: rep?.email ?? null,
          note,
        },
        seat.writer.email,
        batch,
      );
    }

    return NextResponse.json({ ok: true, batch, moved: wanted.length });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}
