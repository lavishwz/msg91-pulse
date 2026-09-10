/**
 * GET    /api/pulse/voice          — how the signed-in person writes
 * POST   /api/pulse/voice          — add a trait
 * DELETE /api/pulse/voice?trait=…  — remove one
 *
 * Always the caller's own list. There is deliberately no way to read or edit
 * somebody else's: this is a description of how a person writes, it shapes
 * mail that will go out under their name, and nobody else gets to author it.
 * That is why the email comes from the session rather than from the request.
 */

import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import {
  addTrait,
  hasEdited,
  isTraitShaped,
  normalizeTrait,
  removeTrait,
  traitsFor,
  MAX_TRAIT_LENGTH,
} from "@/lib/pulse/voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET() {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);
  try {
    const email = seat.writer.email;
    const [traits, edited] = await Promise.all([traitsFor(email), hasEdited(email)]);
    return NextResponse.json({ ok: true, traits, edited, max: MAX_TRAIT_LENGTH });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}

export async function POST(req: Request) {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);

  const body = (await req.json().catch(() => ({}))) as { trait?: unknown };
  const trait = normalizeTrait(typeof body.trait === "string" ? body.trait : "");
  if (!isTraitShaped(trait)) {
    return bad(`A trait needs 2 to ${MAX_TRAIT_LENGTH} characters.`);
  }

  try {
    const traits = await addTrait(seat.writer.email, trait);
    return NextResponse.json({ ok: true, added: trait, traits, edited: true }, { status: 201 });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}

export async function DELETE(req: Request) {
  const seat = await writer();
  if (!seat.ok) return bad(seat.error, seat.status);

  const trait = normalizeTrait(new URL(req.url).searchParams.get("trait") ?? "");
  if (!trait) return bad("Which trait?");

  try {
    const traits = await removeTrait(seat.writer.email, trait);
    return NextResponse.json({ ok: true, removed: trait, traits, edited: true });
  } catch (err) {
    return bad((err as Error).message, 503);
  }
}
