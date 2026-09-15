import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { rulesByMotion, editRule, retireRule, testAgainstHistory, type Motion } from "@/lib/pulse/autopilot/rules";

/**
 * GET  /api/pulse/autopilot/rules            — the four motions' rules
 * POST /api/pulse/autopilot/rules            — { action, ... }
 *
 * action: "edit" | "retire" | "test".
 *
 * There is no "add" any more — a new motion rule is built as a full
 * automation instead (see /api/pulse/autopilot/build), so every rule from
 * here on has its own query/schedule/event and a real AI judge at run time,
 * rather than the old free, in-code score/field check the sentence-compiler
 * used to produce. Existing rules created that way still edit, test and
 * retire exactly as before — only the *creation* path changed.
 *
 * "test" replays a rule against decisions already made and reports what it
 * would have done differently. Nothing is sent and nothing is written — the
 * handover is blunt about this: nobody should change an automation blind.
 */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, rules: await rulesByMotion() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  /* Rules are what Autopilot is allowed to do on its own, so changing one is a
     super admin's job. Checked here rather than in the browser: the Rules tab
     hiding its edit pencils is a convenience, not the rule. */
  const who = await writer("super_admin");
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  try {
    const b = (await req.json()) as {
      action?: "edit" | "retire" | "test";
      motion?: Motion;
      key?: string;
      english?: string;
      machine?: Record<string, unknown>;
      days?: number;
    };
    /* From the session, never the body — otherwise the record of who changed a
       rule is whatever the caller chose to type. */
    const actor = who.writer.email;

    if (b.action === "edit") {
      if (!b.key || !b.english?.trim()) {
        return NextResponse.json({ ok: false, error: "key and english are required" }, { status: 400 });
      }
      const rule = await editRule(b.key, b.english.trim(), (b.machine ?? null) as never, actor);
      return rule
        ? NextResponse.json({ ok: true, rule })
        : NextResponse.json({ ok: false, error: "no such active rule" }, { status: 404 });
    }

    if (b.action === "retire") {
      if (!b.key) return NextResponse.json({ ok: false, error: "key is required" }, { status: 400 });
      const done = await retireRule(b.key, actor);
      return done
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ ok: false, error: "no such rule" }, { status: 404 });
    }

    if (b.action === "test") {
      if (!b.key) return NextResponse.json({ ok: false, error: "key is required" }, { status: 400 });
      const all = await rulesByMotion();
      const rule = Object.values(all).flat().find((r) => r.key === b.key);
      if (!rule) return NextResponse.json({ ok: false, error: "no such rule" }, { status: 404 });
      return NextResponse.json({ ok: true, test: await testAgainstHistory(rule, b.days ?? 30) });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
