import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { activePolicy } from "@/lib/store";
import { setSendingPaused } from "@/lib/pulse/autopilot/drafts";

/**
 * GET  /api/pulse/autopilot/policy — the rules in force
 * POST /api/pulse/autopilot/policy — { paused: boolean } — the kill switch
 *
 * "Pause all automatic sending" was a command-bar item that did nothing. It now
 * writes a pulse_policy row, which the runner reads before every pass and the
 * release path checks before letting anything out.
 */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, policy: await activePolicy() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  /* Any member may do this, but it is recorded against the person who did
     it — the actor no longer comes from the request body. */
  const who = await writer();
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  try {
    const body = (await req.json()) as { paused?: boolean };
    if (typeof body.paused !== "boolean") {
      return NextResponse.json({ ok: false, error: "paused must be true or false" }, { status: 400 });
    }
    await setSendingPaused(body.paused, who.writer.email);
    return NextResponse.json({ ok: true, policy: await activePolicy() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
