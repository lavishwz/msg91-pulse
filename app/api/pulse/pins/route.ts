/**
 * GET /api/pulse/pins — the signed-in member's pinned questions
 * PUT /api/pulse/pins — replace them whole
 *
 * One row per member (lib/pulse/pins.ts). Pins are a personal preference, not
 * a shared record like a tag, so no ladder here either — a member may only
 * ever read and write their own row, which is why there is no :id in this
 * path at all; `caller()` supplies it.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import { getPins, savePins } from "@/lib/pulse/pins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function caller(): Promise<string | null> {
  const result = await gate();
  return result.state === "ok" ? result.session.user.email : null;
}

const refusal = () =>
  NextResponse.json(
    { ok: false, error: "You are not signed in to Pulse, or your access has been removed." },
    { status: 401 },
  );

export async function GET() {
  const email = await caller();
  if (!email) return refusal();

  try {
    return NextResponse.json({ ok: true, pins: await getPins(email) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const email = await caller();
  if (!email) return refusal();

  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json({ ok: true, pins: await savePins(email, body) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
