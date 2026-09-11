import { NextResponse } from "next/server";
import { runHealthDigest } from "@/lib/pulse/autopilot/healthDigest";

/**
 * POST /api/pulse/health/nightly-digest-tick — the health-band-movement
 * digest (lib/pulse/autopilot/healthDigest.ts). Cron calls this at midnight;
 * nothing else should. Same shared-secret rule as every other tick endpoint.
 *
 * Fire-and-forget, same reasoning as /api/pulse/autopilot/tick and
 * /api/pulse/health/tick: this account's cron-job.org enforces roughly a 30s
 * ceiling regardless of requestTimeout, and a real GTWY judge call alone can
 * take well past that.
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

  runHealthDigest().catch((err) => {
    console.error("[pulse] health digest failed in the background:", (err as Error).message);
  });
  return NextResponse.json({ ok: true, started: true });
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
