/**
 * POST /api/pulse/accounts/:id/log — "Log what happened", for real.
 *
 * Body: { note: string }. Runs the note through the log-extract GTWY agent
 * and writes whatever it found: a promise (work item), a risk (work item), a
 * product-interest mission, and/or a contact — see lib/pulse/logNote.ts for
 * exactly what each field becomes and why "decision" writes nowhere of its
 * own.
 */

import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { getAccount } from "@/lib/pulse/accounts";
import { logWhatHappened } from "@/lib/pulse/logNote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function accountFrom(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const seat = await writer();
  if (!seat.ok) return NextResponse.json({ ok: false, error: seat.error }, { status: seat.status });

  const accountId = accountFrom((await ctx.params).id);
  if (accountId === null) return NextResponse.json({ ok: false, error: "bad account id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { note?: string };
  const note = (body.note ?? "").trim();
  if (!note) return NextResponse.json({ ok: false, error: "Write something first" }, { status: 400 });
  if (note.length > 4000) {
    return NextResponse.json({ ok: false, error: "That's a lot — keep it under 4000 characters" }, { status: 400 });
  }

  try {
    const account = await getAccount(accountId);
    if (!account) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    const result = await logWhatHappened(String(accountId), account.name, note, seat.writer.email);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
