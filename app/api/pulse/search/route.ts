import { NextResponse } from "next/server";
import { listAccounts } from "@/lib/pulse/accounts";
import { page } from "@/lib/pulse/paginate";

/**
 * GET /api/pulse/search?q=… — ⌘K over real accounts.
 * Always capped at a screenful; the palette shows a handful of rows.
 */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ ok: true, rows: [] });
  try {
    const p = page({ limit: Number(new URL(req.url).searchParams.get("limit") ?? 12) });
    const { rows, nextCursor } = await listAccounts({ q }, p);
    return NextResponse.json({ ok: true, rows, nextCursor });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
