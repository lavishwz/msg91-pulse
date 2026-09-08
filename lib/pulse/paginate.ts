/**
 * Pagination guards.
 *
 * Every query in lib/pulse goes through here. The rule for this project is that
 * no query may ever return an unbounded result set: the database is the live
 * MSG91 beta (ms_trans alone is ~1M rows), the connection is read-only and
 * shared, and Pulse only ever renders a screenful at a time.
 *
 * LIMIT/OFFSET are interpolated as integers rather than bound as `?` because
 * MySQL 5.7 will not accept placeholders there in a prepared statement. They are
 * passed through `int()` first, so nothing but a number can reach the SQL.
 */

/** Largest page any caller can ask for. */
export const MAX_PAGE_SIZE = 50;

/** Page size used when a caller does not specify one. */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Hard ceiling for aggregate scans (counts, sums, group-bys) that cannot be
 * paged. Queries that scan are additionally constrained by a date window.
 */
export const MAX_SCAN_ROWS = 5_000;

/** Coerce to a safe non-negative integer. Anything odd becomes `fallback`. */
export function int(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback;
}

export type PageRequest = { limit?: unknown; offset?: unknown; cursor?: unknown };

export type Page = { limit: number; offset: number };

/** Clamp a caller's page request into something safe to run. */
export function page(req: PageRequest = {}): Page {
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, int(req.limit, DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE),
  );
  const offset = int(req.cursor ?? req.offset, 0);
  return { limit, offset };
}

/**
 * `LIMIT n+1 OFFSET m` — one extra row so the caller can tell whether another
 * page exists without a second COUNT(*) query over a large table.
 */
export function limitClause({ limit, offset }: Page): string {
  return `LIMIT ${limit + 1} OFFSET ${offset}`;
}

export type Paged<T> = {
  rows: T[];
  nextCursor: number | null;
  limit: number;
  offset: number;
};

/** Split the probe row off the end and turn it into a cursor. */
export function toPaged<T>(rows: T[], p: Page): Paged<T> {
  const hasMore = rows.length > p.limit;
  return {
    rows: hasMore ? rows.slice(0, p.limit) : rows,
    nextCursor: hasMore ? p.offset + p.limit : null,
    limit: p.limit,
    offset: p.offset,
  };
}

/** Read a page request off a URL's query string. */
export function pageFromUrl(url: string): Page {
  const q = new URL(url).searchParams;
  return page({ limit: q.get("limit"), offset: q.get("offset"), cursor: q.get("cursor") });
}
