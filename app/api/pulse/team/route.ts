import { NextResponse } from "next/server";
import { listReps, resolveMe, standings, repActivity, repStandings } from "@/lib/pulse/team";
import { pageFromUrl } from "@/lib/pulse/paginate";

/** GET /api/pulse/team?view=reps|standings|health|activity */
export async function GET(req: Request) {
  const view = new URL(req.url).searchParams.get("view") ?? "reps";
  try {
    const me = await resolveMe();
    if (view === "standings")
      return NextResponse.json({ ok: true, me, standings: await standings(me?.id ?? null) });
    // How each rep's book is holding up — a standing, not a movement, because
    // movement needs a month of history Pulse has only just begun recording.
    if (view === "health")
      return NextResponse.json({ ok: true, reps: await repStandings(6) });
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
