/**
 * GET /api/pulse/missions?account=<ms_user.user_pid> — the missions open (or
 * recently closed) on one company, for the account page's "Open on this
 * account" section (handover §7.6, feature 20).
 *
 * Missions are AI/scanner-managed (lib/pulse/missions.ts::upsertMission) —
 * there is no human "create a mission" action here on purpose, matching the
 * PRD's "do not force a manual CRM stage" rule. A person acts through the
 * work items a mission produces, not by opening the mission itself.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import { listMissionsForAccount } from "@/lib/pulse/missions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function caller(): Promise<string | null> {
  const result = await gate();
  return result.state === "ok" ? result.session.user.email : null;
}

export async function GET(req: Request) {
  if (!(await caller())) {
    return NextResponse.json(
      { ok: false, error: "You are not signed in to Pulse, or your access has been removed." },
      { status: 401 },
    );
  }

  const account = new URL(req.url).searchParams.get("account") ?? "";
  if (!account) return NextResponse.json({ ok: false, error: "account is required" }, { status: 400 });

  try {
    return NextResponse.json({ ok: true, missions: await listMissionsForAccount(account) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
