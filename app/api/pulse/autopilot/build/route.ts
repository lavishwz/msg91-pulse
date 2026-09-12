import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { buildAutomation } from "@/lib/pulse/autopilot/build";
import { EVENTS, isEventName } from "@/lib/pulse/autopilot/events";
import type { Motion } from "@/lib/pulse/autopilot/automations";

/** The ENUM in migrations/006, in one place the route can check against. */
const MOTIONS: Motion[] = ["inbound", "outbound", "startup", "partner", "any"];

/**
 * GET /api/pulse/autopilot/build — the fixed event catalogue, for the Rules
 * page's "when this happens" dropdown. Served from here rather than baked
 * into the client so the dropdown can never list an event the backend does
 * not actually recognize.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    events: Object.entries(EVENTS).map(([name, e]) => ({ name, label: e.label })),
  });
}

/**
 * POST /api/pulse/autopilot/build — { english, motion, eventName? }
 *
 * The dynamic path: plan the rule, provision its executor agent on GTWY,
 * subscribe a cron-job.org job if it needs one, save it. Same super_admin
 * gate as /rules, for the same reason — this is what Autopilot may do on
 * its own.
 *
 * `eventName`, when the Rules page's event dropdown was used instead of a
 * schedule, is one of the fixed names from `lib/pulse/autopilot/events.ts` —
 * validated here rather than trusted from the client, since it becomes
 * `trigger_kind='event'` and skips the query/cron path entirely.
 */
export async function POST(req: Request) {
  const who = await writer("super_admin");
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  const b = (await req.json().catch(() => ({}))) as { english?: string; motion?: Motion; eventName?: string };
  if (!b.english?.trim() || !b.motion) {
    return NextResponse.json({ ok: false, error: "english and motion are required" }, { status: 400 });
  }
  /* Checked against the list rather than trusted from the client, for the
     same reason eventName is below: it goes straight into an ENUM column
     (migrations/006), so an unknown value is not a validation message but a
     failed INSERT surfacing as "saving it failed" after the planner has
     already been paid for. */
  if (!MOTIONS.includes(b.motion)) {
    return NextResponse.json(
      { ok: false, error: `unknown motion "${b.motion}". One of: ${MOTIONS.join(", ")}.` },
      { status: 400 },
    );
  }

  const eventName = b.eventName;
  if (eventName !== undefined && !isEventName(eventName)) {
    return NextResponse.json({ ok: false, error: `unknown event "${eventName}"` }, { status: 400 });
  }

  const result = await buildAutomation(
    b.english.trim(),
    b.motion,
    who.writer.email,
    undefined,
    eventName,
  );
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export const dynamic = "force-dynamic";
