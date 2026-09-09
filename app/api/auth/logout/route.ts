/**
 * POST /api/auth/logout — end the session.
 *
 * Two halves, in this order: tell Proxy the token is finished with, then clear
 * the cookies. The first is best-effort with a timeout; the second always
 * happens, because a logout that leaves somebody signed in because a remote
 * service was slow is not a logout.
 */

import { NextResponse, type NextRequest } from "next/server";
import { PROXY_COOKIE, SESSION_COOKIE } from "@/lib/pulse/auth";
import { revokeProxyToken } from "@/lib/pulse/proxy";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const proxyAuthToken = req.cookies.get(PROXY_COOKIE)?.value;
  if (proxyAuthToken) await revokeProxyToken(proxyAuthToken);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PROXY_COOKIE);
  return res;
}
