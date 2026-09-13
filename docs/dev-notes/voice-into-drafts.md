# Wiring "How you write" into draft generation

## Purpose
Closes the exact gap the user asked about: Profile's "How you write" traits
were already saved for real (`pulse_user_voice`, `/api/pulse/voice`) — that
part was never mock — but nothing read them back. Every draft used the same
hardcoded line regardless of what anyone had typed in Profile. This wires
`traitsFor(email)` into the outreach-drafter's prompt, exactly the "one-
function change" the original code comment in `lib/pulse/voice.ts` said it
would be.

## Data decisions
| Business fact | Option | Source |
|---|---|---|
| A person's writing traits | 1 — existing Pulse table | `pulse_user_voice`, unchanged |
| Whose traits a given draft borrows | **Not yet a real per-account fact** — see limitation below | `PULSE_OWNER_EMAIL` env var (new, optional) |

## UI behavior
No screen changed. Profile's trait editor already called the real API.

## AI behavior
`draftFor()` now builds `owner_writing_samples` from `samplesFromTraits(await
traitsFor(ownerEmail))` when an owner email is available, e.g.:
> "Write like this: Short sentences; Opens with the point, never a greeting; ..."

Falls back to the original honest placeholder — *"no samples yet — write
plainly..."* — when there is no email to look up, rather than guessing whose
voice to use.

## The limitation, stated plainly
**This is one shared identity, not truly per-rep, yet.** New-signup
acknowledgment drafts (`lib/pulse/autopilot/runner.ts`,
`lib/pulse/autopilot/timers.ts`) fire before any specific rep is assigned to
the account — there is no "owner" to speak of at draft time, only Pulse's one
configured default identity (`PULSE_OWNER_NAME` / now also
`PULSE_OWNER_EMAIL`, both optional env vars, neither set today). So right now,
setting `PULSE_OWNER_EMAIL` makes every acknowledgment draft borrow *that one
person's* voice — correct for a single default sender, not yet correct for
"each rep's drafts sound like that rep."

True per-rep voice needs per-signup owner assignment to exist first (noted as
not-yet-built in the surrounding code comments), then `draftFor` would look up
the *resolved* owner's email instead of the env var. That is the natural next
slice once ownership assignment lands — `draftFor(..., ownerEmail)`'s
signature already takes whatever email is passed in, so nothing here needs to
change again, only what the callers pass.

## Security and audit
No new exposure — traits were already visible to their own owner via the
Profile API; this only changes what a prompt string contains.

## Edge cases
- No traits saved for the given email: `traitsFor` seeds the five defaults on
  first read (existing behavior, unchanged), so `samplesFromTraits` never
  sees an empty list once an email is actually looked up.
- `PULSE_OWNER_EMAIL` unset (today's default): behavior is byte-for-byte what
  it was before this change — the honest placeholder text.
- `PULSE_OWNER_EMAIL` set to an email with no `pulse_member` row: still
  works — `pulse_user_voice` is keyed by email as free text, not by a foreign
  key, and seeds the same five defaults for any email on first read.

## Acceptance checks
- [x] `npx tsc --noEmit` passes.
- [x] `npm test` (all suites, including `test:drafts`) passes unchanged.
- [ ] Not exercised against a live draft run — would need `PULSE_OWNER_EMAIL`
      set and a real signup to fire the pipeline. Verify by setting it,
      triggering `POST /api/pulse/autopilot/run` (or waiting for the next
      tick), and checking the resulting `pulse_draft.body` reflects the
      traits.
