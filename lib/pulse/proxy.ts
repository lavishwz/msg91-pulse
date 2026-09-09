/**
 * MSG91 Proxy — the identity service behind the login widget.
 *
 * Two ways to ask who somebody is, and Pulse uses whichever is configured:
 *
 *   1. Admin, server-to-server. `authkey: PROXY_ADMIN_TOKEN` against
 *      `${PROXY_BASE_URL}/${REFERENCEID}/getDetails?user_id=…`.
 *      Exact, and the same call the ViaSocket admin panel makes.
 *   2. User-scoped. The visitor's own `proxy_auth_token` against
 *      `${PROXY_BASE_URL}/c/getDetails`. Needs no admin key, which means a
 *      deploy with nothing but a reference id can still log people in.
 *
 * The admin path is preferred when the key is there; the user-scoped one is the
 * fallback. Either way the answer must include an email — the invite list is
 * keyed on it, so an identity without one cannot be let in.
 *
 * Server-only: PROXY_ADMIN_TOKEN must not reach the browser.
 */

import { REFERENCE_ID } from "./proxy-app";

const BASE_URL = (process.env.PROXY_BASE_URL ?? "https://routes.msg91.com/api").replace(/\/+$/, "");
const ADMIN_TOKEN = (process.env.PROXY_ADMIN_TOKEN ?? "").trim();

export type ProxyIdentity = {
  user: { id: string; name: string; email: string };
  org: { id: string; name: string } | null;
};

export function isProxyConfigured(): boolean {
  return Boolean(REFERENCE_ID);
}

/** Whether the admin key is present — decides which of the two paths runs. */
export function hasAdminToken(): boolean {
  return Boolean(ADMIN_TOKEN);
}

const TIMEOUT_MS = 8000;

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`Proxy ${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* Proxy's envelope varies by endpoint — `{data:{data:[…]}}` on the admin
   lookups, `{data:{…}}` elsewhere — and the shape is not ours to control. So
   rather than hard-coding one path, look for the first object that has the
   fields an identity needs. Wrong-shaped responses then read as "no identity"
   instead of a crash on `.data.data[0]`. */
function firstWith(value: unknown, keys: string[], depth = 0): Record<string, unknown> | null {
  if (depth > 6 || value === null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = firstWith(item, keys, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  const obj = value as Record<string, unknown>;
  if (keys.every((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== "")) return obj;
  for (const nested of Object.values(obj)) {
    const hit = firstWith(nested, keys, depth + 1);
    if (hit) return hit;
  }
  return null;
}

const str = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

function adminUrl(path: string, param: string, value: string): string {
  const url = new URL(`${BASE_URL}/${REFERENCE_ID}/${path}`);
  url.searchParams.set(param, value);
  return url.toString();
}

/** Admin lookup of one user. Returns null when Proxy has nothing to say. */
async function adminUser(userId: string): Promise<{ id: string; name: string; email: string } | null> {
  const body = await getJson(adminUrl("getDetails", "user_id", userId), { authkey: ADMIN_TOKEN });
  const user = firstWith(body, ["id", "email"]);
  if (!user) return null;
  return { id: str(user.id), name: str(user.name) || str(user.email), email: str(user.email) };
}

async function adminCompany(companyId: string): Promise<{ id: string; name: string } | null> {
  const body = await getJson(adminUrl("getCompanies", "id", companyId), { authkey: ADMIN_TOKEN });
  const company = firstWith(body, ["id", "name"]);
  if (!company) return null;
  return { id: str(company.id), name: str(company.name) };
}

/**
 * User-scoped identity: the visitor's own token, no admin key involved.
 * `/c/getDetails` answers with the user and the org they are currently in.
 */
async function selfIdentity(proxyAuthToken: string): Promise<ProxyIdentity | null> {
  const body = await getJson(`${BASE_URL}/c/getDetails`, { proxy_auth_token: proxyAuthToken });
  const user = firstWith(body, ["id", "email"]);
  if (!user) return null;
  const current = firstWith((body as Record<string, unknown>)?.["data"], ["id", "name"]);
  return {
    user: { id: str(user.id), name: str(user.name) || str(user.email), email: str(user.email) },
    org: current && str(current.id) !== str(user.id)
      ? { id: str(current.id), name: str(current.name) }
      : null,
  };
}

/**
 * Who just logged in.
 *
 * The ids come from Proxy's own redirect back to /login, so they are not the
 * browser's to invent: Proxy only appends them after a login it accepted.
 * Errors are deliberately specific — "who you are could not be confirmed" with
 * no reason is the least debuggable failure a login can have.
 */
export async function resolveIdentity(args: {
  proxyAuthToken: string;
  userRefId: string;
  companyRefId?: string | null;
}): Promise<ProxyIdentity> {
  if (!isProxyConfigured()) {
    throw new Error(
      "REFERENCEID is not set, so Pulse cannot ask Proxy who you are. See docs/auth.md.",
    );
  }

  const attempts: string[] = [];

  if (hasAdminToken()) {
    try {
      const [user, org] = await Promise.all([
        adminUser(args.userRefId),
        args.companyRefId ? adminCompany(args.companyRefId) : Promise.resolve(null),
      ]);
      if (user?.email) return { user, org };
      attempts.push("admin lookup returned no email for that user");
    } catch (err) {
      attempts.push(`admin lookup failed (${(err as Error).message})`);
    }
  } else {
    attempts.push("PROXY_ADMIN_TOKEN is not set, so the admin lookup was skipped");
  }

  try {
    const self = await selfIdentity(args.proxyAuthToken);
    if (self?.user.email) return self;
    attempts.push("the user-scoped lookup returned no email");
  } catch (err) {
    attempts.push(`the user-scoped lookup failed (${(err as Error).message})`);
  }

  throw new Error(`Proxy could not confirm who you are: ${attempts.join("; ")}.`);
}

/**
 * Best-effort invalidation of a token on Proxy's side at logout, so a copied
 * cookie cannot be replayed after the person has signed out. Cookies are
 * cleared either way — this failing must not keep somebody signed in.
 */
export async function revokeProxyToken(proxyAuthToken: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(`${BASE_URL}/c/logout`, {
      method: "DELETE",
      headers: { proxy_auth_token: proxyAuthToken },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    console.warn("[pulse] Proxy logout failed:", (err as Error).message);
  } finally {
    clearTimeout(timer);
  }
}

/** Name for an invited email, when Proxy already knows them. Best effort. */
export async function nameForEmail(email: string): Promise<string | null> {
  if (!isProxyConfigured() || !hasAdminToken()) return null;
  try {
    const body = await getJson(adminUrl("getDetails", "user_email", email), { authkey: ADMIN_TOKEN });
    const user = firstWith(body, ["id", "email"]);
    const name = user ? str(user.name) : "";
    return name || null;
  } catch {
    return null;
  }
}
