/**
 * POST /api/pulse/prospects — "Add accounts in bulk" and ⌘K "add a company",
 * made real (handover features 21/35).
 *
 * Two-step on purpose, matching the sheet's own UI (check, then confirm):
 *   { action: "check",  rows: string[] }              → classify only
 *   { action: "create", rows: [{companyName,domain,email}] } → insert
 * GET lists what has been added, newest first.
 */

import { NextResponse } from "next/server";
import { gate } from "@/lib/pulse/guard";
import { checkBulk, createProspects, listProspects, parseBulkInput } from "@/lib/pulse/prospects";

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

export async function GET() {
  if (!(await caller())) return refusal();
  try {
    return NextResponse.json({ ok: true, prospects: await listProspects() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

type Body =
  | { action: "check"; text?: string; rows?: string[] }
  | { action: "create"; rows?: { companyName: string; domain: string | null; email: string | null }[] };

export async function POST(req: Request) {
  const email = await caller();
  if (!email) return refusal();

  const body = (await req.json().catch(() => ({}))) as Body;

  try {
    if (body.action === "check") {
      const rows = body.rows ?? (body.text ? parseBulkInput(body.text) : []);
      if (!rows.length) return NextResponse.json({ ok: false, error: "Nothing to check" }, { status: 400 });
      return NextResponse.json({ ok: true, rows: await checkBulk(rows) });
    }
    if (body.action === "create") {
      if (!body.rows?.length) return NextResponse.json({ ok: false, error: "Nothing to create" }, { status: 400 });
      const created = await createProspects(body.rows, email, "bulk_add");
      return NextResponse.json({ ok: true, created }, { status: 201 });
    }
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}
