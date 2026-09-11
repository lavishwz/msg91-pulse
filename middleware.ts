/**
 * The guard.
 *
 * Pulse is invite-only, which has to mean invite-only everywhere — not just on
 * the page. Every request passes through here: without a valid session cookie a
 * page is sent to /login and an API call gets a 401, so nothing is reachable by
 * knowing a URL.
 *
 * This runs on the Edge runtime, because that is the only runtime Next 15
 * middleware has, so it can verify the session (jose is edge-safe) but cannot
 * read the invite list (mysql2 is not). The membership re-check therefore lives
 * on the Node side — `lib/pulse/guard.ts`, called by the page render and by
 * /api/auth/refresh — and the session is deliberately short-lived so that a
 * removed member's existing cookie expires in minutes rather than in a day.
 * docs/auth.md sets out that split and why it is where the seam is.
 */

import { NextResponse, type NextRequest } from "next/server";
import { PROXY_COOKIE, SESSION_COOKIE, verifySession } from "@/lib/pulse/auth";

export const config = {
  // Everything except Next's own internals and static assets. The matcher is
  // wide on purpose: a new route is guarded the moment it is added, rather than
  // when somebody remembers to list it.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|gif|webp|ico|css|map)$).*)",
  ],
};

/** Reachable without a session: the login page and the routes it calls. */
function isPublic(pathname: string): boolean {
  return (
    pathname === "/login" ||
    // The service worker and manifest have to be fetchable with no session:
    // the browser requests them (and re-validates the worker) on its own
    // schedule, not only while a person is signed in, and a redirect to
    // /login in place of the script is what a `new Response()` failure to
    // register looks like.
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/api/auth/")
    // The per-automation webhook (/api/pulse/autopilot/webhook/[key]) is NOT
    // listed here: cron-job.org's outgoing calls now carry the same shared
    // secret the tick uses (see build.ts), so it is authenticated via
    // isMachineCall() below instead of being a public route.
  );
}

/**
 * The endpoints called by a schedule rather than a person. Each already checks
 * AUTOPILOT_TICK_SECRET itself and refuses to run when it is unset, so they are
 * not unauthenticated — they authenticate differently. The secret is compared
 * here too, so a wrong one is turned away by the guard rather than reaching the
 * handler.
 */
function isMachineCall(req: NextRequest): boolean {
  const expected = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
  if (!expected) return false;
  const presented =
    req.headers.get("x-autopilot-secret") ?? req.nextUrl.searchParams.get("secret") ?? "";
  return presented === expected;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // Somebody with a live session asking for /login has nothing to do there.
  if (pathname === "/login" && token) {
    try {
      await verifySession(token);
      return NextResponse.redirect(new URL("/", req.url));
    } catch {
      // Not a session after all — let the login page load.
    }
  }

  if (isPublic(pathname)) return NextResponse.next();
  if (isMachineCall(req)) return NextResponse.next();

  if (!token) return refuse(req);

  try {
    await verifySession(token);
    return NextResponse.next();
  } catch {
    // Expired or tampered with. Clear it rather than only refusing it, so the
    // next request is a clean login instead of the same failure again.
    return endSession(req);
  }
}

/** No session: a 401 for an API call, the login page for a person. */
function refuse(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }
  const url = new URL("/login", req.url);
  // So a deep link survives the round trip out to Proxy and back. The query
  // string comes with it: a screen's filters live there now (?scope=team), so
  // the path alone would land somebody a step away from where they were going.
  const next = req.nextUrl.pathname + req.nextUrl.search;
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function endSession(req: NextRequest) {
  const res = refuse(req);
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PROXY_COOKIE);
  return res;
}
