/**
 * GET /api/pulse/gmail/recent — the signed-in member's last 10 Gmail
 * messages, for the "Recent mail" panel on their profile page.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionFrom } from "@/lib/pulse/auth";
import { recentMails } from "@/lib/pulse/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  try {
    const mails = await recentMails(session.user.email, 10);
    return NextResponse.json({ ok: true, mails });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 409 });
  }
}
