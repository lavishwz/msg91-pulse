/**
 * ViaSocket embed tokens.
 *
 * The "Connect app" button (Gmail, Calendar, …) needs a fresh signed token
 * per open — org_id and project_id are ViaSocket's own, fixed; unique_identifier
 * is whoever is asking, so their connections stay theirs and don't leak into
 * another Pulse member's flows. Signed HS256 with VIASOCKET_ACCESS_KEY, which
 * must never reach the browser.
 */

import { SignJWT } from "jose";

const ORG_ID = (process.env.VIASOCKET_ORG_ID ?? "").trim();
const PROJECT_ID = (process.env.VIASOCKET_PROJECT_ID ?? "").trim();
const ACCESS_KEY = (process.env.VIASOCKET_ACCESS_KEY ?? "").trim();

export function isViasocketConfigured(): boolean {
  return Boolean(ORG_ID && PROJECT_ID && ACCESS_KEY);
}

function secret(): Uint8Array {
  if (!ACCESS_KEY) {
    throw new Error(
      "VIASOCKET_ACCESS_KEY is not set, so Pulse cannot sign a ViaSocket embed token.",
    );
  }
  return new TextEncoder().encode(ACCESS_KEY);
}

/**
 * Sign a fresh embed token for one person. ViaSocket's docs sign these with no
 * expiry claim, so this doesn't set one either — the token identifies a scope
 * (org/project/identifier), not a session.
 */
export async function signViasocketToken(uniqueIdentifier: string): Promise<string> {
  if (!ORG_ID || !PROJECT_ID) {
    throw new Error(
      "VIASOCKET_ORG_ID / VIASOCKET_PROJECT_ID are not set. See .env.example.",
    );
  }
  if (!uniqueIdentifier) {
    throw new Error("unique_identifier is required to isolate ViaSocket flows per user.");
  }
  return new SignJWT({
    org_id: ORG_ID,
    project_id: PROJECT_ID,
    unique_identifier: uniqueIdentifier,
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret());
}
