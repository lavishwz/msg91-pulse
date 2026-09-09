import { NextResponse } from "next/server";
import { all, reset } from "@/lib/pulse/autopilot/breaker";

/**
 * GET  /api/pulse/autopilot/breakers — every agent's breaker, tripped or not
 * POST /api/pulse/autopilot/breakers — { agent, actor } clears one
 *
 * Clearing is deliberate and attributed. A breaker that reset itself after an
 * hour would let the same runaway through twelve times a day and nobody would
 * ever learn what caused it.
 */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, breakers: await all() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { agent?: string; actor?: string };
    if (!b.agent) return NextResponse.json({ ok: false, error: "agent is required" }, { status: 400 });
    const done = await reset(b.agent, b.actor ?? "a person");
    return NextResponse.json({ ok: done, breakers: await all() }, { status: done ? 200 : 404 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
