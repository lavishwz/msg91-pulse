# Pulse's own store — the six tables Autopilot writes to

Everything MSG91 owns, Pulse reads. `readonly_user` has `SELECT` and nothing
else, and that is correct: Pulse has no business writing to a production
messaging platform's schema.

But Autopilot is *a record of decisions taken over time*. With `SELECT` only
there is nowhere to put a decision, a draft, a timer, a policy version, or the
fact that a person approved something — so an agent that scores a signup and
cannot store the score has done nothing. The next page load re-scores it,
differently, and the log stays empty.

This document is that missing half: six tables in a schema Pulse owns.

    npm run db:local      # the MSG91 clone   → test_betatest  (read-only in spirit)
    npm run store:up      # Pulse's own store → pulse_store    (read-write)

Both live on the same local MariaDB (port 3399). They are **separate schemas on
purpose** — see §3.

---

## 1. The six tables

| Table | Holds | Why it is the spine |
|---|---|---|
| `pulse_policy` | rules and manifest as versioned rows | a decision must cite the policy that produced it |
| `pulse_signal` | de-duplicated things worth acting on | stops one signup becoming three cards |
| `pulse_decision` | one row per AI decision | **this table *is* the Live / AI log tab** |
| `pulse_draft` | messages written, and what happened to them | "held for a person" needs somewhere to hold it |
| `pulse_timer` | follow-ups the agent set for itself | "if nothing changes by Thursday, act or hand it back" |
| `pulse_outcome` | what happened after | the only thing that makes any of this improve |

Full DDL with the reasoning inline: `scripts/pulse-store/schema.sql`.

Three more tables live in the same schema without being part of the decision
loop — they are the things the app itself owns:

| Table | Holds | Migration |
|---|---|---|
| `pulse_member` | who may sign in, and as what type | `003_members.sql`, `004_member_roles.sql` |
| `pulse_account_tag` | tags on a company | `005_account_tags.sql` |

`pulse_account_tag` is keyed on `account_id` — an `ms_user.user_pid` — with no
foreign key, because that table is on another server Pulse only reads. One row
per tag per company, unique on a lowercased `tag_key` so "Enterprise" and
"enterprise" are one note rather than two. `source` separates the tags somebody
typed (`human`, drawn solid) from the ones Pulse inferred from evidence
(`pulse`, drawn dashed); a person re-adding an inferred tag promotes it to
theirs, and never the reverse. See `lib/pulse/tags.ts`.

---

## 2. The three ideas that matter

Everything else is columns. These three are the design.

### 2.1 The stable key

`pulse_signal.signal_key` is derived from what the signal is *about*, never from
when it was noticed:

    signup:302655
    month:2026-09:account:302621
    wallet_dry:302408

It is `UNIQUE`. So a re-run, a retry, a crash halfway through, or two runners
racing all produce the same key, and the second insert is refused rather than
duplicated. `pulse_decision` carries the same idea one level up with
`UNIQUE (signal_key, agent)` — one verdict per agent per signal, forever.

This is what makes the runner safe to run on a cron every five minutes without
anyone thinking hard about it. Verified: inserting `signup:302655` twice leaves
one row.

### 2.2 Every branch writes a decision row

Including the ones that did nothing.

- suppressed a junk signup → a row, with the reasons, reversible
- gateway timed out → a row with `held = 1` and `error_code = 'TIMEOUT'`
- agent replied with something that failed schema validation → a row with
  `error_code = 'BAD_AGENT_REPLY'`

A silent skip is the one outcome that must never happen, because it is
indistinguishable from "nothing was there". The difference between a log a
manager can audit and a feed of things that happened to work is entirely in
whether the failures are in it.

### 2.3 Policy is data, not code

The thresholds and the manifest were a hardcoded `MANIFEST` array in
`public/pulse.js`. They are now 22 rows in `pulse_policy` at version `v1`, and
every decision records the `policy_version` in force when it was made.

Change a threshold and you write a **new version**; you never edit the old row.
Otherwise every decision made under the old rule becomes unexplainable six weeks
later, which defeats the point of logging them.

`state` is `active | proposed | retired` rather than a boolean, because a rule
being trialled is not the same as one that is live — that distinction is what
the Rules tab draws, and what Agent 7 eventually proposes changes into.

---

## 3. Why a separate schema

`pulse_store` is its own database, not six tables added to `test_betatest`.

- **The boundary is real.** "MSG91's data, which Pulse reads" and "Pulse's data,
  which Pulse owns" are different things with different permissions and
  different owners. A schema boundary says so in a way a naming convention
  cannot.
- **Production is a connection string, not a migration.** When MSG91 grants a
  writable schema, the same DDL runs there and the app changes one env var.
- **No foreign keys cross over.** An account is referenced as `account_pid`, a
  plain value, never a FK into `ms_user`. The two schemas may not stay on the
  same server, and a cross-schema FK would make that move painful for no gain.
- **The clone stays disposable.** `npm run db:local:reset` can wipe the MSG91
  copy without touching a single decision Pulse has made.

---

## 4. What a full loop looks like in these tables

A signup arrives and is worth a human:

```
ms_user gets a row                       (MSG91's schema — read)
   │
   ▼ runner polls from a watermark, SQL assembles the facts
   │
   ├─ pulse_signal    signup:302655, state=open, evidence=[…], sla_due_at=+4h
   │
   ├─ pulse_decision  agent=signup-triage, verdict=human_now, score=92,
   │                  confidence=0.92, policy_version=v1,
   │                  input_digest=sha256(facts), output_json={…}
   │
   ├─ pulse_decision  agent=outreach-drafter, held=1,
   │                  hold_reason='mentions a price'
   │  └─ pulse_draft  status=held, body='…', facts_used=[…]
   │
   ├─ pulse_timer     nurture:302655:step2, fires_at=+3d, action=draft_step_2
   │
   ▼ a rep releases the draft
   pulse_draft        status=released, released_by=<admin_pid>, released_at=…
                      released_body=<what they actually sent>
   │
   ▼ two weeks later
   pulse_outcome      kind=replied, occurred_at=…
```

The Live tab is then `SELECT * FROM pulse_decision ORDER BY at DESC` — with the
evidence, the confidence and the policy version already attached, because they
were written at the moment the decision was made rather than reconstructed
afterwards.

Verified end to end on the local store: signal → decision → draft → timer, all
four joined on `signal_key`, then cleaned up. The store is currently empty apart
from the 22 policy rows.

---

## 5. Two columns worth explaining

**`pulse_decision.input_digest`** — a SHA-256 of the facts sent to the agent.
Two decisions with the same digest and different outputs mean the agent drifted.
That comparison is the whole input to Agent 7 (`policy-critic`), and it costs one
column to make possible now rather than reconstructing it later from logs that
were never kept.

**`pulse_draft.body` vs `released_body`** — `body` is what the agent wrote and
never changes; `released_body` is what the rep actually sent. Keeping both is the
only way to measure the edit rate, which is the drafter's real metric. A draft
released unedited is the goal; a draft rewritten every time is a prompt problem,
and you cannot tell the difference if you only store one of them.

---

## 6. What this does not solve

- **Production still cannot be written to.** This schema exists on the local
  clone. Autopilot can be built and proven end to end against it, but going live
  needs MSG91 to grant Pulse a writable schema and a second connection.
- **Nothing sends.** `pulse_draft.status = 'sent'` has no code path behind it
  until a mailbox is connected. Released is as far as a draft goes.
- **Outcomes need time.** `pulse_outcome` can be written to today, but a
  snapshot of a database cannot tell you who replied next week.

---

## 7. Commands

```bash
npm run db:local        # start the local server (port 3399)
npm run store:up        # create/update pulse_store, seed policy v1 — idempotent
npm run store:reset     # drop it and start over
```

Connect:

```bash
mysql -h 127.0.0.1 -P 3399 -u pulse -ppulse pulse_store
```

The `pulse` user has full rights on `pulse_store` and on the `test_betatest`
clone, which is what lets one connection read MSG91's data and another write
Pulse's — the shape production will need, rehearsed locally.

---

## 8. Running it on a schedule

One endpoint. Call it every five minutes from anything that can make an HTTP
request — cron, a scheduler, an automation tool.

```bash
curl -X POST https://your-host/api/pulse/autopilot/run \
     -H "x-autopilot-secret: $AUTOPILOT_TICK_SECRET"
```

The secret can also go in the query string (`?secret=…`) for schedulers that
cannot set headers. Without it the endpoint returns 401, and if
`AUTOPILOT_TICK_SECRET` is unset it refuses to run at all — a missing config
must never mean "no authentication needed".

### What one call does

```
take the lock  →  triage new signups  →  draft for whoever needs one  →  release
```

Both phases re-derive their work from the store rather than from anything held
in memory, so a call that is cut short leaves the rest for the next one. There
is no retry path to maintain: the query is the retry.

Triage runs first and always. Drafting gets the time that is left, because a
signup above the threshold has an SLA measured in minutes while a message that
is written a minute later costs nothing.

### Measured

| Situation | Time | AI calls |
|---|---|---|
| Nothing new (most calls) | **16 ms** | none |
| One draft to write | ~56 s | 1 |
| Ten new signups + three drafts | ~3.5 min | 4 |

At roughly four signups a day, nearly every call is the first row. The five
minute frequency is there for the SLA — a signup scoring above the threshold is
meant to reach a person within ten minutes — not for the volume.

### Calling it twice at once is safe

A second call arriving while the first is still working returns `200` with
`ran: false` and the reason, rather than starting a second run. Verified: two
simultaneous calls, one ran, one declined.

Duplicate work would not corrupt anything — every key in this store is unique —
but it would spend AI calls twice, so the second caller goes home. A lock also
expires, so a runner killed mid-pass does not block every future call.

### Reading the response

- `200` — the pass was clean
- `207` — something was held and needs looking at
- `401` / `503` — the secret is wrong, or the store is unreachable

`GET` on the same URL is a status read with no side effects: whether a run is in
progress, and what the store holds.

---

## 9. Migrations

The deploy platform has no release phase — nothing runs between "code uploaded"
and "server started" — so the app brings its own schema up. `instrumentation.ts`
calls `migrate()` once per server start, before the first request.

```
migrations/
  001_store.sql   the nine tables
  002_seed.sql    the manifest, thresholds, nurture gaps, and the four motions' rules
```

A fresh deploy against an empty database creates everything and seeds the
policy. An existing one skips both files and costs a few milliseconds.

### The rules it follows

- **Only forward.** Files apply in filename order and never re-apply. There is
  no down migration: rolling a live schema backwards is how data is lost, and
  reverting is a new migration like any other.
- **Recorded by checksum.** A file edited *after* it was applied is reported at
  boot rather than ignored — it means two environments have different schemas
  and neither knows.
- **One at a time.** `GET_LOCK('pulse_migrate', 60)` stops two instances running
  DDL against the same database at once.
- **Never touches MSG91's schema.** Everything goes through the store pool, which
  points at `PULSE_STORE_DATABASE`.
- **A failure does not stop the server.** It is logged, and the data routes say
  what is wrong — which they already do. A schema problem should not take down
  the pages that do not need the store.

### Adding one

Drop a new file in `migrations/` with the next number. Write every statement so
it is safe to run twice (`CREATE TABLE IF NOT EXISTS`, `INSERT IGNORE`,
`ADD COLUMN IF NOT EXISTS`) — the file is a description of a schema that may
already partly exist, not a one-shot script.

**Never edit a migration that has already run.** Write another one.

### Running it by hand

```bash
# what is on record
curl http://127.0.0.1:3002/api/pulse/store/migrate

# apply anything outstanding
curl -X POST http://127.0.0.1:3002/api/pulse/store/migrate \
     -H "x-autopilot-secret: $AUTOPILOT_TICK_SECRET"
```

POST needs the same secret as the runner: applying DDL is not something a
stranger with the URL should be able to trigger.

Verified against a genuinely empty database — 9 tables created, 40 policy rows
and 16 motion rules seeded, in 11 statements.
