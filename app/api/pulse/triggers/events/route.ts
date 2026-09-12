/**
 * GET /api/pulse/triggers/events?since=<id> — what has arrived since the tab
 * last looked.
 *
 * The page polls this on a timer. Polling rather than a socket because Pulse
 * runs on serverless compute where a held-open connection has no home, and
 * because the thing being announced — a mail landing — is not worth a second
 * infrastructure. A few seconds of latency on a toast is not a defect.
 *
 * `since` is an event id, not a timestamp. Two events inside the same second
 * are ordinary, and a clock that steps backwards is not; an id is exact in
 * both cases. A tab with no `since` yet is told the current high-water mark by
 * /api/pulse/triggers and starts from there, so opening a page does not replay
 * every mail as a toast.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionFrom } from "@/lib/pulse/auth";
import { eventsSince, latestEventId } from "@/lib/pulse/triggers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await sessionFrom(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const email = session.user.email;
  const raw = req.nextUrl.searchParams.get("since");
  const since = Number(raw ?? 0);

  /* No `since` at all means a tab that has not been told where to start. Answer
     with the high-water mark and no events, so its next poll is a real one
     rather than a replay of everything already in the table. */
  if (!Number.isFinite(since) || since <= 0) {
    return NextResponse.json({ ok: true, events: [], since: await latestEventId(email) });
  }

  const events = await eventsSince(email, since);
  return NextResponse.json({
    ok: true,
    events: events.map((e) => ({
      id: e.id,
      label: e.label,
      service: e.service,
      summary: e.summary,
      receivedAt: e.receivedAt,
    })),
    /* The cursor for the next poll: the newest id seen, or the one we were
       given when nothing arrived. Never recomputed from MAX(id), which would
       skip past events written between the read and the reply. */
    since: events.length ? events[events.length - 1].id : since,
  });
}
