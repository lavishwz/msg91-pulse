/**
 * Where Pulse is reachable from the outside.
 *
 * Anything that hands an address to a service that must call *back in* uses
 * this: the per-automation webhooks cron-job.org subscribes (build.ts), and
 * any future subscribe/callback URL. It is deliberately one function rather
 * than `process.env.PUBLIC_BASE_URL` read at each call site, because the
 * fallback below is the part that is easy to get wrong.
 *
 * Resolution order:
 *
 *   1. PUBLIC_BASE_URL — set explicitly, and the only value that survives a
 *      custom domain. Always wins.
 *
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the project's *stable* production
 *      host (msg91-pulse.vercel.app). Vercel sets it on every deployment,
 *      so a deploy that forgot the env var still subscribes working URLs
 *      instead of failing the build step with "PUBLIC_BASE_URL is not set".
 *
 * VERCEL_URL is deliberately NOT used. It is the *deployment-specific* host
 * (msg91-pulse-abc123-lavish.vercel.app), which changes on every single
 * deploy — a cron job subscribed against it keeps calling the one deployment
 * it was created on, and starts 404ing the moment that deployment is aged
 * out. A stale URL that still resolves is worse than no URL at all, because
 * nothing reports it: the job keeps firing and the automation silently never
 * runs.
 */
export function publicBaseUrl(): string {
  const explicit = (process.env.PUBLIC_BASE_URL ?? "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "";
}

/** An absolute URL for a path on this app. `path` may start with or without "/". */
export function absoluteUrl(path: string): string {
  const base = publicBaseUrl();
  if (!base) return "";
  return `${base}/${path.replace(/^\/+/, "")}`;
}
