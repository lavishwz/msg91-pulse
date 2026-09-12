import { randomUUID } from "node:crypto";
import { NextResponse, after } from "next/server";
import { acquireLock, releaseLock } from "@/lib/store";
import { getAutomation } from "@/lib/pulse/autopilot/automations";
import { runOne } from "@/lib/pulse/autopilot/automation-runner";
import { webhookKeyMatches } from "@/lib/pulse/autopilot/webhookKey";

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
 * Authenticated by this route itself, on the ?k= it is called with — a key
 * derived for this one automation (lib/pulse/autopilot/webhookKey.ts), not the
 * shared AUTOPILOT_TICK_SECRET the URL used to carry. middleware.ts lets the
 * path through unauthenticated precisely so that check can happen here, where
 * the automation being addressed is known; it used to rely on isMachineCall(),
 * which could only ever ask "does this caller hold the secret that opens every
 * machine endpoint".
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
 * The actual fix: the response does not have to wait for the work — but on
 * Vercel (a serverless runtime, not a persistent process the way this was
 * first written and tested against a local tunnel) simply not awaiting a
 * promise is not enough. Once a route handler returns, the platform is free
 * to freeze or tear down the invocation at any moment; an un-awaited
 * `runOne(...)` call could be silently cut off mid-pass with no error and no
 * released lock, which is exactly the failure mode that must not happen
 * unattended overnight. `after()` (next/server) is Next's own answer to
 * this: it keeps the invocation alive to run its callback after the response
 * has been sent, on Vercel specifically via Vercel's waitUntil under the
 * hood. cron-job.org still gets an immediate 200 and its own timeout is
 * still irrelevant at any value — the difference is the platform now knows
 * to keep the process around for the real pass. A per-automation lock (same
 * pattern runAutomations already uses for the internal tick) stops two
 * overlapping fires of the same automation from double-processing rows if a
 * pass ever runs longer than the interval between schedule ticks.
 */
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  /* Authenticated here, not only by middleware.
   *
   * The URL build.ts registers now carries ?k=<per-automation key> instead of
   * ?secret=AUTOPILOT_TICK_SECRET. cron-job.org stores that URL forever and
   * shows it in its dashboard, and the shared secret also opens /tick, /run,
   * /monthly, /store/migrate and the nightly digest — every job in a third
   * party's account held the key to every machine endpoint in the product.
   * See lib/pulse/autopilot/webhookKey.ts.
   *
   * The shared-secret fallback is gone. It existed so jobs registered before
   * the per-automation key did not all break on deploy; repoint-cron-jobs.mjs
   * has since rewritten every automation webhook to ?k=, and both were watched
   * firing cleanly on the new key afterwards.
   *
   * Worth removing rather than leaving harmless: it was the one place the
   * shared secret was checked with `===` on a route that middleware
   * deliberately skips, and while it stood, the whole point of the change —
   * that a URL sitting in cron-job.org's dashboard no longer opens every
   * machine endpoint — was only true of the jobs that happened to be
   * repointed. The tick still authenticates with the shared secret, but that
   * is /tick, a different path with no automation to derive a key from. */
  const params_ = new URL(req.url).searchParams;
  if (!webhookKeyMatches(key, params_.get("k"))) {
    /* Deliberately the same answer an unknown automation gets, so a caller
       with a wrong key cannot use this to learn which automations exist. */
    return NextResponse.json({ ok: false, error: "no such automation" }, { status: 404 });
  }

  const a = await getAutomation(key);
  if (!a) return NextResponse.json({ ok: false, error: "no such automation" }, { status: 404 });

  const holder = randomUUID();
  const got = await acquireLock(`automation:${key}`, holder, 300);
  if (!got) {
    // A previous fire is still running this same automation — not an
    // error, just nothing new to start. cron-job.org sees a clean 200.
    return NextResponse.json({ ok: true, skipped: "already running" });
  }

  // Runs after the response is sent, but the invocation is kept alive for it
  // — see the comment above for why that distinction matters here. Errors
  // are caught inside because nothing downstream is left to catch them once
  // the response has already gone out.
  after(() =>
    runOne(a, Date.now() + 250_000)
      .catch((err) => {
        console.error(`[pulse] automation ${key} failed in the background:`, (err as Error).message);
      })
      .finally(() => releaseLock(`automation:${key}`, holder)),
  );

  return NextResponse.json({ ok: true, started: true });
}

export const maxDuration = 300;

export const dynamic = "force-dynamic";
