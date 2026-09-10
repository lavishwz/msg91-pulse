/**
 * GET  /api/pulse/connections — the signed-in member's own Gmail/Calendar/Slack state.
 * POST /api/pulse/connections — record what ViaSocket just told the browser.
 *
 * The token endpoint (viasocket/token) lets the browser open a connection;
 * this is what makes the result stick on Pulse's own side, so it survives a
 * reload instead of living only in the page's in-memory ME.gmail/ME.cal/ME.slackapp.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionFrom } from "@/lib/pulse/auth";
import {
  connectionState,
  recordConnected,
  recordDisconnected,
  teamConnectionSummary,
  type ConnectionService,
} from "@/lib/pulse/connections";

const SERVICES: ConnectionService[] = ["gmail", "cal", "slack"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?view=team — everyone's state, for the Autopilot "Connections" tab. */
export async function GET(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  try {
    if (new URL(req.url).searchParams.get("view") === "team") {
      return NextResponse.json({ ok: true, team: await teamConnectionSummary() });
    }
    return NextResponse.json({ ok: true, connections: await connectionState(session.user.email) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const service = body?.service;
  const action = body?.action;
  if (!SERVICES.includes(service)) {
    return NextResponse.json({ ok: false, error: `service must be one of ${SERVICES.join(", ")}` }, { status: 400 });
  }
  if (action !== "connected" && action !== "disconnected") {
    return NextResponse.json({ ok: false, error: 'action must be "connected" or "disconnected"' }, { status: 400 });
  }

  try {
    if (action === "connected") {
      await recordConnected(session.user.email, service, typeof body?.viasocketId === "string" ? body.viasocketId : null);
    } else {
      await recordDisconnected(session.user.email, service);
    }
    return NextResponse.json({ ok: true, connections: await connectionState(session.user.email) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
