# Verification checklist — session of 2026-09-10/11

Everything below was done in one long session. This is the handoff document so it (or another AI) can be re-verified in production without re-deriving context. Each item lists: what changed, where, and exactly how to check it's actually working.

---

## 0. Environment setup (context for everything else)

- `.env.local` `MYSQL_*` points at a local clone of the real MSG91 data: `127.0.0.1:3399` / `test_betatest` — a real clone (510 tables, ~3.6M rows), not the schema-only dump. The real host (`mysql.test.txtapi.com`) is office-IP-only.
- `.env.local` `PULSE_STORE_*` points at `cloud.layerbase.dev` — Pulse's own writable store, reachable from wherever this app actually runs (was unreachable from the dev sandbox for most of this session, became reachable later — same host, don't change it without reason).
- `PUBLIC_BASE_URL` is a `trycloudflare.com` tunnel URL — **this expires when the tunnel process ends**. Every cron-job.org job below points at this URL. If the tunnel is gone, **re-point every job's URL** at wherever the app is really running, or they fail silently.

**Verify:** `npm run db:check` should connect; `curl https://api.cron-job.org/jobs -H "Authorization: Bearer $CRONJOB_API_KEY"` should list jobs whose URLs still resolve.

---

## 1. Backend bug fixes (all verified: passes `tsc`, passes full test suite — 254/254 at time of writing)

| # | Fix | File | How to re-check |
|---|---|---|---|
| 1 | Retiring an automation now actually stops it running (previously only tore down external cron, `runOne()` never checked `state`/`live`) | `lib/pulse/autopilot/automation-runner.ts` (`runOne`) | Retire a live automation, confirm `runOne()` returns `skipped: "automation is retired..."` |
| 2 | Per-automation webhook now requires the shared secret (was fully public, listed in middleware's `isPublic()`) | `middleware.ts`, `app/api/pulse/autopilot/webhook/[key]/route.ts`, `lib/pulse/autopilot/build.ts` | `curl POST` the webhook with no `?secret=` → should 401. New automations built via the UI get the secret baked into their cron-job.org URL automatically now. |
| 3 | Circuit breaker now applies per-automation (`rule-worker:<key>`), not one shared bucket for every custom rule | `lib/pulse/autopilot/automation-runner.ts`, `lib/pulse/autopilot/breaker.ts` | `SELECT * FROM pulse_policy WHERE policy_key LIKE 'breaker.rule-worker:%'` after enough runs |
| 4 | `sqlguard`'s LIMIT-capping no longer drops the offset on `LIMIT a,b` queries | `lib/pulse/sqlguard.ts` | `tests/sqlguard.test.mjs` — regression test added, run `npm run test:guard` |
| 5 | Statement-timeout hint now applies to `WITH`/CTE queries too, not just bare `SELECT` | `lib/pulse/autopilot/automation-runner.ts` (`withStatementTimeout`) | Code-reviewed; low real-world exposure since the target DB doesn't support CTEs |
| 6 | Closed a keyword-check bypass (statement ending in a bare forbidden keyword, no trailing space) | `lib/pulse/sqlguard.ts` | Code-reviewed |
| 7 | "AI log" now marks rule-only decisions as `isAI: false` instead of implying every row was LLM-judged | `lib/pulse/autopilot/log.ts` | `SELECT agent FROM pulse_decision WHERE agent='rules'` — those rows should map to `isAI:false` when read through `decisions()` |

---

## 2. Frontend: dead buttons fixed (`public/pulse.js`)

All 13 from the original audit — either wired to something real, or honestly disabled/removed (no more silent no-ops):
- `answerActDest`, `oppAsk` — were undefined, threw `ReferenceError`, now defined
- "Revert" (Approvals sheet) — was fake-success, now honestly disabled with a tooltip (no real revert endpoint exists)
- "Share" (Ask) — now really copies a link to clipboard
- "＋ Add an account I own" (onboarding) — now really adds to the local list
- "Reassign N/Create missions", "Send this month's digest", "Upload a CSV instead", 6 Admin submenu rows — no backend exists for any of these; all honestly disabled/marked "SOON" rather than silently doing nothing
- "Open the thread", "Change something" — removed (nothing real to back them)

**Verify:** `node --check public/pulse.js` (should already pass); click through Ask answers and Admin submenu once logged in.

---

## 3. Frontend: fake/dummy data cleanup (`public/pulse.js`, `public/pulse-live.js`)

- **3 "empty API response left fake data on screen" bugs fixed**: `CARDS`, `BOOK`, `STANDINGS` now correctly clear to empty when the real API returns nothing, instead of leaving the sample fallback showing forever.
- **Every fabricated real-sounding name replaced** with obviously-synthetic placeholders (`Sample Co N`, `Sample Rep N`, `Sample Partner N`, `Sample Contact`) — found and fixed two stragglers myself after the first pass (`ROOM`'s all-caps tag line, and a leftover "Rohan Desai" person name).
- **`ONB`/`ROOM_NEW` onboarding copy** — no longer fabricated; numbers now come from real bootstrap/card data, or were reworded to drop fake specificity where no real number exists.
- **Visible sample-data banner added** (`#mockbar` in `app/pulse-shell.tsx`) — shows only when something on screen actually fell back to sample data; previously this only ever reached the console.
- **Still permanently fake, deliberately not wired** (would need new backend features, not just wiring): `PINNED`, `APPROVALS`, `BULK`, `PARTNERS` (the dedicated partner page, distinct from the Ask answer below), `POINTS`, the 18-company board-fallback cluster (`HEALTH`/`BANDS`/`CARDMOVE`/`HMOVERS`/`HKEPT`/`STATEOF`/`LASTTOUCH`/`VIEWS`/`LENS_BOOK`), `TAGS`/`OPEN`, `ROOM` (fallback tier only), `filteredSample`/`ailogSample`, and most `ASK` ids beyond the 11 now real (see §5). These show consistent honest placeholders, never real-sounding fake names, and the banner flags it when they're what's on screen.

**Verify:** grep `public/pulse.js` for `Kanchan|Trellis|Falcon Pay|Bluebird|Rohan Desai` (case-insensitive) — should be zero hits.

---

## 4. UI/UX punch list (`public/pulse.js`, `app/globals.css`)

Done: contrast fix (`--faint`/`--muted` now WCAG AA), Done-vs-Snooze visually distinct, `.scoreband`/`.manifest` collapse on mobile, zero-state vs still-loading distinguished, "Wrong" feedback gets a confirmation toast, dead-end search palette now offers "Ask Pulse: '...'", rule/draft saves get a success toast, `aria-expanded` on disclosure buttons, ~11 highest-traffic rows keyboard-accessible, country lens collapses instead of listing all ~65.

Not done: nothing further requested; account-menu grouping was reviewed and judged already adequate.

---

## 5. New: `/members` page (was a popup sheet)

- `app/members/page.tsx` + `app/members/members-client.tsx` — real route, same `/api/pulse/members` endpoints, same server-side rules (`abilities`/`denyInvite`/`denyRemove`/`denySetRole` unchanged and still enforced).
- Old sheet code removed from `public/pulse-auth.js`; header link (`app/pulse-shell.tsx`) now points at `/members`.
- A parallel/later pass (not mine) added a `Loader` component (`app/loader.tsx`) and a proper header/nav to this page — reviewed, consistent, left in place.

**Verify:** sign in, open the account menu → "Members" should navigate to `/members`, not open an overlay.

---

## 6. New: 3 real `Ask` answers, plus 1 new card-deck scanner

All in `lib/pulse/ask.ts` — added to `ANSWERS` and `ASK_CATALOGUE`, so the frontend picks them up automatically (no `pulse.js` changes needed):

| id | Question | Verified against real data |
|---|---|---|
| `uae` | "UAE entity, this quarter" | 40 real AED accounts found |
| `cold` | "Which accounts have not been touched in 60 days?" | 50+ real matches (via `admin_updation_log`) |
| `partners` | "Revenue by partner this month" | Query runs correctly; currently 0 rows (no partner-sourced gateway payment in the last 30 days in this dataset — an honest empty answer, not a bug) |

New card scanner in `lib/pulse/cards.ts` (`repeatedPaymentFailure`) — reads `micro_sub_payment_failed_logs` (previously completely unused), surfaces a failed auto-recharge as an earlier churn signal than the existing "wallet ran dry" check. Uses the existing `Watch closely` reason category (did not add a 7th reason — the codebase's design deliberately caps at 6).

**Verify:** `SELECT id FROM pulse_automation` is unrelated; for Ask, hit `/api/pulse/ask?q=uae` (or `cold`/`partners`) while signed in and confirm a real `Answer` object comes back, not `available:false`.

---

## 7. New automation: monthly signup digest

- **`migrations/018_monthly_signup_digest.sql`** — creates `auto.monthly.signup_digest`. Portfolio-level (no single account), counts last month's signups by entity (India/UAE/US/UK/Singapore) + unowned count.
- **`migrations/019_signup_digest_real_judgment.sql`** — rewrote its `agent_task` so the AI genuinely decides whether to alert (originally shipped as "always alert," which isn't real judgment — fixed same day after noticing).
- **Both migrations are applied to the real Pulse store already** (confirmed via `pulse_migration` table, not just written to disk).
- **Uses the existing shared `rule-worker` GTWY agent** — no new AI agent was created. The row's `find_sql` + `agent_task` are what make it distinct; the agent itself is shared by every custom automation in the app.
- **A dedicated cron-job.org job was created**: id `8428961`, "pulse: monthly signup digest (nightly check)", 3:00 UTC daily, hits only this automation's webhook. Stored back on the row (`cron_job_id = '8428961'`) so retiring the automation through the app will also tear down this cron job.

**Verify:**
```sql
-- On the real Pulse store:
SELECT automation_key, state, live, next_run_at, last_run_at, run_count, cron_job_id
  FROM pulse_automation WHERE automation_key = 'auto.monthly.signup_digest';

SELECT signal_key, verdict, output_json FROM pulse_decision
  WHERE signal_key = 'auto:auto.monthly.signup_digest:portfolio';
```
```bash
# Confirm the cron job is still live and pointed at the right (current) URL:
curl -s "https://api.cron-job.org/jobs/8428961" -H "Authorization: Bearer $CRONJOB_API_KEY"
```
I manually triggered two test runs during this session (see §8) — the automation has **not yet fired on its own schedule**; the first real unattended run will be whenever `next_run_at` (30 days from the last manual trigger) next passes and the 3am cron job hits it.

---

## 8. ⚠️ Test data — needs a decision, not yet cleaned up

**10 fake signup rows were inserted into the real local clone** (`test_betatest`, `127.0.0.1:3399` — NOT the office-only real MSG91 host) to verify the automation actually reads live data:

- `ms_user`: `user_pid` 900001–900010, `user_fname = 'ZZTEST'` for all of them
- `default_destination_country`: rows for 900001–900009 (900010 deliberately has none, to test the "no entity" bucket)
- `user_handled_by`: rows for 900001–900004, 900007, 900009 (the "owned" ones; 900005/900006/900008/900010 deliberately left unowned)

**These are still in the database.** I have not deleted them — cleanup was left as an open question in the conversation.

**To remove them:**
```sql
DELETE FROM user_handled_by WHERE user_id BETWEEN 900001 AND 900010;
DELETE FROM default_destination_country WHERE u_id BETWEEN 900001 AND 900010;
DELETE FROM ms_user WHERE user_pid BETWEEN 900001 AND 900010;
```
**Verify no other test rows exist:** `SELECT user_pid FROM ms_user WHERE user_fname = 'ZZTEST'`.

---

## 9. Known open items — explicitly not done, by choice

- **The general Autopilot tick (`/api/pulse/autopilot/tick`) has no cron job calling it at all** — this affects signup triage and the pre-existing built-in automations (`auto.partner.silence`, `auto.partner.digest`), not just anything I built. Flagged to the user; deliberately not fixed yet pending their decision (bundling it with a nightly-only job would slow down real-time signup triage, which needs ~5-minute polling per the code's own docs).
- **3 broken pre-existing dynamic automations** noticed incidentally during a test tick run — fail with `Table 'test_betatest.accounts' doesn't exist` / `'test_betatest.signups' doesn't exist`. Not something I built or touched; flagged to the user, not yet investigated further.
- **§5's other 8 unused-DB-signal opportunities** (sender-ID rejection rate, login recency, revenue-weighted leaderboard, etc.) — real, but explicitly deferred as net-new features rather than bug fixes.
- The `agent_task` false-positive noticed during verification (AI flagged "the numbers don't add up" because unowned overlaps with entity buckets, which it wasn't told) — user was given the option to fix this wording; **not yet done** unless a later message in this thread says otherwise.

---

## 11. New automation, built and confirmed live in production (added after §7 above was first written)

Everything in §7 above is now **confirmed running for real** in the actual production Pulse store (not just tested against a throwaway copy):

- `pulse_migration` confirms both `018_monthly_signup_digest.sql` and `019_signup_digest_real_judgment.sql` are applied to the real store.
- Triggered two real runs via the automation's own webhook. Both wrote real rows to `pulse_decision`/`pulse_signal`, judged by the real shared `rule-worker` GTWY agent (not a new agent — see §7).
- **A dedicated cron-job.org job exists and is live**: id `8428961`, "pulse: monthly signup digest (nightly check)", 3:00 UTC daily, hits only this automation's webhook (with the shared secret). Stored on the row (`cron_job_id`) so retiring the automation tears the cron job down too.
- **Confirmed showing up correctly in the app UI** (`Autopilot → Activity`): title now reads *"Aug 2026 signups: 122 total; India 103, Unowned 14"* (see §14 below for why it used to read "Scored Account ?").
- **10 test signup rows (`ZZTEST`, ids 900001–900010)** were inserted into the local MSG91 clone specifically to verify the automation reads live data — confirmed every count moved by exactly the expected amount. **These are still in the database, not yet cleaned up** — see §8 above for the exact `DELETE` statements.

**Verify:**
```sql
SELECT run_count, last_run_at, next_run_at, cron_job_id FROM pulse_automation
 WHERE automation_key='auto.monthly.signup_digest';
```
```bash
curl -s "https://api.cron-job.org/jobs/8428961" -H "Authorization: Bearer $CRONJOB_API_KEY"
```

---

## 12. ⚠️ Bigger bug found and fixed: the account-health scoring pass never made progress

Unrelated to the automation above — found while investigating why "N of M accounts are healthy" on the home page looked stale.

**The bug (pre-existing, not something I introduced):** `lib/pulse/healthCron.ts`'s hourly background pass (`runHealthPass`) restarted its account scan from the very beginning every single call — no persisted position. It always landed on the exact same handful of accounts (whichever the default "newest signup first" ordering put first) and could never reach the rest of the customer base. Verified directly: **only 43 of 10,096 customer accounts had ever been scored**, and every one of them was among the ~43 newest signups.

**The fix, in two stages:**
1. **`accountsAfter()`** (new, `lib/pulse/accounts.ts`) — pages accounts by stable `user_pid` ascending instead of an offset into a date-ordered list, so a persisted cursor actually means the same thing across separate calls.
2. **Persisted, wrapping cursor** (`lib/pulse/healthCron.ts`) — stored in `pulse_watermark` (stream `account-health-cursor`), written plainly rather than through the existing forward-only `advanceWatermark()` helper, because this one deliberately needs to wrap back to 0 once it reaches the end and start a new lap.
3. **Scope narrowed to "boardworthy" accounts** (owned, or among the newest 200 signups) rather than the entire 10,096-account customer base — since an unowned, years-old account can never appear on any board, scoring it first was wasted effort. Cuts the relevant universe to ~3,795. (Hit a MariaDB limitation along the way — `LIMIT` is not allowed directly inside an `IN (...)` subquery; fixed by wrapping it in a derived table.)

**Verified with real, live data**, not just review:
- Ran a real pass; watched `pulse_account_health`'s row count and the cursor's position climb continuously (`54 → 72 → 110` in one run, `246 → 1247 → 1614` in a later one after the boardworthy-scoping fix — note the big jump, confirming it now skips irrelevant accounts instead of grinding through them).
- Confirmed **every scored account still shows `decided_by: 'ai'`** (93/93 at last check) — this fix changed *which* accounts get reached, not how they're judged; the real GTWY `account-health` agent was already wired in before this session and remains untouched.
- Owned-account coverage measured directly: 28 → 73 → still climbing as the hourly cron continues.

**Still true:** a full lap over ~3,795 boardworthy accounts takes multiple days at the observed rate (hourly cron, ~20–40 accounts per run). A specific person's board may not visibly change for a while depending on where their owned accounts' ids fall in the sweep — this is expected, not a new bug.

**Verify:**
```sql
SELECT stream, position, last_run_at FROM pulse_watermark WHERE stream='account-health-cursor';
SELECT decided_by, COUNT(*) FROM pulse_account_health GROUP BY decided_by;
SELECT COUNT(*) FROM pulse_account_health; -- should keep growing over successive checks, never shrink or reset
```

---

## 13. New: country lens now scoped by owner for "me"

`countryCounts()` (`lib/pulse/accounts.ts`) previously always counted every customer account company-wide, with no way to narrow it — so the "me" scope's country filter listed every country the *entire company* touches (68 in this dataset), not just the countries the signed-in person's own book is actually in.

- `countryCounts(ownerId?)` — optional param, joins `user_handled_by` and filters to that owner when given.
- `app/api/pulse/bootstrap/route.ts` now also returns `myCountries` (owner-scoped) alongside the existing `countries` (company-wide, unchanged, still used for "team"/"company" scope since those place no ownership restriction — see `board/route.ts`).
- `public/pulse-live.js` captures `state.myCountries`; `public/pulse.js`'s `lensCountries()`/`lensTotal()`/`lensFlag()` all read from a new `lensCountrySource()` helper that picks `myCountries` on "me" scope, `countries` otherwise.

**Verified with a real account** (admin id 87572, ~2,700 owned accounts): scoped query correctly returned only that admin's actual countries; a different test session's `myCountries` came back with 28 entries vs. the company-wide 68 — confirmed narrower, not just re-sorted.

**Verify:** sign in, switch the Now-page scope pill to "me", open the country lens — it should list noticeably fewer countries than "team"/"company" show, and every one of them should be a country you actually have an account in.

---

## 14. Small fix: portfolio-wide automations no longer show "Scored Account ?"

`lib/pulse/autopilot/log.ts`'s title logic was written assuming every decision is about one account (`name` falls back to `Account ${subject_id ?? "?"}`). A portfolio-wide automation like `auto.monthly.signup_digest` has no single account by design (`subject_id` is null on purpose), so every one of its entries read "Scored Account ?" in the Activity tab.

**Fix:** when `subject_id` is null and the worker's own `headline` exists, use that headline as the title directly, instead of forcing the account-shaped title template onto a row that was never about one account.

**Verified live:** the automation's entry now reads *"Aug 2026 signups: 122 total; India 103, Unowned 14"* instead of "Scored Account ?", confirmed via a direct authenticated call to `/api/pulse/autopilot/decisions`.

---

## 16. New: two midnight automations — daily signups + health-band movement

Requested as "run at midnight, calculate last night, show for user/team/company." Two real architecture constraints came up while building this (both confirmed by reading the actual code, not assumed) and shaped the final design — flagged to the user before building:

1. **"Team" is not real** — every scope filter in this app (`board/route.ts`) already treats "team" and "company" as the exact same unrestricted account list. A separate "team" number would just be "company" under a different label, so it was deliberately left out rather than faked.
2. **Automations can't combine both data sources** — `lib/pulse/autopilot/automation-runner.ts`'s `find_sql` only ever queries MSG91's read-only schema (`lib/db.ts`). Health bands live in Pulse's own store (`pulse_account_health`). No single automation row can join the two, so this became two separate mechanisms:

**16a. `auto.nightly.signup_digest`** (`migrations/020_nightly_signup_digest.sql`) — daily counterpart to §7/§11's monthly one. Company-wide only (a signup has no owner until claimed, so there's no "me" for this one either). Real AI judgment, not forced — verified live: with 0 real signups on the test day, the agent correctly returned `should_alert: false, confidence: 0.9` rather than manufacturing a headline for a quiet day.
- Cron job `8429461`, "pulse: nightly signup digest (midnight)", 00:00 UTC daily.

**16b. Health-band-movement digest** (`lib/pulse/autopilot/healthDigest.ts`, new — NOT a `pulse_automation` row, for the reason above) — reports company-wide band movement (from `pulse_account_health`) AND the default rep's own book (`resolveMe()` + `user_handled_by`, joined in application code since the two live in different databases), as two separate numbers, never blended.
- New endpoint: `app/api/pulse/health/nightly-digest-tick/route.ts` (same secret-auth pattern as every other tick route).
- Cron job `8429481`, "pulse: nightly health-band digest (midnight)", 00:05 UTC daily (5 minutes after the signup digest, so they don't fire in the same second).
- **Verified live** with real data: *"Company-wide health bands climbed 9 and slipped 4 overnight. Kadamb Kaluskar company's book climbed 4 with no slips."* — genuine AI judgment (`confidence: 0.75`), company and personal numbers correctly kept separate, and the response honestly notes coverage is partial (ties to §12's health-pass fix — a full lap takes days, so "overnight" reflects whatever the hourly pass reached, not the whole customer base).

Both write to the same `pulse_decision`/`pulse_signal` tables everything else uses, so both show up in Autopilot → Activity like any other automation.

**Verify:**
```sql
SELECT * FROM pulse_decision WHERE signal_key IN
  ('auto:auto.nightly.signup_digest:portfolio', 'auto:health-digest:portfolio')
 ORDER BY at DESC LIMIT 5;
```
```bash
curl -s "https://api.cron-job.org/jobs/8429461" -H "Authorization: Bearer $CRONJOB_API_KEY"
curl -s "https://api.cron-job.org/jobs/8429481" -H "Authorization: Bearer $CRONJOB_API_KEY"
```

---

## 17. Files changed this session (for a full diff)

Mine, this session:
```
app/api/pulse/autopilot/webhook/[key]/route.ts
app/api/pulse/bootstrap/route.ts
app/api/pulse/health/tick/route.ts        (read only, not modified — reviewed)
app/api/pulse/health/nightly-digest-tick/route.ts   (new, §16b)
app/globals.css
app/members/                              (mine + a parallel pass)
app/pulse-shell.tsx
lib/pulse/accounts.ts                     (accountsAfter, countryCounts(ownerId))
lib/pulse/ask.ts
lib/pulse/autopilot/automation-runner.ts
lib/pulse/autopilot/breaker.ts
lib/pulse/autopilot/build.ts
lib/pulse/autopilot/healthDigest.ts       (new, §16b)
lib/pulse/autopilot/log.ts
lib/pulse/cards.ts
lib/pulse/healthCron.ts                   (the health-scoring-progress fix, §12)
lib/pulse/sqlguard.ts
middleware.ts
migrations/018_monthly_signup_digest.sql          (new)
migrations/019_signup_digest_real_judgment.sql    (new)
migrations/020_nightly_signup_digest.sql          (new, §16a)
public/pulse-auth.js
public/pulse-live.js
public/pulse.js
tests/sqlguard.test.mjs
```

Also touched this session by a parallel pass, not mine (reviewed, left in place, consistent):
```
app/api/pulse/accounts/[id]/route.ts
app/api/pulse/autopilot/automations/route.ts
app/loader.tsx                            (new)
app/login/login-form.tsx
app/login/page.tsx
lib/pulse/autopilot/automations.ts
lib/pulse/healthJudge.ts
next.config.ts
```
