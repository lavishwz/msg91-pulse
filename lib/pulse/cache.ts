/**
 * A very small in-process cache.
 *
 * Not an optimisation for its own sake: `ms_trans` has no index beyond its
 * primary key, so every aggregate over it is a ~400ms full scan of a million
 * rows. Several surfaces ask the same question within one page load (the card
 * deck, the growth strip and an Ask answer all want "who paid recently"), and
 * without this the same scan runs three times per request.
 *
 * Deliberately simple: a TTL map on globalThis, so it survives Next's dev
 * module reloads. Single-process only — with more than one server process each
 * would keep its own copy, which is fine for data that is seconds stale by
 * design and never written back.
 */

type Entry = { value: unknown; expires: number };

const store = globalThis as unknown as { __pulseCache?: Map<string, Entry> };
store.__pulseCache ??= new Map();

/** Default lifetime. Short enough that "live" stays honest. */
export const DEFAULT_TTL_MS = 60_000;

export async function cached<T>(
  key: string,
  ttlMs: number,
  produce: () => Promise<T>,
): Promise<T> {
  const map = store.__pulseCache!;
  const hit = map.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const value = await produce();
  map.set(key, { value, expires: Date.now() + ttlMs });

  // Keep the map from growing without bound if keys ever become dynamic.
  if (map.size > 200) {
    const now = Date.now();
    for (const [k, v] of map) if (v.expires <= now) map.delete(k);
  }
  return value;
}

/** Drop everything — used by the health endpoint and tests. */
export function clearCache(): void {
  store.__pulseCache?.clear();
}

/**
 * Drop every entry whose key starts with `prefix`.
 *
 * This is what "Recompute" on an answer calls. Without it the button would
 * re-request a value the server hands straight back out of the TTL map, which
 * looks identical to doing nothing — the failure this button had to begin with.
 */
export function drop(prefix: string): number {
  const map = store.__pulseCache;
  if (!map) return 0;
  let n = 0;
  for (const k of [...map.keys()]) if (k.startsWith(prefix)) { map.delete(k); n++; }
  return n;
}
