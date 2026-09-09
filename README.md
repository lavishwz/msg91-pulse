# MSG91 Pulse — Next.js

A Next.js (App Router) port of `pulse-prototype.html`, built for exact visual and
functional parity with the prototype rather than as a rewrite.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Signing in

Pulse is invite-only. Identity comes from MSG91's Proxy — the widget on
`/login` — and the `pulse_member` table decides who is allowed through it.
Every route is behind that: an unauthenticated page redirects to `/login`, an
unauthenticated API call gets a 401.

Two variables are needed in `.env.local`:

```
NEXT_PUBLIC_REFERENCEID=1258584i17889575326aa1535c30048
JWT_SECRET=<openssl rand -base64 48>
```

`lavishgehlod@gmail.com` is seeded as the founding super admin, so the list is
never empty and nobody uninvited can sign in — not even on a fresh database.
Invite people from **Members** in the account menu and pick their type there:

- **Member** — uses Pulse.
- **Admin** — plus invites and removes members.
- **Super admin** — plus invites admins and changes anybody's type.

The founding super admin cannot be removed or demoted, and the last super admin
cannot step down, so there is always somebody who can let people back in. See
[docs/auth.md](docs/auth.md) for where each check runs and why.

## How parity is preserved

The prototype is a single-file app: ~675 lines of CSS and ~1,490 lines of vanilla
JS that renders every surface by writing HTML strings into `#main`. Re-expressing
that as React components would have changed markup, class order, whitespace and
line-box metrics — so instead each part is carried over verbatim and given a
proper home in the project:

| Prototype | Here | Change |
| --- | --- | --- |
| `<style>` block | `app/globals.css` | none — extracted byte for byte |
| `<script>` block | `public/pulse.js` | none — extracted byte for byte |
| static body markup | `app/page.tsx` | same elements, attributes and order, written as JSX |
| `<title>` + font links | `app/layout.tsx` | same Google Fonts stylesheet, same title |
| — | `app/quirks-compat.css` | added; see below |

`pulse.js` is loaded with `next/script` at `afterInteractive`, so it runs against
the server-rendered markup exactly as it ran against the prototype's. It owns all
DOM inside `#main` and the overlay roots; React never re-renders those, so the two
never fight. The app is otherwise untouched: same state machine, same delegated
event handlers, same `⌘K` palette, tooltips, countdown clocks and overlays.

### The quirks-mode compatibility layer

The prototype shipped without a `<!DOCTYPE html>`, so browsers rendered it in
**quirks mode**. Next.js always emits a doctype (standards mode), which changes two
layout behaviours the prototype's CSS silently depended on:

1. Tables don't inherit `line-height` in quirks mode, so `body{line-height:1.55}`
   never reached the `.tbl` cells.
2. The line-box "strut" is ignored on lines that own no text, so a row was only as
   tall as its real content instead of reserving space for the block's own font.

Without compensation, dense list rows and tables render 1–5px taller than the
prototype. `app/quirks-compat.css` restores the original metrics for the handful of
affected containers, with the derivation of every value documented in the file.
Nothing else in the prototype's CSS needed compatibility rules.

## Live MSG91 data

The prototype's sample objects are replaced with real data from the MSG91 beta
database. The renderer is untouched: `public/pulse-live.js` fetches from
`/api/pulse/*` and reshapes the results into exactly the structures pulse.js
already read (`CARDS`, `BOOK`, `GROWTH`, `STANDINGS`, `ASK`, `AUTO`, `CUST`), so
the layout stays pixel-identical while the content becomes real.

### What is live

| Surface | Source | Notes |
| --- | --- | --- |
| Who you are | `user_handled_by` + `ms_user` (type 1) | biggest book, or pin one with `PULSE_ME_USER_PID` |
| Cards | five scanners, see below | reasons assigned per handover §4 |
| Accounts / logo wall | `ms_user` (type 3) + `user_handled_by` | owner, entity, motion, status sentence |
| Company page | `ms_text_bal`, `ms_user_updation_logs`, `user_comment` | products, activity, notes |
| Commercial (L2) | `ms_trans` | only on the explicit reveal |
| Growth strip | `ms_user`, `ms_trans` | signups, payers, unowned, yours |
| Standings | `user_handled_by` grouped | ranked by accounts owned |
| Ask — 8 questions | one SQL query each | churn, unowned, stuck, signups, payments, flat, partner, entities |
| Autopilot → Audit | `admin_updation_log` (126k rows, live) | plus anomaly detection |
| Autopilot → Filtered | `signup_tracking` | abandoned signups |
| ⌘K search | `ms_user` | two-step: match, then hydrate |

### The scanners

Handover §10's point is that most customer loss is *a thing that stopped
happening*, so these are pull scanners over absence and drift:

1. **unowned signup** — signed up, no row in `user_handled_by` → *Your hands*, with the ten-minute clock
2. **no first value** — signed up ≥3 days ago, empty wallet, never transacted → *Watch closely*
3. **new person at an existing account** — a signup whose email domain already has accounts → *Your hands* (handover feature 22)
4. **unowned but paying** — gateway payments in 90 days and no owner → *Your hands*
5. **verification stalled** — `user_status = 2` for more than two days → *Your knowledge*
6. **wallet run dry** — paid before, empty now, quiet 21–180 days → *Watch closely*

The deck is deduplicated by account before it renders, so one account cannot
produce six cards — §13.4 names card fatigue as the way this product dies.

### Free-text Ask (text-to-SQL, via GTWY)

The eight questions above are hand-written SQL. Typing your own question goes
through AI instead: `POST /api/pulse/nl` sends the schema, the AI returns a
SELECT, and Pulse runs it. Handover §10's "deterministic first, LLM second" —
the curated questions carry the daily load with no AI call; this covers the rest.

**All AI calls go through GTWY**, MSG91's own gateway — no model provider is
called directly, so which model answers and under what system prompt is
configured on the GTWY agent rather than in this repo.

```
POST https://api.gtwy.ai/api/v2/model/chat/completion
headers: pauthkey, Content-Type: application/json
body:    { user, agent_id, thread_id, response_type: "text", variables: {} }
→ { success: true, response: { data: { content, model, … }, usage: { … } } }
```

Set `GTWY_PAUTHKEY` in `.env.local`. `GTWY_AGENT_ID` defaults to the Pulse agent
(`6a9ebec00869a6b2a232c53f`) and `GTWY_BASE_URL` to `https://api.gtwy.ai`.
Without a pauthkey the built-in questions still work and a typed question
returns a 501 saying what is missing.

Two things about the client (`lib/pulse/gtwy.ts`) worth knowing:

- **The whole briefing travels in `user`.** The Pulse agent's prompt lives on the
  GTWY platform and declares no variables, so there is nowhere else to put the
  schema — rules, schema and question are one message, ordered so the stable part
  comes first.
- **A fresh `thread_id` per question.** GTWY groups conversations by thread; a
  new one each time means no history is replayed, which keeps the call cheap and
  stops an earlier question from colouring a later answer. Pass a stable id to
  deliberately keep context across follow-ups.
- **`response_type: "text"` means the reply is prose**, so the JSON is extracted
  by brace matching rather than a greedy regex — a `{` inside a SQL string
  literal would otherwise truncate the object. If the agent is configured to
  deliver out of band, the gateway replies `{success, message_id}` with no
  answer; that is reported as a configuration problem rather than an empty
  result.

**What gets sent.** Not all 509 tables at full detail — that would be ~500k
tokens and a bloated prompt makes the AI *less* accurate. Two resolutions
instead:

- **every table** as name + row count + one-line description — 21KB, ~5,700
  tokens (`lib/pulse/schema-notes.ts` holds the descriptions the MSG91 team
  supplied; `information_schema.table_comment` is empty for almost all of them)
- **full columns** for the 12 tables Pulse is built on — ~1,600 tokens

If the AI needs a table it wasn't given columns for, it says so in
`needs_schema_for` and gets one more round with those columns. ~8.5k tokens per
question.

The prompt also carries what the schema cannot say: that `user_type = 3` means
customer, that ownership lives only in `user_handled_by`, that
`trans_type = 1 AND payment_mode = 2` is the gateway-payment definition — and
that `ms_trans` has no usable index, so a correlated subquery against it must
never be written.

**Why AI-written SQL is safe to run here.** Three independent layers:

1. **The database user has `SELECT` only.** A `DROP` would be refused by MySQL
   itself. This is the real boundary.
2. **`lib/pulse/sqlguard.ts`** covers what privilege does not: it strips
   comments, splits on semicolons *outside string literals*, and refuses
   anything that is not exactly one `SELECT` — stacked statements,
   `INTO OUTFILE` (which writes even for a read-only user), `LOAD_FILE`,
   `SLEEP`, `BENCHMARK`, `@@variables`, `mysql.*`, `performance_schema.*`. It
   appends `LIMIT 200` when absent and lowers anything higher.
3. **A 15s `max_execution_time`** on a dedicated connection, so a query that
   would scan `ms_trans` badly gets stopped instead of tying up the pool.

`npm test` runs both suites — 26 guard cases (every injection shape) and 11
GTWY parsing cases.

**The generated SQL is always shown under the answer.** A number nobody can
trace is worse than no number — the same reason §12 blocks payment display until
the transaction mapping is confirmed. If the AI decides the database cannot
answer a question, it says so rather than inventing a query that returns a
plausible wrong figure.

### Running against a local database

The production host is IP-bound, so it is unreachable from most machines. There
is a local substitute that needs no root and installs nothing system-wide:

```bash
npm run db:local        # start MariaDB inside .localdb/ and load the schema
npm run db:local:seed   # fill it with dummy data
```

Then point `.env.local` at it:

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3399
MYSQL_USER=pulse
MYSQL_PASSWORD=pulse
MYSQL_DATABASE=pulse_local
```

`npm run db:local:stop` stops it; `npm run db:local:reset` wipes the data
directory and starts over. Everything lives in `.localdb/`, which is
git-ignored. The server binary is expected at `~/.local/mariadb-*/` — the script
prints the one-line download if it is missing.

**Where the schema comes from.** `Dump20260903.sql` (schema only, 106 tables) is
loaded as-is, plus `scripts/local-db/schema-extra.sql` for `clientManagement`
and `signup_tracking`, which the dump omits but the code queries. Their column
definitions were read from the production `information_schema` before that host
became unreachable — not invented.

Six tables in the agent allowlist are absent from the dump
(`admin_group_login_as`, `cashfreeWebhookLogs`, `cities_master`,
`countries_master`, `country_code_master_list`, `states_master`). Their real
columns were never captured, and inventing columns would be worse than leaving
them out — the agent would learn a shape that does not exist in production. So
locally the agent sees 106 tables and in production 112; `schema.ts` omits
absent tables from the index rather than advertising them.

**The data is invented, the shapes are not.** `scripts/local-db/seed.mjs`
reproduces every rule the app and the agent depend on: `user_type` 1/2/3,
`user_pid = 2` as MSG91's own root reseller, ownership living only in
`user_handled_by`, and `ms_trans` carrying gateway payments (`payment_mode 2`)
separately from admin moves (`payment_mode 1`). A local database that disagreed
with production would teach wrong lessons.

It also plants the situations each scanner looks for, so the UI has something to
show: unowned recent signups, accounts that never sent anything, stalled
verifications, wallets that ran dry after paying, a paying account with no
owner, and a second person signing up on a domain MSG91 already has. The
generator is seeded deterministically, so two people running it get the same
database and a reported bug is reproducible.

Verified locally: 605 customers, 130 unowned, 9,012 transactions, 3,074 of them
gateway payments; 20 cards from the scanners, all eight Ask answers returning
rows, and a 3ms query latency against ~400ms for the remote host.

### Query discipline

`ms_trans` (~1M rows) and `ms_user` have **a primary key and no other index**,
so every predicate against them is a full scan. Two rules follow, and both are
load-bearing:

- **Everything is paged.** `lib/pulse/paginate.ts` clamps every request to at
  most 50 rows and fetches `LIMIT n+1` to detect the next page without a second
  `COUNT(*)`.
- **At most one pass over `ms_trans` per request, never correlated.** Candidates
  are found in `ms_user` (cheap), then a single aggregate answers the question
  for all of them. The first-value scanner took **37 seconds** as a correlated
  `NOT EXISTS` and **0.09s** as two passes; the same fix took an Ask answer from
  50s to 0.02s, and hydrating a page of accounts by id instead of joining across
  all of them took bootstrap from **29s to 0.8s**.

`lib/pulse/cache.ts` holds aggregate results for 60 seconds, because the card
deck, the growth strip and an Ask answer all want "who paid recently" within one
page load.

**An index on `ms_trans (trans_tuserid, trans_date)` would remove most of this
constraint** — worth raising with whoever owns the schema.

### What is still the prototype's sample data, and why

Everything below needs state Pulse must own. The database user here has
`SELECT` only (`GRANT SELECT ON test_betatest.*`), so Pulse cannot record
anything — which is exactly what handover §9 anticipates when it says Pulse owns
its own records.

- **Promises, missions, in-flight, done today, room to grow** — Pulse-owned
  entities with no legacy equivalent
- **The score** — weighted to promises kept and accounts recovered
- **AI log** — records decisions Pulse made; it has made none, and inventing
  entries would undermine the one surface whose purpose is trust
- **Rules, manifest, connections** — policy Pulse stores and versions
- **People on an account** — `user_comment` gives notes, not contacts
- **Card dismissals, tags, pins, reassignment** — all writes

`PulseLive.report()` prints the same split to the console on every load, so it
is never a guess which half of the screen is real.

## How parity was verified

Both documents were served side by side and driven through the same 37 interaction
states — all three surfaces, all three scopes, every Autopilot tab, the lens menu,
card evidence, quick actions, the Done / In-flight / Room-to-grow toggles, the
company page and its commercial reveal, the person peek, the profile page, the `⌘K`
palette, the answer panel, the rule editor, onboarding, the log sheet and the
reassign sheet.

At each state, every element under the app's roots was compared on its
full-precision bounding rect (x, y, width, height) plus 23 computed paint
properties (colors, borders, radius, shadow, opacity, visibility, z-index,
transform, overflow, display, position, text alignment). Rendered HTML was compared
separately and matches exactly.

Result: **37/37 states pixel-identical** at 1280×800 against the production build,
and **28/28 identical** below the 760px breakpoint with the responsive rules active.

### The prototype's viewport behaviour is preserved too

The prototype declares no `<meta name="viewport">`, so a phone lays it out at the
default 980px layout viewport and shrinks that to fit the screen — which is why the
prototype's own `@media (max-width:760px)` rules never fire on a real device. Next.js
would otherwise emit `width=device-width, initial-scale=1` and change that, so
`app/layout.tsx` pins the layout viewport to 980 and leaves `initial-scale` unset:

```ts
export const viewport: Viewport = { width: 980, initialScale: undefined };
```

Under phone emulation the app reports the same 981px layout viewport as the
prototype and renders the same geometry state for state. The mobile rules still take
effect at narrow layout viewports (a resized desktop window), exactly as in the
prototype.
