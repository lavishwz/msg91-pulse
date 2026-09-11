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
const API_URL = (process.env.VIASOCKET_API_URL ?? "https://flow-api.viasocket.com").replace(/\/+$/, "");
const RUN_URL = (process.env.VIASOCKET_RUN_URL ?? "https://flow.sokt.io").replace(/\/+$/, "");

/** Gmail's own service id — fixed, same one public/pulse.js opens the connect popup with. */
export const GMAIL_SERVICE_ID = "rowo0bqrhj5g";

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

/**
 * Step 2 of the embed flow, run once right after the connect popup succeeds:
 * turn the auth_id it handed back into a script_id — the credential
 * `runViasocketAction` actually runs Gmail actions with. Unlike the token
 * above, this call is scoped to the same `uniqueIdentifier` the popup used,
 * so it must be the member's own email.
 */
export async function enableViasocketApp(
  uniqueIdentifier: string,
  authId: string,
  serviceId: string = GMAIL_SERVICE_ID,
): Promise<string> {
  const token = await signViasocketToken(uniqueIdentifier);
  const res = await fetch(`${API_URL}/embed/enable/${serviceId}/${authId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", authorization: token },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `ViaSocket enable failed with ${res.status}`);
  }
  const scriptId = body?.data?.script_id;
  if (!scriptId) {
    throw new Error("ViaSocket did not return a script_id for this connection.");
  }
  return scriptId;
}

/**
 * Run a Gmail action. No embed token here — the script_id itself is the
 * credential, ViaSocket's contract for this call.
 */
export async function runViasocketAction(
  scriptId: string,
  actionVersionId: string,
  inputData: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${RUN_URL}/func/${scriptId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action_version_id: actionVersionId, inputData }),
  });
  const body = await res.json().catch(() => ({}));
  // Some flows (e.g. List_all_Mails, confirmed by calling it live) answer
  // with the result directly — no {success, data} envelope at all — while
  // others do wrap it. Only an explicit success:false is a real failure;
  // anything else is treated as the payload.
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `ViaSocket action failed with ${res.status}`);
  }
  return body?.success === true ? body.data : body;
}
