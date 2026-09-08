import { NextResponse } from "next/server";
import { listAccounts, type AccountFilter } from "@/lib/pulse/accounts";
import { pageFromUrl } from "@/lib/pulse/paginate";
import type { Entity, Motion } from "@/lib/pulse/domain";

/** GET /api/pulse/accounts?owner=&unowned=1&entity=&motion=&q=&limit=&cursor= */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const filter: AccountFilter = {
    ownerId: q.get("owner") ? Number(q.get("owner")) : undefined,
    unownedOnly: q.get("unowned") === "1",
    entity: (q.get("entity") as Entity) || undefined,
    motion: (q.get("motion") as Motion) || undefined,
    q: q.get("q") || undefined,
  };
  try {
    return NextResponse.json({ ok: true, ...(await listAccounts(filter, pageFromUrl(req.url))) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
