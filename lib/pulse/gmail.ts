/**
 * Recent Gmail messages, via the script_id ViaSocket handed back when the
 * member connected (lib/pulse/connections.ts, lib/pulse/viasocket.ts).
 *
 * Only "list the last few" so far — this is the read Profile's "Recent mail"
 * panel needs, not a general mail client.
 */

import { scriptIdFor } from "@/lib/pulse/connections";
import { runViasocketAction } from "@/lib/pulse/viasocket";

/** ViaSocket action_version_ids. */
const LIST_ALL_MAILS = "rowgko0n0edh";
const GET_THREAD_REPLIES = "rowsesarjlu2";
const GET_ATTACHMENT = "rowd1cj5r1q0";

export type RecentMail = {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  /** Full plain-text body, for the popup a click opens. Never HTML — see plainOf. */
  body: string;
  date: string | null;
  /** Gmail's own link to the message, when ViaSocket supplied one. */
  url: string | null;
  attachmentCount: number;
};

export type ThreadMessage = {
  id: string;
  from: string;
  date: string | null;
  body: string;
};

export type MailAttachment = {
  filename: string;
  mimeType: string;
  size: number | null;
  url: string | null;
};

export type MailDetail = {
  messages: ThreadMessage[];
  attachments: MailAttachment[];
};

const str = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

/**
 * Plain text only, never the `html` half of ViaSocket's `{plain, html}` body.
 * The popup sets this into the page as text (escaped, not innerHTML) — the
 * html alternative is a stranger's raw markup and would need sanitizing
 * before it could go anywhere near the DOM, which nothing here does.
 */
function plainOf(body: unknown): string {
  if (typeof body === "string") return body.trim();
  const plain = (body as { plain?: unknown } | null)?.plain;
  return typeof plain === "string" ? plain.trim() : "";
}

/* List_all_Mails answers `{ emails: [...] }` — confirmed by calling it live.
   Still checked defensively against a couple of other shapes the wider
   ViaSocket Apps API uses (a bare array, or `{data: [...]}`), so a future
   ViaSocket-side rename doesn't blank every row silently. */
function toMails(data: unknown): RecentMail[] {
  const obj = data as { emails?: unknown; messages?: unknown; data?: unknown } | null;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(obj?.emails)
      ? obj!.emails
      : Array.isArray(obj?.messages)
        ? obj!.messages
        : Array.isArray(obj?.data)
          ? obj!.data
          : [];
  return (list as unknown[]).map((raw, i) => {
    const m = (raw ?? {}) as Record<string, unknown>;
    const body = plainOf(m.body ?? m.snippet ?? m.preview);
    return {
      id: str(m.id ?? m.messageId ?? i),
      threadId: str(m.threadId ?? m.id ?? m.messageId ?? i),
      from: str(m.from ?? m.sender ?? "Unknown sender"),
      subject: str(m.subject || "(no subject)"),
      snippet: body.slice(0, 200),
      body,
      date: m.date ?? m.receivedDate ?? m.internalDate ? str(m.date ?? m.receivedDate ?? m.internalDate) : null,
      url: typeof m.emailUrl === "string" ? m.emailUrl : null,
      attachmentCount: Number(m.attachmentCount ?? 0) || 0,
    };
  });
}

/**
 * One message out of Get Thread Replies — either `originalMessage` or an
 * entry of whichever array holds the rest (`replies`/`messages`/`thread`;
 * ViaSocket's own docs don't pin the name down, so all three are checked).
 */
function toThreadMessage(raw: unknown): ThreadMessage {
  const m = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(m.messageId ?? m.id ?? ""),
    from: str(m.from ?? "Unknown sender"),
    date: m.date ? str(m.date) : null,
    body: plainOf(m.plainBody ?? m.body ?? m.snippet),
  };
}

function toAttachments(data: unknown): MailAttachment[] {
  const obj = data as { attachments?: unknown; attachmentDetails?: unknown } | null;
  const list = Array.isArray(obj?.attachments)
    ? obj!.attachments
    : Array.isArray(obj?.attachmentDetails)
      ? obj!.attachmentDetails
      : [];
  return (list as unknown[]).map((raw) => {
    const a = (raw ?? {}) as Record<string, unknown>;
    return {
      filename: str(a.filename ?? a.name ?? "attachment"),
      mimeType: str(a.mimeType ?? a.contentType ?? ""),
      size: typeof a.size === "number" ? a.size : null,
      url: typeof a.url === "string" ? a.url : typeof a.downloadUrl === "string" ? a.downloadUrl : null,
    };
  });
}

/**
 * The signed-in member's last `max` inbox messages. Throws a plain "not
 * connected" error when there's no script_id yet — either Gmail was never
 * connected, or the enable step (route.ts, /api/pulse/connections) failed and
 * they need to reconnect.
 */
export async function recentMails(memberEmail: string, max = 10): Promise<RecentMail[]> {
  const scriptId = await scriptIdFor(memberEmail, "gmail");
  if (!scriptId) {
    throw new Error("Gmail is not connected — connect it in your profile, or reconnect if it was connected before this.");
  }
  const data = await runViasocketAction(scriptId, LIST_ALL_MAILS, { max });
  return toMails(data).slice(0, max);
}

/**
 * Everything the "Recent mail" popup shows beyond the list: the full thread
 * (List_all_Mails' body is a preview only — ViaSocket truncates it and says
 * so, literally ending it with "... [truncated]"; Get Thread Replies is the
 * one action that answers with the real, untruncated plain body) and, when
 * the list said there were any, the attachments on this one message.
 */
export async function mailDetail(memberEmail: string, messageId: string, threadId: string, attachmentCount: number): Promise<MailDetail> {
  const scriptId = await scriptIdFor(memberEmail, "gmail");
  if (!scriptId) {
    throw new Error("Gmail is not connected — connect it in your profile, or reconnect if it was connected before this.");
  }

  const [thread, attachments] = await Promise.all([
    runViasocketAction(scriptId, GET_THREAD_REPLIES, { thread_id: threadId }),
    attachmentCount > 0
      ? runViasocketAction(scriptId, GET_ATTACHMENT, { messageId }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const t = (thread ?? {}) as { originalMessage?: unknown; replies?: unknown; messages?: unknown; thread?: unknown };
  const rest = (Array.isArray(t.replies) && t.replies) || (Array.isArray(t.messages) && t.messages) || (Array.isArray(t.thread) && t.thread) || [];
  const seen = new Set<string>();
  const messages: ThreadMessage[] = [];
  for (const raw of [t.originalMessage, ...(rest as unknown[])]) {
    if (!raw) continue;
    const msg = toThreadMessage(raw);
    if (seen.has(msg.id)) continue;
    seen.add(msg.id);
    messages.push(msg);
  }

  return { messages, attachments: attachments ? toAttachments(attachments) : [] };
}
