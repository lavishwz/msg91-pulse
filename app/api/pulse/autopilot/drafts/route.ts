import { NextResponse } from "next/server";
import { listDrafts, releaseDraft, discardDraft } from "@/lib/pulse/autopilot/drafts";

/**
 * GET  /api/pulse/autopilot/drafts?status=held — what is waiting on a person
 * POST /api/pulse/autopilot/drafts             — { id, action, body?, actor? }
 *
 * `action` is "release" or "discard". Release re-checks the price rule against
 * whatever text is actually going out, including a rep's edits — see
 * lib/pulse/autopilot/drafts.ts.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "held";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 25), 100);
  try {
    return NextResponse.json({ ok: true, drafts: await listDrafts(status, limit) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: number;
      action?: "release" | "discard";
      body?: string;
      actor?: string;
    };
    if (!body.id || !body.action) {
      return NextResponse.json({ ok: false, error: "id and action are required" }, { status: 400 });
    }
    const actor = body.actor ?? "unknown";
    const res =
      body.action === "release"
        ? await releaseDraft(body.id, actor, body.body)
        : await discardDraft(body.id, actor);

    // A refused release is a 409, not a 500: the rule worked, and the message
    // says which rule and why.
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
