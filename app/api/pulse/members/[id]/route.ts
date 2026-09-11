/**
 * PATCH  /api/pulse/members/[id] — change what somebody is allowed to do.
 * DELETE /api/pulse/members/[id] — take somebody off the invite list.
 *
 * Removal is not only about the next login: the guard re-checks membership on
 * every request, so an open session stops working within the cache window
 * rather than at token expiry. A role change lands in the same window, which is
 * why the cache entry is dropped here rather than waited out.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import {
  countByRole,
  denyRemove,
  denySetRole,
  findMember,
  isRole,
  removeMember,
  ROLES,
  setMemberRole,
  type Role,
} from "@/lib/pulse/members";
import { forgetMembership } from "@/lib/pulse/membership-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function idFrom(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await caller();
  if (!me) return refusal();

  const id = idFrom((await ctx.params).id);
  if (id === null) return NextResponse.json({ ok: false, error: "Invalid member id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { role?: string };
  if (!isRole(body.role)) {
    return NextResponse.json(
      { ok: false, error: `A member type is required. One of: ${ROLES.join(", ")}.` },
      { status: 400 },
    );
  }
  const next: Role = body.role;

  try {
    const target = await findMember(id);
    if (!target) return NextResponse.json({ ok: false, error: "No such member" }, { status: 404 });

    const denied = denySetRole(me, target, next, await countByRole("super_admin"));
    if (denied) return NextResponse.json({ ok: false, error: denied }, { status: 403 });

    await setMemberRole(id, next);
    // So the change applies on their very next request, not in thirty seconds.
    forgetMembership(target.email);
    return NextResponse.json({ ok: true, member: { ...target, role: next } });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await caller();
  if (!me) return refusal();

  const id = idFrom((await ctx.params).id);
  if (id === null) return NextResponse.json({ ok: false, error: "Invalid member id" }, { status: 400 });

  try {
    const target = await findMember(id);
    if (!target) return NextResponse.json({ ok: false, error: "No such member" }, { status: 404 });

    const denied = denyRemove(me, target, await countByRole("super_admin"));
    if (denied) return NextResponse.json({ ok: false, error: denied }, { status: 403 });

    await removeMember(id);
    forgetMembership(target.email);
    const { emitEvent } = await import("@/lib/pulse/autopilot/automation-runner");
    emitEvent("member.removed", { email: target.email, removedBy: me.email }).catch(() => {});
    return NextResponse.json({ ok: true, removed: target.email });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
