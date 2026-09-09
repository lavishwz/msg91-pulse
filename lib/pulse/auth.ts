/**
 * Sessions.
 *
 * Pulse does not keep passwords, and it does not keep users either. MSG91's
 * Proxy (routes.msg91.com) owns both: the login widget on /login hands back a
 * `proxy_auth_token`, Pulse turns that into a name, an email and an org, checks
 * the email against the invite list, and mints its own short-lived JWT.
 *
 * That JWT is the session. It is an HTTP-only cookie, signed with JWT_SECRET,
 * and it carries the email — because the guard re-checks membership on every
 * request, and an email is what the invite list is keyed on.
 *
 * Server-only. JWT_SECRET must never reach the browser, so nothing in a
 * "use client" file may import this.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "pulse_session";
export const PROXY_COOKIE = "proxy_auth_token";

/**
 * How long a session cookie lives.
 *
 * Short on purpose, and it is the revocation window rather than a comfort
 * setting. Next 15's middleware runs on the Edge runtime and cannot read the
 * invite list (mysql2 is Node-only), so between two Node-side checks the only
 * thing standing between a removed member and their old cookie is its expiry.
 * Thirty minutes bounds that. Nobody is signed out mid-shift for it: the page
 * re-mints on every load and the browser refreshes in the background
 * (public/pulse-auth.js → POST /api/auth/refresh), both of which re-check the
 * invite list on the way through.
 */
export const SESSION_TTL_SECONDS = 30 * 60;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

export type SessionClaims = {
  user: SessionUser;
  org: { id: string; name: string } | null;
};

export type Session = SessionClaims & JWTPayload & { tokenType: "pulse" };

function secret(): Uint8Array {
  const value = (process.env.JWT_SECRET ?? "").trim();
  if (!value) {
    throw new Error(
      "JWT_SECRET is not set, so Pulse cannot sign a session. Put a long random " +
        "string in .env.local — see docs/auth.md.",
    );
  }
  return new TextEncoder().encode(value);
}

/** True when signing is possible at all — used to fail loudly, early. */
export function isAuthConfigured(): boolean {
  return Boolean((process.env.JWT_SECRET ?? "").trim());
}

export function initialsOf(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const one = parts[0] ?? email;
  return one.slice(0, 2).toUpperCase();
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims, tokenType: "pulse" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

/**
 * Verify a session cookie. Throws on anything that is not a live Pulse session
 * — expired, tampered with, signed by another app, or minted by an older build
 * that did not carry an email.
 */
export async function verifySession(token: string): Promise<Session> {
  const { payload } = await jwtVerify(token, secret());
  const session = payload as Session;
  if (session.tokenType !== "pulse") throw new Error("Not a Pulse session token");
  if (!session.user?.email) throw new Error("Session carries no email");
  return session;
}

/** The session on a request, or null. Never throws — callers decide the answer. */
export async function sessionFrom(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
