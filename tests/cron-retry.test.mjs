/**
 * What the cron-job.org client does when the call does NOT work.
 *
 * The retry in lib/pulse/cronjob.ts exists for one failure in particular:
 * cron-job.org rate-limits an account that registers jobs quickly, and Pulse
 * registers one job per scheduled rule, so building rules back to back turns
 * a perfectly good rule into a failed build for a reason that has nothing to
 * do with the rule. Retrying the 429 is what keeps that rule.
 *
 * But a retry is only worth having if it is spent on the failures that a wait
 * actually fixes. Their limit is per-minute: every attempt spent on a 400 or a
 * 401 — which will say exactly the same thing in ninety seconds — is an
 * attempt not available to the 429 that the retry was built for, and four
 * wasted requests inside the window are themselves part of what trips the
 * limit. So the cases below that assert "exactly one fetch" are load-bearing:
 * they pin the budget, not just the error message.
 *
 * The happy paths are not covered here on purpose; this file is the error
 * half. cron-interval.test.mjs covers cronIntervalMinutes.
 *
 * SPEED: the real ladder is 4s + 8s + 16s + 32s — a full minute per exhausted
 * call, and this file exhausts it half a dozen times over. So
 * globalThis.setTimeout is swapped for one that records the requested delay
 * and then fires on a real 0ms timer. Nothing about the module's ordering
 * changes, the waits are asserted rather than served, and the suite finishes
 * in well under a second. The stub (and fetch, and console.warn) is restored
 * after every case, so a case can never leak into the next one.
 */

process.env.CRONJOB_API_KEY = "test-key-not-a-real-one";

const { deleteCronJob, CronJobError } = await import("../lib/pulse/cronjob.ts");

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) pass++;
  else { fail++; console.log(`FAIL  ${msg}`); }
};
const eq = (got, want, msg) => ok(got === want, `${msg} — expected ${want}, got ${got}`);

/* The constants the module is built around. Not exported, so they are pinned
   here: if RETRY_ATTEMPTS or RETRY_BASE_MS change, these cases say so.

   They did change. The ladder used to be 1.5s doubling over four attempts —
   10.5s of waiting against a per-minute rate limit, which could not outlast
   the window the retry exists for. That was not theoretical: in a live batch a
   429 on PUT /jobs was still a 429 when the ladder ran out. 4s doubling over
   five attempts is 4 + 8 + 16 + 32 = 60s, which does outlast it. The waits
   asserted below are that ladder. */
const RETRY_ATTEMPTS = 5;
const RETRY_BASE_MS = 4_000;

/* ── scripted responses ───────────────────────────────────────────────────── */

/** One scripted reply. `body` as a string is sent verbatim — that is how the
    non-JSON case is built. */
const reply = (status, body = { error: "no" }, headers = {}) => () =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers });

/** The connection never opened — fetch itself rejects, no status to reason about. */
const refused = () => () => { throw new Error("connect ECONNREFUSED 127.0.0.1:443"); };

const repeat = (n, thunk) => Array.from({ length: n }, () => thunk);

/**
 * Run `fn` with fetch replaced by the scripted replies and the backoff timer
 * collapsed to nothing. Returns { calls, waits, error } — `calls` is how many
 * requests the module actually made, `waits` the delays it asked to sleep for.
 */
async function underScript(script, fn) {
  const realFetch = globalThis.fetch;
  const realSetTimeout = globalThis.setTimeout;
  const realWarn = console.warn;
  const state = { calls: 0, waits: [], error: null, overflow: false };

  globalThis.fetch = async () => {
    const thunk = script[state.calls];
    state.calls++;
    if (!thunk) { state.overflow = true; throw new Error("scripted fetch exhausted"); }
    return thunk();
  };
  /* Record the delay, then fire immediately. The module's `sleep` resolves
     setTimeout off globalThis at call time, so this is the timer it uses. */
  globalThis.setTimeout = (cb, ms, ...rest) => {
    state.waits.push(ms);
    return realSetTimeout(cb, 0, ...rest);
  };
  console.warn = () => {}; /* the retry warning is expected; keep the output readable */

  try {
    await fn();
  } catch (err) {
    state.error = err;
  } finally {
    globalThis.fetch = realFetch;
    globalThis.setTimeout = realSetTimeout;
    console.warn = realWarn;
  }
  if (state.overflow) {
    fail++;
    console.log("FAIL  the module made more requests than the case scripted");
  }
  return state;
}

/* ── 0. the API key is missing — fail before spending anything ────────────── */
/* This is the cheapest failure there is and it used to be the most expensive.
   apiKey() throws when CRONJOB_API_KEY is unset, and that throw was raised
   *inside* the try that wraps fetch — so the connection-failure handler caught
   it, relabelled it "cron-job.org unreachable", and then slept the entire
   ladder. Nobody was ever going to answer, because nothing was ever sent: zero
   requests, a full minute of waiting, and a person told to go look at somebody
   else's network for a line missing from their own .env.local.

   Both halves of that are asserted here, because either one alone would have
   let the bug back in. The budget: no fetch, no wait. And the message: it has
   to name the environment variable, and must NOT say "unreachable", since that
   single word is what sent the reader to the wrong problem. */
{
  const realKey = process.env.CRONJOB_API_KEY;
  process.env.CRONJOB_API_KEY = "";
  const r = await underScript([], () => deleteCronJob("7"));
  process.env.CRONJOB_API_KEY = realKey;

  ok(r.error instanceof CronJobError, `a missing API key must throw CronJobError, got ${r.error}`);
  eq(r.calls, 0, "a missing API key must not send a single request");
  eq(r.waits.length, 0, "a missing API key must not sleep — no wait can supply a key");
  ok(
    String(r.error?.message).includes("CRONJOB_API_KEY"),
    `the message must name the env var, got: ${r.error?.message}`,
  );
  ok(
    !String(r.error?.message).includes("unreachable"),
    `a config error must not be reported as a network failure, got: ${r.error?.message}`,
  );
}
/* Whitespace counts as missing — a key that is one stray newline from a .env
   file copy-paste would otherwise be sent as a Bearer token and come back a
   401, which reads like a wrong key rather than an empty one. */
{
  const realKey = process.env.CRONJOB_API_KEY;
  process.env.CRONJOB_API_KEY = "   ";
  const r = await underScript([], () => deleteCronJob("7"));
  process.env.CRONJOB_API_KEY = realKey;

  ok(r.error instanceof CronJobError, `a whitespace-only API key must throw, got ${r.error}`);
  eq(r.calls, 0, "a whitespace-only API key must not send a request");
}

/* ── 1. a 429 that clears — the whole reason the retry exists ─────────────── */
/* Two rate-limited attempts, then the account is under the limit again. The
   caller must never learn any of that happened: the delete simply succeeds. */
{
  const r = await underScript(
    [reply(429), reply(429), reply(200, { jobId: 7 })],
    () => deleteCronJob("7"),
  );
  ok(r.error === null, `a 429 that later clears must not surface — threw ${r.error}`);
  ok(r.calls > 1, `a 429 must be retried — fetch was called ${r.calls} time(s)`);
  eq(r.calls, 3, "the call should stop as soon as one attempt succeeds");
}

/* ── 2. a 429 on every attempt — give up, but only after the full budget ──── */
/* The rate limit outlasting four attempts is a real failure and must be
   reported as one. What matters is that it is reported *after* the budget was
   actually spent: a client that gives up early has not really retried. */
{
  const r = await underScript(repeat(RETRY_ATTEMPTS, reply(429)), () => deleteCronJob("7"));
  ok(r.error instanceof CronJobError, `an unrecoverable 429 must throw CronJobError, got ${r.error}`);
  eq(r.error?.status, 429, "the thrown error must carry the status it gave up on");
  eq(r.calls, RETRY_ATTEMPTS, "a persistent 429 must use exactly RETRY_ATTEMPTS attempts");
  /* The exponential ladder, with no Retry-After to override it. The total is
     the point, not the individual rungs: it has to be longer than the
     per-minute window, or the last attempt lands inside the same window that
     rejected the first and the whole retry was theatre. */
  eq(r.waits.length, RETRY_ATTEMPTS - 1, "one wait between each pair of attempts, none after the last");
  eq(r.waits[0], RETRY_BASE_MS, "first backoff is the base");
  eq(r.waits[1], RETRY_BASE_MS * 2, "second backoff doubles");
  eq(r.waits[2], RETRY_BASE_MS * 4, "third backoff doubles again");
  eq(r.waits[3], RETRY_BASE_MS * 8, "fourth backoff doubles again");
  const total = r.waits.reduce((a, b) => a + b, 0);
  ok(total >= 60_000, `the ladder must outlast a per-minute rate-limit window — it waits ${total}ms`);
}

/* ── 3. a 400 is never retried ────────────────────────────────────────────── */
/* THE important one. A 400 is us sending something malformed; it will be just
   as malformed on the fourth try. Retrying it spends four requests of a
   per-minute budget that the 429 retry above depends on having — so the cost
   of getting this wrong is not a slow error, it is the rate limit tripping for
   the next rule somebody builds. Exactly one fetch. */
{
  const r = await underScript(repeat(RETRY_ATTEMPTS, reply(400, { error: "bad schedule" })), () =>
    deleteCronJob("7"));
  ok(r.error instanceof CronJobError, `a 400 must throw CronJobError, got ${r.error}`);
  eq(r.error?.status, 400, "the thrown error must carry status 400");
  eq(r.calls, 1, "a 400 must cost exactly one request — retrying it burns the 429's budget");
  eq(r.waits.length, 0, "a 400 must not make the caller wait at all");
}

/* ── 4. a 401 is never retried ────────────────────────────────────────────── */
/* Same budget argument, different cause: a bad or missing CRONJOB_API_KEY. No
   amount of waiting grows a valid key, and the person needs to be told which
   of the two it is — a 401 retried four times reads, from the outside, exactly
   like the rate limit it isn't. */
{
  const r = await underScript(repeat(RETRY_ATTEMPTS, reply(401, { error: "unauthorized" })), () =>
    deleteCronJob("7"));
  ok(r.error instanceof CronJobError, `a 401 must throw CronJobError, got ${r.error}`);
  eq(r.error?.status, 401, "the thrown error must carry status 401");
  eq(r.calls, 1, "a bad API key must cost exactly one request");
}

/* ── 5. a 5xx is retried ──────────────────────────────────────────────────── */
/* Their side, not ours, and usually over in seconds — the one other shape
   where waiting genuinely changes the answer. */
{
  const r = await underScript([reply(500), reply(200, {})], () => deleteCronJob("7"));
  ok(r.error === null, `a 500 that clears must not surface — threw ${r.error}`);
  eq(r.calls, 2, "a 500 must be retried and then succeed");
}
{
  const r = await underScript(repeat(RETRY_ATTEMPTS, reply(503)), () => deleteCronJob("7"));
  ok(r.error instanceof CronJobError, `a persistent 503 must throw CronJobError, got ${r.error}`);
  eq(r.error?.status, 503, "the thrown error must carry status 503");
  eq(r.calls, RETRY_ATTEMPTS, "a persistent 5xx must use the full budget");
}

/* ── 6. the connection never opened ───────────────────────────────────────── */
/* fetch rejects outright: DNS, a refused connection, the machine briefly
   offline. There is no status to reason about, but in practice it means what a
   503 means, so it gets the same budget — and when it never comes back it must
   still fail as a CronJobError, not as a raw TypeError the callers do not
   expect. */
{
  const r = await underScript(repeat(RETRY_ATTEMPTS, refused()), () => deleteCronJob("7"));
  ok(r.error instanceof CronJobError, `an unreachable host must throw CronJobError, got ${r.error}`);
  eq(r.error?.status, null, "a connection failure has no status to report");
  ok(
    String(r.error?.message).includes("unreachable"),
    `the message must say the host was unreachable, got: ${r.error?.message}`,
  );
  eq(r.calls, RETRY_ATTEMPTS, "a connection failure must be retried like a 5xx");
  eq(r.waits.length, RETRY_ATTEMPTS - 1, "the connection path must back off on the same ladder");
  eq(r.waits[0], RETRY_BASE_MS, "the connection path must use the same base backoff");
}

/* ── 7. Retry-After is honoured, and capped ───────────────────────────────── */
/* When they tell us how long to wait, guessing is worse than listening — a
   backoff shorter than their window just spends an attempt to be told no
   again. */
{
  const r = await underScript(
    [reply(429, { error: "slow down" }, { "retry-after": "5" }), reply(200, {})],
    () => deleteCronJob("7"),
  );
  ok(r.error === null, `the retry after a Retry-After must succeed — threw ${r.error}`);
  eq(r.waits[0], 5_000, "Retry-After: 5 must be waited out, not replaced by the base backoff");
}
/* And capped, because a build request cannot sit for the ten minutes a header
   is free to ask for. Past the cap it is better to fail and let the person
   retry the build than to hold the request open. */
{
  const r = await underScript(repeat(RETRY_ATTEMPTS, reply(429, { error: "slow down" }, { "retry-after": "600" })),
    () => deleteCronJob("7"));
  ok(r.error instanceof CronJobError, "a capped-wait 429 that never clears still throws");
  eq(r.waits[0], 30_000, "Retry-After: 600 must be capped at 30s");
  ok(r.waits.every((w) => w <= 30_000), `no wait may exceed the 30s cap — saw ${r.waits.join(", ")}`);
}
/* A Retry-After we cannot read must not become a zero-length wait: an HTTP-date
   is legal in that header, Number() makes NaN of it, and a retry that fires
   instantly is the tight loop the backoff exists to prevent. */
{
  const r = await underScript(
    [reply(429, { error: "slow down" }, { "retry-after": "Wed, 21 Oct 2015 07:28:00 GMT" }), reply(200, {})],
    () => deleteCronJob("7"),
  );
  eq(r.waits[0], RETRY_BASE_MS, "an unreadable Retry-After must fall back to the base backoff");
}

/* ── 8. a body that is not JSON ───────────────────────────────────────────── */
/* A proxy or a maintenance page in front of their API answers with HTML. The
   status decides whether to wait; the body only decides the message. That
   split matters because an HTML 502 is not a different failure from a JSON
   502 — it is the same transient outage wearing a proxy's error page, and
   treating the unparseable body as its own unretryable thing meant the single
   most retry-worthy shape on the wire got exactly one attempt. So a non-JSON
   502 now walks the full ladder like any other 502. */
{
  const r = await underScript(
    repeat(RETRY_ATTEMPTS, reply(502, "<html><body>502 Bad Gateway</body></html>")),
    () => deleteCronJob("7"),
  );
  ok(r.error instanceof CronJobError, `a non-JSON body must throw CronJobError, got ${r.error}`);
  eq(r.error?.status, 502, "the status must survive onto the error even when the body does not parse");
  ok(
    String(r.error?.message).includes("non-JSON"),
    `the message must name the problem, got: ${r.error?.message}`,
  );
  eq(r.calls, RETRY_ATTEMPTS, "a non-JSON body on a retryable status must use the full budget");
  eq(r.waits.length, RETRY_ATTEMPTS - 1, "and must back off between attempts like any other retry");
  eq(r.waits[0], RETRY_BASE_MS, "on the same base backoff");
}
/* And the transient case really does clear: an HTML maintenance page followed
   by a real answer must come back as a success, not as the parse error that
   the first attempt saw. */
{
  const r = await underScript(
    [reply(503, "<html>maintenance</html>"), reply(200, {})],
    () => deleteCronJob("7"),
  );
  ok(r.error === null, `a non-JSON 503 that clears must not surface — threw ${r.error}`);
  eq(r.calls, 2, "the second attempt's good body is the one that counts");
}
/* The companion, and the half that keeps the budget honest: an unparseable
   body on a status no wait can fix is still thrown on the spot. Otherwise the
   fix above would have handed 400s a retry through the back door — the exact
   budget leak cases 3 and 4 exist to prevent, just arriving via the parser
   instead of the status check. */
{
  const r = await underScript(
    repeat(RETRY_ATTEMPTS, reply(400, "<html><body>Bad Request</body></html>")),
    () => deleteCronJob("7"),
  );
  ok(r.error instanceof CronJobError, `a non-JSON 400 must throw CronJobError, got ${r.error}`);
  eq(r.error?.status, 400, "the status must survive onto the error");
  ok(
    String(r.error?.message).includes("non-JSON"),
    `the message must name the problem, got: ${r.error?.message}`,
  );
  eq(r.calls, 1, "a non-JSON body on a non-retryable status must still cost exactly one request");
  eq(r.waits.length, 0, "and must not make the caller wait");
}
/* Same shape on a 200: a success whose body is garbage is still a failure, and
   must not be handed to createCronJob as if it were a job record. */
{
  const r = await underScript([reply(200, "not json at all")], () => deleteCronJob("7"));
  ok(r.error instanceof CronJobError, `a 200 with a non-JSON body must still throw, got ${r.error}`);
  eq(r.error?.status, 200, "the error carries the status it actually received");
}

/* ── the shape of a failure, from the caller's side ──────────────────────── */
/* Everything the callers catch is a CronJobError with a readable message —
   build.ts puts that message in front of the person whose rule did not
   register, so an empty or [object Object] message is a real failure. */
{
  const r = await underScript(repeat(RETRY_ATTEMPTS, reply(429)), () => deleteCronJob("7"));
  eq(r.error?.name, "CronJobError", "the error must identify itself by name");
  ok(typeof r.error?.message === "string" && r.error.message.length > 20,
    `the message must be readable, got: ${r.error?.message}`);
  ok(r.error?.message.includes("DELETE /jobs/7"),
    `the message must name the call that failed, got: ${r.error?.message}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
