import { NextResponse } from "next/server";
import { resolveMe } from "@/lib/pulse/team";
import { listAccounts } from "@/lib/pulse/accounts";
import { healthFor, toBoard } from "@/lib/pulse/health";
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
 */
const LIMIT = 200;

export async function GET(req: Request) {
  try {
    const scope = new URL(req.url).searchParams.get("scope") ?? "me";
    const me = await resolveMe();
    const meId = me?.id ?? null;

    /* Your game is the accounts you own; the team and the company are the
       first page of everything, which is all one request can honestly score. */
    const filter = scope === "me" && meId ? { ownerId: meId } : {};
    const { rows } = await listAccounts(filter, page({ limit: LIMIT }));

    const health = await healthFor(rows.map((a) => ({ id: a.id, hasOwner: Boolean(a.owner), ageDays: a.ageDays })));
    const board = toBoard(
      rows.map((a) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        country: a.country,
        countryFlag: a.countryFlag,
      })),
      health,
    );

    return NextResponse.json({
      ok: true,
      scope,
      board,
      scored: board.total,
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
