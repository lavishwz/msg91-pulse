import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { buildAutomation } from "@/lib/pulse/autopilot/build";
import type { Motion } from "@/lib/pulse/autopilot/automations";

/**
 * POST /api/pulse/autopilot/build — { english, motion }
 *
 * The dynamic path: plan the rule, provision its executor agent on GTWY,
 * subscribe a cron-job.org job if it needs one, save it. Same super_admin
 * gate as /rules, for the same reason — this is what Autopilot may do on
 * its own.
 */
export async function POST(req: Request) {
  const who = await writer("super_admin");
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  const b = (await req.json().catch(() => ({}))) as { english?: string; motion?: Motion };
  if (!b.english?.trim() || !b.motion) {
    return NextResponse.json({ ok: false, error: "english and motion are required" }, { status: 400 });
  }

  const result = await buildAutomation(b.english.trim(), b.motion, who.writer.email);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export const dynamic = "force-dynamic";
