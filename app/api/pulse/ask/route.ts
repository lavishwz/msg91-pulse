import { NextResponse } from "next/server";
import { answer, ASK_CATALOGUE } from "@/lib/pulse/ask";

/**
 * GET /api/pulse/ask?q=churn            — one answer
 * GET /api/pulse/ask?q=unowned&offset=20 — the next slice of a table answer
 * GET /api/pulse/ask?q=churn&fresh=1     — the same answer, recomputed
 * GET /api/pulse/ask                     — the catalogue
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const id = params.get("q");
  const offset = Math.max(0, Number(params.get("offset") ?? 0) || 0);
  const fresh = params.get("fresh") === "1";
  try {
    if (!id) return NextResponse.json({ ok: true, catalogue: ASK_CATALOGUE });
    return NextResponse.json({ ok: true, answer: await answer(id, offset, fresh) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
