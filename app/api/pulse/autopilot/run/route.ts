import { NextResponse } from "next/server";
import { runAutopilot, storeSummary } from "@/lib/pulse/autopilot/runner";
import { lockState } from "@/lib/store";

/**
 * POST /api/pulse/autopilot/run — one scheduled pass. Call this every 5 minutes.
 *
 * This is the only endpoint a scheduler needs. It reads new signups, triages
 * them, writes the decisions, then drafts messages with whatever time is left.
 * Nothing is held in memory between calls: every phase re-derives its work from
 * the store, so a call that is cut short leaves the rest for the next one.
 *
 *   curl -X POST https://your-host/api/pulse/autopilot/run \
 *        -H "x-autopilot-secret: $AUTOPILOT_TICK_SECRET"
 *
 * Safe to call more often than needed. If a previous run is still going this
 * returns 200 with `ran: false` rather than starting a second one — a duplicate
 * would not corrupt anything, but it would spend AI calls twice.
 *
 * A caught-up run costs about 20ms and makes no AI calls at all, so a five
 * minute schedule against roughly four signups a day is nearly free. The
 * frequency exists for the SLA — a signup above the threshold is meant to reach
 * a person within ten minutes — not for the volume.
 */
export async function POST(req: Request) {
  const expected = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "AUTOPILOT_TICK_SECRET is not set — the runner refuses to run unprotected." },
      { status: 503 },
    );
  }

  // Accept the secret in either place: schedulers differ in what they can send,
  // and a query string is the one thing every one of them can do.
  const url = new URL(req.url);
  const given = req.headers.get("x-autopilot-secret") ?? url.searchParams.get("secret") ?? "";
  if (given !== expected) {
    return NextResponse.json({ ok: false, error: "bad or missing secret" }, { status: 401 });
  }

  try {
    const result = await runAutopilot();
    return NextResponse.json(
      { ...result, store: await storeSummary() },
      // 200 when the pass was clean, 207 when something was held — so a
      // scheduler watching status codes can tell "nothing to do" from
      // "something needs looking at" without parsing the body.
      { status: result.ok ? 200 : 207 },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

/** GET — is a run in progress, and what does the store hold? No side effects. */
export async function GET() {
  try {
    const lock = await lockState("autopilot");
    return NextResponse.json({
      ok: true,
      running: Boolean(lock && lock.expires_at > new Date()),
      since: lock?.acquired_at ?? null,
      store: await storeSummary(),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
