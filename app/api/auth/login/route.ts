/**
 * POST /api/auth/login — turn a Proxy login into a Pulse session.
 *
 * The browser arrives at /login?proxy_auth_token=…&user_ref_id=…&company_ref_id=…
 * after the widget has done its work, and posts those three values here. This
 * route asks Proxy who they are, checks the email against the invite list, and
 * sets the session cookie.
 *
 * Public — the guard in middleware.ts lets /api/auth through, because this is
 * the route you have to be able to reach before you have a session. Nothing is
 * trusted from the body beyond the three opaque values, and each is checked
 * against Proxy rather than read.
 */

import { NextResponse } from "next/server";
import { isAuthConfigured, initialsOf, signSession, PROXY_COOKIE, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/pulse/auth";
import { checkAndRecordLogin, type Role } from "@/lib/pulse/members";
import { resolveIdentity } from "@/lib/pulse/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* A cookie marked Secure is not sent over plain http, so a dev server on
   localhost would set one and never see it again. Decided per request from the
   scheme the proxy in front of us reports, so production keeps the flag. */
function isHttps(req: Request): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  return new URL(req.url).protocol === "https:";
}

export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Pulse has no JWT_SECRET set, so it cannot sign you in. See docs/auth.md." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    proxy_auth_token?: string;
    user_ref_id?: string;
    company_ref_id?: string;
  };
  const proxyAuthToken = body.proxy_auth_token?.trim();
  const userRefId = body.user_ref_id?.trim();
  const companyRefId = body.company_ref_id?.trim() || null;

  if (!proxyAuthToken || !userRefId) {
    return NextResponse.json(
      { ok: false, error: "Missing proxy_auth_token or user_ref_id" },
      { status: 400 },
    );
  }

  let identity;
  try {
    identity = await resolveIdentity({ proxyAuthToken, userRefId, companyRefId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 401 });
  }

  /* The invite gate. A store that cannot be reached is a refusal, not a pass:
     the whole point of the list is that Pulse is closed by default. The role
     comes back with the answer but is not put in the token — the guard reads it
     fresh, so a promotion does not need a re-login. */
  let role: Role | null;
  try {
    role = await checkAndRecordLogin(
      identity.user.email,
      identity.user.name || null,
      identity.user.id || null,
    );
  } catch (err) {
    console.error("[pulse] invite list unreachable at login:", (err as Error).message);
    return NextResponse.json(
      { ok: false, error: "Pulse cannot reach its own database to check the invite list. Try again in a minute." },
      { status: 503 },
    );
  }

  if (!role) {
    return NextResponse.json(
      {
        ok: false,
        error: `${identity.user.email} has not been invited to Pulse. Ask somebody who is already in to invite you.`,
      },
      { status: 403 },
    );
  }

  const user = {
    id: identity.user.id,
    name: identity.user.name || identity.user.email,
    email: identity.user.email,
    initials: initialsOf(identity.user.name || identity.user.email, identity.user.email),
  };
  const token = await signSession({ user, org: identity.org });

  const res = NextResponse.json({ ok: true, user, org: identity.org, role });
  const cookie = {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
  res.cookies.set(SESSION_COOKIE, token, cookie);
  // Kept so logout can invalidate the token on Proxy's side as well as here.
  res.cookies.set(PROXY_COOKIE, proxyAuthToken, cookie);
  return res;
}
