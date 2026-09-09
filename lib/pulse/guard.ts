/**
 * The Node-side half of the guard.
 *
 * middleware.ts proves the session is real. This proves the person is still
 * invited — a MySQL read, so it can only happen here, on the Node runtime.
 *
 * Two callers, both of which re-mint the cookie when the answer is yes:
 *   - the page render (app/page.tsx), so opening Pulse always re-checks;
 *   - POST /api/auth/refresh, so a tab left open keeps re-checking.
 *
 * Fails closed. A store that cannot be reached returns "not allowed", for the
 * same reason the login gate refuses rather than waves through: the list is
 * what makes Pulse closed, and an unreadable list is not an open one.
 */

import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionFrom,
  signSession,
  type Session,
} from "@/lib/pulse/auth";
import { memberAccess, type Role } from "@/lib/pulse/members";
import { roleAtLeast } from "@/lib/pulse/member-roles";
import { accessCached } from "@/lib/pulse/membership-cache";

export type GateResult =
  | { state: "anonymous" }
  | { state: "revoked"; session: Session }
  | { state: "unavailable"; session: Session; error: string }
  | { state: "ok"; session: Session; role: Role };

/**
 * Is this email still on the list, and as what? Cached for seconds, never
 * longer — the role is read here rather than taken from the session token,
 * because a promotion or demotion has to take effect without a re-login.
 */
export async function access(email: string) {
  return accessCached(email, () => memberAccess(email));
}

/**
 * Check the caller and, when they are still a member, extend their session.
 *
 * `renew` is false where the response has already begun and a cookie can no
 * longer be set — a server component render in a context Next does not allow
 * writes from. Callers that can write cookies leave it on.
 */
export async function gate(renew = true): Promise<GateResult> {
  const jar = await cookies();
  const session = await sessionFrom(jar.get(SESSION_COOKIE)?.value);
  if (!session) return { state: "anonymous" };

  let allowed: boolean;
  let role: Role;
  try {
    ({ allowed, role } = await access(session.user.email));
  } catch (err) {
    return { state: "unavailable", session, error: (err as Error).message };
  }
  if (!allowed) return { state: "revoked", session };

  if (renew) {
    try {
      const token = await signSession({ user: session.user, org: session.org });
      jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        // Matches the login route: a Secure cookie is never sent over the plain
        // http a dev server speaks, so the flag follows the scheme in use.
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
    } catch {
      /* A render that may not set cookies is not a failed check — the caller
         has already been verified, and the cookie simply keeps its old expiry. */
    }
  }

  return { state: "ok", session, role };
}

/**
 * The caller, for a route that writes.
 *
 * Two things happen here that did not happen before:
 *
 *   - the role is checked. Rule writes used to take no role at all, so any
 *     invited member could rewrite what Autopilot may do;
 *   - the actor is taken from the session rather than the request body. Every
 *     autopilot write used to accept `actor` as free text from the client and
 *     default it to "a person", which meant the log of who changed a rule was
 *     whatever the caller felt like typing.
 *
 * `need` is the lowest role allowed. Undefined means any member will do —
 * useful for the writes that are not rule changes but still must be attributed
 * to a real person.
 */
export type Writer = { email: string; role: Role };
export type WriterResult =
  | { ok: true; writer: Writer }
  | { ok: false; status: 401 | 403 | 503; error: string };



export async function writer(need?: Role): Promise<WriterResult> {
  const result = await gate();

  if (result.state === "anonymous")
    return { ok: false, status: 401, error: "You are not signed in to Pulse." };
  if (result.state === "revoked")
    return { ok: false, status: 401, error: "Your access to Pulse has been removed." };
  if (result.state === "unavailable")
    // Fails closed, for the same reason gate() does: an unreadable list is not
    // an open one.
    return { ok: false, status: 503, error: "The membership list could not be read: " + result.error };

  if (!roleAtLeast(result.role, need))
    return {
      ok: false,
      status: 403,
      error: `This needs ${need === "super_admin" ? "a super admin" : "an admin"}. You are signed in as ${result.role.replace("_", " ")}.`,
    };

  return { ok: true, writer: { email: result.session.user.email, role: result.role } };
}
