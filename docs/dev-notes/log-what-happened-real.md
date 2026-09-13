# "Log what happened" — real extraction, real records

## Purpose
The single most-referenced gap across every audit this session: the sheet
was a hardcoded sample note, a fake five-line preview, and a save button
that called nothing. This closes it completely — real GTWY agent, real
extraction, real rows.

## Data decisions
| Business fact | Option | Source |
|---|---|---|
| Structured extraction from a free-text note | 2 — API, a new fixed GTWY agent, created and configured this session by the user's explicit instruction and their own admin token | `GTWY_AGENT_LOG_EXTRACT` (agent `6aa0352bb54ce2b5442e0f39`) |
| Promise / risk | 3 — Pulse standalone | `pulse_work_item` (types `promise`, `watch`) |
| Product interest | 3 — Pulse standalone | `pulse_mission` (type `grow_product`) |
| Person | 1 — existing Pulse table | `pulse_account_contact` |
| The raw note + full extraction, always | 3 — Pulse standalone | `pulse_signal` (`kind='manual_note'`), append-only |

## The GTWY agent
Created via the exact mechanism the user specified: **no runtime agent
creation** (that pattern was already removed from this codebase on purpose —
see `lib/pulse/gtwyAdmin.ts`'s own header comment). This is a fixed,
manually-configured agent, same as the other 9 already in `agents.ts`.

Built this session:
1. Configured the blank draft version (`PUT /api/versions/:id`) with a role/
   goal/instruction prompt — five nullable fields (promise, decision,
   interest, risk, person), explicit that null is the honest answer when
   the note doesn't say a field, never a guess dressed up as fact.
2. Published it (`POST /api/versions/publish/:id`) — the endpoint isn't
   documented anywhere in this repo; found by reading the actual GTWY
   backend route source the user pointed to
   (`all-projects/AI-middleware/src/routes/agentVersion.routes.js`).
3. Verified live against the real gateway (`api.gtwy.ai`) with three test
   notes — a full one (promise+decision+interest+risk+person all present),
   an empty one (correctly returned all-null), and the one used for the
   end-to-end database test below.
4. Wired into `lib/pulse/agents.ts` as `AGENTS.logExtract`, matching the
   existing fixed-agent-id pattern exactly (`GTWY_AGENT_LOG_EXTRACT` env var,
   hardcoded fallback id, same as every other agent here).

**Model note:** configured on `gpt-5-nano` (the id already had this set from
creation) with `response_type: "default"` — matching the *actual* working
pattern already in production for `automation-planner`, not GTWY's
`json_schema` response type, which no agent in this account currently uses.
Structure is enforced by the prompt + this app's own Zod parse
(`LogExtractSchema`), same as every other agent here.

## What changed in code
- `lib/pulse/agents.ts` — `AGENTS.logExtract`, `LogExtractSchema`,
  `extractLog()`.
- New `lib/pulse/logNote.ts` — `logWhatHappened()`, the whole pipeline.
- New `POST /api/pulse/accounts/:id/log`.
- `public/pulse.js` — the sheet's textarea is now empty (placeholder, not a
  fake sample), the fake five-line "What I will do with that" preview is
  gone (it promised the same result for every note), `#ovdo` calls the real
  endpoint, and a new `logResultHtml()` shows exactly what was actually
  created — only the fields the note supported, nothing padded.
- `public/pulse-live.js` — `PulseLive.logWhatHappened()`.

## Why "decision" writes nowhere of its own
None of the four work-item types (next_action/promise/approval/watch,
per the decisions doc's own "there are only four") fit "a fact was settled."
Inventing a fifth type for one field was worse than the honest alternative:
it's still captured in full, in the `pulse_signal` row every call writes
regardless of what else fires.

## Verified end-to-end against the live store, then cleaned up
Ran `logWhatHappened()` directly against a real account with a realistic
note. Confirmed by reading every row back:
- Extraction was correct: a promise with a resolved due date, a product
  interest with reason, a person with role, `decision`/`risk` correctly
  null (the note didn't mention either).
- `pulse_work_item` row created for real (id 3, type `promise`).
- `pulse_mission` row created for real — **the first mission this system
  has ever written** (id 1, type `grow_product`) — closing the earlier gap
  that the mission substrate had a schema but no writer.
- `pulse_account_contact` row created for real.
- `pulse_signal` audit row present.

All four test rows were then deleted (this was verification data against a
real customer account, not a real event) — the delete itself confirms the
rows existed exactly where expected, with nothing left behind.

## Acceptance checks
- [x] `npx tsc --noEmit` clean.
- [x] `npm test` — all 16 suites, unchanged, still green.
- [x] `node -c public/pulse.js` / `public/pulse-live.js` — syntax clean.
- [x] GTWY agent live-tested three times against the real gateway before
      being wired into the app.
- [x] Full pipeline live-tested against the real store, all four resulting
      rows verified correct, then removed.
- [ ] Not click-tested from the actual sheet in a browser — needs a signed-
      in session. The API and data layer are proven; only the last mile
      (textarea → button → this endpoint) is unverified by a real click.
