import { read, readOne, write } from "@/lib/store";

/**
 * Missions and work items — pulse_mission / pulse_work_item (029_missions.sql).
 *
 * This is the substrate the PRD calls the actual difference between Pulse and
 * a CRM: "AI creates, merges, updates, pauses, or closes revenue missions from
 * signals" (PRD §8.4), and My Work is built on four work-item types — next
 * action, promise, approval, watch (decisions doc) — never a bare task typed
 * by hand.
 *
 * Everything here is idempotent by key, the same discipline pulse_signal and
 * pulse_decision already use: a caller that runs twice (a retried scanner, a
 * re-submitted "Log what happened") must update the same row, never open a
 * second mission or a duplicate task. That is the merge rule the handover's
 * engine notes (§10) name as the single biggest defence against card fatigue.
 */

export type MissionType =
  | "qualify"
  | "first_value"
  | "activate_product"
  | "grow_product"
  | "protect_revenue"
  | "solve_issue"
  | "repair_relationship"
  | "startup_progress"
  | "partner_growth"
  | "outbound_discovery";

export type MissionState = "active" | "waiting" | "blocked" | "completed" | "stopped";

export type Mission = {
  id: number;
  key: string;
  accountPid: string;
  type: MissionType;
  state: MissionState;
  title: string;
  reason: string | null;
  evidence: unknown;
  ownerId: string | null;
  expectedOutcome: string | null;
  actualOutcome: string | null;
  source: "ai" | "human";
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

type RawMission = {
  id: number;
  mission_key: string;
  account_pid: string;
  type: string;
  state: string;
  title: string;
  reason: string | null;
  evidence: unknown;
  owner_admin_id: string | null;
  expected_outcome: string | null;
  actual_outcome: string | null;
  source: string;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
};

function parseJson(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

const shapeMission = (r: RawMission): Mission => ({
  id: r.id,
  key: r.mission_key,
  accountPid: r.account_pid,
  type: r.type as MissionType,
  state: r.state as MissionState,
  title: r.title,
  reason: r.reason,
  evidence: parseJson(r.evidence),
  ownerId: r.owner_admin_id,
  expectedOutcome: r.expected_outcome,
  actualOutcome: r.actual_outcome,
  source: r.source as "ai" | "human",
  createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  closedAt: r.closed_at ? (r.closed_at instanceof Date ? r.closed_at.toISOString() : String(r.closed_at)) : null,
});

export type UpsertMissionInput = {
  key: string;
  accountPid: string;
  type: MissionType;
  title: string;
  reason?: string | null;
  evidence?: unknown;
  ownerId?: string | null;
  expectedOutcome?: string | null;
  source?: "ai" | "human";
  createdBy?: string | null;
};

/**
 * Create or merge a mission by its stable key.
 *
 * An existing mission is updated — title, reason, evidence, expected outcome
 * — and reopened to `active` if a fresh signal arrives on one that had gone
 * to `waiting`. It is never reopened once `completed` or `stopped`; a new
 * signal after that starts a new mission (a fresh key), because re-litigating
 * a closed outcome is a different mission, not a continuation of the old one.
 */
export async function upsertMission(input: UpsertMissionInput): Promise<Mission> {
  const existing = await readOne<RawMission>(
    `SELECT * FROM pulse_mission WHERE mission_key = ?`,
    [input.key],
  );

  if (existing && existing.state !== "completed" && existing.state !== "stopped") {
    await write(
      `UPDATE pulse_mission
          SET title = ?, reason = ?, evidence = ?, expected_outcome = COALESCE(?, expected_outcome),
              state = IF(state = 'waiting', 'active', state)
        WHERE id = ?`,
      [
        input.title,
        input.reason ?? null,
        JSON.stringify(input.evidence ?? null),
        input.expectedOutcome ?? null,
        existing.id,
      ],
    );
    const row = await readOne<RawMission>(`SELECT * FROM pulse_mission WHERE id = ?`, [existing.id]);
    return shapeMission(row as RawMission);
  }

  await write(
    `INSERT INTO pulse_mission
       (mission_key, account_pid, type, title, reason, evidence, owner_admin_id,
        expected_outcome, source, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.key,
      input.accountPid,
      input.type,
      input.title,
      input.reason ?? null,
      JSON.stringify(input.evidence ?? null),
      input.ownerId ?? null,
      input.expectedOutcome ?? null,
      input.source ?? "ai",
      input.createdBy ?? null,
    ],
  );
  const row = await readOne<RawMission>(`SELECT * FROM pulse_mission WHERE mission_key = ?`, [input.key]);
  return shapeMission(row as RawMission);
}

export async function listMissionsForAccount(accountPid: string): Promise<Mission[]> {
  const rows = await read<RawMission>(
    `SELECT * FROM pulse_mission WHERE account_pid = ? ORDER BY
       FIELD(state,'active','waiting','blocked','completed','stopped'), updated_at DESC`,
    [accountPid],
  );
  return rows.map(shapeMission);
}

export async function getMission(id: number): Promise<Mission | null> {
  const row = await readOne<RawMission>(`SELECT * FROM pulse_mission WHERE id = ?`, [id]);
  return row ? shapeMission(row) : null;
}

/** Complete or stop a mission. Terminal — see upsertMission for why. */
export async function closeMission(
  id: number,
  outcome: string,
  state: "completed" | "stopped" = "completed",
): Promise<void> {
  await write(
    `UPDATE pulse_mission SET state = ?, actual_outcome = ?, closed_at = NOW() WHERE id = ?`,
    [state, outcome, id],
  );
}

// ── Work items ───────────────────────────────────────────────────────────

export type WorkType = "next_action" | "promise" | "approval" | "watch";
export type WorkStatus = "open" | "done" | "snoozed" | "stopped";
export type WaitingOn = "them" | "us" | "teammate";

export type WorkItem = {
  id: number;
  key: string;
  missionId: number | null;
  accountPid: string;
  type: WorkType;
  title: string;
  reason: string | null;
  evidence: unknown;
  ownerId: string | null;
  team: string | null;
  dueAt: string | null;
  status: WorkStatus;
  priorityReason: string | null;
  waitingOn: WaitingOn | null;
  source: "ai" | "human";
  outcome: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

type RawWork = {
  id: number;
  work_key: string;
  mission_id: number | null;
  account_pid: string;
  type: string;
  title: string;
  reason: string | null;
  evidence: unknown;
  owner_admin_id: string | null;
  team: string | null;
  due_at: Date | null;
  status: string;
  priority_reason: string | null;
  waiting_on: string | null;
  source: string;
  outcome: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
};

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

const shapeWork = (r: RawWork): WorkItem => ({
  id: r.id,
  key: r.work_key,
  missionId: r.mission_id,
  accountPid: r.account_pid,
  type: r.type as WorkType,
  title: r.title,
  reason: r.reason,
  evidence: parseJson(r.evidence),
  ownerId: r.owner_admin_id,
  team: r.team,
  dueAt: iso(r.due_at),
  status: r.status as WorkStatus,
  priorityReason: r.priority_reason,
  waitingOn: r.waiting_on as WaitingOn | null,
  source: r.source as "ai" | "human",
  outcome: r.outcome,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
  completedAt: iso(r.completed_at),
});

export type UpsertWorkInput = {
  key: string;
  missionId?: number | null;
  accountPid: string;
  type: WorkType;
  title: string;
  reason?: string | null;
  evidence?: unknown;
  ownerId?: string | null;
  team?: string | null;
  dueAt?: string | Date | null;
  priorityReason?: string | null;
  waitingOn?: WaitingOn | null;
  source?: "ai" | "human";
};

/** Create or refresh a work item by key. Never duplicates an open promise. */
export async function upsertWorkItem(input: UpsertWorkInput): Promise<WorkItem> {
  const existing = await readOne<RawWork>(`SELECT * FROM pulse_work_item WHERE work_key = ?`, [input.key]);

  if (existing && existing.status !== "done" && existing.status !== "stopped") {
    await write(
      `UPDATE pulse_work_item
          SET title = ?, reason = ?, evidence = ?, due_at = ?, priority_reason = ?,
              waiting_on = COALESCE(?, waiting_on)
        WHERE id = ?`,
      [
        input.title,
        input.reason ?? null,
        JSON.stringify(input.evidence ?? null),
        input.dueAt ?? null,
        input.priorityReason ?? null,
        input.waitingOn ?? null,
        existing.id,
      ],
    );
    const row = await readOne<RawWork>(`SELECT * FROM pulse_work_item WHERE id = ?`, [existing.id]);
    return shapeWork(row as RawWork);
  }

  await write(
    `INSERT INTO pulse_work_item
       (work_key, mission_id, account_pid, type, title, reason, evidence,
        owner_admin_id, team, due_at, priority_reason, waiting_on, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.key,
      input.missionId ?? null,
      input.accountPid,
      input.type,
      input.title,
      input.reason ?? null,
      JSON.stringify(input.evidence ?? null),
      input.ownerId ?? null,
      input.team ?? null,
      input.dueAt ?? null,
      input.priorityReason ?? null,
      input.waitingOn ?? null,
      input.source ?? "ai",
    ],
  );
  const row = await readOne<RawWork>(`SELECT * FROM pulse_work_item WHERE work_key = ?`, [input.key]);
  return shapeWork(row as RawWork);
}

export type WorkScope = "mine" | "team" | "company" | "waiting";

export type WorkQuery = {
  scope: WorkScope;
  ownerId?: string | null;
  team?: string | null;
  limit?: number;
};

/**
 * My Work's four views (PRD §7.1 / decisions doc).
 *
 * - mine: open work owned by this person.
 * - team: open work owned by anyone on the team, plus unowned work tagged
 *   with the team — this is where overdue/unassigned surfaces.
 * - company: long-pending or unowned work company-wide — no team filter.
 * - waiting: open work with waiting_on set, regardless of owner — the
 *   customer/teammate/external response the handover's "In flight" tracks.
 */
export async function listWork(q: WorkQuery): Promise<WorkItem[]> {
  const limit = q.limit ?? 100;
  if (q.scope === "mine") {
    if (!q.ownerId) return [];
    const rows = await read<RawWork>(
      `SELECT * FROM pulse_work_item WHERE owner_admin_id = ? AND status IN ('open','snoozed')
         ORDER BY due_at IS NULL, due_at ASC, created_at DESC LIMIT ?`,
      [q.ownerId, limit],
    );
    return rows.map(shapeWork);
  }
  if (q.scope === "team") {
    const rows = await read<RawWork>(
      `SELECT * FROM pulse_work_item
        WHERE status IN ('open','snoozed') AND (team = ? OR owner_admin_id IS NULL)
        ORDER BY owner_admin_id IS NULL DESC, due_at IS NULL, due_at ASC LIMIT ?`,
      [q.team ?? null, limit],
    );
    return rows.map(shapeWork);
  }
  if (q.scope === "waiting") {
    const rows = await read<RawWork>(
      `SELECT * FROM pulse_work_item WHERE status = 'open' AND waiting_on IS NOT NULL
         ORDER BY updated_at ASC LIMIT ?`,
      [limit],
    );
    return rows.map(shapeWork);
  }
  // company: long-pending or unowned, across everyone
  const rows = await read<RawWork>(
    `SELECT * FROM pulse_work_item
      WHERE status IN ('open','snoozed')
        AND (owner_admin_id IS NULL OR created_at < DATE_SUB(NOW(), INTERVAL 14 DAY))
      ORDER BY owner_admin_id IS NULL DESC, created_at ASC LIMIT ?`,
    [limit],
  );
  return rows.map(shapeWork);
}

export async function getWorkItem(id: number): Promise<WorkItem | null> {
  const row = await readOne<RawWork>(`SELECT * FROM pulse_work_item WHERE id = ?`, [id]);
  return row ? shapeWork(row) : null;
}

/** Mark done. `outcome` is free text — "kept", "missed", or a short note. */
export async function completeWorkItem(id: number, outcome: string): Promise<void> {
  await write(
    `UPDATE pulse_work_item SET status = 'done', outcome = ?, completed_at = NOW() WHERE id = ?`,
    [outcome, id],
  );
}

export async function snoozeWorkItem(id: number, until: string | Date): Promise<void> {
  await write(
    `UPDATE pulse_work_item SET status = 'snoozed', snoozed_until = ? WHERE id = ?`,
    [until, id],
  );
}

export async function stopWorkItem(id: number, reason: string): Promise<void> {
  await write(
    `UPDATE pulse_work_item SET status = 'stopped', outcome = ?, completed_at = NOW() WHERE id = ?`,
    [reason, id],
  );
}

/** Overdue: open/snoozed work past its due time. Feeds the stale-work checks. */
export async function overdueWork(limit = 50): Promise<WorkItem[]> {
  const rows = await read<RawWork>(
    `SELECT * FROM pulse_work_item
      WHERE status IN ('open','snoozed') AND due_at IS NOT NULL AND due_at < NOW()
      ORDER BY due_at ASC LIMIT ?`,
    [limit],
  );
  return rows.map(shapeWork);
}
