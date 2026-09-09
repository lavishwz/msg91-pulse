/**
 * GET /api/auth/session — who the browser is signed in as.
 *
 * The page is static HTML rendered by public/pulse.js, so the front end has to
 * ask. Answers `{ ok:true, session:null }` rather than a 401 when there is no
 * session: this is also how the login page checks whether to skip the widget.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionFrom } from "@/lib/pulse/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({
    ok: true,
    session: session ? { user: session.user, org: session.org } : null,
  });
}
