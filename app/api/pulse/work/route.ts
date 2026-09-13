/**
 * GET  /api/pulse/work?scope=mine|team|company|waiting — My Work's four views
 *      (PRD §7.1). "mine"/"team" scope to the signed-in rep; "company" and
 *      "waiting" are cross-team by definition.
 * POST /api/pulse/work — one of:
 *      { action: "create", accountId, type, title, reason?, dueAt?, ownerId? }
 *        Manual work item (PRD §8.4: "Create work from a mission, customer
 *        promise, manual instruction, workflow, or AI decision").
 *      { action: "complete", id, outcome }
 *      { action: "snooze",   id, until }
 *      { action: "stop",     id, reason }
 *
 * This is the first real backend behind My Work — before this migration, work
 * items had no persistent record at all (see the audit against the handover's
 * feature 17/32 status). Scanners and a future "Log what happened" save both
 * write through `upsertWorkItem` in lib/pulse/missions.ts, not this route
 * directly, so the idempotency guarantee holds everywhere the same way.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import { resolveMe } from "@/lib/pulse/team";
import {
  completeWorkItem,
  getWorkItem,
  listWork,
  snoozeWorkItem,
  stopWorkItem,
  upsertWorkItem,
  type WorkScope,
  type WorkType,
} from "@/lib/pulse/missions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function caller(): Promise<string | null> {
  const result = await gate();
  return result.state === "ok" ? result.session.user.email : null;
}

const refusal = () =>
  NextResponse.json(
    { ok: false, error: "You are not signed in to Pulse, or your access has been removed." },
    { status: 401 },
  );

const SCOPES: WorkScope[] = ["mine", "team", "company", "waiting"];
const TYPES: WorkType[] = ["next_action", "promise", "approval", "watch"];

export async function GET(req: Request) {
  if (!(await caller())) return refusal();

  const scopeParam = new URL(req.url).searchParams.get("scope") ?? "mine";
  const scope = SCOPES.includes(scopeParam as WorkScope) ? (scopeParam as WorkScope) : "mine";

  try {
    const me = await resolveMe();
    const items = await listWork({
      scope,
      ownerId: me ? String(me.id) : null,
      // No team taxonomy exists in Pulse yet (see the audit — motion is
      // derived, not a rep property), so "team" currently reads as "everyone's
      // open and unowned work" rather than a real team slice. Narrowing this
      // needs a team field on the rep, which is out of scope here.
      team: null,
    });
    return NextResponse.json({ ok: true, scope, items });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

type Body =
  | { action: "create"; accountId?: string; type?: string; title?: string; reason?: string; dueAt?: string; ownerId?: string }
  | { action: "complete"; id?: number; outcome?: string }
  | { action: "snooze"; id?: number; until?: string }
  | { action: "stop"; id?: number; reason?: string };

export async function POST(req: Request) {
  const email = await caller();
  if (!email) return refusal();

  const body = (await req.json().catch(() => ({}))) as Body;

  try {
    if (body.action === "create") {
      const { accountId, type, title } = body;
      if (!accountId || !title || !TYPES.includes(type as WorkType)) {
        return NextResponse.json(
          { ok: false, error: "accountId, a valid type, and a title are required" },
          { status: 400 },
        );
      }
      const key = `manual:${accountId}:${type}:${Date.now()}`;
      const item = await upsertWorkItem({
        key,
        accountPid: accountId,
        type: type as WorkType,
        title,
        reason: body.reason ?? null,
        dueAt: body.dueAt ?? null,
        ownerId: body.ownerId ?? null,
        source: "human",
      });
      return NextResponse.json({ ok: true, item }, { status: 201 });
    }

    const id = "id" in body ? Number(body.id) : NaN;
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "bad work item id" }, { status: 400 });
    }
    const existing = await getWorkItem(id);
    if (!existing) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    if (body.action === "complete") {
      await completeWorkItem(id, body.outcome ?? "done");
    } else if (body.action === "snooze") {
      if (!body.until) return NextResponse.json({ ok: false, error: "until is required" }, { status: 400 });
      await snoozeWorkItem(id, body.until);
    } else if (body.action === "stop") {
      await stopWorkItem(id, body.reason ?? "stopped");
    } else {
      return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: await getWorkItem(id) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
