/**
 * GET  /api/pulse/members — the invite list, and what the caller may do to it.
 * POST /api/pulse/members — invite somebody, at a level.
 *
 * The ladder lives in lib/pulse/members.ts as pure functions, and is applied
 * here rather than in the browser: the select box on the members sheet is a
 * convenience, not the rule.
 *
 * These go through `gate()` rather than reading the session alone. This is the
 * surface that controls access, so it re-checks the list itself — and takes the
 * caller's role from the database, not from their token, so somebody demoted a
 * minute ago cannot still invite, and somebody promoted a minute ago can.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import {
  abilities,
  denyInvite,
  DuplicateMemberError,
  inviteMember,
  isEmailShaped,
  isRole,
  listMembers,
  normalizeEmail,
  ROLES,
  type Role,
} from "@/lib/pulse/members";
import { nameForEmail } from "@/lib/pulse/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Long enough for the event automations this route fires to actually finish.
 *
 * Every write here announces something through `emitEvent`, and `after()`
 * keeps the invocation alive for that work — but only up to `maxDuration`.
 * One event automation is one GTWY judging call, measured at 15-25 seconds
 * against the shared rule-worker, so the platform default (10-15s) kills the
 * invocation mid-call. Nothing reports it: the response already went out, so
 * the caller sees success while the automation never ran, wrote no alert and
 * wrote no decision row. Matches the 300 the scheduled runners already set
 * (tick, webhook, run, monthly) for exactly the same reason.
 */
export const maxDuration = 300;

/** The caller, if they are signed in AND still on the list. Null otherwise. */
async function caller(): Promise<{ email: string; role: Role } | null> {
  const result = await gate();
  return result.state === "ok"
    ? { email: result.session.user.email, role: result.role }
    : null;
}

function refusal() {
  return NextResponse.json(
    { ok: false, error: "You are not signed in to Pulse, or your access has been removed." },
    { status: 401 },
  );
}

export async function GET() {
  const me = await caller();
  if (!me) return refusal();

  try {
    return NextResponse.json({
      ok: true,
      // `can` is what the sheet draws itself from, so a member never sees an
      // invite box that would only ever be refused.
      me: { email: me.email, role: me.role, can: abilities(me.role) },
      roles: ROLES,
      members: await listMembers(),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const me = await caller();
  if (!me) return refusal();

  const body = (await req.json().catch(() => ({}))) as { email?: string; role?: string };
  const email = normalizeEmail(body.email ?? "");
  if (!email || !isEmailShaped(email)) {
    return NextResponse.json({ ok: false, error: "A valid email address is required" }, { status: 400 });
  }

  // No role means the least of them. An invite that silently granted more than
  // was asked for would be the worst possible default here.
  const role: Role = body.role === undefined ? "member" : isRole(body.role) ? body.role : "member";
  if (body.role !== undefined && !isRole(body.role)) {
    return NextResponse.json(
      { ok: false, error: `Unknown member type "${body.role}". One of: ${ROLES.join(", ")}.` },
      { status: 400 },
    );
  }

  const denied = denyInvite(me.role, role);
  if (denied) return NextResponse.json({ ok: false, error: denied }, { status: 403 });

  // Prefills the name when Proxy already knows them; an invitee who has never
  // signed in anywhere simply has no name until their first login.
  const name = await nameForEmail(email);

  try {
    const invited = await inviteMember(email, role, me.email, name);
    return NextResponse.json({ ok: true, member: invited }, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateMemberError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
