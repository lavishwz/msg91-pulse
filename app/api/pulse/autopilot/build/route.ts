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
/**
 * Two of the seven events are deliberately not offered.
 *
 * connection.connected and connection.disconnected fire when somebody links or
 * unlinks their own Gmail, Calendar or Slack. They are real events and the
 * backend still runs the rules already built on them — what is removed here is
 * only the ability to build *new* rules against them, because in practice they
 * describe a person's own housekeeping rather than anything about an account,
 * and a rule written on them tells you that you connected something you just
 * connected.
 *
 * Filtered here rather than deleted from events.ts on purpose: emitEvent still
 * fires them, existing subscriptions still receive them, and a rule somebody
 * built before this keeps working. Removing the name outright would strand
 * those rows against an event the catalogue no longer admits exists.
 */
const NOT_OFFERED = new Set(["connection.connected", "connection.disconnected"]);

export async function GET() {
  return NextResponse.json({
    ok: true,
    events: Object.entries(EVENTS)
      .filter(([name]) => !NOT_OFFERED.has(name))
      .map(([name, e]) => ({ name, label: e.label })),
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

/**
 * Building a rule is the slowest thing a person waits on in this product, and
 * this was the only route in autopilot/ without a ceiling raised to match —
 * /run, /tick and /monthly all set 300 while this took the platform default.
 *
 * It fitted while a build was one planner call of twenty to thirty seconds. It
 * stopped fitting when two things landed together: the planner's prompt grew
 * by the real table index (~2k tokens), and callAgent gained up to three
 * attempts on an unparseable reply. Three attempts at thirty seconds is ninety,
 * and the invocation was being killed partway — which surfaces as a 500 with an
 * empty body and nothing in pulse_automation_build_failure, because the process
 * died before it could write the row explaining itself.
 */
export const maxDuration = 300;

export const dynamic = "force-dynamic";
