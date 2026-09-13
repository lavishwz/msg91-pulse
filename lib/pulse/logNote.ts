import { write } from "@/lib/store";
import { extractLog, type LogExtract } from "./agents";
import { upsertWorkItem, upsertMission } from "./missions";
import { addContact } from "./contacts";

/**
 * "Log what happened" — PRD §8.4, handover §7.7: "the single most important
 * input in the product... the rep logs reality, AI does the structuring."
 *
 * Before this, the sheet was a hardcoded sample and a save button that called
 * nothing (see the feature audit and docs/dev-notes/*). This is the real
 * path: one free-text note in, real records out.
 *
 * `decision` deliberately writes nowhere of its own — none of the four
 * work-item types (next_action/promise/approval/watch) fit "a fact was
 * settled," and inventing a fifth type for one field was worse than the
 * alternative. It is still captured, in the append-only `pulse_signal` row
 * every call writes regardless of what else fires — the complete note and
 * extraction are on record even where nothing else was created from them.
 */

export type LogResult = {
  extract: LogExtract;
  created: {
    promiseId: number | null;
    riskId: number | null;
    missionId: number | null;
    contactAdded: boolean;
  };
};

export async function logWhatHappened(
  accountPid: string,
  accountName: string,
  note: string,
  actor: string,
): Promise<LogResult> {
  const call = await extractLog(note, accountName);
  const extract = call.data;
  const noteKey = `note:${accountPid}:${Date.now()}`;

  await write(
    `INSERT INTO pulse_signal (signal_key, kind, subject_type, subject_id, source, evidence)
     VALUES (?, 'manual_note', 'account', ?, 'human', ?)`,
    [noteKey, accountPid, JSON.stringify({ note, actor, extract })],
  );

  let promiseId: number | null = null;
  if (extract.promise) {
    const item = await upsertWorkItem({
      key: `${noteKey}:promise`,
      accountPid,
      type: "promise",
      title: extract.promise.text,
      dueAt: extract.promise.due_date,
      source: "human",
      priorityReason: "logged from a note",
    });
    promiseId = item.id;
  }

  let riskId: number | null = null;
  if (extract.risk) {
    const item = await upsertWorkItem({
      key: `${noteKey}:risk`,
      accountPid,
      type: "watch",
      title: extract.risk.text,
      dueAt: extract.risk.chase_date,
      source: "human",
      priorityReason: "logged from a note",
    });
    riskId = item.id;
  }

  let missionId: number | null = null;
  if (extract.interest) {
    const productKey = extract.interest.product.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_");
    const mission = await upsertMission({
      key: `grow_product:${accountPid}:${productKey}`,
      accountPid,
      type: "grow_product",
      title: `Help ${accountName} adopt ${extract.interest.product}`,
      reason: extract.interest.reason,
      evidence: [note],
      source: "human",
      createdBy: actor,
    });
    missionId = mission.id;
  }

  let contactAdded = false;
  if (extract.person) {
    await addContact(accountPid, extract.person.name, extract.person.role, actor);
    contactAdded = true;
  }

  return { extract, created: { promiseId, riskId, missionId, contactAdded } };
}
