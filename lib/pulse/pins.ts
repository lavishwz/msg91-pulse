/**
 * Pinned questions, on the server.
 *
 * One row per member (`pulse_pin`, migrations/026), holding the same
 * `{q, typed}` shape the client used to keep in localStorage alone — see
 * public/pulse.js's own comment on PINS for what each half means. Pulse's own
 * store, so this is a write path: `lib/db.ts` is MSG91's schema and Pulse has
 * SELECT on it and nothing else.
 */

import { read, write } from "@/lib/store";

export type PinData = { q: Record<string, 0 | 1>; typed: string[] };

export const EMPTY_PINS: PinData = { q: {}, typed: [] };

/** The longest a typed pin may be — matches the Ask box's own input limit. */
export const MAX_TYPED_LENGTH = 500;

/** The most typed pins kept per member, so one person cannot grow this without bound. */
export const MAX_TYPED_COUNT = 200;

/**
 * Coerce anything a client might send into the real shape.
 *
 * A pin is a preference, not a record worth failing loudly over — a
 * malformed body just means "no override", the same as a member who has
 * never pinned anything.
 */
export function sanitizePins(raw: unknown): PinData {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const q: Record<string, 0 | 1> = {};
  if (obj.q && typeof obj.q === "object") {
    for (const [k, v] of Object.entries(obj.q as Record<string, unknown>)) {
      if (typeof k === "string" && k) q[k] = v ? 1 : 0;
    }
  }
  const typed = Array.isArray(obj.typed)
    ? obj.typed
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.slice(0, MAX_TYPED_LENGTH))
        .slice(0, MAX_TYPED_COUNT)
    : [];
  return { q, typed };
}

type PinRow = { data: PinData | string };

/** One member's pins, or the empty shape if they have never pinned anything. */
export async function getPins(email: string): Promise<PinData> {
  const rows = await read<PinRow>(`SELECT data FROM pulse_pin WHERE member_email = ?`, [email]);
  if (!rows.length) return { q: {}, typed: [] };
  const data = rows[0].data;
  return sanitizePins(typeof data === "string" ? JSON.parse(data) : data);
}

/** Replace one member's pins whole — the client always sends the full shape. */
export async function savePins(email: string, data: unknown): Promise<PinData> {
  const clean = sanitizePins(data);
  await write(
    `INSERT INTO pulse_pin (member_email, data) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data)`,
    [email, JSON.stringify(clean)],
  );
  return clean;
}
