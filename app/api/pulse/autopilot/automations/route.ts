import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { listAutomations, retireAutomation, setLive, type Motion } from "@/lib/pulse/autopilot/automations";

/**
 * GET  /api/pulse/autopilot/automations            — list, optionally ?motion=
 * POST /api/pulse/autopilot/automations             — { action: "retire"|"setLive", key, live? }
 *
 * Management for pulse_automation rows — both the four built-in automations
 * and anything built dynamically via /build. "retire" also tears down
 * whatever was provisioned for a dynamic one (see retireAutomation).
 */
export async function GET(req: Request) {
  const motion = (new URL(req.url).searchParams.get("motion") as Motion | null) ?? undefined;
  try {
    return NextResponse.json({ ok: true, automations: await listAutomations(motion) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const who = await writer("super_admin");
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  const b = (await req.json().catch(() => ({}))) as {
    action?: "retire" | "setLive";
    key?: string;
    live?: boolean;
  };
  if (!b.key) return NextResponse.json({ ok: false, error: "key is required" }, { status: 400 });

  if (b.action === "retire") {
    const done = await retireAutomation(b.key);
    return done
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ ok: false, error: "no such automation" }, { status: 404 });
  }

  if (b.action === "setLive") {
    const done = await setLive(b.key, Boolean(b.live));
    return done
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ ok: false, error: "no such active, runnable automation" }, { status: 404 });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}

export const dynamic = "force-dynamic";
