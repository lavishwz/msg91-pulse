import { NextResponse } from "next/server";
import { getAutomation } from "@/lib/pulse/autopilot/automations";
import { runOne } from "@/lib/pulse/autopilot/automation-runner";
import { judgeRowWithAgent } from "@/lib/pulse/agents";

/**
 * POST /api/pulse/autopilot/webhook/[key] — what cron-job.org calls.
 *
 * Runs exactly one automation, once, using its own dynamically-created GTWY
 * agent instead of the shared ruleWorker — everything else (guard, watermark,
 * pulse_decision, pulse_signal) is the same machinery the internal tick uses,
 * via automation-runner's runOne with a custom judge.
 *
 * No auth on this route yet — deliberately, for now, while wiring this up.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const a = await getAutomation(key);
  if (!a) return NextResponse.json({ ok: false, error: "no such automation" }, { status: 404 });
  if (!a.gtwyAgentId) {
    return NextResponse.json(
      { ok: false, error: "this automation has no executor agent — it is not a dynamically built rule" },
      { status: 409 },
    );
  }

  const run = await runOne(a, Date.now() + 90_000, (english, _task, row) =>
    judgeRowWithAgent(a.gtwyAgentId!, english, row),
  );
  return NextResponse.json({ ok: true, run });
}

export const dynamic = "force-dynamic";
