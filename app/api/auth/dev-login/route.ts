/**
 * POST /api/auth/dev-login — local-development-only sign-in.
 *
 * The real /login flow depends on MSG91's proxy-auth widget (36blocks.com),
 * which renders empty on a domain it does not recognise — most likely
 * localhost, since nobody registers a dev machine on that allowed-origin
 * list. That is a config question for whoever owns the widget's REFERENCEID,
 * not a bug in this app, and it should not be the reason nobody can sign in
 * on their own machine to test anything else.
 *
 * This route is the same invite-list check and the same session cookie the
 * real login mints (checkAndRecordLogin, signSession) — the only thing it
 * skips is asking Proxy who the browser is, which is exactly the step that
 * cannot work locally anyway. It is compiled out of a production build by
 * the NODE_ENV check below, so this is never a second way in once deployed.
 */

import { NextResponse } from "next/server";
import { isAuthConfigured, initialsOf, signSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/pulse/auth";
import { checkAndRecordLogin } from "@/lib/pulse/members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  if (!isAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Pulse has no JWT_SECRET set, so it cannot sign you in. See docs/auth.md." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
  }

  let role;
  try {
    role = await checkAndRecordLogin(email, null, null);
  } catch (err) {
    console.error("[pulse] invite list unreachable at dev login:", (err as Error).message);
    return NextResponse.json(
      { ok: false, error: "Pulse cannot reach its own database to check the invite list. Try again in a minute." },
      { status: 503 },
    );
  }

  if (!role) {
    return NextResponse.json(
      { ok: false, error: `${email} has not been invited to Pulse. Ask somebody who is already in to invite you.` },
      { status: 403 },
    );
  }

  const user = { id: email, name: email, email, initials: initialsOf(email, email) };
  // No org: the real thing comes from Proxy, which this route has no token to
  // ask. Downstream already treats a null org as "no org known" — the same
  // shape a real login carries whenever Proxy itself has none on file.
  const token = await signSession({ user, org: null });

  const res = NextResponse.json({ ok: true, user, org: null, role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
