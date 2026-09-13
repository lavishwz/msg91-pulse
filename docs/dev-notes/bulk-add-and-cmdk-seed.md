# Bulk-add wired for real, and a bigger bug it uncovered

## Purpose
Wire "Add accounts in bulk" to the real backend built earlier this session
(`lib/pulse/prospects.ts`, previously built but not connected to the sheet).
Also fixes the "Suppressed" chip's identical lossy-window bug from the
"Drafted" fix. In the process, found and fixed something bigger: **⌘K's
"Go to" and "Do" groups had no entries at all** — not just bulk-add.

## The bigger bug
`rebuildPal()` has always filtered `PAL` for `g==="Go to"` and `g==="Do"`,
expecting a static seed to carry forward across each rebuild. But `PAL`
started as `[]` and nothing, anywhere in the file, ever put a "Go to" or
"Do" row into it. Confirmed by search: not a single `data-sheet="bulk"`
existed anywhere in the codebase. Every item handover §7.8 describes living
only in ⌘K — add a company, add accounts in bulk, log a call, reassign,
pause all sending, and every "Go to" shortcut — has been unreachable since
this shipped, not just the one this session happened to need.

**Fixed:** a real seed at the top of the file. Scoped to what has a genuine
backend behind it right now:
- **Go to** — Autopilot's four tabs, Profile.
- **Do** — Add accounts in bulk, Reassign accounts (opens the real reassign
  sheet on the unassigned pile), Pause all sending (the real kill switch,
  `PulseLive.setSendingPaused`, confirmed first — it affects everyone).

Not added: "Log a call" (needs an account already in context — ⌘K isn't
scoped to one) and "Add a company" the enriched paste-a-domain way (handover
feature 35, still explicitly PENDING — no enrichment exists to promise).

## Bulk-add, wired for real
Two-step sheet matching the real API (`checkBulk`/`createBulk` in
pulse-live.js):
1. Paste rows → **Check →** → `POST /api/pulse/prospects {action:"check"}`
   → real classification (new / already a customer / already a prospect /
   suppressed), shown with the real reason for each.
2. **Create the N new ones →** → `POST {action:"create"}` → only the
   confirmed `new` rows are written.

Removed the false "NEW ACCOUNTS ARE ENRICHED AND SCORED" claim — no
enrichment exists (confirmed in the earlier prospects dev note); the copy
now says exactly what happens: checked against MSG91's accounts and
existing prospects, nothing more.

## Suppressed chip
Identical fix to "Drafted for a person" two turns ago: `loadSuppressed()`
reads the dedicated `suppressed()` query (`view=filtered`) instead of
filtering the general feed's most-recent-60 window. Generalized both
chips' loading/rendering through one `OWNFETCH` map instead of duplicating
the drafted-specific logic a second time.

## Acceptance checks
- [x] `node -c public/pulse.js` / `public/pulse-live.js` — syntax clean.
- [x] `npx tsc --noEmit` clean.
- [x] `npm test` — all 16 suites, unchanged, still green.
- [x] Routes verified against a running dev server: correct 401s, no 500s,
      no server errors.
- [ ] Not click-tested live (needs a signed-in session) — the ⌘K seed in
      particular is worth a real click-through: open ⌘K, confirm "Go to"
      and "Do" now show rows, and that "Add accounts in bulk" opens the
      real sheet end to end.
