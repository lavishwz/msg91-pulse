/**
 * POST /api/auth/refresh — re-check the invite list and extend the session.
 *
 * Called by the browser every few minutes (public/pulse-auth.js). It is the
 * mechanism that makes "remove a member" take effect on somebody already
 * signed in: their next refresh finds them off the list, gets a 401, and the
 * tab goes back to /login.
 *
 * Public in the middleware's eyes — it has to be reachable with a cookie the
 * guard would honour and one it would not — but it verifies the session itself
 * and answers 401 to anything else.
 */

import { NextResponse } from "next/server";
import { PROXY_COOKIE, SESSION_COOKIE } from "@/lib/pulse/auth";
import { gate } from "@/lib/pulse/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await gate();

  if (result.state === "ok") {
    return NextResponse.json({ ok: true, session: { user: result.session.user, org: result.session.org } });
  }

  if (result.state === "unavailable") {
    // Say what happened and leave the cookie alone: a database blip should not
    // sign the whole team out. The session still expires on its own shortly.
    return NextResponse.json(
      { ok: false, error: `Could not check the invite list: ${result.error}` },
      { status: 503 },
    );
  }

  const res = NextResponse.json(
    {
      ok: false,
      error:
        result.state === "revoked"
          ? "Your access to Pulse has been removed."
          : "Not signed in",
    },
    { status: 401 },
  );
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PROXY_COOKIE);
  return res;
}
