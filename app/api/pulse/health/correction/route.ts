/**
 * POST /api/pulse/health/correction — a rep flagging a health score as wrong.
 *
 * Records disagreement against migrations/031_health_correction.sql. Does not
 * change the score itself — see the note there on why a flag, not a rewrite.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import { flagHealthScore } from "@/lib/pulse/healthCorrection";

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

const MAX_NOTE_LENGTH = 500;

export async function POST(req: Request) {
  const email = await caller();
  if (!email) return refusal();

  const body = (await req.json().catch(() => ({}))) as {
    accountId?: string;
    score?: number;
    band?: string;
    decidedBy?: string;
    note?: string;
  };

  const accountId = String(body.accountId ?? "").trim();
  const score = Number(body.score);
  const band = String(body.band ?? "").trim();
  const decidedBy = body.decidedBy === "ai" ? "ai" : "formula";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, MAX_NOTE_LENGTH) : null;

  if (!accountId || !Number.isFinite(score) || !band) {
    return NextResponse.json(
      { ok: false, error: "accountId, score and band are required" },
      { status: 400 },
    );
  }

  try {
    await flagHealthScore({
      accountPid: accountId,
      shownScore: score,
      shownBand: band,
      decidedBy,
      note: note || null,
      raisedBy: email,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
