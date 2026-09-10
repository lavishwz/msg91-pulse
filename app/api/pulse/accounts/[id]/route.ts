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
import { accountProducts } from "@/lib/pulse/products";
import { ownerHistory } from "@/lib/pulse/ownership";
import { page } from "@/lib/pulse/paginate";
import { listTags } from "@/lib/pulse/tags";
import { healthFor } from "@/lib/pulse/health";
import { recordReveal, revealsFor } from "@/lib/pulse/reveals";
import { gate } from "@/lib/pulse/guard";

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
    let revealLogged = reveal;

    /* The reveal is the one read on this route that is itself an event. The
       button promises "opening them writes an audit event against your name",
       and until now nothing was written — see lib/pulse/reveals.ts. Recorded
       before the figures are fetched, so a reveal cannot succeed unrecorded;
       recordReveal never throws, so the reverse cannot happen either. */
    if (reveal) {
      try {
        const seat = await gate(false);
        const who = seat.state === "ok" || seat.state === "unavailable" ? seat.session.user.email : null;
        if (who) await recordReveal(accountId, account.name, who);
        else console.warn(`[pulse] commercial reveal of ${accountId} by an unidentified caller`);
      } catch (err) {
        /* Loud, but not fatal. Refusing to show a rep figures they are
           entitled to because the audit database blinked would be the wrong
           trade; an unrecorded reveal is worth an error in the log and a
           `revealLogged: false` on the response so the page can say so. */
        console.error("[pulse] REVEAL AUDIT FAILED:", err);
        revealLogged = false;
      }
    }

    // The two per-account feeds page independently, so "more notes" does not
    // also refetch the activity list.
    const commentPage = page({ limit: 10, offset: params.get("commentsFrom") });
    const activityPage = page({ limit: 10, offset: params.get("activityFrom") });

    const [routes, comments, activity, people, autopilot, commercial, health, tags, products, owners, reveals] =
      await Promise.all([
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
      /* The company's tags, from Pulse's own store. Sent with the page rather
         than fetched after it, so they are there on the first paint — and
         degraded to an empty list on failure, like autopilot above, because a
         store blip should not cost you the account. */
      listTags(accountId).catch(() => []),
      /* Which products this company is actually on. Reads MSG91's entitlement
         table and one evidence table per product — see lib/pulse/products.ts.
         Degraded to an empty list on failure like the two above: a product
         list is worth a lot, and not worth the whole page. */
      accountProducts(accountId).catch((err) => {
        console.warn("[pulse] products for " + accountId + " failed:", (err as Error).message);
        return [];
      }),
      /* Every time somebody reassigned this account in Pulse. Pulse's own
         store, so the same treatment. */
      ownerHistory(accountId).catch(() => []),
      /* Who else has looked at this company's commercials. Only sent on the
         reveal itself: it is the answer to "who has seen this", and that is
         not a question the page asks until somebody opens the section. */
      reveal ? revealsFor(accountId).catch(() => []) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      ok: true,
      account,
      routes,
      /* `routes` is SMS plumbing — one row per ms_text_bal route — and was
         standing in for the product list until now. Kept, because the wallet
         page reads it; superseded by `products` on the company page. */
      products,
      owners,
      reveals,
      revealLogged,
      comments: comments.rows,
      commentsNext: comments.nextCursor,
      people: people.rows,
      autopilot,
      activity: activity.rows,
      activityNext: activity.nextCursor,
      commercial,
      health: health.get(accountId) ?? null,
      tags,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
