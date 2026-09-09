import { NextResponse } from "next/server";
import { systemAlerts } from "@/lib/pulse/autopilot/alerts";

/**
 * GET /api/pulse/autopilot/alerts — system exceptions for Now.
 *
 * Read by Team and Company scope only. A rep is not on call for the gateway,
 * and putting infrastructure trouble in a salesperson's morning list is how
 * both get ignored.
 */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, alerts: await systemAlerts() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
