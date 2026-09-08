import { NextResponse } from "next/server";
import { buildCards } from "@/lib/pulse/cards";

/** GET /api/pulse/cards?per=4 — the card deck, capped per scanner. */
export async function GET(req: Request) {
  const per = Number(new URL(req.url).searchParams.get("per") ?? 4);
  try {
    return NextResponse.json({ ok: true, cards: await buildCards({ perScanner: per }) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
