import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { decisions, suppressed, logSummary, unsuppress, humanActs, inFlight } from "@/lib/pulse/autopilot/log";

/**
 * GET  /api/pulse/autopilot/decisions        — the Live / AI log feed
 * GET  /api/pulse/autopilot/decisions?view=filtered — what was suppressed
 * POST /api/pulse/autopilot/decisions        — { signalKey } reopens a suppression
 *
 * Reads Pulse's own store. If the store is not reachable the surfaces fall back
 * to the prototype's sample data rather than showing an error, which is why a
 * failure here is a 503 with a message and not an exception.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const view = url.searchParams.get("view");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40), 200);
  const before = url.searchParams.get("before") ?? undefined;
  const automation = url.searchParams.get("automation") ?? undefined;

  try {
    if (view === "filtered") {
      return NextResponse.json({ ok: true, rows: await suppressed(limit) });
    }
    // What people did to Autopilot's own records — releasing a draft, reversing
    // a suppression. Different question from Activity ("what did the AI do?"),
    // so it is read by the Audit log, which has its own audience.
    // Who holds the ball, derived from drafts, timers and what went out.
    if (view === "flight") {
      return NextResponse.json({ ok: true, rows: await inFlight(limit) });
    }
    if (view === "human") {
      return NextResponse.json({ ok: true, rows: await humanActs(limit) });
    }
    const [rows, summary] = await Promise.all([decisions(limit, before, automation), logSummary()]);
    return NextResponse.json({
      ok: true,
      rows,
      summary,
      // The oldest row on this page is the cursor for the next one.
      nextCursor: rows.length === limit ? rows[rows.length - 1].at : null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  /* Any member may do this, but it is recorded against the person who did
     it — the actor no longer comes from the request body. */
  const who = await writer();
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  try {
    const body = (await req.json()) as { signalKey?: string };
    if (!body.signalKey) {
      return NextResponse.json({ ok: false, error: "signalKey is required" }, { status: 400 });
    }
    const done = await unsuppress(body.signalKey, who.writer.email);
    return NextResponse.json(
      done
        ? { ok: true, signalKey: body.signalKey, state: "open" }
        : { ok: false, error: "that signal is not suppressed" },
      { status: done ? 200 : 409 },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
