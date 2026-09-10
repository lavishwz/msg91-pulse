/**
 * GET    /api/pulse/accounts/:id/owner  — who owns it, and every change to that
 * PUT    /api/pulse/accounts/:id/owner  — reassign it
 * DELETE /api/pulse/accounts/:id/owner  — withdraw Pulse's override
 *
 * Ownership is recorded in MSG91's `user_handled_by`, which Pulse may only
 * read. A reassignment made here is therefore an override in Pulse's own store
 * (migrations/009), layered over MSG91's answer wherever an account is read.
 * The response says which of the two you are looking at, because "Rhea owns
 * this" and "we gave this to Rhea and MSG91 has not caught up" are different
 * things to walk into a meeting believing.
 *
 * Any signed-in member may reassign — this is the sheet's own promise ("anyone
 * can do this — it writes an audit event either way") and it is the right one:
 * an unowned account is a cost that anybody noticing it should be able to fix.
 * What is not optional is attribution, which is why this goes through
 * `writer()` rather than `gate()`.
 */

import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { getAccount } from "@/lib/pulse/accounts";
import { getRep } from "@/lib/pulse/team";
import { assignOwner, clearOwner, ownerHistory, ownerOf } from "@/lib/pulse/ownership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Account ids are ms_user.user_pid — numeric, and not ours to invent. */
function accountFrom(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) return bad("bad account id");

  try {
    const [account, override, history] = await Promise.all([
      getAccount(accountId),
      ownerOf(accountId),
      ownerHistory(accountId),
    ]);
    if (!account) return bad("not found", 404);
    return NextResponse.json({
      ok: true,
      owner: account.owner,
      source: account.ownerSource,
      before: account.ownerBefore,
      note: account.ownerNote,
      override,
      history,
    });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) return bad("bad account id");

  const body = (await req.json().catch(() => ({}))) as { ownerId?: unknown; note?: unknown };

  /* `null` is a real answer and not a missing one: it means the account is
     deliberately owned by nobody, which is what "take this off Vikram" does
     before anyone has decided who gets it. `undefined` is the mistake. */
  if (!("ownerId" in body)) return bad("ownerId is required — a rep id, or null for nobody");
  const rawOwner = body.ownerId;
  if (rawOwner !== null && !(Number.isInteger(rawOwner) && (rawOwner as number) > 0)) {
    return bad("ownerId must be a rep id, or null for nobody");
  }
  const ownerId = rawOwner as number | null;
  const note = typeof body.note === "string" ? body.note : null;

  try {
    const account = await getAccount(accountId);
    if (!account) return bad("not found", 404);

    /* The rep is looked up rather than trusted from the request: the name and
       email are copied into Pulse's store and become the audit record, so they
       have to be MSG91's answer and not the caller's. A rep id that names
       nobody is a bug in the client, not a reassignment. */
    const rep = ownerId === null ? null : await getRep(ownerId);
    if (ownerId !== null && !rep) return bad(`No rep with id ${ownerId}`, 404);

    if (account.owner?.id === ownerId) {
      /* `before` and `note` travel with the no-op too. The client writes the
         whole owner block from this response, so leaving them out replaced a
         real "MSG91 still says Vikram" with "nobody" on the account page — the
         override's own provenance, lost to a request that changed nothing. */
      return NextResponse.json({
        ok: true,
        unchanged: true,
        owner: account.owner,
        source: account.ownerSource,
        before: account.ownerBefore,
        note: account.ownerNote,
      });
    }

    await assignOwner(
      {
        accountId,
        accountName: account.name,
        ownerId,
        ownerName: rep?.name ?? null,
        ownerEmail: rep?.email ?? null,
        previousOwnerId: account.owner?.id ?? null,
        previousOwnerName: account.owner?.name ?? null,
        note,
      },
      seat.writer.email,
    );

    return NextResponse.json({
      ok: true,
      owner: rep ? { id: rep.id, name: rep.name } : null,
      source: "pulse",
      before: account.owner,
      note,
      history: await ownerHistory(accountId),
    });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) return bad("bad account id");

  try {
    const account = await getAccount(accountId);
    const cleared = await clearOwner(accountId, seat.writer.email, account?.name ?? null);
    if (!cleared) return bad("Pulse has not reassigned this account", 404);
    /* Read back rather than computed: withdrawing the override means MSG91's
       answer stands again, and this is the only way to be sure what that is. */
    const after = await getAccount(accountId);
    return NextResponse.json({
      ok: true,
      owner: after?.owner ?? null,
      source: after?.ownerSource ?? "msg91",
      history: await ownerHistory(accountId),
    });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}
