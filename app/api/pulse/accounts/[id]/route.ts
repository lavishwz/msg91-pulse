import { NextResponse } from "next/server";
import {
  getAccount,
  accountRoutes,
  accountCommercial,
  accountComments,
  accountActivity,
} from "@/lib/pulse/accounts";
import { page } from "@/lib/pulse/paginate";

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

    const [routes, comments, activity, commercial] = await Promise.all([
      accountRoutes(accountId),
      accountComments(accountId, commentPage),
      accountActivity(accountId, activityPage),
      reveal ? accountCommercial(accountId, account.currency) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ok: true,
      account,
      routes,
      comments: comments.rows,
      commentsNext: comments.nextCursor,
      activity: activity.rows,
      activityNext: activity.nextCursor,
      commercial,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
