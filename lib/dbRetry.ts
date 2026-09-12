/**
 * One retry, after a pause, for a query that failed for a connection reason.
 *
 * Both MySQL hosts this app talks to (the MSG91 read host and Pulse's own
 * store) sit on free-tier managed MySQL — cloud.layerbase.dev in particular
 * suspends its instance after a stretch of inactivity and takes several
 * seconds to resume on the next connection. That first query after a quiet
 * spell doesn't get a slow answer, it gets a connection error — indistinguishable
 * from the host actually being down unless something waits and tries again.
 *
 * Only retries errors that look connection-shaped (a refused/reset/timed-out
 * socket, or MySQL's own "server has gone away"). A syntax error or a
 * constraint violation retries no better the second time and would just cost
 * three extra seconds before failing anyway.
 */
const RETRYABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "PROTOCOL_CONNECTION_LOST",
]);

function isRetryable(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code && RETRYABLE_CODES.has(code)) return true;
  const message = err instanceof Error ? err.message : "";
  return /server has gone away|connect ETIMEDOUT|read ECONNRESET/i.test(message);
}

export async function withColdStartRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!isRetryable(err)) throw err;
    await new Promise((r) => setTimeout(r, 3000));
    return run();
  }
}
