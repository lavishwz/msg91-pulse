import { NextResponse } from "next/server";
import { forAccount } from "@/lib/pulse/autopilot/log";
import {
  getAccount,
  accountRoutes,
  accountCommercial,
  accountComments,
  accountActivity,
  accountPeople,
} from "@/lib/pulse/accounts";
import { page } from "@/lib/pulse/paginate";
import { healthFor } from "@/lib/pulse/health";

/**
 * GET /api/pulse/accounts/:id            — L0/L1: the account and its context
 * GET /api/pulse/accounts/:id?reveal=1   — adds L2 commercial figures
 *
 * The reveal is a separate request on purpose (handover §5): commercial data is
 * never ambient, and asking for it is the event that would be audited.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const accountId = Number(id);
  if (!Number.isFinite(accountId)) {
    return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });
  }

  try {
    const account = await getAccount(accountId);
    if (!account) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    const params = new URL(req.url).searchParams;
    const reveal = params.get("reveal") === "1";

    // The two per-account feeds page independently, so "more notes" does not
    // also refetch the activity list.
    const commentPage = page({ limit: 10, offset: params.get("commentsFrom") });
    const activityPage = page({ limit: 10, offset: params.get("activityFrom") });

    const [routes, comments, activity, people, autopilot, commercial, health] = await Promise.all([
      accountRoutes(accountId),
      accountComments(accountId, commentPage),
      accountActivity(accountId, activityPage),
      accountPeople(accountId),
      /* What Autopilot has done about this company. Reads Pulse's own store, so
         a failure there must not take the whole page down — the account is
         still worth showing without it. */
      forAccount(accountId).catch(() => null),
      reveal ? accountCommercial(accountId, account.currency) : Promise.resolve(null),
      /* The same score the board uses, with its four components — so "which
         part moved" is answerable on the page the board sends you to. */
      healthFor([{ id: accountId, hasOwner: Boolean(account.owner), ageDays: account.ageDays }]),
    ]);

    return NextResponse.json({
      ok: true,
      account,
      routes,
      comments: comments.rows,
      commentsNext: comments.nextCursor,
      people: people.rows,
      autopilot,
      activity: activity.rows,
      activityNext: activity.nextCursor,
      commercial,
      health: health.get(accountId) ?? null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
