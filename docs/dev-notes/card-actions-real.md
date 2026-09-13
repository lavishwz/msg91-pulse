# Card primary actions, made real

## Purpose
Before this, every card's blue primary button — except "Your approval",
fixed earlier — fell through to one generic `[data-do]` handler that only
marked the card done in local browser state (`S.doneIds`) and played a fake
score animation against an empty `CARDMOVE` lookup. Nothing was called,
nothing was recorded. Closes that for the remaining actionable card types.

## What each action now does
| Card reason | Action text | What happens now |
|---|---|---|
| Your hands | "Take this account" / "Assign an owner" | **CLAIM** — real `PUT /api/pulse/accounts/:id/owner` with the signed-in rep as owner. Writes to `pulse_account_owner` + `pulse_account_owner_event` (existing audit trail, unchanged). The scanner's own `WHERE admin_id IS NULL` (or equivalent) no longer matches, so the card is gone on the next real fetch — not hidden, resolved. |
| Your hands | "Call them" | **TRACK** — Pulse cannot place a phone call. `POST /api/pulse/work {action:"create", type:"next_action"}` writes a real `pulse_work_item` (shows up in `GET /api/pulse/work?scope=mine`), then opens the account via `loadAccountById` so the rep has the contact to actually call. |
| Your knowledge | "Find out what stalled" | Same TRACK path — a fact only a human can get, tracked instead of discarded. |
| Watch closely | *(none)* | Unchanged — these cards have `action: null` by design (handover §4: "Awareness only. No button. Auto-decays."). Nothing to wire; confirmed no card of this reason has a button in the first place. |
| Your approval | "Review and send" | Already wired in the previous slice — opens the account's real Release/Discard panel. |

## Data decisions
No new data path — CLAIM reuses `lib/pulse/ownership.ts` (option 1, existing
`pulse_account_owner` + read-only `user_handled_by`). TRACK reuses
`lib/pulse/missions.ts` (option 3, pre-approved, built two slices ago).

## UI behavior
Both new paths disable the button and show `…` while the request is in
flight, then either re-enable it with a `toastDone` error, or mark the card
done and toast success — matching the existing pattern used elsewhere
(`data-open-scored-account`, `releaseDraft`), not a new interaction style.

## Edge cases
- `c.custId` missing (should not happen — every card's `account.id` comes
  straight from the API): both branches check for it and fall through to the
  old generic handler rather than throwing.
- Claim on an account already owned by the same rep: the owner route already
  handles this as a no-op (`account.owner?.id === ownerId`) — returns
  `unchanged:true` rather than erroring; the card still marks done.
- Network/API failure: button re-enables with its original label and an
  error toast, card stays in the deck — never silently marked done on a
  failed write.

## Acceptance checks
- [x] `node -c public/pulse.js` / `public/pulse-live.js` — syntax clean.
- [x] `npx tsc --noEmit` clean (no server-side files touched here).
- [x] `npm test` — all suites unchanged, still green.
- [ ] Not click-tested live — needs a signed-in session in a real browser.
      Verify: click "Take this account" on an unowned-signup card, confirm
      the account's owner changes and the card does not reappear on refresh;
      click "Call them" on a new-person card, confirm the account page opens
      and the item appears under `GET /api/pulse/work?scope=mine`.
