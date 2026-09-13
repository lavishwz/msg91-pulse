# Missions and work items

## Purpose
Gives Pulse a persistent record of "an outcome worth achieving for a customer"
(mission) and "something a person or AI must do about it" (work item), so My
Work, the account page's "Open on this account," and a future "Log what
happened" save all read the same store instead of each recomputing cards from
scratch. Closes the gap identified in the PRD/handover feature audit: `cards.ts`
computes cards live from `ms_trans`/`ms_user` on every request and nothing
persisted the outcome, so nothing could say "this promise is still open" a day
later.

## Users
Every employee role (PRD §4) reads their own/team/company work through
`GET /api/pulse/work`. Missions are read-only from the API — no employee
creates one by hand, matching the rule "never make an employee enter a manual
CRM stage when a signal can infer it" (build instructions §6). AI/scanners and
(for manual work items) any signed-in member write through
`lib/pulse/missions.ts`.

## Plain-language copy
Not yet wired to any screen — this is the data layer and two endpoints only.
See "Edge cases" for what a screen consuming this needs to say for the empty
and degraded states.

## Data decisions
| Business fact | Option | Source | Company link | Sensitivity |
|---|---|---|---|---|
| Mission (outcome worth achieving) | 3 — Pulse standalone | `pulse_mission` | `account_pid` = `ms_user.user_pid`, no FK (cross-database) | Internal — visible to any signed-in member per existing role rules |
| Work item (next action / promise / approval / watch) | 3 — Pulse standalone | `pulse_work_item` | same | Internal |

Both are pre-approved as option 3 in the AI build instructions' known-decisions
table ("Pulse missions, work, people added by employees... = Pulse standalone
data") — no open question to ask before building this slice.

## UI behavior
Not built yet. Intended consumers, in priority order:
1. My Work (PRD §7.1) — `GET /api/pulse/work?scope=mine|team|company|waiting`.
2. Account page "Open on this account" (handover §7.6) —
   `GET /api/pulse/missions?account=<id>`.

`scope=team` currently degrades to "everyone's open + unowned work": Pulse has
no team field on a rep (motion is derived per-account, not a rep property), so
a real team filter needs that decided first — flagged inline in the route.

## AI behavior
No scanner writes through this yet. `upsertMission`/`upsertWorkItem` are ready
for a scanner or the eventual "Log what happened" extraction to call — both are
idempotent by key (`mission_key` / `work_key`), so a retried scanner run or a
resubmitted extraction updates the same row rather than opening a duplicate,
per the handover's merge rule (§10: "card fatigue is the number one way this
product dies"). A mission does not reopen once `completed`/`stopped` — a new
signal after that starts a new mission under a fresh key, since re-litigating a
closed outcome is a different mission.

## Security and audit
Every write carries `source` (`ai`/`human`) and, for human writes,
`created_by` (member email) on the mission/work row itself. There is **no**
separate audit-event row for mission/work changes yet — unlike reassignment
(`pulse_account_owner_event`) or commercial reveals
(`pulse_commercial_reveal`), which each have their own event log. If mission/
work history needs to survive an update (not just the current state), that is
the next slice, following the `pulse_account_owner_event` pattern.
Endpoints require a valid Pulse session (`gate()`); no additional role check —
matches the tags endpoint's "any member" precedent, since the underlying data
carries no sensitivity beyond what an account page already needs.

## Edge cases
- No missions on an account: `GET /api/pulse/missions` returns `[]`, not an
  error — a genuine, expected state for a new/quiet account.
- Store unreachable: routes return `503` with the underlying error message
  (matches the tags/accounts route convention), not a fabricated empty list.
- Reprocessing the same signal: idempotent by key, verified only by code
  inspection so far — **not yet covered by an automated test**, because a
  meaningful test needs a live store (the repo's local MariaDB tooling is
  currently broken — `unknown variable 'provider_bzip2'` — unrelated to this
  change; flagged for a separate fix).
- `waiting_on` is optional and only set by a caller that knows who holds the
  ball; nothing infers it automatically yet — that inference is the "In
  flight" feature (handover §7.1) this table is meant to make possible next.

## Acceptance checks
- [x] `npx tsc --noEmit` passes with the new files.
- [x] Existing test suite (`npm test`) still passes unchanged.
- [ ] Migration `029_missions.sql` applied against a live store and confirmed
      idempotent (`CREATE TABLE IF NOT EXISTS`, matches house style) — not
      run here; applies automatically on next server boot per
      `lib/migrate.ts`. Local verification was blocked by the pre-existing
      local-db startup failure noted above.
- [ ] A scanner or "Log what happened" actually calls `upsertMission`/
      `upsertWorkItem` — nothing does yet. This migration is the substrate,
      not a finished feature; the next slice is wiring one real writer to it
      (recommended: the "Your approval" card below, or a first scanner using
      `upsertWorkItem` for a promise).
