/**
 * A few seconds of memory in front of the invite-list check.
 *
 * The guard runs on every request, and the check is a round trip to MySQL. This
 * keeps the answer for a short while so a page load with twenty API calls does
 * not become twenty queries.
 *
 * The TTL is the whole design here: it is the window between "removed on the
 * members sheet" and "locked out", and equally between "promoted" and "can
 * invite", so it is deliberately short rather than whatever a cache would like.
 * Kept separate from lib/pulse/cache.ts because that one is a 60s cache for
 * expensive reads, and this must not be.
 */

import type { Role } from "@/lib/pulse/members";

const TTL_MS = 30_000;

export type Access = { allowed: boolean; role: Role };

type Entry = { access: Access; expires: number };

const store = globalThis as unknown as { __pulseMembership?: Map<string, Entry> };
store.__pulseMembership ??= new Map();

export async function accessCached(
  email: string,
  check: () => Promise<Access>,
): Promise<Access> {
  const key = email.trim().toLowerCase();
  const map = store.__pulseMembership!;
  const hit = map.get(key);
  if (hit && hit.expires > Date.now()) return hit.access;

  const access = await check();
  map.set(key, { access, expires: Date.now() + TTL_MS });
  return access;
}

/**
 * Drop one entry, so a change takes effect now rather than in thirty seconds.
 * Called when somebody is removed or their role changes.
 */
export function forgetMembership(email: string): void {
  store.__pulseMembership!.delete(email.trim().toLowerCase());
}
