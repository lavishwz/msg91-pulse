# Autopilot — how it works, and what is left

Autopilot is Pulse's promise that **every decision AI made is on the record, with
the evidence and the policy behind it**. Not a chatbot in the corner: a log a
manager can audit, where each row says what was seen, which rule applied, what
was done, and whether a person was needed.

This is the operating document. `docs/autopilot-agents.md` is the original plan,
`docs/autopilot-agent-prompts.md` holds the four agents' prompts and schemas, and
`docs/pulse-store.md` describes the tables. This one says how the pieces fit and
what is still missing.

---

## 1. The one thing to know

> **A query answers "what is true". An agent answers "what should we do about
> it" or "how should we say it". The rules decide, in code, and are never sent
> to an agent.**

Everything below follows from that split.

- **SQL** assembles the facts. Deterministic, cheap, auditable.
- **The agent** scores and writes. It never sees a threshold, and it never
  touches the database.
- **The rules** turn a score into an action. They are rows a person can read and
  edit, evaluated in code — because a rule written into a prompt is guidance a
  model usually follows, while a rule evaluated in code is a control that always
  holds.

The one place this is deliberately duplicated is the price rule: it is in the
drafting agent's prompt *and* checked in code before anything can be released.
The prompt stops most of it; the check is what makes it true.

---

## 2. One scheduled call

```bash
curl -X POST https://your-host/api/pulse/autopilot/run \
     -H "x-autopilot-secret: $AUTOPILOT_TICK_SECRET"
```

Every five minutes, from anything that can make an HTTP request. The secret may
also go in the query string (`?secret=…`) for schedulers that cannot set
headers. Month end is a second, separate call:

```bash
curl -X POST https://your-host/api/pulse/autopilot/monthly \
     -H "x-autopilot-secret: $AUTOPILOT_TICK_SECRET"
```

### What one call does

```
take the lock
  → check the circuit breaker
  → triage new signups
  → draft for whoever needs one
  → fire whatever timers are due
release the lock
```

Every phase re-derives its work from the store, so a call that runs out of time
leaves the rest for the next one. There is no retry path to maintain: **the query
is the retry.**

### Measured

| Situation | Time | AI calls |
|---|---|---|
| Nothing new — most calls | **16 ms** | none |
| One draft to write | ~56 s | 1 |
| Ten signups and three drafts | ~3.5 min | 4 |

At roughly four signups a day, nearly every call is the first row. **The five
minute frequency is for the SLA** — a signup above the threshold is meant to
reach a person within ten minutes — not for the volume.

Calling it twice at once is safe: the second call returns `200` with
`ran: false` rather than starting a second run. The lock expires, so a runner
killed mid-pass does not block every future call.

---

## 3. The signup flow, end to end

```
a row lands in ms_user
   │
   │  the runner polls from a watermark, oldest first
   ▼
SQL assembles the facts ......................... lib/pulse/facts.ts
   domain history · spend on the domain · entity · motion
   signup progress · industry · owner · free-mail · competitor
   │  three queries, whatever the batch size
   ▼
Agent 2 · signup-triage ......................... facts only, no thresholds
   → score 0-100, reasons, confidence
   ▼
the motion's rules, applied in code ............. lib/pulse/autopilot/rules.ts
   80+   → a card, ten-minute clock
   40-79 → nurture sequence
   <40   → suppressed, with reasons, reversible
   confidence below 0.60 may never suppress — it becomes nurture instead
   ▼
pulse_decision ................................... always, including failures
   │
   ├─ card raised → merged into an open card if that domain already has one
   ├─ nurture     → Agent 3 writes message one, held
   │                 → a timer for message two, three days out
   └─ suppressed  → Suppressed filter, reviewable, never deleted
```

### Why the fetch is oldest-first and the display is newest-first

The watermark advances to the last row read. Reading newest-first would move it
past everything older, and those signups would never be seen again. So facts are
fetched `ORDER BY user_date ASC` and the feed is rendered `ORDER BY at DESC`.

### Timers

Message one goes out; message two is a dated row rather than something anyone
has to remember. Step two schedules step three. **Step three schedules nothing —
there is no step four, by design.**

Every due timer is re-checked against the world before it fires, because a chase
sent to someone who already replied is worse than no chase at all:

| Cancelled when | Checkable today |
|---|---|
| They paid or started sending | yes — `ms_trans` |
| A person discarded the previous draft | yes |
| The signal was resolved or suppressed | yes |
| They replied | **needs Gmail** |

Gaps are policy rows (`nurture.gap.step2` = 3 days, `step3` = 5), so the cadence
changes without a deploy.

### Month end

```
every account with an owner or spend → Agent 4 → the month's verdict
the board, per scope               → Agent 5 → the narrative and the plays
```

The verdict fills the account page; the plays fill "Where to grow". Keyed by
month and account, so a second call skips what is already written rather than
paying for it again. Accounts younger than thirty days are skipped and say so —
there is genuinely no month to describe yet.

---

## 4. What stops it

Four controls, in order of how loudly they fail.

**The circuit breaker** counts an agent's decisions per hour and, past the limit,
**stops that agent and stays stopped** until a person clears it. It does not warn
and carry on: a runaway automation that writes to 400 customers is the failure
mode that ends trust permanently. Clearing is deliberate and attributed, and only
counts activity since the reset — so acknowledging a burst actually lets work
continue.

**The price rule** refuses to release any message containing a currency symbol, a
rate, a discount, or the words price/quote/tariff. Checked against the text
actually going out, **including a rep's edits** — a control that only saw the
agent's output would be bypassed by typing the price in by hand.

**The kill switch** is a policy row the runner reads before every pass and the
release path checks before letting anything out. Triage and drafting continue
while it is on; nothing reaches a customer.

**The confidence floor** stops a suppression below 0.60 and turns it into a
nurture. This is the error nobody notices — the customer who was never called
leaves no trace.

**Merging** keeps a second signup from a domain that already has an open card
from raising its own. Card fatigue is the number one way this product dies.

---

## 5. Two databases, and why

Pulse reads MSG91's database and writes its own. They are different servers, and
that separation is enforced in code rather than by care.

```
                MSG91's database                    Pulse's database
                mysql.test.txtapi.com               127.0.0.1:3399
                MySQL 5.7 · readonly_user           MariaDB · pulse
                        │                                   │
                     lib/db.ts                        lib/store.ts
                     query()                          write() read()
                        │                                   │
                        └──────── the runner ───────────────┘
                             reads facts      writes decisions
```

- **`lib/db.ts` has no write helper.** It exports `query`, `queryOne` and
  `pool`. There is nothing on it that could insert.
- **`lib/store.ts` has the only `write()`**, and it runs on `storePool()` — a
  separate pool with separate credentials.
- **The database refuses anyway.** `readonly_user` holds `SELECT`; a `CREATE`
  attempt comes back `ERROR 1142: command denied`.

### The mapping is by id, never by foreign key

Nothing in `pulse_store` points at an MSG91 table. An account is referenced as a
plain value:

| Column | Holds | Points at |
|---|---|---|
| `pulse_signal.subject_id` | `ms_user.user_pid` | nothing — a value |
| `pulse_draft.account_pid` | `ms_user.user_pid` | nothing — a value |
| `pulse_decision.actor_admin_id` | an admin's `user_pid` | nothing — a value |
| `pulse_signal.signal_key` | `signup:302658` | nothing — a string |

The only foreign keys in the store are internal: `pulse_draft.decision_id` and
`pulse_outcome.decision_id`, both to `pulse_decision.id`.

That is what lets the two live on different servers, and what will let Pulse's
schema move to whatever MSG91 grants without a migration — only a connection
string changes.

### Switching between the host and the clone

`.env.local` carries both. `MYSQL_*` chooses what is read; the host block is
active and the local clone is commented directly beneath it, for when the host
is unreachable — it only accepts whitelisted IPs, so from home it times out.

**`PULSE_STORE_*` must always be set explicitly.** `lib/store.ts` falls back to
the `MYSQL_*` values when they are missing, which — now that `MYSQL_*` points at
the host — would aim every write at a read-only user on MSG91's database. Those
four lines are what keep reads and writes on different servers.

---

## 6. Where things are written

**Nothing writes to MSG91's database.** Reads go through `lib/db.ts`, which has
`SELECT` and nothing else. Every write goes through `lib/store.ts`, a separate
pool pointed at Pulse's own schema. A read path cannot write, by construction
rather than by care.

| Table | Holds |
|---|---|
| `pulse_decision` | one row per decision — **this is the Activity tab** |
| `pulse_signal` | de-duplicated signals with stable keys |
| `pulse_draft` | messages, held until a person releases them |
| `pulse_timer` | follow-ups and what to do when they fire |
| `pulse_policy` | the manifest, thresholds, rules and breakers, versioned |
| `pulse_outcome` | what happened after — replied, paid, overridden, ignored |
| `pulse_watermark` | how far the runner has read |
| `pulse_lock` | one runner at a time |
| `pulse_question` | Ask's question-to-SQL cache |

**Nothing is ever deleted.** Suppressing, retiring a rule, cancelling a timer and
discarding a draft all leave rows behind. A decision made last month must still
resolve to the exact words that were in force when it was made.

---

## 7. On screen

**Now** — work alerts appear at every scope including Me, because work belongs to
a person. System trouble (a gateway down, a runaway, the kill switch left on)
appears at Team and Company only: a rep is not on call for the infrastructure.

**Autopilot** — four tabs.
- **Activity** — every decision, newest first, with chips for Everything /
  Acted / Drafted / Suppressed / Learned. A row opens the right-hand panel: the
  evidence, how sure it was, the score band, the message if one was written, and
  the policy version behind it.
- **Rules** — the manifest, then the four motions. Editable. Every rule shows
  whether Autopilot actually runs it, and "Test on the last 30 days" replays it
  against decisions already made without sending anything.
- **Connections** — still prototype text.
- **Audit log** — what *people* did. Separate on purpose: different question,
  different audience, different retention.

**Loading** shows a skeleton rather than the prototype's sample rows. A screen
that contradicts itself two seconds later costs more trust than one that admits
it is still loading.

---

## 8. Ask remembers its questions

The question-to-SQL translation is cached in `pulse_question`; **the answer never
is**. The query re-runs on every ask, so the numbers are always current — only
the translation is skipped.

| | Time |
|---|---|
| First ask | 18,741 ms |
| Same question again | **5 ms** |

Normalisation is mild — case, spacing, trailing punctuation, a few filler
openers. Anything cleverer risks collapsing "this month" and "last month", and a
wrong cache hit is far worse than a miss. Marking an answer wrong retires the
plan, and the next ask goes back to the agent.

⌘K searches companies, remembered questions, rules and the manifest.

---

## 9. What is left

### In code
- **Motion rules not wired** — Outbound 0 of 4, Startup 0 of 4, Partner 1 of 4.
  Written down and visible, and each says it is not running. Most need something
  Pulse cannot see yet (a mailbox, DLT status, per-partner volume).
- **New rules are sentences only.** A person can write one; turning it into
  something the runner evaluates is a separate step, done once and confirmed by
  a person. That step is not built.
- **Missions and promises** do not exist as tables, so mission-level merging is
  limited to signals.

### Needs a person
- **A hundred hand-labelled signups.** Until then nobody can say whether the
  scoring is good, and the two asymmetric errors — a suppressed signup that
  would have paid, versus junk reaching a human — cannot be measured.
- **Reading the drafts.** The edit rate is the drafter's only real metric.

### Needs MSG91
- **`ms_trans` transaction types** — which values are a genuine customer payment.
  A provisional definition (`trans_type = 1 AND payment_mode = 2`) is in use
  today and it shapes real verdicts. This is the most consequential open item.
- **Gmail, read-only** — without it there is no reply detection, so silence is
  guesswork and the drafter has no voice to imitate.
- **Write access in production** — everything here runs against a local clone.
- **A database the deployed app can reach** — the Embarko deploy answers, and
  every data route returns 503.
- **An OpenAI key on the gateway** — all four agents run on the cheapest model
  because the org has none. The drafter and the digest were specified for the
  strongest tier available.

### Deliberately later
- **Agent 6 · inbound-responder** — needs Gmail and a proven drafter.
- **Agent 7 · policy-critic** — reads a week of decisions against the policy and
  proposes rule changes. Build it once there are decisions worth criticising.

---

## 10. The number to keep in front of everyone

> **What fraction of signals were resolved without a person, and what fraction of
> those a person later overrode.**

The first is the value. The second is the cost of the first. Neither can be
computed until `pulse_outcome` has been filling for a month, which is the real
argument for starting the clock sooner rather than later.
