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
 * ViaSocket's stand-ins for "there is no body", which are prose rather than
 * an empty string and so render as if they were the mail's actual content.
 * Seen live: a Reddit digest whose entire body was "No plain text available".
 */
const EMPTY_BODY_PLACEHOLDERS = new Set([
  "no plain text available",
  "no content",
  "(no content)",
]);

/**
 * What a marketing email looks like after something converted its HTML to
 * text: the layout survives as whitespace and punctuation even though the
 * layout is gone.
 *
 * Every rule here was written against a real message from the connected
 * mailbox, not imagined:
 *
 *   a 57-character run of "-" where a Samsung mail had a horizontal rule.
 *
 *   `[image: Google]` where an account-recovery mail had a logo. The word
 *   "Google" is not content; the marker is noise on every line it sits on.
 *
 *   `Download Ollama [https://ollama.com/download]` — the link text and the
 *   href, side by side, because the converter had nowhere else to put the
 *   href. The bracketed URL is what produced the 181-character unbroken
 *   token that used to push the detail panel off its own width.
 *
 *   runs of four to eight blank lines between every block, because each
 *   table row and spacer cell became its own line.
 *
 * Deliberately conservative: this normalizes whitespace and removes markers
 * that are provably layout artefacts. It does not try to reflow paragraphs
 * or strip quoted replies — a quoted reply is content, and guessing wrong
 * there deletes something the person needed to read.
 */
export function tidyPlainText(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n");

  /* Unicode spaces down to an ordinary one, before anything below looks at
     whitespace. A converted `&nbsp;` is U+00A0, which is not [ \t], so a line
     holding nothing but one is not "blank" to any of the rules below — it
     survives the trailing-space strip, it breaks up a run of real blank lines
     so the collapse never fires, and the result is the two-inch vertical gaps
     between every block of a marketing mail. This body had eleven of them.
     U+2000-200A are the typographic spaces, U+200B the zero-width space, and
     U+FEFF a byte-order mark that some converters leave mid-document. */
  text = text.replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ");
  text = text.replace(/[\u200B\uFEFF]/g, "");

  /* The converter's own truncation marker. It says nothing a reader wants —
     the list already only shows a preview, and the detail panel fetches the
     untruncated body separately. */
  text = text.replace(/\s*\.\.\.\s*\[truncated\]\s*$/i, "");

  /* Image placeholders: the alt text is a logo's name, not prose. */
  text = text.replace(/\[image:[^\]\n]*\]/gi, "");

  /* `text [https://url]` → `text` when the URL is only repeating the link's
     own text, otherwise keep the URL on its own. Either way it stops being
     glued to the preceding word as one unbreakable token. */
  text = text.replace(/[ \t]*\[(https?:\/\/[^\]\s]+)\]/g, " $1");

  /* Decorative rules. Four or more of the same punctuation character in a
     row was a border, never a sentence. */
  text = text.replace(/^[ \t]*([-=_*~])\1{3,}[ \t]*$/gm, "");

  /* Trailing spaces on every line — invisible, but they are what makes a
     "blank" line not match /^$/ and survive the collapse below. */
  text = text.replace(/[ \t]+$/gm, "");

  /* Runs of blank lines down to one. A paragraph break is one blank line;
     six of them is the table the mail used to be. */
  text = text.replace(/\n{3,}/g, "\n\n");

  text = text.trim();

  return EMPTY_BODY_PLACEHOLDERS.has(text.toLowerCase()) ? "" : text;
}

/**
 * Plain text only, never the `html` half of ViaSocket's `{plain, html}` body.
 * The popup sets this into the page as text (escaped, not innerHTML) — the
 * html alternative is a stranger's raw markup and would need sanitizing
 * before it could go anywhere near the DOM, which nothing here does.
 *
 * Tidying happens here rather than in the browser because this is the one
 * funnel every body passes through — the list preview, the thread messages
 * and anything an agent is later handed all come out of this function, so
 * they cannot disagree about what the text of a mail is.
 */
function plainOf(body: unknown): string {
  if (typeof body === "string") return tidyPlainText(body);
  const plain = (body as { plain?: unknown } | null)?.plain;
  return typeof plain === "string" ? tidyPlainText(plain) : "";
}

/**
 * A subject line, with the converter's truncation marker taken off.
 *
 * ViaSocket truncates long subjects the same way it truncates bodies, and
 * leaves the same "... [truncated]" on the end. In the list that marker is
 * what pushed a long subject onto a second line, so the row it was in stood
 * a line taller than every other row — the marker cost more than the words it
 * replaced. Nothing else is normalized here: a subject is one line of text a
 * person wrote, not converted layout.
 */
function subjectOf(raw: string): string {
  const text = raw.replace(/\s*\.\.\.\s*\[truncated\]\s*$/i, "").trim();
  return text || "(no subject)";
}

/**
 * The one-line preview the list shows.
 *
 * The list renders this with `white-space: nowrap`, so every newline in the
 * body would collapse to nothing and run two unrelated sentences together —
 * "Account recovered successfully" immediately followed by an email address.
 * Newlines become a middot separator instead, which reads as the break it
 * actually was. Cut at 200 characters, on a word boundary when one is near
 * enough that the cut does not land mid-word.
 */
function snippetOf(body: string): string {
  const flat = body.replace(/\n+/g, " · ").replace(/\s{2,}/g, " ").trim();
  if (flat.length <= 200) return flat;
  const cut = flat.slice(0, 200);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 160 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
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
      subject: subjectOf(str(m.subject ?? "")),
      snippet: snippetOf(body),
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
