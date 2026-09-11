import { NextResponse, after } from "next/server";
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

  // Not awaited — same reasoning as the automation webhook's comment: this
  // account's real cron-job.org enforces roughly a 30s ceiling no matter what
  // requestTimeout is set to, and no per-call budget reliably stays under
  // that once real GTWY latency is in the mix. On Vercel a bare un-awaited
  // call is not enough to survive the response being sent — after() is what
  // actually keeps the invocation alive for it (see the automation webhook's
  // comment for the full reasoning). runHealthPass() already takes its own
  // lock ("account-health"), so a fire that lands while a previous pass is
  // still running just gets told so, cleanly.
  after(() =>
    runHealthPass(250_000).catch((err) => {
      console.error("[pulse] health pass failed in the background:", (err as Error).message);
    }),
  );
  return NextResponse.json({ ok: true, started: true });
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
