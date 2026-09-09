import { NextResponse } from "next/server";
import { runMonthEnd, accountVerdict, portfolioDigestFor } from "@/lib/pulse/autopilot/monthly";

/**
 * POST /api/pulse/autopilot/monthly — write the month's verdicts and digest.
 * GET  ?account=302621                — this month's verdict for one account
 * GET  ?scope=team                    — the month's portfolio digest
 *
 * Separate from the five-minute run on purpose. This is tens of agent calls and
 * belongs on its own schedule — the first of the month, early — while the run
 * endpoint has to stay fast enough to be called constantly.
 *
 * Safe to call more than once: every verdict is keyed by month and account, so
 * a second call skips what is already written rather than paying for it twice.
 */
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

  const cap = Math.min(Number(url.searchParams.get("accounts") ?? 25), 200);
  const budget = Math.min(Number(url.searchParams.get("budgetMs") ?? 240_000), 280_000);

  try {
    return NextResponse.json({ ok: true, ...(await runMonthEnd(budget, cap)) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const account = url.searchParams.get("account");
  const scope = url.searchParams.get("scope") as "me" | "team" | "company" | null;
  try {
    if (account) return NextResponse.json({ ok: true, verdict: await accountVerdict(Number(account)) });
    return NextResponse.json({ ok: true, digest: await portfolioDigestFor(scope ?? "team") });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
