/**
 * GET    /api/pulse/accounts/:id/tags        — every tag on this company
 * POST   /api/pulse/accounts/:id/tags        — add one, or several
 * DELETE /api/pulse/accounts/:id/tags?tag=…  — remove one
 *
 * Tags are notes one person leaves for the next, so any member may add and
 * remove them — no ladder here, unlike the members list. What *is* recorded is
 * who added each one, which is the part worth knowing later.
 *
 * The response is the whole list every time rather than just the change, so the
 * company page can redraw from one answer and two people tagging at once
 * converge instead of drifting.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import { addTag, isTagShaped, listTags, normalizeTag, removeTag, MAX_TAG_LENGTH } from "@/lib/pulse/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in member's email, or null when they may not be here. */
async function caller(): Promise<string | null> {
  const result = await gate();
  return result.state === "ok" ? result.session.user.email : null;
}

const refusal = () =>
  NextResponse.json(
    { ok: false, error: "You are not signed in to Pulse, or your access has been removed." },
    { status: 401 },
  );

/** Account ids are ms_user.user_pid — numeric, and not ours to invent. */
function accountFrom(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await caller())) return refusal();

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) {
    return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });
  }

  try {
    return NextResponse.json({ ok: true, tags: await listTags(accountId) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await caller();
  if (!email) return refusal();

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) {
    return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });
  }

  /* The sheet can send several at once — the chips are picked together and
     added with one button — so `tags` is the shape and `tag` is the courtesy. */
  const body = (await req.json().catch(() => ({}))) as { tag?: string; tags?: unknown };
  const raw = Array.isArray(body.tags) ? body.tags : body.tag !== undefined ? [body.tag] : [];

  const wanted = raw
    .filter((t): t is string => typeof t === "string")
    .map(normalizeTag)
    .filter((t, i, all) => all.indexOf(t) === i);

  if (!wanted.length) {
    return NextResponse.json({ ok: false, error: "A tag is required" }, { status: 400 });
  }
  const bad = wanted.find((t) => !isTagShaped(t));
  if (bad !== undefined) {
    return NextResponse.json(
      {
        ok: false,
        error: bad
          ? `"${bad}" is not a tag — it needs 2 to ${MAX_TAG_LENGTH} characters.`
          : `A tag needs 2 to ${MAX_TAG_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  try {
    // Sequentially, not in parallel: they land on one unique key, and a handful
    // of tags is not worth racing rows against each other for.
    for (const tag of wanted) await addTag(accountId, tag, "human", email);
    return NextResponse.json({ ok: true, added: wanted, tags: await listTags(accountId) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await caller())) return refusal();

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) {
    return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });
  }

  const tag = normalizeTag(new URL(req.url).searchParams.get("tag") ?? "");
  if (!tag) return NextResponse.json({ ok: false, error: "Which tag?" }, { status: 400 });

  try {
    const removed = await removeTag(accountId, tag);
    if (!removed) return NextResponse.json({ ok: false, error: "That tag is not on this company" }, { status: 404 });
    return NextResponse.json({ ok: true, removed: tag, tags: await listTags(accountId) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
