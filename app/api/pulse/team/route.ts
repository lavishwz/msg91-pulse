import { NextResponse } from "next/server";
import { listReps, resolveMe, standings, repActivity } from "@/lib/pulse/team";
import { pageFromUrl } from "@/lib/pulse/paginate";

/** GET /api/pulse/team?view=reps|standings|activity */
export async function GET(req: Request) {
  const view = new URL(req.url).searchParams.get("view") ?? "reps";
  try {
    const me = await resolveMe();
    if (view === "standings")
      return NextResponse.json({ ok: true, me, standings: await standings(me?.id ?? null) });
    if (view === "activity")
      return NextResponse.json({ ok: true, ...(await repActivity(pageFromUrl(req.url))) });
    return NextResponse.json({
      ok: true,
      me,
      ...(await listReps(me?.id ?? null, pageFromUrl(req.url))),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
