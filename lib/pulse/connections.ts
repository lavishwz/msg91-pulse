import { read, write } from "@/lib/store";

/**
 * Who has connected Google (mail, calendar) through ViaSocket — Pulse's own
 * record of it, `pulse_connection` (migrations/012). ViaSocket owns the OAuth
 * and the connection itself; this is only the fact that it happened, kept
 * server-side so it survives a reload and shows the same on any device,
 * unlike the `ME.gmail`/`ME.cal` flags in public/pulse.js which are just the
 * page's own memory of the last answer.
 */

export type ConnectionService = "gmail" | "cal" | "slack";
const SERVICES: ConnectionService[] = ["gmail", "cal", "slack"];

type Row = { service: string; connected_at: Date | null; disconnected_at: Date | null };

/** `{gmail: bool, cal: bool, slack: bool}` — connected means connected and not since disconnected. */
export async function connectionState(memberEmail: string): Promise<Record<ConnectionService, boolean>> {
  const rows = await read<Row>(
    `SELECT service, connected_at, disconnected_at
       FROM pulse_connection
      WHERE member_email = ?`,
    [memberEmail],
  );
  const state = { gmail: false, cal: false, slack: false } as Record<ConnectionService, boolean>;
  for (const r of rows) {
    if (!SERVICES.includes(r.service as ConnectionService)) continue;
    state[r.service as ConnectionService] = Boolean(r.connected_at) && !r.disconnected_at;
  }
  return state;
}

/** Record a successful ViaSocket connect. */
export async function recordConnected(
  memberEmail: string,
  service: ConnectionService,
  viasocketId: string | null,
  scriptId: string | null = null,
): Promise<void> {
  await write(
    `INSERT INTO pulse_connection (member_email, service, viasocket_id, script_id, connected_at, disconnected_at)
          VALUES (?, ?, ?, ?, NOW(), NULL)
     ON DUPLICATE KEY UPDATE
          viasocket_id = VALUES(viasocket_id), script_id = VALUES(script_id),
          connected_at = NOW(), disconnected_at = NULL`,
    [memberEmail, service, viasocketId, scriptId],
  );
  const { emitEvent } = await import("@/lib/pulse/autopilot/automation-runner");
  emitEvent("connection.connected", { memberEmail, service }).catch(() => {});
}

/** The script_id one member's connection runs actions with, or null if there isn't one yet. */
export async function scriptIdFor(memberEmail: string, service: ConnectionService): Promise<string | null> {
  const rows = await read<{ script_id: string | null }>(
    `SELECT script_id
       FROM pulse_connection
      WHERE member_email = ? AND service = ? AND connected_at IS NOT NULL AND disconnected_at IS NULL`,
    [memberEmail, service],
  );
  return rows[0]?.script_id ?? null;
}

/** Record a disconnect. The row is kept, not deleted — see migrations/012. */
export async function recordDisconnected(memberEmail: string, service: ConnectionService): Promise<void> {
  await write(
    `INSERT INTO pulse_connection (member_email, service, connected_at, disconnected_at)
          VALUES (?, ?, NULL, NOW())
     ON DUPLICATE KEY UPDATE disconnected_at = NOW()`,
    [memberEmail, service],
  );
  const { emitEvent } = await import("@/lib/pulse/autopilot/automation-runner");
  emitEvent("connection.disconnected", { memberEmail, service }).catch(() => {});
}

export type TeamConnectionSummary = {
  connected: number;
  total: number;
  unconnected: string[];
};

type TeamRow = { email: string; name: string | null; service: string | null; connected: number };

/**
 * Across every active member: who has connected which service. This is what
 * the Autopilot "Connections" tab's mailbox/calendar rows read instead of a
 * fixed "22 of 25" — the same shape, but the real count from pulse_connection
 * joined against pulse_member.
 */
export async function teamConnectionSummary(): Promise<Record<ConnectionService, TeamConnectionSummary>> {
  const rows = await read<TeamRow>(
    `SELECT m.email AS email, m.name AS name, c.service AS service,
            (c.connected_at IS NOT NULL AND c.disconnected_at IS NULL) AS connected
       FROM pulse_member m
       LEFT JOIN pulse_connection c
              ON c.member_email = m.email AND c.service IN ('gmail','cal','slack')
      WHERE m.status = 'active'`,
  );

  const byService: Record<ConnectionService, TeamConnectionSummary> = {
    gmail: { connected: 0, total: 0, unconnected: [] },
    cal: { connected: 0, total: 0, unconnected: [] },
    slack: { connected: 0, total: 0, unconnected: [] },
  };

  const byEmail = new Map<string, { name: string | null; services: Set<string> }>();
  for (const r of rows) {
    if (!byEmail.has(r.email)) byEmail.set(r.email, { name: r.name, services: new Set() });
    if (r.service && Number(r.connected)) byEmail.get(r.email)!.services.add(r.service);
  }

  for (const service of SERVICES) {
    const summary = byService[service];
    summary.total = byEmail.size;
    for (const [email, info] of byEmail) {
      if (info.services.has(service)) summary.connected += 1;
      else summary.unconnected.push(info.name || email);
    }
  }
  return byService;
}
