import { read, write } from "@/lib/store";

/**
 * The AI log, read back.
 *
 * Autopilot's promise is "every decision AI made, with the evidence and the
 * policy behind it". That is not a feature to be built on top of the decision
 * table — it *is* the decision table, read in order. So this file is thin on
 * purpose: it selects rows and shapes them for the feed, and invents nothing.
 *
 * Reads and writes both go through `lib/store.ts`. MSG91's schema is not
 * touched here at all.
 */

export type LogRow = {
  when: string;
  at: string;
  signalKey: string;
  title: string;
  detail: string;
  tag: string;
  kind: string;
  verdict: string | null;
  score: number | null;
  confidence: number | null;
  policyVersion: string | null;
  model: string | null;
  agent: string;
  reasons: string[];
  held: boolean;
  errorCode: string | null;
};

type Raw = {
  id: number;
  signal_key: string;
  agent: string;
  model: string | null;
  policy_version: string | null;
  verdict: string | null;
  score: number | null;
  confidence: string | number | null;
  action_taken: string | null;
  held: number;
  hold_reason: string | null;
  error_code: string | null;
  output_json: unknown;
  input_json: unknown;
  at: Date;
  subject_id: string | null;
  subject_name: string | null;
  state: string | null;
};

const SELECT = `
  SELECT d.id, d.signal_key, d.agent, d.model, d.policy_version, d.verdict, d.score,
         d.confidence, d.action_taken, d.held, d.hold_reason, d.error_code,
         d.output_json, d.input_json, d.at, s.subject_id, s.state,
         (SELECT JSON_UNQUOTE(JSON_EXTRACT(t.input_json, '$.company_name'))
            FROM pulse_decision t
           WHERE t.signal_key = d.signal_key AND t.agent = 'signup-triage'
           LIMIT 1) subject_name
    FROM pulse_decision d
    LEFT JOIN pulse_signal s ON s.signal_key = d.signal_key`;

const json = <T,>(v: unknown, dflt: T): T => {
  if (v == null) return dflt;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return dflt;
    }
  }
  return v as T;
};

/** 09:14 — the feed shows a time, and the panel shows the date. */
function hhmm(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * The tag under each row.
 *
 * These are the prototype's own vocabulary (`acted`, `draft`, `merged`,
 * `escalated`) so the feed reads the same whether a row came from sample data
 * or from a real decision. A held row says so; a failed one says so louder.
 */
function tagFor(r: Raw): { tag: string; kind: string } {
  // A row written by a person is an approval, not an AI action. It stays in the
  // feed — releasing a draft is part of the story of that signal — but it must
  // not read as something the AI decided.
  if (r.agent === "human") return { tag: "approve", kind: "ok" };
  if (r.error_code) return { tag: "escalated", kind: "act" };
  if (r.held) return { tag: "draft", kind: "act" };
  switch (r.verdict) {
    case "human_now":
      return { tag: "acted", kind: "act" };
    case "nurture":
      return { tag: "acted", kind: "ok" };
    case "suppress":
      return { tag: "merged", kind: "ok" };
    default:
      return { tag: "acted", kind: "ok" };
  }
}

function shape(r: Raw): LogRow {
  const out = json<Record<string, unknown>>(r.output_json, {});
  const inp = json<Record<string, unknown>>(r.input_json, {});
  // `reasons` for triage, `evidence` for a monthly review — different agents
  // name the same thing differently, and a row should show whichever exists
  // rather than nothing at all.
  const reasons = Array.isArray(out.reasons)
    ? (out.reasons as string[])
    : Array.isArray(out.evidence)
      ? (out.evidence as unknown[]).map((e) => (Array.isArray(e) ? `${e[0]}: ${e[1]}` : String(e)))
      : [];
  // Each agent labels the account under a different key. Falling through them in
  // order is what stops a row reading "Scored Account ?".
  const name =
    (inp.company_name as string) ||
    (inp.account as string) ||
    (r.subject_name as string) ||
    `Account ${r.subject_id ?? "?"}`;

  // The system talking about itself: a breaker tripping is not a decision about
  // a customer and has no account behind it, so it must not borrow the triage
  // vocabulary and end up reading "Could not decide on Account ?".
  if (r.agent === "system") {
    const who = r.signal_key.split(":")[1] ?? "an agent";
    return {
      when: hhmm(r.at), at: r.at.toISOString(), signalKey: r.signal_key,
      title: `${who} stopped itself`,
      detail: `${r.hold_reason ?? "too much activity in one hour"}. It will not run again until a person clears it.`,
      tag: "escalated", kind: "act", verdict: r.verdict, score: null, confidence: null,
      policyVersion: r.policy_version, model: null, agent: r.agent,
      reasons: [], held: Boolean(r.held), errorCode: r.error_code,
    };
  }

  // A monthly review is a verdict and a digest is a narrative. Forcing either
  // into the triage vocabulary is what produced rows that said nothing.
  if (r.agent === "account-review") {
    return {
      when: hhmm(r.at), at: r.at.toISOString(), signalKey: r.signal_key,
      title: `${name} — the month's verdict`,
      detail: (out.headline as string) ?? (out.why as string) ?? "Reviewed at month end.",
      tag: "learned", kind: "ok", verdict: r.verdict, score: null,
      confidence: r.confidence === null ? null : Number(r.confidence),
      policyVersion: r.policy_version, model: r.model, agent: r.agent,
      reasons: [(out.why as string) ?? "", (out.recommended_move as string) ?? ""]
        .filter(Boolean)
        .concat(reasons),
      held: Boolean(r.held), errorCode: r.error_code,
    };
  }
  if (r.agent === "portfolio-digest") {
    const plays = Array.isArray(out.plays) ? (out.plays as { what?: string; worth?: string }[]) : [];
    return {
      when: hhmm(r.at), at: r.at.toISOString(), signalKey: r.signal_key,
      title: "The month, one level up",
      detail: ((out.narrative as string) ?? "").slice(0, 220),
      tag: "learned", kind: "ok", verdict: null, score: null,
      confidence: r.confidence === null ? null : Number(r.confidence),
      policyVersion: r.policy_version, model: r.model, agent: r.agent,
      reasons: plays.map((p) => `${p.worth ?? ""} — ${p.what ?? ""}`.trim()),
      held: Boolean(r.held), errorCode: r.error_code,
    };
  }
  const domain = (inp.email_domain as string) || "";
  const { tag, kind } = tagFor(r);

  // Human rows carry no facts of their own — they point at the signal a person
  // acted on — so they are titled from what the person did, not from a verdict.
  const humanTitle =
    r.verdict === "released"
      ? `A person released the message to ${name}`
      : r.verdict === "unsuppressed"
        ? `A person put ${name} back`
        : `A person acted on ${name}`;

  const title = r.agent === "human"
    ? humanTitle
    : r.error_code
    ? `Could not decide on ${name}`
    : r.verdict === "human_now"
      ? `Scored ${name} — a person should call`
      : r.verdict === "nurture"
        ? `Scored ${name} — nurture sequence`
        : r.verdict === "suppress"
          ? `Suppressed ${name}`
          : `Scored ${name}`;

  // The detail line is the evidence, not a restatement of the verdict. If the
  // agent gave reasons they are the detail; a failure explains itself instead.
  const detail = r.error_code
    ? `${r.hold_reason ?? "the gateway did not answer"} — held, nothing was sent. Will retry.`
    : [
        reasons[0],
        reasons[1],
        r.score !== null ? `Score ${r.score}, confidence ${Number(r.confidence ?? 0).toFixed(2)}.` : null,
        r.policy_version ? `Policy ${r.policy_version}.` : null,
      ]
        .filter(Boolean)
        .join(" ");

  return {
    when: hhmm(r.at),
    at: r.at.toISOString(),
    signalKey: r.signal_key,
    title,
    detail: detail || `${domain || "no domain"} · ${r.action_taken ?? "logged"}`,
    tag,
    kind,
    verdict: r.verdict,
    score: r.score === null ? null : Number(r.score),
    confidence: r.confidence === null ? null : Number(r.confidence),
    policyVersion: r.policy_version,
    model: r.model,
    agent: r.agent,
    reasons,
    held: Boolean(r.held),
    errorCode: r.error_code,
  };
}

/** The Live and AI log feeds: every decision, newest first. */
export async function decisions(limit = 40, before?: string): Promise<LogRow[]> {
  // Only what the AI did. A person releasing a draft or reversing a suppression
  // is a human act, and human acts are the Audit log's question — "are the
  // people behaving?" — not Activity's. The rows still exist; they are read by
  // a different surface with a different audience and retention.
  const rows = before
    ? await read<Raw>(
        `${SELECT} WHERE d.agent <> 'human' AND d.at < ? ORDER BY d.at DESC, d.id DESC LIMIT ?`,
        [before, limit],
      )
    : await read<Raw>(
        `${SELECT} WHERE d.agent <> 'human' ORDER BY d.at DESC, d.id DESC LIMIT ?`,
        [limit],
      );
  return rows.map(shape);
}

/** Human acts on Autopilot's own records — the Audit log's half of the table. */
export async function humanActs(limit = 25): Promise<LogRow[]> {
  const rows = await read<Raw>(
    `${SELECT} WHERE d.agent = 'human' ORDER BY d.at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(shape);
}

/**
 * The Filtered tab: what was suppressed, and why.
 *
 * Suppression is the decision nobody sees go wrong — a customer who never got
 * called leaves no trace. So this reads from the same table as everything else
 * and nothing is ever deleted; `unsuppress` below is the way back.
 */
export async function suppressed(limit = 25): Promise<LogRow[]> {
  // Filter on the signal's *current* state, not the decision's verdict. The
  // decision is history and never changes — putting a signup back reopens the
  // signal and writes a second decision, so a verdict filter would keep showing
  // things a person already reversed.
  const rows = await read<Raw>(
    `${SELECT} WHERE d.verdict = 'suppress' AND s.state = 'suppressed'
      ORDER BY d.at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(shape);
}

/**
 * Put a suppressed signal back in front of a person.
 *
 * This does not edit the decision — the original verdict stays exactly as it
 * was made, because a log that can be rewritten is not a log. It reopens the
 * signal and records the reversal as its own decision row, actor and all.
 */
export async function unsuppress(signalKey: string, actorAdminId: string | null): Promise<boolean> {
  const res = await write(
    `UPDATE pulse_signal SET state = 'open' WHERE signal_key = ? AND state = 'suppressed'`,
    [signalKey],
  );
  if (!res.affectedRows) return false;

  await write(
    `INSERT INTO pulse_decision
        (signal_key, agent, policy_version, input_digest, verdict, action_taken,
         actor_admin_id, acted_at, output_json)
     VALUES (?, 'human', NULL, SHA2(CONCAT('unsuppress:', ?), 256), 'unsuppressed',
             'reopened by a person', ?, NOW(), JSON_OBJECT('note','a person reversed the suppression'))
     ON DUPLICATE KEY UPDATE acted_at = NOW(), actor_admin_id = VALUES(actor_admin_id)`,
    [signalKey, signalKey, actorAdminId],
  );

  await write(
    `INSERT INTO pulse_outcome (signal_key, kind, detail, actor_admin_id, occurred_at)
     VALUES (?, 'unsuppressed', 'reopened from the Filtered tab', ?, NOW())`,
    [signalKey, actorAdminId],
  );

  return true;
}

/** The headline over the tabs — real counts, not a sample number. */
export async function logSummary() {
  const row = await read<{
    total: number;
    raised: number;
    nurtured: number;
    suppressed: number;
    held: number;
    this_month: number;
  }>(
    `SELECT COUNT(*) total,
            SUM(verdict = 'human_now') raised,
            SUM(verdict = 'nurture')   nurtured,
            SUM(verdict = 'suppress')  suppressed,
            SUM(held = 1)              held,
            SUM(at >= DATE_FORMAT(NOW(), '%Y-%m-01')) this_month
       FROM pulse_decision`,
  );
  const r = row[0];
  return {
    total: Number(r?.total ?? 0),
    raised: Number(r?.raised ?? 0),
    nurtured: Number(r?.nurtured ?? 0),
    suppressed: Number(r?.suppressed ?? 0),
    held: Number(r?.held ?? 0),
    thisMonth: Number(r?.this_month ?? 0),
  };
}

/**
 * What Autopilot has done about one account.
 *
 * The account page is where a rep asks "what is going on with this company?" and
 * until now Autopilot's own answer to that question lived on a different
 * surface. A signup that was suppressed as a partner's customer should say so
 * here, on the page of the company it was about.
 *
 * Reads Pulse's store only. The account is matched by id — `signup:302631`,
 * `daily:day_12:302631` — because nothing here has a foreign key into MSG91's
 * schema.
 */
export async function forAccount(userPid: number) {
  const [decisions, drafts, timers] = await Promise.all([
    read<Raw>(
      `${SELECT} WHERE s.subject_id = ? OR d.signal_key LIKE ?
        ORDER BY d.at DESC LIMIT 12`,
      [String(userPid), `%:${userPid}`],
    ),
    read<{ id: number; channel: string; subject: string | null; body: string; status: string; hold_reason: string | null; created_at: Date }>(
      `SELECT id, channel, subject, body, status, hold_reason, created_at
         FROM pulse_draft WHERE account_pid = ? ORDER BY created_at DESC LIMIT 5`,
      [String(userPid)],
    ),
    read<{ timer_key: string; fires_at: Date; action: string; state: string }>(
      `SELECT timer_key, fires_at, action, state
         FROM pulse_timer
        WHERE state = 'pending' AND signal_key LIKE ?
        ORDER BY fires_at ASC LIMIT 3`,
      [`%:${userPid}`],
    ),
  ]);

  return {
    decisions: decisions.map(shape),
    drafts: drafts.map((d) => ({
      id: d.id,
      channel: d.channel,
      subject: d.subject,
      body: d.body,
      status: d.status,
      holdReason: d.hold_reason,
      when: d.created_at.toISOString(),
    })),
    // "Message two goes out on Thursday, unless something changes." Nowhere
    // else in the product says what Autopilot intends to do next.
    next: timers.map((t) => ({
      what: t.action.replace(/_/g, " "),
      at: t.fires_at.toISOString(),
      inDays: Math.max(0, Math.ceil((t.fires_at.getTime() - Date.now()) / 86_400_000)),
    })),
  };
}

/**
 * In flight — work that is moving without you.
 *
 * Handover §7.1 asks the question this section exists to answer: **who holds
 * the ball?** Not a pipeline stage, and nothing typed by hand — every row is
 * derived from what Autopilot is actually doing.
 *
 *   PULSE   — Autopilot is running it. A timer is set; nobody needs to act.
 *   BLOCKED — something here is holding it up. A draft written and waiting on
 *             a person to release. **This is where work actually dies, and it
 *             is invisible in every CRM.**
 *   THEM    — the message went out and the customer owes a reply.
 *
 * Ageing is what turns a row into a card. A draft held for three days is not
 * the same as one written an hour ago, and the difference should be visible
 * before anyone has to ask.
 */
export type FlightRow = {
  account: string;
  what: string;
  ball: "them" | "us" | "pulse";
  days: number;
  doing: string;
  signalKey: string;
  old: boolean;
};

export async function inFlight(limit = 12): Promise<FlightRow[]> {
  const [drafts, timers, sent] = await Promise.all([
    read<{ signal_key: string; account_pid: string | null; subject: string | null; hold_reason: string | null; created_at: Date; name: string | null }>(
      `SELECT f.signal_key, f.account_pid, f.subject, f.hold_reason, f.created_at,
              JSON_UNQUOTE(JSON_EXTRACT(d.input_json, '$.company_name')) name
         FROM pulse_draft f
         LEFT JOIN pulse_decision d ON d.signal_key = f.signal_key AND d.agent = 'signup-triage'
        WHERE f.status = 'held'
        ORDER BY f.created_at ASC LIMIT ?`,
      [limit],
    ),
    read<{ signal_key: string; fires_at: Date; action: string; name: string | null }>(
      `SELECT t.signal_key, t.fires_at, t.action,
              JSON_UNQUOTE(JSON_EXTRACT(d.input_json, '$.company_name')) name
         FROM pulse_timer t
         LEFT JOIN pulse_decision d ON d.signal_key = t.signal_key AND d.agent = 'signup-triage'
        WHERE t.state = 'pending'
        ORDER BY t.fires_at ASC LIMIT ?`,
      [limit],
    ),
    read<{ signal_key: string; released_at: Date; name: string | null }>(
      `SELECT f.signal_key, f.released_at,
              JSON_UNQUOTE(JSON_EXTRACT(d.input_json, '$.company_name')) name
         FROM pulse_draft f
         LEFT JOIN pulse_decision d ON d.signal_key = f.signal_key AND d.agent = 'signup-triage'
         LEFT JOIN pulse_outcome o ON o.signal_key = f.signal_key AND o.kind = 'replied'
        WHERE f.status = 'released' AND o.id IS NULL
        ORDER BY f.released_at DESC LIMIT ?`,
      [limit],
    ),
  ]);

  const daysSince = (d: Date) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000));
  const named = (n: string | null, key: string) => n?.trim() || `Account ${key.split(":")[1] ?? "?"}`;

  const rows: FlightRow[] = [
    ...drafts.map((d) => ({
      account: named(d.name, d.signal_key),
      what: d.subject ? `“${d.subject}” written and held` : "A message written and held",
      ball: "us" as const,
      days: daysSince(d.created_at),
      doing: d.hold_reason ? `Held: ${d.hold_reason}. Waiting on you to release it.` : "Waiting on you to release it.",
      signalKey: d.signal_key,
      // Three days is where a first touch stops being worth sending.
      old: daysSince(d.created_at) >= 3,
    })),
    ...timers.map((t) => ({
      account: named(t.name, t.signal_key),
      what: t.action.replace(/_/g, " "),
      ball: "pulse" as const,
      days: 0,
      doing: `Set for ${new Date(t.fires_at).toDateString().slice(4, 10)}. Cancels itself if they pay or a person steps in.`,
      signalKey: t.signal_key,
      old: false,
    })),
    ...sent.map((s) => ({
      account: named(s.name, s.signal_key),
      what: "Message sent, no reply yet",
      ball: "them" as const,
      days: s.released_at ? daysSince(s.released_at) : 0,
      doing: "Waiting on them. Silence detection needs a mailbox, so this ages rather than resolves.",
      signalKey: s.signal_key,
      old: s.released_at ? daysSince(s.released_at) >= 7 : false,
    })),
  ];

  // Oldest first: a row that has been waiting longest is the one worth seeing.
  return rows.sort((a, b) => b.days - a.days).slice(0, limit);
}
