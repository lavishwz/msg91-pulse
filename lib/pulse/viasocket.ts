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

/**
 * Gmail's "Send Email" action (rowwj0sfmhub) — the one action every prior
 * ViaSocket call in this file deliberately avoided. Reading a mailbox is
 * reversible; sending is not, which is why this exists as its own named
 * function rather than a bare `runViasocketAction` call at the point of use —
 * one place to find every real send this app has ever made, for whoever
 * greps for it next.
 *
 * `messageBody` is HTML per the action's own field table — no `messageType`
 * branch on Send Email, unlike Reply To Thread and Create Email Draft, which
 * do. `from` is left unset: it is optional, and every rep sends from the one
 * mailbox they connected.
 */
export async function sendGmail(
  scriptId: string,
  to: string,
  subject: string,
  htmlBody: string,
): Promise<unknown> {
  return runViasocketAction(scriptId, "rowwj0sfmhub", { to, subject, messageBody: htmlBody });
}

/* ── triggers ──────────────────────────────────────────────────────────────
 *
 * Everything above is Pulse asking ViaSocket a question. A trigger is the
 * other direction: ViaSocket watches the mailbox and POSTs to us when
 * something happens there.
 */

export type ViasocketTrigger = {
  /** ViaSocket's trigger_version_id — what /embed/subscribe-event takes. */
  id: string;
  label: string;
  description: string;
  /** Fixed inputData for this trigger's own subscribe call — see below. */
  inputData: Record<string, unknown>;
};

/**
 * The triggers Gmail offers, read off ViaSocket's own dashboard and pasted in
 * — nothing lists a service's triggers by API (`/embed/*` 404s on every
 * plausible catalogue route), so this is what everyone using this API does,
 * the same provenance as the action_version_ids in lib/pulse/gmail.ts.
 *
 * Hardcoded here rather than an env var on purpose: none of these ids are
 * secrets (same reasoning as GMAIL_SERVICE_ID above) — they're just which
 * trigger, not a credential — so there's no reason to push them through
 * config. A wrong id is a code review away from being caught instead of a
 * silent env typo.
 *
 * `inputData` is fixed per trigger rather than collected from the person
 * subscribing: both real Gmail triggers need a `thread` choice and nothing
 * else required, so "first_email_only", no sender/subject filter — the
 * broadest, simplest version of each — is hardcoded rather than building a
 * picker UI for a field nobody has to set. "New Attachment" (row0c62qpq3t)
 * requires a `label` id with no sensible universal default and needs a real
 * list-options picker to choose one, so it isn't offered yet.
 */
export function gmailTriggers(): ViasocketTrigger[] {
  return [
    {
      id: "rowubk94iqsc",
      label: "New email received",
      description: "Fires the moment a message arrives in the mailbox.",
      inputData: { thread: "first_email_only" },
    },
    {
      id: "rowpw1i7ci9h",
      label: "New email sent",
      description: "Fires when a new message appears in Sent.",
      inputData: { thread: "first_email_only" },
    },
  ];
}

/**
 * Every flow this identifier owns — one per enabled app, one per trigger
 * subscription. The only way to recover a script_id we failed to store.
 */
export async function listViasocketFlows(
  uniqueIdentifier: string,
): Promise<Array<Record<string, unknown>>> {
  const token = await signViasocketToken(uniqueIdentifier);
  const res = await fetch(`${API_URL}/projects/${PROJECT_ID}/integrations`, {
    headers: { authorization: token },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `ViaSocket flow list failed with ${res.status}`);
  }
  return body?.data?.flows ?? [];
}

/**
 * Start listening. Returns the subscription's own script_id, which is the
 * handle `setViasocketFlowStatus` needs to stop it again.
 *
 * There is deliberately no `enable` step here: enabling buys the right to run
 * *actions*, and a subscription needs only the connection. An integration
 * that merely listens never calls /embed/enable at all.
 */
export async function subscribeViasocketEvent(
  uniqueIdentifier: string,
  triggerVersionId: string,
  authId: string,
  webhook: string,
  inputData: Record<string, unknown> = {},
  meta: Record<string, unknown> = {},
): Promise<{ scriptId: string; hookUrl: string | null }> {
  const token = await signViasocketToken(uniqueIdentifier);
  const res = await fetch(`${API_URL}/embed/subscribe-event/${triggerVersionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", authorization: token },
    body: JSON.stringify({ auth_id: authId, inputData, webhook, meta }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `ViaSocket subscribe failed with ${res.status}`);
  }
  const scriptId = body?.data?.script_id;
  if (!scriptId) {
    throw new Error("ViaSocket did not return a script_id for this subscription.");
  }
  return { scriptId, hookUrl: body?.data?.inputData?.hookUrl ?? null };
}

/** status=0 stops a subscription (or disables an enabled app); status=1 resumes it. */
export async function setViasocketFlowStatus(
  uniqueIdentifier: string,
  scriptId: string,
  status: 0 | 1,
): Promise<void> {
  const token = await signViasocketToken(uniqueIdentifier);
  const res = await fetch(`${API_URL}/embed/updatestatus/${scriptId}?status=${status}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", authorization: token },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `ViaSocket status change failed with ${res.status}`);
  }
}
