# "Your approval" card

## Purpose
Closes the gap where 3 of the 6 card reasons the handover's design system
requires (§4) were typed but never produced: `Your judgment`, `Your voice`,
`Your approval`. This slice ships the cheapest of the three — `pulse_draft`
already recorded everything a card needs (held/released/sent, confidence,
hold reason, facts used); it just was never read into a card.

## Users
Sales/CS reps with a held draft addressed to one of their accounts (`scope:
"me"` — see `lib/pulse/cards.ts`).

## Plain-language copy
Headline: `A {channel} draft for {account} is ready to send.`
Reason line: `Written {age} ago, held because it {reason}. Nothing goes out
until you say so.` L1 chip: `{age} ago`.

## Data decisions
| Business fact | Option | Source |
|---|---|---|
| Held draft (channel, body, confidence, hold reason) | 1 — existing Pulse table | `pulse_draft`, already written by `lib/pulse/autopilot/drafts.ts` |
| Account name/currency for the draft's `account_pid` | 1 — existing database | `ms_user` / `default_destination_country`, batched in one query (`IN (...)`), matching the file's one-pass-over-legacy-tables rule |

No new data source. This is entirely a read of a table that already existed.

## UI behavior
Sorted into the deck like every other scanner (`buildCardsUncached`), deduped
by account so a customer with two held drafts still shows one card. The
primary action ("Review and send") is not yet wired to open the release flow
— it opens wherever the deck's existing `action` click-through already routes
"Your hands"/"Your knowledge" cards, which the frontend audit found unwired
for several other actions too; wiring the actual reveal/release panel for
this card is the next slice, not part of this one.

## AI behavior
None new — the draft was already written by Agent 3 under its existing policy
(`lib/pulse/agents.ts` / `drafts.ts`). This slice only surfaces it as a card.

## Security and audit
No new exposure: a held draft was already visible via
`GET` on the drafts list; this puts the same row in the card deck. Releasing
still goes through `releaseDraft`, which re-checks the price/partner guards on
the actual text being sent (`drafts.ts`), unchanged by this slice.

## Edge cases
- No held drafts: `heldDrafts()` returns `[]`, scanner group is simply empty —
  no error, no placeholder card.
- Draft's `account_pid` not found in `ms_user` (should not happen, but the
  draft table has no FK to enforce it): falls back to `Account {id}` rather
  than throwing.

## Acceptance checks
- [x] `npx tsc --noEmit` passes.
- [x] `npm test` (all suites) passes unchanged.
- [ ] Not yet verified against live held-draft rows — no local DB available
      this session (see the missions dev note for why). Verify on next deploy
      by checking Autopilot → Activity for a held draft, then Now for the
      matching "Your approval" card.
