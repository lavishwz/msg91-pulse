import { draftOutreach, type Draft } from "../agents";
import { read, write, readOne, activePolicy } from "@/lib/store";
import { checkForPrice, isPartnerCustomer } from "./guards";
import type { SignupFacts } from "../agents";

export { checkForPrice, isPartnerCustomer } from "./guards";

/**
 * Drafts — writing to a customer, and the controls around it.
 *
 * The manifest allows Autopilot to draft; it never allows it to send anything
 * with a price in it, or to contact a partner's customer. Those two rules are
 * written into Agent 3's prompt AND enforced here, in code.
 *
 * That duplication is deliberate. A prompt is guidance a model usually follows;
 * a check is a control that always holds. Every rule that would embarrass MSG91
 * if broken is enforced at the boundary the draft has to cross, not in the
 * instructions that produced it.
 */

export type DraftRow = {
  id: number;
  signalKey: string;
  accountPid: string | null;
  channel: string;
  step: number;
  subject: string | null;
  body: string;
  status: string;
  holdReason: string | null;
  confidence: number | null;
  factsUsed: string[];
  createdAt: string;
  releasedBy: string | null;
  edited: boolean;
};

type RawDraft = {
  id: number;
  signal_key: string;
  account_pid: string | null;
  channel: string;
  sequence_step: number;
  subject: string | null;
  body: string;
  released_body: string | null;
  status: string;
  hold_reason: string | null;
  confidence: string | number | null;
  facts_used: unknown;
  created_at: Date;
  released_by: string | null;
};

const shape = (r: RawDraft): DraftRow => ({
  id: r.id,
  signalKey: r.signal_key,
  accountPid: r.account_pid,
  channel: r.channel,
  step: Number(r.sequence_step),
  subject: r.subject,
  body: r.released_body ?? r.body,
  status: r.status,
  holdReason: r.hold_reason,
  confidence: r.confidence === null ? null : Number(r.confidence),
  factsUsed: Array.isArray(r.facts_used)
    ? (r.facts_used as string[])
    : typeof r.facts_used === "string"
      ? (JSON.parse(r.facts_used || "[]") as string[])
      : [],
  createdAt: r.created_at.toISOString(),
  releasedBy: r.released_by,
  edited: Boolean(r.released_body && r.released_body !== r.body),
});

/**
 * Write one draft for a signup.
 *
 * Returns the row id, or null when nothing should be written at all — a
 * partner's customer gets no draft, not a held one, because there is no
 * circumstance in which a person should release it.
 */
export async function draftFor(
  facts: SignupFacts,
  reasons: string[],
  ownerName: string,
  step: 1 | 2 | 3 = 1,
): Promise<{ draftId: number | null; draft: Draft | null; holdReason: string | null }> {
  if (isPartnerCustomer(facts)) {
    return { draftId: null, draft: null, holdReason: "partner customer" };
  }

  const policy = await activePolicy();

  const call = await draftOutreach({
    accountFacts: {
      company_name: facts.company_name,
      email_domain: facts.email_domain,
      entity: facts.entity,
      signup_step_reached: facts.signup_step_reached,
      industry: facts.industry,
      is_free_mail: facts.is_free_mail,
    },
    triageReasons: reasons,
    channel: "email",
    sequenceStep: step,
    ownerName,
    ownerTitle: "Account Manager, MSG91",
    // No mailbox is connected yet, so there are no real writing samples. Saying
    // so is better than inventing a voice the rep does not have.
    ownerWritingSamples:
      "(no samples yet — write plainly, short sentences, no marketing language)",
    rateCardBounds: "not provided — never mention a price, a rate or a discount",
    sendingPaused: policy.sendingPaused,
  });

  const d = call.data;

  // The controls, in order of severity. Each one only ever makes a draft *more*
  // held, never less: nothing here can flip send back to true.
  let send = d.send;
  let hold = d.hold_reason as string | null;

  const price = checkForPrice(`${d.subject} ${d.body}`);
  if (!price.clean) {
    send = false;
    hold = price.reason;
  }
  if (policy.sendingPaused) {
    send = false;
    hold = "sending paused";
  }
  if (d.confidence < 0.6) {
    send = false;
    hold = hold ?? "low confidence";
  }
  // Nothing is actually sendable yet — no mailbox is connected — so every draft
  // waits for a person regardless. When a mailbox exists, this is the one line
  // that changes.
  const status: "held" = "held";
  if (send && !hold) hold = "no mailbox connected";

  // INSERT IGNORE, not INSERT: a re-run of the same tick must not write a
  // second message to the same person. The unique key on (signal_key, step) is
  // what enforces it; this just makes the collision a no-op instead of a throw.
  const res = await write(
    `INSERT IGNORE INTO pulse_draft
       (decision_id, signal_key, account_pid, channel, sequence_step, subject, body,
        status, hold_reason, confidence, facts_used)
     VALUES (
       (SELECT id FROM pulse_decision WHERE signal_key = ? AND agent = 'signup-triage' LIMIT 1),
       ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      facts.user_pid ? `signup:${facts.user_pid}` : "",
      `signup:${facts.user_pid}`,
      facts.user_pid,
      d.channel,
      step,
      d.subject,
      d.body,
      status,
      hold,
      d.confidence,
      JSON.stringify(d.facts_used),
    ],
  );

  // affectedRows 0 means a draft for this step already existed and this one was
  // dropped. That is the correct outcome, not a failure.
  if (!res.affectedRows) {
    return { draftId: null, draft: d, holdReason: "a draft for this step already exists" };
  }

  return { draftId: res.insertId, draft: d, holdReason: hold };
}

/** Drafts waiting on a person, newest first. */
export async function listDrafts(status = "held", limit = 25): Promise<DraftRow[]> {
  const rows = await read<RawDraft>(
    `SELECT * FROM pulse_draft WHERE status = ? ORDER BY created_at DESC LIMIT ?`,
    [status, limit],
  );
  return rows.map(shape);
}

export async function getDraft(id: number): Promise<DraftRow | null> {
  const row = await readOne<RawDraft>(`SELECT * FROM pulse_draft WHERE id = ?`, [id]);
  return row ? shape(row) : null;
}

/**
 * Release a draft — the moment a person takes responsibility for it.
 *
 * The price check runs again here on whatever text is actually being released,
 * because the rep may have edited it. A control that only runs on the agent's
 * output would be trivially bypassed by typing the price in by hand.
 *
 * `body` is left exactly as the agent wrote it and the edit goes in
 * `released_body`, so the edit rate stays measurable.
 */
export async function releaseDraft(
  id: number,
  actor: string,
  editedBody?: string,
): Promise<{ ok: boolean; error?: string }> {
  const draft = await getDraft(id);
  if (!draft) return { ok: false, error: "no such draft" };
  if (draft.status !== "held") return { ok: false, error: `draft is already ${draft.status}` };

  const policy = await activePolicy();
  if (policy.sendingPaused) {
    return { ok: false, error: "sending is paused — the kill switch is on" };
  }

  const finalText = editedBody ?? draft.body;
  const price = checkForPrice(`${draft.subject ?? ""} ${finalText}`);
  if (!price.clean) {
    return { ok: false, error: `cannot release: ${price.reason}. A price needs a person with authority, not a release click.` };
  }

  await write(
    `UPDATE pulse_draft
        SET status = 'released', released_by = ?, released_at = NOW(),
            released_body = ?
      WHERE id = ? AND status = 'held'`,
    [actor, editedBody ?? null, id],
  );

  // The release is the approve row in the audit log. It is a decision made by a
  // person, recorded in the same table as the ones made by an agent.
  await write(
    `INSERT INTO pulse_decision
        (signal_key, agent, input_digest, verdict, action_taken, actor_admin_id, acted_at, output_json)
     VALUES (?, 'human', SHA2(CONCAT('release:', ?), 256), 'released',
             ?, ?, NOW(), JSON_OBJECT('draft_id', ?, 'edited', ?))
     ON DUPLICATE KEY UPDATE acted_at = NOW(), actor_admin_id = VALUES(actor_admin_id)`,
    [
      draft.signalKey,
      String(id),
      editedBody ? "released after editing" : "released unedited",
      actor,
      id,
      editedBody ? 1 : 0,
    ],
  );

  return { ok: true };
}

export async function discardDraft(id: number, actor: string): Promise<{ ok: boolean; error?: string }> {
  const draft = await getDraft(id);
  if (!draft) return { ok: false, error: "no such draft" };
  if (draft.status !== "held") return { ok: false, error: `draft is already ${draft.status}` };

  await write(`UPDATE pulse_draft SET status = 'discarded' WHERE id = ? AND status = 'held'`, [id]);
  await write(
    `INSERT INTO pulse_outcome (signal_key, kind, detail, actor_admin_id, occurred_at)
     VALUES (?, 'ignored', 'draft discarded by a person', ?, NOW())`,
    [draft.signalKey, actor],
  );
  return { ok: true };
}

/** The kill switch. Writes a policy row; the runner and release path read it. */
export async function setSendingPaused(paused: boolean, actor: string): Promise<void> {
  await write(
    `UPDATE pulse_policy SET body = JSON_OBJECT('paused', ?), note = ?
      WHERE policy_key = 'sending.paused' AND state = 'active'`,
    [paused ? 1 : 0, `${paused ? "paused" : "resumed"} by ${actor}`],
  );
}
