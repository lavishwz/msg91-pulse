# Room to grow → Activity → held draft, made a real path

## Purpose
Traced a user report end to end: "Release what is written" said 3 messages
were waiting, its panel had no way to reach them, and the "Drafted for a
person" chip in Autopilot → Activity — the natural destination — showed 0
despite real held drafts existing. All three were real, separate bugs, now
fixed as one connected path.

## The three bugs, precisely
1. **`oppDest` (new) / `oppAsk` (existing)** — the room-to-grow panel's "Open
   in X" link is chosen by guessing keywords out of the opportunity's title
   and CTA text (`oppAsk`). None of the three real (non-mock) opportunities
   `roomRows()` produces — "Claim an account", "Wake something up", "Release
   what is written" — matched any of its four keyword patterns, so all three
   opened a panel with only "Not now" on it. Fixed by checking an exact key
   lookup first (`public/pulse.js:oppDest`), falling back to the old guess
   only for Agent-5's generated monthly-digest plays, whose titles aren't a
   fixed set this can name.
2. **`draftId` was never set anywhere** — `LogRow.held` (pulse_decision's own
   held state — "this verdict needs a person") and "there is a held draft
   attached to this decision" are different facts, but the "Drafted for a
   person" chip filtered on `r.held || !!r.draftId`, and nothing in the API
   ever populated `draftId`. Fixed with a real join: `pulse_draft` LEFT
   JOINed onto the shared decision `SELECT` in `lib/pulse/autopilot/log.ts`,
   preferring a still-held draft over an already-released one per signal.
   New `LogRow.draftHeld` is what the chip actually checks now.
3. **The deeper one: even joined correctly, a held draft can be older than
   dozens of unrelated decisions.** `decisions()` returns the most recent N
   rows across *everything* — every automation run, every viasocket trigger
   — and confirmed live, 83 other decisions landed after 3 real held drafts
   within about a day. No page size fixes this permanently, only delays it.
   Fixed by giving "drafted" the same treatment `suppressed()` already had:
   its own query (`draftedForPerson()`, `WHERE f.status = 'held'`), its own
   endpoint (`GET /api/pulse/autopilot/decisions?view=drafted`), and its own
   lazy client fetch (`PulseLive.loadDrafted`) — not a filter over a window
   that can silently lose rows.

A fourth thing broke as a direct consequence of #3 and is fixed alongside it:
the row-detail panel (`kind==="autopilot"`) looked a clicked row up only in
`state.activity` — a row sourced from the new `state.activityDrafted` fetch
would not be found there, and the panel would silently close. Now checks both.

## What "Suppressed" is, for the record
`d.verdict = 'suppress' AND s.state = 'suppressed'` — a signal AI looked at
and decided was not worth a person's time (a junk/disposable-email signup,
for instance — decisions doc example 2). This is the "junk suppression"
feature, working as designed; "This was real" (`data-unsuppress`) is how a
person corrects a wrong one. Note: `suppressed()` has the exact same
dedicated-query pattern `draftedForPerson()` now follows, but — unlike
`drafted` — is **still not wired to a lazy client fetch**; the "Suppressed"
chip still filters the general window. Same latent bug, not fixed here
(out of the reported scope, flagged for the same fix later).

## Card primary actions — the other half of this session's report
Covered in `docs/dev-notes/card-actions-real.md`: the blue button on every
actionable card now calls a real backend (claim ownership, or track a real
work item) instead of a local-only "mark done". Not repeated here.

## "Not now" now confirms
`data-oppoff` (Room to grow's dismiss, both the inline card and the panel)
goes through `pulseConfirm()` — the app's existing non-blocking confirm
dialog, already used for destructive actions elsewhere (e.g. deleting an
automation) — before adding to `S.roomOff`. Copy is honest either way:
dismissing only hides it locally until reload; nothing is written.

## An unrelated finding surfaced while verifying this live
Checked the newly-scheduled `/api/pulse/autopilot/run` cron job
(docs from the earlier scheduling session) against cron-job.org directly: it
**is** firing and **is** doing real work — `draftedForPerson()` now returns
8 held drafts against the 3 that existed before, confirming new signups are
being triaged and drafted automatically. But cron-job.org itself reports
`status=FAILED (timeout)` on every run, `duration=30004ms` — its own client
waits ~30s for a response and gives up, while the route's `maxDuration=300`
lets the actual serverless function keep running past that and finish for
real. Not a functional problem (the work completes either way), but worth
fixing so the job's dashboard stops crying wolf — `createCronJob()`
(`lib/pulse/cronjob.ts`) does not currently set a `requestTimeout`, and
cron-job.org's API supports one. Not changed in this session — flagging for
a decision rather than guessing at a new timeout value.

## Acceptance checks
- [x] `node -c public/pulse.js` / `public/pulse-live.js` — syntax clean.
- [x] `npx tsc --noEmit` clean.
- [x] `npm test` — all 16 suites, unchanged, still green.
- [x] `draftedForPerson()` verified directly against the live store: returns
      real rows (`draftHeld: true`) including the exact 3 signups from the
      user's screenshot (walkover, uday, SenderID) plus 5 more from the
      cron job's real runs since.
- [ ] Not click-tested live end to end (Room to grow → Autopilot → a
      drafted row → Release) — needs a signed-in browser session.
