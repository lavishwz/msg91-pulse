import { NextResponse } from "next/server";
import { resolveMe, standings } from "@/lib/pulse/team";
import { listAccounts, countAccounts, countryCounts } from "@/lib/pulse/accounts";
import { growth, ASK_CATALOGUE } from "@/lib/pulse/ask";
import { auditAnomaly } from "@/lib/pulse/audit";
import { page } from "@/lib/pulse/paginate";
import { gate } from "@/lib/pulse/guard";

/**
 * GET /api/pulse/bootstrap
 *
 * Everything the first paint of Now needs *cheaply*: who Pulse is acting as, the
 * account wall, the growth strip, the standings and the counts. Each piece is
 * separately paginated behind its own endpoint; this only ever returns the first
 * page of each so the payload stays small.
 *
 * The card deck is deliberately NOT here. Two of its scanners aggregate
 * ms_trans, which has no usable index and costs a full scan of a million rows
 * each, so including them made this route take 12 seconds cold. /api/pulse/cards
 * is fetched straight afterwards and the cards drop in when they land — the rest
 * of Now renders immediately instead of waiting on them.
 */
export async function GET() {
  try {
    /* The caller's Pulse role, so the Rules tab can draw itself correctly from
       the first paint. Advisory only — the routes that write rules check the
       role themselves, and this is what stops a member being shown an edit
       pencil that would only ever come back 403. */
    const seat = await gate(false);
    const role = seat.state === "ok" ? seat.role : null;

    const me = await resolveMe();
    const meId = me?.id ?? null;

    const [mine, wall, g, ranks, anomaly, totals] = await Promise.all([
      meId ? listAccounts({ ownerId: meId }, page({ limit: 20 })) : Promise.resolve(null),
      listAccounts({}, page({ limit: 40 })),
      growth(meId),
      standings(meId, 50),
      auditAnomaly(),
      Promise.all([countAccounts(), countAccounts({ unownedOnly: true })]),
    ]);

    return NextResponse.json({
      ok: true,
      me,
      role,
      can: { editRules: role === "super_admin" },
      myAccounts: mine?.rows ?? [],
      myAccountsNext: mine?.nextCursor ?? null,
      wall: wall.rows,
      wallNext: wall.nextCursor,
      growth: g,
      standings: ranks,
      anomaly,
      counts: { accounts: totals[0], unowned: totals[1] },
      /* Every country the base is in, so the lens lists them all rather than
         only the ones that happen to be on the scored page of the board. */
      countries: await countryCounts(),
      askCatalogue: ASK_CATALOGUE,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const e = err as { message?: string; code?: string };
    return NextResponse.json(
      { ok: false, error: e.message ?? String(err), code: e.code },
      { status: 503 },
    );
  }
}

export const dynamic = "force-dynamic";
