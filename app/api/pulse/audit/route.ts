import { NextResponse } from "next/server";
import { staffAudit, customerAudit, filteredSignups, auditAnomaly } from "@/lib/pulse/audit";
import { pageFromUrl } from "@/lib/pulse/paginate";

/** GET /api/pulse/audit?view=staff|customer|filtered&limit=&cursor= */
export async function GET(req: Request) {
  const view = new URL(req.url).searchParams.get("view") ?? "staff";
  const p = pageFromUrl(req.url);
  try {
    if (view === "customer") return NextResponse.json({ ok: true, ...(await customerAudit(p)) });
    if (view === "filtered") return NextResponse.json({ ok: true, ...(await filteredSignups(p)) });
    const [entries, anomaly] = await Promise.all([staffAudit(p), auditAnomaly()]);
    return NextResponse.json({ ok: true, ...entries, anomaly });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
