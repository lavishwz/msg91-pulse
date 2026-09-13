# Sending a draft, for real

## Purpose
Until this slice, nothing in Pulse ever sent a customer a message. "Release"
only flipped `pulse_draft.status` in the database — confirmed by tracing the
full chain together with the user, who then supplied MSG91's own viaSocket
Gmail integration reference and asked for real sending, with a confirmation
popup naming the recipient first. This is that.

## Data decisions
| Business fact | Option | Source |
|---|---|---|
| How to send an email as a connected rep | 2 — API, approved by the user directly (viaSocket Apps API reference supplied in full) | ViaSocket's Gmail "Send Email" action, `rowwj0sfmhub` |
| Which mailbox sends it | 1 — existing Pulse connection | `pulse_connection.script_id`, the same connection reading mail already uses (`lib/pulse/connections.ts::scriptIdFor`) — no new connect flow |
| Who to send to | 1 — existing database | `ms_user.user_email` for the draft's `account_pid`, resolved fresh at read/send time, not stored on the draft row |

No new environment variables — `VIASOCKET_*` were already configured for the
existing read integration (listing mail, threads). Verified live: the
signed-in user's Gmail is already connected (`scriptIdFor` returned a real
`script_id`), so this is immediately usable, not blocked on a missing setup
step.

## What changed
- **`lib/pulse/viasocket.ts`** — `sendGmail(scriptId, to, subject, htmlBody)`,
  wrapping the Send Email action. The one new outbound call in the app.
- **`lib/pulse/autopilot/drafts.ts`** — `sendDraft(id, actor, editedBody?)`:
  same guardrails as `releaseDraft` (must be `held`, kill switch, price check
  on the *final* text) plus two new ones — sender must have a connected
  mailbox, account must have a real email — then actually calls `sendGmail`.
  A ViaSocket failure marks the draft `failed` (not back to `held` — a
  person has to look at why, not have it silently retried). On success:
  `status='sent'`, `sent_at` set (both columns already existed, unused until
  now), and a `pulse_decision` row (`verdict='sent'`) — the same audit
  pattern release already used.
- **`DraftRow.to`** — the resolved recipient, attached in `listDrafts`,
  `getDraft`, and `forAccount` (batched, one query regardless of how many
  drafts — same discipline as `cards.ts`'s `everTransacted`).
- **`draftFor`'s hold reason** — used to hardcode `"no mailbox connected"`
  unconditionally, even for a rep who had one. Now checks for real via
  `scriptIdFor`. The draft still always starts `held` regardless — sending is
  never automatic, whatever the reason text says — only the *label* changed
  from a guess to a fact.
- **API** — `POST /api/pulse/autopilot/drafts {action:"send"}`.
- **UI** — the "Release →" button is now "Send →" in both places a held
  draft renders (account page, Autopilot decision panel), carries the
  resolved recipient as `data-release-to`, and clicking it opens the app's
  own confirm dialog (`pulseConfirm`) naming the recipient and stating this
  cannot be undone, before calling `PulseLive.sendDraft`.

## What "Release" still means, separately
Untouched. It still exists as "approved, not sent" — a lighter-weight
"I've looked at this" step. Two real actions now exist, both real, doing
different things: Release marks approval only; Send marks approval **and**
delivers it. Both still require the price/partner/kill-switch guardrails.

## Security and audit
- Nothing changes about who can see a held draft — same role rules as before.
- The confirm dialog is the "before the popup, tell the user who it's going
  to and that it's irreversible" requirement, verbatim.
- Every send writes a `pulse_decision` row exactly like release did — visible
  in Autopilot's audit trail as a human act, with `sent_to` in its
  `output_json`.
- The price check runs on the *actual outgoing text*, including edits — a
  rep cannot type a price in and have it slip past a control that only
  checked the agent's original draft.

## Edge cases
- No email on file for the account: refused before attempting to send
  (`"no email on file for this account — nowhere to send it"`), and the
  confirm dialog says so up front rather than after a failed attempt.
- Sender has no connected mailbox: refused with `"connect your mailbox in
  Profile before sending"` — same connection Profile's existing "Connect
  Gmail" button already establishes.
- ViaSocket call fails (rate limit, revoked token, etc.): draft marked
  `failed`, not silently retried — a person has to look at it next.
- Kill switch on, or a price slipped into an edit: refused exactly as
  release already was, unchanged.

## Acceptance checks
- [x] `npx tsc --noEmit` clean.
- [x] `npm test` (all 16 suites, including `test:drafts`) — unchanged, still
      green.
- [x] `node -c public/pulse.js` / `public/pulse-live.js` — syntax clean.
- [x] Verified against the live store: `listDrafts()` now returns real,
      correct recipient emails for every held draft; `scriptIdFor` confirms
      the signed-in user's Gmail connection is real and usable right now.
- [x] Routes compile and respond correctly (401 unauthenticated, no 500s) on
      a running dev server.
- [ ] **Not actually fired a real send** — that would email a real inbox
      from this session, which needs the user's explicit go-ahead in the
      moment, not just the standing authorization to build the feature.
      First real send should be watched live by the user.
