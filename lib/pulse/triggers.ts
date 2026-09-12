/**
 * Trigger subscriptions and the events they deliver — Pulse's own side of the
 * listening half of ViaSocket (migrations/024).
 *
 * ViaSocket owns the watch: it holds the Gmail push channel, renews it, and
 * POSTs to a URL we gave it when a message arrives. What lives here is only
 * what Pulse needs to be able to answer on its own — which member asked for
 * which trigger, what the unguessable webhook URL for that subscription is,
 * and what has come in since a browser tab last looked.
 *
 * The events table is append-only and read by id rather than by time. A tab
 * polls "anything newer than the last id I saw", which is exact; polling by
 * timestamp would double-deliver anything that landed inside the same second
 * and drop anything whose clock skewed backwards.
 */

import { randomUUID } from "node:crypto";
import { read, readOne, write } from "@/lib/store";

export type TriggerSubscription = {
  id: number;
  memberEmail: string;
  service: string;
  triggerVersionId: string;
  label: string;
  scriptId: string | null;
  hookKey: string;
  state: string;
  lastEventAt: Date | null;
  eventCount: number;
  lastError: string | null;
};

export type TriggerEvent = {
  id: number;
  label: string;
  service: string;
  summary: string | null;
  receivedAt: Date;
};

type SubRow = {
  id: number;
  member_email: string;
  service: string;
  trigger_version_id: string;
  label: string;
  script_id: string | null;
  hook_key: string;
  state: string;
  last_event_at: Date | null;
  event_count: number;
  last_error: string | null;
};

const toSub = (r: SubRow): TriggerSubscription => ({
  id: Number(r.id),
  memberEmail: r.member_email,
  service: r.service,
  triggerVersionId: r.trigger_version_id,
  label: r.label,
  scriptId: r.script_id,
  hookKey: r.hook_key,
  state: r.state,
  lastEventAt: r.last_event_at,
  eventCount: Number(r.event_count),
  lastError: r.last_error,
});

const COLUMNS = `id, member_email, service, trigger_version_id, label, script_id,
  hook_key, state, last_event_at, event_count, last_error`;

/** Everything this member is listening to. */
export async function listSubscriptions(memberEmail: string): Promise<TriggerSubscription[]> {
  const rows = await read<SubRow>(
    `SELECT ${COLUMNS} FROM pulse_trigger_subscription
      WHERE member_email = ? ORDER BY id DESC`,
    [memberEmail],
  );
  return rows.map(toSub);
}

export async function subscriptionByHookKey(hookKey: string): Promise<TriggerSubscription | null> {
  const row = await readOne<SubRow>(
    `SELECT ${COLUMNS} FROM pulse_trigger_subscription WHERE hook_key = ?`,
    [hookKey],
  );
  return row ? toSub(row) : null;
}

export async function subscriptionById(
  memberEmail: string,
  id: number,
): Promise<TriggerSubscription | null> {
  const row = await readOne<SubRow>(
    `SELECT ${COLUMNS} FROM pulse_trigger_subscription WHERE id = ? AND member_email = ?`,
    [id, memberEmail],
  );
  return row ? toSub(row) : null;
}

/**
 * Reserve the row *before* telling ViaSocket about it.
 *
 * The webhook URL contains the hook_key, so the key has to exist before the
 * subscribe call can name it — and if that call then fails, a row pointing at
 * a subscription ViaSocket never created is the honest record of what
 * happened. `recordSubscribed` fills in the script_id on success and
 * `recordSubscribeFailed` writes the reason on failure; a row with neither is
 * one whose subscribe call never came back at all.
 *
 * Re-subscribing to the same trigger reuses the row and its key rather than
 * minting a second watch that would deliver every event twice.
 */
export async function reserveSubscription(
  memberEmail: string,
  service: string,
  triggerVersionId: string,
  label: string,
): Promise<TriggerSubscription> {
  const existing = await readOne<SubRow>(
    `SELECT ${COLUMNS} FROM pulse_trigger_subscription
      WHERE member_email = ? AND trigger_version_id = ?`,
    [memberEmail, triggerVersionId],
  );
  if (existing) return toSub(existing);

  const hookKey = randomUUID();
  await write(
    `INSERT INTO pulse_trigger_subscription
       (member_email, service, trigger_version_id, label, hook_key, state)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [memberEmail, service, triggerVersionId, label, hookKey],
  );
  const row = await readOne<SubRow>(
    `SELECT ${COLUMNS} FROM pulse_trigger_subscription WHERE hook_key = ?`,
    [hookKey],
  );
  if (!row) throw new Error("Could not read back the subscription just created.");
  return toSub(row);
}

export async function recordSubscribed(
  id: number,
  scriptId: string,
  hookUrl: string | null,
): Promise<void> {
  await write(
    `UPDATE pulse_trigger_subscription
        SET script_id = ?, hook_url = ?, state = 'active', last_error = NULL
      WHERE id = ?`,
    [scriptId, hookUrl, id],
  );
}

export async function recordSubscribeFailed(id: number, message: string): Promise<void> {
  await write(`UPDATE pulse_trigger_subscription SET last_error = ? WHERE id = ?`, [
    message.slice(0, 400),
    id,
  ]);
}

export async function setSubscriptionState(id: number, state: "active" | "paused"): Promise<void> {
  await write(`UPDATE pulse_trigger_subscription SET state = ? WHERE id = ?`, [state, id]);
}

export async function deleteSubscription(memberEmail: string, id: number): Promise<void> {
  await write(`DELETE FROM pulse_trigger_event WHERE subscription_id = ?`, [id]);
  await write(`DELETE FROM pulse_trigger_subscription WHERE id = ? AND member_email = ?`, [
    id,
    memberEmail,
  ]);
}

/**
 * A one-line description of an event, for the toast.
 *
 * Gmail's payload shape is not contractually fixed and differs between
 * triggers, so this reads the fields that are usually there and falls back to
 * the trigger's own name rather than inventing something. Nothing here is
 * load-bearing — the whole payload is stored beside it.
 */
function summarise(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const body = (p.body ?? p.data ?? p) as Record<string, unknown>;
  const pick = (...names: string[]): string | null => {
    for (const n of names) {
      const v = body?.[n] ?? p?.[n];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };
  const from = pick("from", "From", "sender", "fromAddress");
  const subject = pick("subject", "Subject", "title", "snippet");
  if (from && subject) return `${subject} — ${from}`.slice(0, 400);
  return (subject ?? from)?.slice(0, 400) ?? null;
}

/** Store one delivered event and bump its subscription's counters. */
export async function recordEvent(
  sub: TriggerSubscription,
  payload: unknown,
): Promise<{ id: number; summary: string | null }> {
  const summary = summarise(payload);
  let text: string | null = null;
  try {
    text = JSON.stringify(payload ?? null);
  } catch {
    // A payload that will not serialise is still an event worth recording;
    // losing the body is better than losing the fact that it arrived.
    text = null;
  }
  const res = await write(
    `INSERT INTO pulse_trigger_event
       (subscription_id, member_email, service, label, summary, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sub.id, sub.memberEmail, sub.service, sub.label, summary, text],
  );
  await write(
    `UPDATE pulse_trigger_subscription
        SET event_count = event_count + 1, last_event_at = NOW()
      WHERE id = ?`,
    [sub.id],
  );
  return { id: Number(res.insertId), summary };
}

/**
 * Events newer than `sinceId`, oldest first so a tab that was away renders
 * them in the order they happened.
 *
 * `sinceId` of 0 means "a tab that has just opened". That returns nothing on
 * purpose: the point of the poll is to announce what arrives while somebody is
 * watching, and replaying a week of mail as toasts the moment a page loads is
 * not that. `latestEventId` is what a fresh tab starts from.
 */
export async function eventsSince(
  memberEmail: string,
  sinceId: number,
  limit = 20,
): Promise<TriggerEvent[]> {
  if (!sinceId) return [];
  const rows = await read<{
    id: number; label: string; service: string; summary: string | null; received_at: Date;
  }>(
    `SELECT id, label, service, summary, received_at
       FROM pulse_trigger_event
      WHERE member_email = ? AND id > ?
      ORDER BY id ASC LIMIT ${Number(limit)}`,
    [memberEmail, sinceId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    label: r.label,
    service: r.service,
    summary: r.summary,
    receivedAt: r.received_at,
  }));
}

/**
 * Where a fresh tab's cursor starts — not literally "everything that already
 * happened", but everything older than `recentSeconds`. A plain MAX(id) meant
 * sending an email and reloading the page a moment later (ViaSocket's
 * delivery itself runs a couple of minutes behind the real event, not
 * instant) landed the toast-worthy event before the cursor did, so it was
 * never announced — indistinguishable from the trigger not having fired at
 * all. Anything within the window still counts as new and gets toasted on
 * the next poll; anything older is exactly the "do not replay a week of
 * mail" behaviour this always had.
 */
export async function latestEventId(memberEmail: string, recentSeconds = 180): Promise<number> {
  const row = await readOne<{ id: number | null }>(
    `SELECT MAX(id) AS id FROM pulse_trigger_event
      WHERE member_email = ? AND received_at < DATE_SUB(NOW(), INTERVAL ? SECOND)`,
    [memberEmail, recentSeconds],
  );
  return Number(row?.id ?? 0);
}
