# "Done today · Company" — no longer fake

## Purpose
Found while auditing for remaining mock data: `DONE_C` in `public/pulse.js`
was two hardcoded rows — *"Told all nine customers about the UAE outage"*,
*"Sent the RCS ask to product"* — that rendered under Now → Company →
Done today permanently, regardless of what actually happened. Me and Team
scope were already honestly empty (`DONE`/`DONE_T`, never populated but
never faked either); Company was the one exception.

## Data decision
| Business fact | Option | Source |
|---|---|---|
| Work completed today, company-wide | 1 — existing Pulse table | `pulse_work_item WHERE status='done' AND completed_at >= CURDATE()`, no owner filter (Company scope is everyone's) |

No new table — `pulse_work_item` already existed (missions slice, earlier
this session). This is the first real reader of `status='done'` rows.

## What changed
- `lib/pulse/missions.ts` — `doneToday()`.
- `GET /api/pulse/work?scope=done` — kept in the same route as the four
  My Work views since it's the same table, but not routed through
  `listWork()`: `doneToday` has no owner/team filter, a different shape.
- `public/pulse-live.js` — `loadDoneCompany()`, fetched lazily the first
  time Company scope is opened (chip click or a deep link landing there
  directly — both paths covered).
- `public/pulse.js` — `DONE_C` deleted outright rather than emptied in
  place, so a future reader can't mistake it for a real array that just
  happens to be empty right now.

## Why it's empty right now, and that's correct
`pulse_work_item` is new this session — the only writer today is "Log what
happened," and nothing has been marked `done` yet (work items complete
when a person closes them, which no UI does yet either — see the open "My
Work has no screen" gap). Verified directly against the live store:
`doneToday()` returns `[]`, not an error, not a placeholder. Correct,
honest behavior for a table with no `done` rows yet — the same "empty is
the goal" principle the rest of this app already follows.

## Acceptance checks
- [x] `npx tsc --noEmit` clean.
- [x] `npm test` — all 16 suites, unchanged, still green.
- [x] `node -c public/pulse.js` / `public/pulse-live.js` — syntax clean.
- [x] `doneToday()` verified directly against the live store — runs
      clean, returns `[]` (correct: nothing is done yet).
- [x] Route verified against a running server — 401 unauthenticated, no
      500s.
- [ ] Not visually confirmed in a browser (needs a signed-in session) that
      Company → Done today now shows genuinely empty instead of the two
      old fake rows.
