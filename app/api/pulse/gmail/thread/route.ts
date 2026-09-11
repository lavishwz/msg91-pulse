/**
 * GET /api/pulse/gmail/thread — the full thread and attachments behind one
 * row in "Recent mail". Separate from /gmail/recent because it's a second,
 * heavier ViaSocket call per message — only worth making once somebody
 * actually opens that one mail.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionFrom } from "@/lib/pulse/auth";
import { mailDetail } from "@/lib/pulse/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const threadId = url.searchParams.get("threadId");
  const attachmentCount = Number(url.searchParams.get("attachmentCount") ?? 0) || 0;
  if (!id || !threadId) {
    return NextResponse.json({ ok: false, error: "id and threadId are required" }, { status: 400 });
  }

  try {
    const detail = await mailDetail(session.user.email, id, threadId, attachmentCount);
    return NextResponse.json({ ok: true, ...detail });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 409 });
  }
}
