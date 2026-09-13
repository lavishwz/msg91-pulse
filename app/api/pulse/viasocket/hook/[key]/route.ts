/**
 * POST /api/pulse/viasocket/hook/[key] — where a ViaSocket trigger lands.
 *
 * This is the one Pulse endpoint a third party calls unprompted. It carries no
 * session (ViaSocket has none) and no shared secret (see middleware.ts for why
 * it does not get AUTOPILOT_TICK_SECRET): the `key` in the path is a random
 * UUID minted per subscription, and an unknown one is refused. Knowing the URL
 * is the whole authorisation, which is why it is never logged or returned
 * anywhere a browser could read it for a different member.
 *
 * The handler records that the event arrived and answers ViaSocket immediately
 * — the response is what ViaSocket is timing, and a slow answer here is a
 * trigger it marks failed and eventually stops calling. What used to end there
 * ("no fan-out, no agent call" — this docstring, until a rule written against
 * "the ViaSocket trigger" turned out to have nothing to react to: the fixed
 * event catalogue offered only the connect/disconnect housekeeping events,
 * never the trigger firing itself). Fan-out to any automation listening for
 * `trigger.fired` now happens after the response, via `after()`, the same
 * pattern every other event emitter in this codebase uses to survive past the
 * request that triggered it on serverless compute.
 */

import { NextResponse, after } from "next/server";
import { subscriptionByHookKey, recordEvent } from "@/lib/pulse/triggers";
import { emitEvent } from "@/lib/pulse/autopilot/automation-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Long enough for `trigger.fired` listeners to actually finish.
 *
 * One event automation is one GTWY judging call, measured at 15-25 seconds —
 * matches maxDuration on every other route that calls emitEvent (tags,
 * owner, tick, webhook) for the same reason: the platform default kills the
 * invocation mid-call, the response has already gone out, and the caller
 * sees success while the automation never actually ran.
 */
export const maxDuration = 300;

async function handle(req: Request, key: string) {
  if (!key || key.length < 16) {
    return NextResponse.json({ ok: false, error: "unknown hook" }, { status: 404 });
  }

  const sub = await subscriptionByHookKey(key);
  /* 404 rather than 401, and the same 404 an unparseable key gets: a caller
     holding a wrong key learns only that it is wrong, never that some other
     key would have worked or that this one used to. */
  if (!sub) {
    return NextResponse.json({ ok: false, error: "unknown hook" }, { status: 404 });
  }

  /* A paused subscription is answered 200 and dropped. ViaSocket retries and
     eventually disables a webhook that errors, and "the member switched this
     off" is not a delivery failure — they may switch it back on. */
  if (sub.state !== "active") {
    return NextResponse.json({ ok: true, ignored: "paused" });
  }

  let payload: unknown = null;
  try {
    const text = await req.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    /* Not JSON. Record the event anyway — that it fired is the fact the UI
       needs, and a body we cannot parse is not a reason to lose it. */
    payload = null;
  }

  const { id, summary } = await recordEvent(sub, payload);
  after(() =>
    emitEvent("trigger.fired", {
      service: sub.service,
      label: sub.label,
      summary,
      memberEmail: sub.memberEmail,
    }).catch(() => {}),
  );
  return NextResponse.json({ ok: true, eventId: id, summary });
}

export async function POST(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  try {
    return await handle(req, key);
  } catch (err) {
    /* 500 on purpose: a store write that failed is a delivery ViaSocket should
       retry, and answering 200 would drop the event silently. */
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

/**
 * Some ViaSocket triggers verify a hook with a GET before they will use it.
 * Answering the same shape keeps that handshake from failing.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const sub = key ? await subscriptionByHookKey(key) : null;
  if (!sub) return NextResponse.json({ ok: false, error: "unknown hook" }, { status: 404 });
  return NextResponse.json({ ok: true, listening: sub.label });
}
