import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { acquireLock, releaseLock } from "@/lib/store";
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
 * Authenticated by middleware.ts's isMachineCall(): the URL cron-job.org is
 * given (see build.ts) carries ?secret=AUTOPILOT_TICK_SECRET, the same secret
 * the internal tick requires. A request that reaches this handler has already
 * presented it — this route does not re-check it.
 *
 * runOne() itself refuses to run a retired or non-live automation, so a
 * lingering copy of this URL (browser history, a queued cron-job.org retry)
 * cannot resurrect one after retireAutomation() has run.
 *
 * ── Why this responds before the work is done ───────────────────────────
 *
 * Tried raising every timeout in the chain first — cron-job.org's per-job
 * requestTimeout (set to 300s via their API) and the local dev tunnel's
 * ~100s wall — and it was not enough: found live, the morning after, that
 * cron-job.org enforces roughly a 30-second ceiling on this account
 * regardless of what requestTimeout is set to and echoes back. A single
 * real GTWY judge call alone can take 15-60s, so any run with actual rows to
 * judge kept failing on schedule even though it always finished correctly
 * when called by hand with a patient timeout.
 *
 * The actual fix: this is a persistent Node process, not a serverless
 * function that dies the moment a response is sent — so the response does
 * not have to wait for the work. cron-job.org gets an immediate 200 and its
 * own timeout becomes irrelevant at any value; the real pass keeps running
 * after the response is sent, same guard/watermark/decision machinery,
 * same budget. A per-automation lock (same pattern runAutomations already
 * uses for the internal tick) stops two overlapping fires of the same
 * automation from double-processing rows if a pass ever runs longer than
 * the interval between schedule ticks.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const a = await getAutomation(key);
  if (!a) return NextResponse.json({ ok: false, error: "no such automation" }, { status: 404 });

  const holder = randomUUID();
  const got = await acquireLock(`automation:${key}`, holder, 300);
  if (!got) {
    // A previous fire is still running this same automation — not an
    // error, just nothing new to start. cron-job.org sees a clean 200.
    return NextResponse.json({ ok: true, skipped: "already running" });
  }

  // Deliberately not awaited: see the comment above for why. Errors are
  // caught here because nothing downstream is left to catch them once the
  // response has already gone out.
  runOne(a, Date.now() + 250_000)
    .catch((err) => {
      console.error(`[pulse] automation ${key} failed in the background:`, (err as Error).message);
    })
    .finally(() => releaseLock(`automation:${key}`, holder));

  return NextResponse.json({ ok: true, started: true });
}

export const maxDuration = 300;

export const dynamic = "force-dynamic";
