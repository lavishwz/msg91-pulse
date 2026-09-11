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
import { enableViasocketApp, GMAIL_SERVICE_ID } from "@/lib/pulse/viasocket";

const SERVICES: ConnectionService[] = ["gmail", "cal", "slack"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Long enough for the event automations this route fires to actually finish.
 *
 * Every write here announces something through `emitEvent`, and `after()`
 * keeps the invocation alive for that work — but only up to `maxDuration`.
 * One event automation is one GTWY judging call, measured at 15-25 seconds
 * against the shared rule-worker, so the platform default (10-15s) kills the
 * invocation mid-call. Nothing reports it: the response already went out, so
 * the caller sees success while the automation never ran, wrote no alert and
 * wrote no decision row. Matches the 300 the scheduled runners already set
 * (tick, webhook, run, monthly) for exactly the same reason.
 */
export const maxDuration = 300;

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
      const viasocketId = typeof body?.viasocketId === "string" ? body.viasocketId : null;
      let scriptId: string | null = null;
      // Gmail is the only service Pulse runs actions against so far — the
      // enable call turns the auth_id from the popup into the script_id that
      // does that. Best-effort: a member is still "connected" without it,
      // just unable to see recent mail until they reconnect.
      if (service === "gmail" && viasocketId) {
        try {
          scriptId = await enableViasocketApp(session.user.email, viasocketId, GMAIL_SERVICE_ID);
        } catch (err) {
          console.warn("[pulse] viasocket enable failed:", (err as Error).message);
        }
      }
      await recordConnected(session.user.email, service, viasocketId, scriptId);
    } else {
      await recordDisconnected(session.user.email, service);
    }
    return NextResponse.json({ ok: true, connections: await connectionState(session.user.email) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
