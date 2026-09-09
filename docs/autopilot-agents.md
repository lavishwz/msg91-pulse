# Autopilot, AI-driven — what to build and how many GTWY agents

Autopilot's promise is narrow and hard: **every decision AI made, with the
evidence and the policy behind it.** Not a chatbot in the corner. A log a
manager can audit, where each row says what was seen, which rule applied, what
was done, and whether a person was needed.

This document is the build plan for that: what exists, what blocks it, how many
GTWY agents it needs, and the two flows asked for — **new signups** and
**monthly data**.

---

## 0. Where Autopilot stands today

| Tab | Backing | State |
|---|---|---|
| Live / AI log | — | **sample data.** Pulse has made no decisions to log |
| Rules | `MANIFEST` + per-motion rules in `pulse.js` | static prototype text |
| Connections | `CONN` in `pulse.js` | static prototype text |
| Audit | `admin_updation_log` (126k rows) + anomaly detection | **live** |
| Filtered | `signup_tracking` (status ≠ 1) | **live, but rule-based** — "abandoned at step N", no scoring |

Elsewhere, already live and AI-adjacent: six SQL scanners produce the card deck
(`lib/pulse/cards.ts`), health scoring feeds the board (`lib/pulse/health.ts`),
and **one** GTWY agent turns typed questions into SQL for Ask
(`docs/gtwy-agent.md`, agent `6a9ebec00869a6b2a232c53f`).

So: the surface exists, the evidence pipeline exists, and one agent exists. What
does not exist is anything that *decides*, and anywhere to *record* a decision.

---

## 1. The blocker is not agents. It is that Pulse cannot write.

```
GRANT SELECT ON test_betatest.*
```

Autopilot is a record of actions taken over time. With SELECT only there is
nowhere to put a decision, a draft, a timer, a policy version, or the fact that
a human approved something. **No number of agents fixes this.** An agent that
scores a signup and cannot store the score has done nothing — the next page load
re-scores it, differently, and the log stays empty.

Step 0 is a Pulse-owned store. Not the legacy schema — its own database or its
own schema on the same instance, with a second connection that has write
privileges. Six tables:

| Table | Holds | Why it is the spine |
|---|---|---|
| `pulse_decision` | one row per AI decision: signal key, agent, input digest, output JSON, confidence, policy version, action taken, held/sent, actor if approved | **this table *is* the AI log tab** |
| `pulse_signal` | de-duplicated signals from scanners + agents, with a stable `key` | stops one signup becoming three cards (§10 merge rule) |
| `pulse_draft` | drafted messages, channel, status (held / released / sent / discarded) | "drafted, held for a person" needs somewhere to hold it |
| `pulse_timer` | follow-up timers the agent set for itself, and what to do when they fire | "if nothing changes by Thursday, act or hand it back" |
| `pulse_policy` | the rules and manifest as versioned rows, not hardcoded arrays | a decision must cite the policy version that produced it |
| `pulse_outcome` | what happened after: replied, paid, churned, human overrode | the only way any of this improves, and the input to evals |

Everything in the README's "still sample data" list — promises, missions, in
flight, done today, tags, pins, dismissals — lands on the same store. Build it
once and half that list stops being sample data.

**Ask for one more thing while you are asking:** an index on
`ms_trans (trans_tuserid, trans_date)`. It is read-only, costs the schema owner
nothing, and removes the constraint that currently caps health scoring at 50
accounts per request.

---

## 2. The rule for what becomes an agent

An agent is a prompt, a JSON schema, a model choice and an eval suite. Each one
is a thing to maintain and a place to drift. So:

> **A query answers "what is true". An agent answers "what should we do about
> it" or "how should we say it". Never use an agent for the first kind.**

Stays deterministic SQL, no agent, forever:

- the six card scanners (unowned signups, stuck before first message, new person
  at an existing account, unowned but paying, verification stalled, wallet dry)
- health scoring and band movement
- duplicate/company matching by domain
- anomaly detection over the change log
- every count, total and roll-up

These are cheap, auditable, and identical on every run. An agent asked "how many
accounts are unowned" is strictly worse than `COUNT(*)`.

---

## 3. The agents

**Four new agents.** Five including the one that already exists. Two more are
worth building once the first four have run for a month, but they are not needed
for what you asked.

### Existing — Agent 1 · `pulse-sql` (text → SQL)

Already live and unchanged. Ask's typed questions. Documented in
`docs/gtwy-agent.md`.

---

### Agent 2 · `signup-triage` — *who deserves a human*

The core of "respond to new signups".

- **Trigger** — a runner polls for `ms_user` rows newer than the last watermark,
  every 5 minutes.
- **Input** (facts only, assembled by SQL — the agent never queries):
  email domain and whether it is free mail, mobile present, entity from
  currency, motion, signup step reached, IP, how many existing MSG91 accounts
  share the domain and what they spend, whether the domain matches a known
  customer or a competitor, industry if `clientManagement` has one, whether an
  owner was auto-assigned.
- **Output** (JSON schema, enforced):
  ```json
  {
    "score": 0-100,
    "verdict": "human_now" | "nurture" | "suppress",
    "reasons": ["walkover.in already has 1,198 accounts with MSG91", "…"],
    "confidence": 0.0-1.0,
    "suppress_reason": null,
    "needs": []
  }
  ```
- **Thresholds** (policy, versioned — not in the prompt): ≥ 80 → a card for a
  human, with the reasons as its evidence. 40–79 → nurture sequence, Agent 3
  writes step one. < 40 → suppress, and it appears in the **Filtered** tab with
  its reasons — reviewable, never deleted.
- **Volume** — 121/month measured. Spiky: 21 arrived in one day. Batch up to 10
  signups per call on a spike.
- **Model** — cheapest capable tier. This is classification with a rubric, not
  writing.
- **Guardrails** — confidence < 0.6 never suppresses; it routes to nurture and
  says why. Suppression is always reversible and always logged. One decision row
  per signup keyed on `user_pid`, so a re-run cannot double-triage.
- **Replaces** — the "abandoned at step N" placeholder in Filtered, and turns
  `unownedSignups` cards from "somebody signed up" into "somebody signed up and
  here is why they matter".

---

### Agent 3 · `outreach-drafter` — *what to actually say*

Deliberately separate from triage. Deciding who matters and writing to a human
being are different skills with different failure modes, and the drafter must
not see the scoring policy — otherwise it argues the score back at you in the
copy.

- **Trigger** — a decision row with verdict `human_now` or `nurture`, or a rep
  pressing "draft this" on a card.
- **Input** — the account's facts, the reasons from triage, the channel, the
  owner's writing samples (from their sent mail, once Gmail is connected), the
  sequence step, and the rate card **only as a boundary**, never as content.
- **Output**:
  ```json
  {
    "channel": "email" | "whatsapp",
    "subject": "…",
    "body": "…",
    "send": true | false,
    "hold_reason": "mentions a price" | null,
    "confidence": 0.0-1.0
  }
  ```
- **Hard rule from the manifest** — anything with a price in it, or any partner's
  customer, is `send: false` regardless of confidence. Held in `pulse_draft`,
  shown to the owner, released by a person. That release is the `approve` row in
  the audit log.
- **Volume** — roughly one per signup that clears 40, plus nurture steps: call it
  200–400/month at today's numbers.
- **Model** — the strongest tier you are willing to pay for. This is the only
  agent whose output a customer reads.

---

### Agent 4 · `account-review` — *the monthly story of one account*

The core of "monthly data".

- **Trigger** — month-end for every account with an owner or any spend in the
  window (**38 accounts spent last month**, so this is tens of calls, not
  10,083). Also on demand when someone opens an account page.
- **Input** — exactly what `lib/pulse/health.ts` already computes: the four
  components with their evidence, the score, the band, the movement, spend by
  30-day window, routes held, days since last payment, days silent, notes from
  `user_comment`, and the change log.
- **Output**:
  ```json
  {
    "headline": "Growing on SMS, and blind to everything else.",
    "why": "…two sentences, citing the components that moved…",
    "recommended_move": "…one action…",
    "expected_effect": "78 → 88 if a second department starts sending",
    "evidence": [["Usage trend", "up 38% over 60 days"], …],
    "confidence": 0.0-1.0
  }
  ```
- **This fills** the account page verdict (currently a stub sentence from the
  live layer) and gives the board chips a real "which part moved" answer.
- **Model** — mid tier. Structured input, short output.
- **Guardrail** — it receives derived aggregates, never raw customer
  conversations, and never a currency conversion (§7.2 — never sum across
  currencies).

---

### Agent 5 · `portfolio-digest` — *the month, one level up*

- **Trigger** — first of the month, once per scope (me / team / company). Three
  calls a month.
- **Input** — the board roll-up: band counts and movement, who climbed and
  slipped, protected and at-risk revenue **per currency**, unowned count and
  what it is worth, top risers and fallers, last month's digest for continuity.
- **Output**:
  ```json
  {
    "narrative": "…what happened this month…",
    "plays": [{ "worth": "₹22L", "what": "…", "why": "…", "cta": "Claim three" }],
    "watch": ["…"],
    "confidence": 0.0-1.0
  }
  ```
- **This fills** "Where to grow" (currently the prototype's ₹22L / Trellis / Vega
  rows) and the month-end review a manager actually reads.
- **Cost** — three calls a month. Use the best model available.
- **Guardrail** — aggregates only. No per-customer detail crosses into this
  agent, which keeps the month-end summary free of anything confidential.

---

### Later — Agent 6 · `inbound-responder`

Answers standard inbound questions from the owner's mailbox — "what is your rate
for 100k SMS", "how do I get a sender ID" — with the rate card as a boundary and
a hard escalation path when the answer would fall outside it. Needs Gmail
connected and the drafter proven first. The manifest already permits it: *answer
standard rate questions from the owner's mailbox, inside the rate card.*

### Later — Agent 7 · `policy-critic`

Reads a sample of last week's `pulse_decision` rows against `pulse_policy` and
flags drift: a price that went out, a suppression at 0.5 confidence, a rule that
fires constantly and is never overridden (promote it), a rule that is overridden
every time (retire it). This produces the `learned` tag and the rule proposals
already drawn in the Rules tab. It is the agent that makes Autopilot improve
rather than merely run — build it once there are decisions worth criticising.

---

## 4. The two flows, end to end

### New signup — minutes

```
ms_user gets a row
   │  runner polls every 5 min from a watermark
   ▼
SQL assembles the facts        domain history, spend on the domain, entity,
   │                          motion, step, owner, industry
   ▼
Agent 2 · signup-triage       → score, verdict, reasons, confidence
   │
   ├─ write pulse_decision (always — this is the log row)
   │
   ├─ ≥80  → pulse_signal → a card, reasons as evidence, SLA clock
   │           └─ Agent 3 drafts the first touch, held or sent per policy
   ├─ 40-79 → nurture sequence, Agent 3 writes step one, timer set
   └─ <40   → suppressed → Filtered tab, with reasons, reversible
```

Every branch writes a decision row. That is what makes the Live tab real: it
stops being a feed of sample text and becomes `SELECT * FROM pulse_decision
ORDER BY at DESC` with the evidence, the policy version and the confidence
already attached.

### Monthly data — month-end

```
1st of the month, 02:00
   │
   ├─ SQL: health for every account with an owner or spend  (bounded, batched)
   │        └─ Agent 4 · account-review, one call per account (~tens)
   │              └─ pulse_decision + the account's verdict for the month
   │
   └─ SQL: the board roll-up per scope
            └─ Agent 5 · portfolio-digest, 3 calls
                  └─ "Where to grow", the month's narrative, the plays
```

Then a fourth thing, weekly rather than monthly, once Agent 7 exists: the policy
critic reads the month's decisions and proposes rule changes.

---

## 5. Orchestration

- **A runner, not a request.** `app/api/pulse/autopilot/tick/route.ts`, protected
  by a shared secret, doing one bounded pass: read watermark → assemble facts →
  call agents → write decisions → advance watermark. Driven by cron (Vercel Cron,
  a systemd timer, or MSG91's own scheduler). Never triggered by a page load.
- **Idempotency.** Every signal has a stable key (`signup:302621`,
  `month:2026-09:account:302621`). A decision row keyed on it means a re-run,
  a retry or two runners racing cannot double-act.
- **Watermarks, not full scans.** Poll `WHERE user_date > :watermark`. The tick
  must cost the same in month twelve as in week one.
- **A kill switch that works.** "Pause all automatic sending" already exists in
  ⌘K and does nothing. Make it a `pulse_policy` row the runner reads first, and
  have the drafter refuse to release while it is set.
- **Failure is a held decision, not a silent skip.** A GTWY timeout writes a row
  with `held: true, reason: "gateway timeout"`. The gateway client already
  distinguishes `TIMEOUT`, `AUTH`, `RATE_LIMIT` and `ASYNC_AGENT`
  (`lib/pulse/gtwy.ts`) — log which one and move on.
- **One GTWY agent per job, not per model.** Which model answers is configured on
  the agent, so switching a model is a platform change, not a deploy.

---

## 6. What it costs

At the volumes measured on this database (121 signups/month, 38 accounts with
spend, 10,083 accounts total):

| Agent | Calls / month | Model tier |
|---|---|---|
| 2 · signup-triage | ~120 (batched on spikes) | cheap |
| 3 · outreach-drafter | 200–400 | best |
| 4 · account-review | ~40–200, depending on how wide "active" is drawn | mid |
| 5 · portfolio-digest | 3 | best |
| 7 · policy-critic (later) | 4 | mid |

Under a thousand calls a month. The cost of Autopilot is engineering and
evaluation, not tokens — which is worth knowing before anyone optimises a prompt
for price.

---

## 7. Phasing

| Phase | Ships | Result on screen |
|---|---|---|
| **0** | write store: the six tables, a second write connection, `pulse_policy` seeded from `MANIFEST` | nothing visible — everything below depends on it |
| **1** | runner + Agent 2 | Live tab becomes real. Filtered tab gets reasons instead of "abandoned at step 3". Cards carry why the signup matters |
| **2** | Agent 3 + `pulse_draft` + release flow | drafts held for a person, the approve/release audit trail, the manifest's price rule enforced in code |
| **3** | Agents 4 and 5 + month-end job | account verdicts and "Where to grow" stop being prototype text; the monthly review is generated |
| **4** | Agents 6 and 7 + `pulse_outcome` | Autopilot answers inbound mail and starts proposing its own rule changes |

Phase 1 is the one that changes what Autopilot *is*. Everything before it is
plumbing and everything after it is range.

---

## 8. How to know it works

Each agent needs a fixed evaluation set before it is trusted with anything a
customer sees:

- **Agent 2** — 100 historical signups, hand-labelled human / nurture / junk.
  Measure agreement, and specifically the two asymmetric errors: a suppressed
  signup that later paid (expensive, watch it closely) versus a junk signup that
  reached a human (cheap, tolerate it).
- **Agent 3** — every draft is reviewed by a person in phase 2 by design. The
  metric is the edit rate: how often a rep changed the text before releasing it,
  and whether that falls over a month.
- **Agent 4 and 5** — no ground truth exists, so the check is falsification: does
  every sentence cite a component that actually moved? A reviewer marking claims
  as supported or unsupported catches confident narration of noise.
- **All of them** — `pulse_outcome` closes the loop. A decision with no recorded
  outcome after 30 days is a decision nobody can defend, and that number should
  be visible in the Rules tab.

The number to keep in front of everyone: **what fraction of signals were
resolved without a person, and what fraction of those a person later
overrode.** The first is the value. The second is the cost of the first.
