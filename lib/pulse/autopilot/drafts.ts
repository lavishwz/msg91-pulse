import { draftOutreach, type Draft } from "../agents";
import { read, write, readOne, activePolicy } from "@/lib/store";
import { checkForPrice, isPartnerCustomer } from "./guards";
import type { SignupFacts } from "../agents";
import { traitsFor, samplesFromTraits } from "../voice";
import { query } from "@/lib/db";
import { scriptIdFor } from "../connections";
import { sendGmail } from "../viasocket";

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
  /** ms_user.user_email for accountPid, resolved fresh — who this actually
   *  goes to if it is sent. Not stored on the draft row itself: an address
   *  changing between drafting and sending should show the current one. */
  to: string | null;
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

const shape = (r: RawDraft, to: string | null = null): DraftRow => ({
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
  to,
});

/**
 * Recipient email for a batch of drafts, one pass over ms_user — the same
 * discipline cards.ts uses against the same table, for the same reason
 * (no usable secondary index, so N drafts must not mean N queries).
 */
async function recipientsFor(accountPids: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(accountPids.filter((p): p is string => !!p))];
  if (!ids.length) return new Map();
  const rows = await query<{ user_pid: number; user_email: string | null }>(
    `SELECT user_pid, user_email FROM ms_user WHERE user_pid IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  return new Map(rows.filter((r) => r.user_email).map((r) => [String(r.user_pid), r.user_email as string]));
}

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
  ownerEmail: string | null = null,
): Promise<{ draftId: number | null; draft: Draft | null; holdReason: string | null }> {
  if (isPartnerCustomer(facts)) {
    return { draftId: null, draft: null, holdReason: "partner customer" };
  }

  const policy = await activePolicy();

  /* The traits saved in Profile → "How you write" (pulse_user_voice), turned
     into the sentence the prompt's owner_writing_samples slot reads. Falls
     back to the same honest "no samples yet" text when there is no email to
     look up — a signup drafted before any owner is resolved, for instance —
     rather than a made-up voice. See lib/pulse/voice.ts for why this used to
     be a dead end: the traits were saved but nothing read them back. */
  const ownerWritingSamples = ownerEmail
    ? samplesFromTraits(await traitsFor(ownerEmail))
    : "(no samples yet — write plainly, short sentences, no marketing language)";

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
    ownerWritingSamples,
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
  // Every draft still waits for a person regardless — sending is never
  // automatic, whatever this reason says (the manifest rule: a customer
  // message always needs a person). What changed is that the reason used to
  // be hardcoded "no mailbox connected" even for a rep who had one — this
  // checks for real now that sendDraft() exists to act on it correctly.
  const status: "held" = "held";
  if (send && !hold) {
    const connected = ownerEmail ? await scriptIdFor(ownerEmail, "gmail") : null;
    hold = connected ? "waiting for a person to review and send" : "no mailbox connected";
  }

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
  const to = await recipientsFor(rows.map((r) => r.account_pid));
  return rows.map((r) => shape(r, r.account_pid ? (to.get(r.account_pid) ?? null) : null));
}

export async function getDraft(id: number): Promise<DraftRow | null> {
  const row = await readOne<RawDraft>(`SELECT * FROM pulse_draft WHERE id = ?`, [id]);
  if (!row) return null;
  const to = await recipientsFor([row.account_pid]);
  return shape(row, row.account_pid ? (to.get(row.account_pid) ?? null) : null);
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

/**
 * Send a draft for real — the piece that was missing entirely until now.
 * `release` (above) only ever flipped a status; nothing in this codebase has
 * ever called an API that puts a message in front of a customer. This does.
 *
 * Same guardrails as release, re-run against the final text (not the
 * original, in case of an edit), plus two checks release never needed
 * because it never actually sent anything:
 *
 *   - the sender must have a connected mailbox (lib/pulse/connections.ts),
 *     the same connection Profile's "Connect Gmail" already establishes —
 *     no new connect flow, this reuses it exactly as reading mail does;
 *   - the account must have a real email on file to send to.
 *
 * A ViaSocket failure marks the draft `failed`, not `held` — it stays
 * refusing to retry itself silently; a person decides what happens next.
 * `sent_at` and `status='sent'` are columns migrations/001_store.sql already
 * had, unused until now.
 */
export async function sendDraft(
  id: number,
  actor: string,
  editedBody?: string,
): Promise<{ ok: boolean; error?: string; sentTo?: string }> {
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
    return { ok: false, error: `cannot send: ${price.reason}. A price needs a person with authority, not a send click.` };
  }

  if (!draft.to) {
    return { ok: false, error: "no email on file for this account — nowhere to send it" };
  }

  const scriptId = await scriptIdFor(actor, "gmail");
  if (!scriptId) {
    return { ok: false, error: "connect your mailbox in Profile before sending" };
  }

  try {
    await sendGmail(scriptId, draft.to, draft.subject ?? "", finalText);
  } catch (err) {
    // Held to failed, not back to held: a retry needs a person to look at
    // why it failed, not another blind attempt on the next pass.
    await write(`UPDATE pulse_draft SET status = 'failed' WHERE id = ? AND status = 'held'`, [id]);
    return { ok: false, error: (err as Error).message };
  }

  await write(
    `UPDATE pulse_draft
        SET status = 'sent', released_by = ?, released_at = NOW(), sent_at = NOW(),
            released_body = ?
      WHERE id = ? AND status = 'held'`,
    [actor, editedBody ?? null, id],
  );

  await write(
    `INSERT INTO pulse_decision
        (signal_key, agent, input_digest, verdict, action_taken, actor_admin_id, acted_at, output_json)
     VALUES (?, 'human', SHA2(CONCAT('send:', ?), 256), 'sent',
             ?, ?, NOW(), JSON_OBJECT('draft_id', ?, 'sent_to', ?, 'edited', ?))
     ON DUPLICATE KEY UPDATE acted_at = NOW(), actor_admin_id = VALUES(actor_admin_id)`,
    [
      draft.signalKey,
      String(id),
      editedBody ? "sent after editing" : "sent unedited",
      actor,
      id,
      draft.to,
      editedBody ? 1 : 0,
    ],
  );

  return { ok: true, sentTo: draft.to };
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
