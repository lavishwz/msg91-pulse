/**
 * The Rules-page trigger panel's one endpoint.
 *
 *   GET    — the catalogue of triggers this service offers, what the signed-in
 *            member is already subscribed to, and the event id to start
 *            polling from.
 *   POST   — subscribe to one { triggerId }.
 *   DELETE — stop one { id }, on ViaSocket's side as well as ours.
 *
 * Everything is scoped to the session's own email, which is also the
 * `unique_identifier` every ViaSocket call is signed with. That is what keeps
 * one member's subscriptions from appearing in another's list, and it is why
 * no route here takes a member email as a parameter.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionFrom } from "@/lib/pulse/auth";
import { authIdFor } from "@/lib/pulse/connections";
import {
  gmailTriggers,
  isViasocketConfigured,
  subscribeViasocketEvent,
  setViasocketFlowStatus,
} from "@/lib/pulse/viasocket";
import {
  listSubscriptions,
  reserveSubscription,
  recordSubscribed,
  recordSubscribeFailed,
  deleteSubscription,
  subscriptionById,
  latestEventId,
} from "@/lib/pulse/triggers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only Gmail has a catalogue today; the shape is per-service so adding one is additive. */
function catalogueFor(service: string) {
  return service === "gmail" ? gmailTriggers() : [];
}

/**
 * The absolute URL ViaSocket should call. It must be absolute and it must be
 * the deployed origin, never the request's own host — a subscription created
 * while someone happened to be on localhost would otherwise register a webhook
 * pointing at a machine ViaSocket cannot reach, and would fail silently
 * forever after.
 */
function hookUrlFor(hookKey: string): string {
  const base = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "PUBLIC_BASE_URL is not set, so Pulse cannot tell ViaSocket where to deliver events.",
    );
  }
  return `${base}/api/pulse/viasocket/hook/${hookKey}`;
}

export async function GET(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const email = session.user.email;
  const service = req.nextUrl.searchParams.get("service") ?? "gmail";
  const [subs, since, authId] = await Promise.all([
    listSubscriptions(email),
    latestEventId(email),
    authIdFor(email, "gmail"),
  ]);

  return NextResponse.json({
    ok: true,
    configured: isViasocketConfigured(),
    /* Told apart from "no triggers exist" on purpose: an empty catalogue is a
       configuration gap the UI should explain, not an app without triggers. */
    catalogue: catalogueFor(service),
    connected: Boolean(authId),
    subscriptions: subs.map((s) => ({
      id: s.id,
      triggerVersionId: s.triggerVersionId,
      label: s.label,
      service: s.service,
      state: s.state,
      eventCount: s.eventCount,
      lastEventAt: s.lastEventAt,
      lastError: s.lastError,
      live: Boolean(s.scriptId),
    })),
    since,
  });
}

export async function POST(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const email = session.user.email;
  const body = (await req.json().catch(() => ({}))) as { triggerId?: string; service?: string };
  const service = body.service ?? "gmail";
  const triggerId = (body.triggerId ?? "").trim();
  if (!triggerId) {
    return NextResponse.json({ ok: false, error: "triggerId is required" }, { status: 400 });
  }

  /* Checked against the catalogue rather than trusted: the id goes straight
     into a ViaSocket URL, and an id the product never offered is a caller
     reaching past the UI, not a typo to pass along. */
  const trigger = catalogueFor(service).find((t) => t.id === triggerId);
  if (!trigger) {
    return NextResponse.json({ ok: false, error: `unknown trigger "${triggerId}"` }, { status: 400 });
  }

  const authId = await authIdFor(email, "gmail");
  if (!authId) {
    return NextResponse.json(
      { ok: false, error: "Connect Gmail first — a trigger needs a connection to watch." },
      { status: 409 },
    );
  }

  const sub = await reserveSubscription(email, service, trigger.id, trigger.label);
  try {
    const { scriptId, hookUrl } = await subscribeViasocketEvent(
      email,
      trigger.id,
      authId,
      hookUrlFor(sub.hookKey),
    );
    await recordSubscribed(sub.id, scriptId, hookUrl);
    return NextResponse.json({ ok: true, id: sub.id, label: trigger.label });
  } catch (err) {
    const message = (err as Error).message;
    await recordSubscribeFailed(sub.id, message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const email = session.user.email;
  const body = (await req.json().catch(() => ({}))) as { id?: number };
  const id = Number(body.id ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

  const sub = await subscriptionById(email, id);
  if (!sub) return NextResponse.json({ ok: false, error: "no such subscription" }, { status: 404 });

  /* Stop it at ViaSocket before forgetting it here. The other order leaves a
     watch running against a hook_key nothing recognises any more — the events
     would 404 forever with nothing in Pulse pointing at what was still firing. */
  if (sub.scriptId) {
    try {
      await setViasocketFlowStatus(email, sub.scriptId, 0);
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: `ViaSocket would not stop it: ${(err as Error).message}` },
        { status: 502 },
      );
    }
  }
  await deleteSubscription(email, id);
  return NextResponse.json({ ok: true });
}
