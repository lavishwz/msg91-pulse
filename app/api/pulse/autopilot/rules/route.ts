import { NextResponse } from "next/server";
import { rulesByMotion, addRule, editRule, retireRule, testAgainstHistory, type Motion } from "@/lib/pulse/autopilot/rules";
import { compileRule } from "@/lib/pulse/agents";

/**
 * GET  /api/pulse/autopilot/rules            — the four motions' rules
 * POST /api/pulse/autopilot/rules            — { action, ... }
 *
 * action: "add" | "edit" | "retire" | "test" | "compile".
 *
 * "compile" turns a sentence into a trigger, conditions and an action, using an
 * agent — once, at writing time. It saves nothing: the result is read back to
 * the person in plain English and only their confirmation makes it live.
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
  try {
    const b = (await req.json()) as {
      action?: "add" | "edit" | "retire" | "test" | "compile";
      motion?: Motion;
      key?: string;
      english?: string;
      machine?: Record<string, unknown>;
      days?: number;
      actor?: string;
    };
    const actor = b.actor ?? "a person";

    if (b.action === "add") {
      if (!b.motion || !b.english?.trim()) {
        return NextResponse.json({ ok: false, error: "motion and english are required" }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        rule: await addRule(b.motion, b.english.trim(), (b.machine ?? {}) as never, actor),
      });
    }

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

    // Translate a sentence into something the runner can check. This is the only
    // place an agent touches a rule, and it happens once — when a person writes
    // it — never at decision time. The result comes back for confirmation; it
    // does not save anything.
    if (b.action === "compile") {
      if (!b.english?.trim() || !b.motion) {
        return NextResponse.json({ ok: false, error: "motion and english are required" }, { status: 400 });
      }
      const call = await compileRule(b.english.trim(), b.motion);
      return NextResponse.json({ ok: true, compiled: call.data, model: call.model });
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
