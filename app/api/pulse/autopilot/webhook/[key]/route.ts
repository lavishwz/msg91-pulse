import { NextResponse } from "next/server";
import { getAutomation } from "@/lib/pulse/autopilot/automations";
import { runOne } from "@/lib/pulse/autopilot/automation-runner";

/**
 * POST /api/pulse/autopilot/webhook/[key] — what cron-job.org calls.
 *
 * Runs exactly one automation, once, through the same machinery the internal
 * tick uses for every automation — guard, watermark, pulse_decision,
 * pulse_signal, and the shared ruleWorker agent (runOne's default judge).
 * A dynamically built automation is not special at execution time: its
 * find_sql and its executor_prompt (stored as agent_task) are what make it
 * itself, not a dedicated agent.
 *
 * No auth on this route yet — deliberately, for now, while wiring this up.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const a = await getAutomation(key);
  if (!a) return NextResponse.json({ ok: false, error: "no such automation" }, { status: 404 });

  const run = await runOne(a, Date.now() + 90_000);
  return NextResponse.json({ ok: true, run });
}

export const dynamic = "force-dynamic";
