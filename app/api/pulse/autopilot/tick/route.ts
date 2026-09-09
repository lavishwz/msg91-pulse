import { NextResponse } from "next/server";
import { tickSignups, storeSummary } from "@/lib/pulse/autopilot/runner";

/**
 * POST /api/pulse/autopilot/tick — run one Autopilot pass.
 *
 * Cron calls this; nothing else should. It is a POST because it acts, and it
 * requires a shared secret because acting on customers must not be reachable by
 * anyone who guesses a URL.
 *
 *   curl -X POST localhost:3002/api/pulse/autopilot/tick \
 *        -H "x-autopilot-secret: $AUTOPILOT_TICK_SECRET"
 *
 * The secret is required, not optional: an unset AUTOPILOT_TICK_SECRET makes
 * this endpoint refuse rather than run open. A missing config must never mean
 * "no authentication needed".
 */
export async function POST(req: Request) {
  const expected = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "AUTOPILOT_TICK_SECRET is not set — the runner refuses to run unprotected." },
      { status: 503 },
    );
  }

  const given = req.headers.get("x-autopilot-secret") ?? "";
  if (given !== expected) {
    return NextResponse.json({ ok: false, error: "bad or missing secret" }, { status: 401 });
  }

  try {
    const result = await tickSignups();
    return NextResponse.json(
      { ...result, store: await storeSummary() },
      // A tick that held everything is a real answer, not a server error — but
      // it should be visible to whatever is watching the cron.
      { status: result.ok ? 200 : 207 },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

/** GET is a dry status read: what the store holds, without acting. */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, store: await storeSummary() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
