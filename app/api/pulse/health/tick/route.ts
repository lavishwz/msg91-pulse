import { NextResponse } from "next/server";
import { runHealthPass, healthCacheAge } from "@/lib/pulse/healthCron";

/**
 * POST /api/pulse/health/tick — score a batch of accounts and cache the result.
 *
 * Cron calls this; nothing else should. Same shared-secret rule as
 * /api/pulse/autopilot/tick, and the same reason: a missing config must never
 * silently mean "no authentication needed". Accepts the secret as a header
 * (x-autopilot-secret) or a query param (?secret=), matching middleware.ts's
 * own machine-call check, so cron-job.org can use whichever it can attach —
 * a query param on the URL when it cannot easily send a custom header.
 */
export async function POST(req: Request) {
  const expected = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "AUTOPILOT_TICK_SECRET is not set — the runner refuses to run unprotected." },
      { status: 503 },
    );
  }

  const given =
    req.headers.get("x-autopilot-secret") ?? new URL(req.url).searchParams.get("secret") ?? "";
  if (given !== expected) {
    return NextResponse.json({ ok: false, error: "bad or missing secret" }, { status: 401 });
  }

  try {
    const result = await runHealthPass();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

/** GET is a dry status read: how stale the cache is, without acting. */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, oldestScoreAt: await healthCacheAge() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
