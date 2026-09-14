import { NextResponse } from "next/server";
import { resolveMe } from "@/lib/pulse/team";
import { listAccounts } from "@/lib/pulse/accounts";
import { toBoard } from "@/lib/pulse/health";
import { cachedHealthFor } from "@/lib/pulse/healthCron";
import { page } from "@/lib/pulse/paginate";

/**
 * GET /api/pulse/board?scope=me|team|company
 *
 * The score band and the board on Now: a health score per account, the four
 * bands, and how many climbed or slipped this month.
 *
 * Deliberately bounded. Health aggregates ms_trans, which has no secondary
 * index, so this scores a page of accounts (the same page the wall shows)
 * rather than the whole customer base — the header says how many were scored,
 * and the UI says so too. Scoring 10,000 accounts needs a nightly job writing
 * to a table Pulse is allowed to own, which it is not yet.
 *
 * The request below asks page() for LIMIT rows, but page() clamps every
 * caller to MAX_PAGE_SIZE (see lib/pulse/paginate.ts) — so the request for
 * LIMIT actually returns page({ limit: LIMIT }).limit rows, not LIMIT. That
 * real, enforced number — plus whether more accounts exist beyond it — is
 * reported back as `limit`/`truncated` so the board never looks complete when
 * it is only a first page.
 */
const LIMIT = 200;

export async function GET(req: Request) {
  try {
    const scope = new URL(req.url).searchParams.get("scope") ?? "me";
    const me = await resolveMe();
    const meId = me?.id ?? null;

    /* Your game is the accounts you own; the team and the company are the
       first page of everything, which is all one request can honestly score.
       "me" always filters, even to nothing (meId ?? -1, a real ownerId no
       account ever has) — it must never silently fall through to everyone
       else's accounts just because identity could not be resolved. */
    const filter = scope === "me" ? { ownerId: meId ?? -1 } : {};
    const { rows, nextCursor, limit } = await listAccounts(filter, page({ limit: LIMIT }));

    // Read the last cron pass's scores rather than calling the account-health
    // agent inline — see lib/pulse/healthCron.ts. An account this page shows
    // that no pass has reached yet is simply absent from the map here.
    // toBoard() used to treat that the same as "too new to score" — now it
    // tells them apart using signedUpAt, so the board can say "still being
    // scored" instead of implying there is nothing to see.
    const health = await cachedHealthFor(rows.map((a) => a.id));
    const board = toBoard(
      rows.map((a) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        country: a.country,
        countryFlag: a.countryFlag,
        // What lets toBoard tell "too new to have anything to score" apart
        // from "old enough, the cron just hasn't reached it yet" — see the
        // note on Board.unscored in lib/pulse/health.ts.
        signedUpAt: a.signedUpAt,
      })),
      health,
    );

    return NextResponse.json({
      ok: true,
      scope,
      board,
      scored: board.total,
      limit,
      truncated: nextCursor !== null,
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
