# Prospects / "Add accounts in bulk"

## Purpose
Makes the bulk-add sheet real. Previously `#ovdo` on that sheet just closed
the dialog (`$("#ov").hidden=true; return;`, public/pulse.js) — nothing was
checked or created, and there was nowhere to put a company that is not yet an
`ms_user` row, since every account Pulse could show was one already in MSG91.
`pulse_prospect` is that missing place, and `/api/pulse/prospects` is the real
check-then-create flow.

## Users
Any signed-in member (Sales primarily, per PRD §4 "Sales... may add potential
customers manually").

## Plain-language copy
Not yet updated in `public/pulse.js` — see "UI behavior" below for exactly
what has to change and why it isn't done in this slice.

## Data decisions
| Business fact | Option | Source |
|---|---|---|
| A potential customer not yet in MSG91 | 3 — Pulse standalone | `pulse_prospect` |
| "Is this already a customer" | 1 — existing database | `ms_user.user_email`, matched by exact email and by domain (`SUBSTRING_INDEX(user_email,'@',-1)`) — the only company-identifying field `ms_user` has; there is no separate domain/website column |
| "Is this already a prospect" | 3 — Pulse standalone | `pulse_prospect.domain` |

## UI behavior
**Honest about what changed vs. what didn't.** The backend is real: `POST
{action:"check"}` classifies each row as `dup_customer` / `dup_prospect` /
`suppressed` / `new` using the queries above, and `POST {action:"create"}`
inserts the confirmed `new` rows. `public/pulse.js`'s bulk sheet still shows
its hardcoded `BULK` array and its `#ovdo` handler still just closes the
dialog — **wiring the sheet to call this endpoint is not done in this slice**.
That is a frontend-only change (replace `BULK` with a `fetch` to
`POST /api/pulse/prospects {action:"check"}` on paste, and call
`{action:"create"}` from `#ovdo`) and is the natural next step.

The handover's claim "new accounts are enriched and scored before they reach
anyone" is **not** implemented and this slice does not add it — there is no
domain-triage/company-resolution code anywhere in the repo. If that copy
reaches the real sheet unchanged, it will be lying about what happened, which
the build instructions forbid outright (§7 "never claim... unless a
source/connector confirms it"). The sheet's copy needs to change to describe
only the dedup check, or enrichment needs to be built first.

## AI behavior
None. This is a deterministic dedup check, not an AI decision — no GTWY call,
nothing to log as an AI action.

## Security and audit
`added_by` is recorded on every prospect row. No separate audit-event log —
same open item as missions/work items (see that dev note); a
`pulse_prospect_event` table following the `pulse_account_owner_event`
pattern is the natural follow-up if prospect history needs to survive an
edit.

## Edge cases
- A row with neither a recognizable domain nor an `@` (e.g. a bare company
  name typed by hand): classified `new` with the note "added as a name only"
  — not rejected, since the PRD explicitly allows adding a company by name.
- A personal email domain (gmail.com etc.): classified `suppressed` with a
  note, **not silently dropped** — matches decisions doc example 2 ("this is
  not assumed to be fake; it is treated as low confidence"), so a human still
  sees it and can override by creating it as `manual` source instead of
  `bulk_add`.
- Duplicate check runs in at most 2 queries regardless of row count (batched
  `IN (...)`), matching the one-pass-over-legacy-tables discipline `cards.ts`
  already established for the same reason (`ms_user`/`ms_trans` carry no
  useful secondary index).

## Acceptance checks
- [x] `npx tsc --noEmit` passes.
- [x] `npm test` passes unchanged.
- [x] Migration `030_prospects.sql` applied to the live store and confirmed
      on record (`pulse_migration`).
- [x] Routes compile and respond correctly when unauthenticated (`401`, not
      `500`) — verified against a running dev server.
- [ ] Not exercised with a real session / real rows — needs a signed-in
      smoke test or a script using `PULSE_ME_USER_PID`.
- [ ] `public/pulse.js`'s bulk sheet still not wired to this endpoint — see
      "UI behavior."
