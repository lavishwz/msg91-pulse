import { NextResponse } from "next/server";
import { writer } from "@/lib/pulse/guard";
import { manifest, addRule, editRule, retireRule, restoreRule, ruleHistory } from "@/lib/pulse/autopilot/manifest";

/**
 * GET  /api/pulse/autopilot/manifest            — both columns, active rules
 * GET  /api/pulse/autopilot/manifest?key=…      — one rule's version history
 * POST /api/pulse/autopilot/manifest            — { action, side?, key?, text? }
 *   super admin only
 *
 * action: "add" | "edit" | "retire" | "restore".
 *
 * There is no delete. Retiring keeps the row so a decision made under an older
 * version still resolves to the words that were in force at the time.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  try {
    if (key) return NextResponse.json({ ok: true, history: await ruleHistory(key) });
    return NextResponse.json({ ok: true, manifest: await manifest() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  /* The manifest is the list of what AI may and may not do — the most load
     bearing statement in the product. Super admin only, same as the motion
     rules it sits beside. */
  const who = await writer("super_admin");
  if (!who.ok) return NextResponse.json({ ok: false, error: who.error }, { status: who.status });

  try {
    const b = (await req.json()) as {
      action?: "add" | "edit" | "retire" | "restore";
      side?: "yes" | "no";
      key?: string;
      text?: string;
    };
    const actor = who.writer.email;

    if (b.action === "add") {
      if (!b.side || !b.text?.trim()) {
        return NextResponse.json({ ok: false, error: "side and text are required" }, { status: 400 });
      }
      return NextResponse.json({ ok: true, item: await addRule(b.side, b.text.trim(), actor) });
    }

    if (b.action === "edit") {
      if (!b.key || !b.text?.trim()) {
        return NextResponse.json({ ok: false, error: "key and text are required" }, { status: 400 });
      }
      const item = await editRule(b.key, b.text.trim(), actor);
      return item
        ? NextResponse.json({ ok: true, item })
        : NextResponse.json({ ok: false, error: "no such active rule" }, { status: 404 });
    }

    if (b.action === "retire" || b.action === "restore") {
      if (!b.key) return NextResponse.json({ ok: false, error: "key is required" }, { status: 400 });
      const done = b.action === "retire" ? await retireRule(b.key, actor) : await restoreRule(b.key, actor);
      return done
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ ok: false, error: "no such rule" }, { status: 404 });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
