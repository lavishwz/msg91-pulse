import { read, write } from "@/lib/store";

/**
 * Motion rules — the four sets shown on the Rules tab.
 *
 * ── Why a rule is stored twice ─────────────────────────────────────────────
 * Every rule carries an English sentence and a machine form:
 *
 *   english : "Quality 80+ → call within 10 minutes."
 *   machine : { when: "signup_scored", if: [["score",">=",80]],
 *               then: { act: "card", reason: "your_hands", sla_minutes: 10 } }
 *
 * The sentence is what a person reads and edits. The machine form is what the
 * runner executes. Neither is sent to an agent at decision time, and that is
 * the point: a rule written into a prompt is guidance a model usually follows,
 * while a rule evaluated in code is a control that always holds.
 *
 * An agent may help *write* the machine form when a person types a new rule —
 * once, at save time, with the result shown for confirmation. It is never asked
 * again afterwards, however many thousand times the rule runs.
 *
 * ── What a rule may do ─────────────────────────────────────────────────────
 * `act` is the autonomy gate from the handover: ACT happens silently and is
 * logged, CARD stops and puts it in front of a person. Nothing else exists,
 * deliberately — a rule that could do anything would be unreviewable.
 */

export type Motion = "inbound" | "outbound" | "startup" | "partner";

export type Condition = [field: string, op: ">=" | ">" | "<=" | "<" | "==" | "!=" | "in", value: unknown];

export type RuleAction = {
  /** ACT runs silently and is logged. CARD stops and asks a person. */
  act: "act" | "card";
  /** What the runner should do: the vocabulary is closed on purpose. */
  do: "score" | "raise_card" | "nurture" | "suppress" | "draft" | "wait" | "notify";
  reason?: string;
  sla_minutes?: number;
  sequence?: string;
  days?: number;
};

export type MotionRule = {
  key: string;
  motion: Motion;
  english: string;
  when: string;
  if: Condition[];
  then: RuleAction;
  stopIf?: Condition[];
  version: string;
  state: "active" | "proposed" | "retired";
  source: "seed" | "human" | "learned";
  /** True when the runner actually evaluates this rule today. */
  live: boolean;
};

type Raw = {
  policy_key: string;
  body: unknown;
  version: string;
  state: string;
  source: string;
  note: string | null;
};

const parse = (v: unknown): Record<string, unknown> => {
  if (v == null) return {};
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return v as Record<string, unknown>;
};

function shape(r: Raw): MotionRule {
  const b = parse(r.body);
  return {
    key: r.policy_key,
    motion: (b.motion as Motion) ?? "inbound",
    english: (b.english as string) ?? "",
    when: (b.when as string) ?? "",
    if: (b.if as Condition[]) ?? [],
    then: (b.then as RuleAction) ?? { act: "act", do: "score" },
    stopIf: (b.stop_if as Condition[]) ?? [],
    version: r.version,
    state: r.state as MotionRule["state"],
    source: r.source as MotionRule["source"],
    live: Boolean(b.live),
  };
}

export async function rulesByMotion(): Promise<Record<Motion, MotionRule[]>> {
  const rows = await read<Raw>(
    `SELECT p.policy_key, p.body, p.version, p.state, p.source, p.note
       FROM pulse_policy p
       JOIN (SELECT policy_key, MIN(id) first_id FROM pulse_policy GROUP BY policy_key) f
         ON f.policy_key = p.policy_key
      WHERE p.state = 'active' AND p.kind = 'rule'
      ORDER BY f.first_id`,
  );
  const out: Record<Motion, MotionRule[]> = { inbound: [], outbound: [], startup: [], partner: [] };
  for (const r of rows) {
    const rule = shape(r);
    if (out[rule.motion]) out[rule.motion].push(rule);
  }
  return out;
}

const slug = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 50) || "rule";

function nextVersion(v: string): string {
  const n = Number((v ?? "v1").replace(/^v/, "")) || 1;
  return `v${n + 1}`;
}

export async function addRule(
  motion: Motion,
  english: string,
  machine: Partial<MotionRule> & { live?: boolean },
  actor: string,
): Promise<MotionRule> {
  const key = `rule.${motion}.${slug(english)}`;

  // A rule only runs when it has a trigger and an action — and when a person
  // confirmed the translation. Both halves matter: the compiler proposes, and
  // somebody who understands the business agrees. Without either, the rule is
  // saved and shown, marked as not running, which is honest rather than a trap.
  const runnable = Boolean(machine.when && machine.then?.do);
  const live = Boolean(machine.live && runnable);

  const body = {
    motion,
    english,
    when: machine.when ?? "",
    if: machine.if ?? [],
    then: machine.then ?? { act: "card", do: "raise_card" },
    stop_if: machine.stopIf ?? [],
    live,
  };
  await write(
    `INSERT INTO pulse_policy (version, policy_key, kind, body, note, state, source)
     VALUES ('v1', ?, 'rule', ?, ?, 'active', 'human')
     ON DUPLICATE KEY UPDATE body = VALUES(body), state = 'active', note = VALUES(note)`,
    [key, JSON.stringify(body), `added by ${actor}`],
  );
  return { ...(body as unknown as MotionRule), key, version: "v1", state: "active", source: "human", live };
}

/** Editing writes a new version and retires the old one — nothing is overwritten. */
export async function editRule(
  key: string,
  english: string,
  machine: (Partial<MotionRule> & { live?: boolean }) | null,
  actor: string,
): Promise<MotionRule | null> {
  const rows = await read<Raw>(
    `SELECT policy_key, body, version, state, source, note
       FROM pulse_policy WHERE policy_key = ? AND state = 'active' LIMIT 1`,
    [key],
  );
  const current = rows[0];
  if (!current) return null;

  const b = parse(current.body);
  const body = {
    ...b,
    english,
    ...(machine?.when !== undefined ? { when: machine.when } : {}),
    ...(machine?.if !== undefined ? { if: machine.if } : {}),
    ...(machine?.then !== undefined ? { then: machine.then } : {}),
    ...(machine?.stopIf !== undefined ? { stop_if: machine.stopIf } : {}),
    ...(machine?.live !== undefined ? { live: Boolean(machine.live) } : {}),
  };

  // Re-worded but never re-compiled: the sentence changed and the check did
  // not, so what runs is no longer what the rule says. Turn it off rather than
  // let the two drift apart.
  if (machine?.when === undefined && english !== b.english && b.live) {
    body.live = false;
  }

  await write(
    `UPDATE pulse_policy SET state = 'retired', retired_at = NOW() WHERE policy_key = ? AND state = 'active'`,
    [key],
  );
  const version = nextVersion(current.version);
  await write(
    `INSERT INTO pulse_policy (version, policy_key, kind, body, note, state, source)
     VALUES (?, ?, 'rule', ?, ?, 'active', 'human')`,
    [version, key, JSON.stringify(body), `edited by ${actor}`],
  );
  return shape({ ...current, body: JSON.stringify(body), version, state: "active", source: "human" });
}

export async function retireRule(key: string, actor: string): Promise<boolean> {
  const res = await write(
    `UPDATE pulse_policy SET state = 'retired', retired_at = NOW(), note = ?
      WHERE policy_key = ? AND state = 'active'`,
    [`retired by ${actor}`, key],
  );
  return res.affectedRows > 0;
}

/* ── evaluation ──────────────────────────────────────────────────────────── */

/**
 * Does one condition hold against the facts?
 *
 * A missing field is `false`, never a throw and never a silent true. A rule
 * that quietly passes because the data was absent is how an automation ends up
 * doing something nobody asked for.
 *
 * Exported: automation-runner.ts reuses this exact evaluator for a dynamically
 * built automation's own `neverIf` conditions, rather than a second
 * implementation that could quietly drift from what this one does.
 */
export function test(cond: Condition, facts: Record<string, unknown>): boolean {
  const [field, op, value] = cond;
  const actual = facts[field];
  if (actual === undefined || actual === null) return false;

  switch (op) {
    case ">=": return Number(actual) >= Number(value);
    case ">":  return Number(actual) >  Number(value);
    case "<=": return Number(actual) <= Number(value);
    case "<":  return Number(actual) <  Number(value);
    case "==": return String(actual) === String(value);
    case "!=": return String(actual) !== String(value);
    case "in": return Array.isArray(value) && value.map(String).includes(String(actual));
    default:   return false;
  }
}

export type RuleMatch = { rule: MotionRule; action: RuleAction };

/**
 * The first live rule for this motion whose conditions all hold.
 *
 * First, not all: rules are ordered and the earliest match wins, so a
 * `score >= 80` rule above a `score >= 40` rule behaves the way a person
 * reading the list top to bottom would expect. Two rules firing at once on the
 * same signal is how one signup becomes three cards.
 */
export function evaluate(
  rules: MotionRule[],
  when: string,
  facts: Record<string, unknown>,
): RuleMatch | null {
  for (const rule of rules) {
    if (!rule.live) continue;
    if (rule.when !== when) continue;
    if (rule.stopIf?.length && rule.stopIf.some((c) => test(c, facts))) continue;
    if (rule.if.length && !rule.if.every((c) => test(c, facts))) continue;
    return { rule, action: rule.then };
  }
  return null;
}

/**
 * What a rule would have done over the last N days.
 *
 * Handover §7.5: "nobody should change an automation blind." This replays the
 * rule against decisions already made and reports what it would have done
 * differently — no customer is contacted, nothing is written.
 */
export async function testAgainstHistory(rule: MotionRule, days = 30) {
  const rows = await read<{ signal_key: string; verdict: string | null; score: number | null; output_json: unknown; input_json: unknown }>(
    `SELECT signal_key, verdict, score, output_json, input_json
       FROM pulse_decision
      WHERE agent = 'signup-triage' AND at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days],
  );

  let fired = 0;
  let sameAsBefore = 0;
  let different = 0;
  const examples: string[] = [];

  for (const r of rows) {
    const facts = {
      ...(parse(r.input_json) as Record<string, unknown>),
      score: r.score,
      verdict: r.verdict,
    };
    if (rule.stopIf?.length && rule.stopIf.some((c) => test(c, facts))) continue;
    if (rule.if.length && !rule.if.every((c) => test(c, facts))) continue;

    fired += 1;
    const wouldBe =
      rule.then.do === "raise_card" ? "human_now" :
      rule.then.do === "nurture" ? "nurture" :
      rule.then.do === "suppress" ? "suppress" : null;

    if (wouldBe && wouldBe !== r.verdict) {
      different += 1;
      if (examples.length < 3) {
        examples.push(`${r.signal_key}: was ${r.verdict ?? "undecided"}, would be ${wouldBe}`);
      }
    } else sameAsBefore += 1;
  }

  return {
    days,
    considered: rows.length,
    fired,
    sameAsBefore,
    different,
    examples,
    // Nothing was sent, and saying so plainly is the reason a person will
    // actually press the button.
    note: "Nothing was sent and nothing was written. This is a replay of decisions already made.",
  };
}
