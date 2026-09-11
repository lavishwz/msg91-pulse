/**
 * GET    /api/pulse/accounts/:id/contacts          — every hand-added person on this company
 * POST   /api/pulse/accounts/:id/contacts           — { name, role? }
 * DELETE /api/pulse/accounts/:id/contacts?id=…      — remove one
 *
 * Alongside MSG91's own invited-member list (read-only, see accounts.ts),
 * not instead of it — any member may add or remove one, same as tags.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import { addContact, isNameShaped, listContacts, MAX_NAME_LENGTH, removeContact } from "@/lib/pulse/contacts";

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

function accountFrom(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await caller())) return refusal();
  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, contacts: await listContacts(accountId) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await caller();
  if (!email) return refusal();

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { name?: string; role?: string };
  const name = (body.name ?? "").trim();
  if (!isNameShaped(name)) {
    return NextResponse.json(
      { ok: false, error: `A name needs 2 to ${MAX_NAME_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const contacts = await addContact(accountId, name, body.role ?? null, email);
    return NextResponse.json({ ok: true, contacts }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await caller())) return refusal();

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "Which person?" }, { status: 400 });
  }

  try {
    const removed = await removeContact(accountId, id);
    return NextResponse.json({ ok: removed });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
