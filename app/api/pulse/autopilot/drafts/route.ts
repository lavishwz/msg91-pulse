import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { listDrafts, releaseDraft, sendDraft, discardDraft } from "@/lib/pulse/autopilot/drafts";

/**
 * GET  /api/pulse/autopilot/drafts?status=held — what is waiting on a person
 * POST /api/pulse/autopilot/drafts             — { id, action, body? }
 *
 * `action` is "release" (marks approved; nothing is sent — see the note in
 * drafts.ts on why this is not the same as "send"), "send" (release AND
 * actually deliver it via the sender's connected Gmail — the one action in
 * this whole app that puts a message in front of a real customer), or
 * "discard". Both release and send re-check the price rule against whatever
 * text is actually going out, including a rep's edits.
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
  /* Any member may do this, but it is recorded against the person who did
     it — the actor no longer comes from the request body. */
  const who = await writer();
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  try {
    const body = (await req.json()) as {
      id?: number;
      action?: "release" | "send" | "discard";
      body?: string;
    };
    if (!body.id || !body.action) {
      return NextResponse.json({ ok: false, error: "id and action are required" }, { status: 400 });
    }
    const actor = who.writer.email;
    const res =
      body.action === "release"
        ? await releaseDraft(body.id, actor, body.body)
        : body.action === "send"
          ? await sendDraft(body.id, actor, body.body)
          : await discardDraft(body.id, actor);

    // A refused release is a 409, not a 500: the rule worked, and the message
    // says which rule and why.
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
