import { NextResponse } from "next/server";
import { migrate, migrationStatus } from "@/lib/migrate";

/**
 * GET  /api/pulse/store/migrate — what has been applied
 * POST /api/pulse/store/migrate — apply anything outstanding
 *
 * The server already runs migrations at boot (instrumentation.ts), so this is
 * for the times boot is not enough: pointing at a fresh database, or checking
 * from outside that a deploy actually brought the schema up.
 *
 * POST needs the same secret as the runner. Applying DDL is not something a
 * stranger with the URL should be able to trigger.
 */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, applied: await migrationStatus() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const expected = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "AUTOPILOT_TICK_SECRET is not set." }, { status: 503 });
  }
  const url = new URL(req.url);
  const given = req.headers.get("x-autopilot-secret") ?? url.searchParams.get("secret") ?? "";
  if (given !== expected) {
    return NextResponse.json({ ok: false, error: "bad or missing secret" }, { status: 401 });
  }

  try {
    const res = await migrate();
    return NextResponse.json(
      { ...res, applied_now: res.applied, on_record: await migrationStatus() },
      { status: res.error ? 500 : 200 },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 120;
