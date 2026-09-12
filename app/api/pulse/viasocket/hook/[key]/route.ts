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
 * The handler is deliberately dull. It records that the event arrived and
 * returns — no fan-out, no agent call, no mail fetch. Whatever Pulse eventually
 * does when mail lands belongs downstream of this row, not inside the request
 * ViaSocket is timing; a slow handler here is a trigger ViaSocket marks failed
 * and eventually stops calling.
 */

import { NextResponse } from "next/server";
import { subscriptionByHookKey, recordEvent } from "@/lib/pulse/triggers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
