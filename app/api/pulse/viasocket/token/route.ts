/**
 * GET /api/pulse/viasocket/token — a fresh embed token for the "Connect app"
 * button (Gmail, Calendar, …). Signed here, not in the browser, so
 * VIASOCKET_ACCESS_KEY never leaves the server. Scoped to whoever is signed
 * in, via their Pulse session email as ViaSocket's unique_identifier — that
 * is what keeps one member's connected accounts from bleeding into another's.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionFrom } from "@/lib/pulse/auth";
import { isViasocketConfigured, signViasocketToken } from "@/lib/pulse/viasocket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  if (!isViasocketConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "VIASOCKET_ORG_ID, VIASOCKET_PROJECT_ID and VIASOCKET_ACCESS_KEY must be set. See .env.example.",
      },
      { status: 501 },
    );
  }
  try {
    const token = await signViasocketToken(session.user.email);
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
