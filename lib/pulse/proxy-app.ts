/**
 * Pulse's app id on Proxy.
 *
 * Hardcoded rather than configured, because it is neither a secret nor a
 * per-environment value. It identifies *this application* to MSG91's Proxy —
 * the same id in development, staging and production — and it was already
 * public by construction: it shipped to the browser as NEXT_PUBLIC_REFERENCEID
 * so the sign-in widget could use it.
 *
 * Making it a required environment variable bought nothing and cost a deploy:
 * with the NEXT_PUBLIC_ prefix it was inlined at build time, so a host that
 * injects configuration only at runtime produced a build with an empty id and
 * a login page that could not load its own widget, whatever was configured.
 *
 * The env override stays for the one case that is real — pointing a build at a
 * different registered app on Proxy — but nothing has to be set for sign-in to
 * work.
 */
export const REFERENCE_ID =
  (process.env.REFERENCEID ?? "").trim() || "1258584i17889575326aa1535c30048";
