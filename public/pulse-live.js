/**
 * Live data binding for Pulse.
 *
 * The prototype's renderer reads a set of plain JS objects at the top of
 * pulse.js (CARDS, BOOK, GROWTH, STANDINGS, ASK, AUTO, CUST …). Rather than
 * rewrite the renderer, this file fetches the real MSG91 data from /api/pulse
 * and reshapes it into exactly those structures, so the rendering path — and
 * therefore the pixel-for-pixel layout — is untouched.
 *
 * Anything the read-only database cannot evidence is left as it was and listed
 * in PulseLive.report(), so it is obvious in the console which surfaces are
 * real and which are still the prototype's sample data.
 */
window.PulseLive = (function () {
  const state = { loaded: false, error: null, real: [], mock: [], me: null, signedInAs: null, ids: {}, cardsLoaded: false, cardsError: null, boardLoaded: false, flightLoaded: false, autopilot: null, autopilotError: null, drafts: [], policy: null, manifest: null, motionRules: null, automations: null, asked: [], digest: null, verdicts: {}, alerts: [], tagError: null, mockDismissed: false, audit: null, auditError: null, auditLoadingMore: false, gmailRecent: null, gmailRecentError: null, gmailRecentLoaded: false, activityDrafted: null, activityDraftedError: null, activitySuppressed: null, activitySuppressedError: null, doneCompany: null, healthFlagged: {}, healthFlagError: null };

  /**
   * Sample-data notice (static markup in app/pulse-shell.tsx, #mockbar).
   *
   * state.mock is the same list report() has always printed to the console —
   * this just also puts it on screen, since a fake number sitting next to real
   * ones is not something a person should need devtools to catch. Called from
   * report(), which already runs at the points where boot's async pieces have
   * settled enough for state.mock to be worth reading.
   */
  function updateMockBanner() {
    const bar = document.getElementById("mockbar");
    const msg = document.getElementById("mockmsg");
    if (!bar || !msg) return;
    if (state.mockDismissed || !state.mock.length) {
      bar.hidden = true;
      return;
    }
    msg.textContent =
      "Sample data, not live: " + state.mock.join("; ") + ". Everything else on screen is real.";
    bar.hidden = false;
  }

  /** How many rows of an answer are on screen at once. Matches lib/pulse/ask.ts. */
  const PAGE_ROWS = 50;

  const get = async (path) => {
    const res = await fetch(path, { headers: { accept: "application/json" } });
    const body = await res.json().catch(() => ({ ok: false, error: "bad JSON" }));
    if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  };

  /** Same contract as `get`, for the writes: throws with the API's own words. */
  const post = async (path, payload) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({ ok: false, error: "bad JSON" }));
    if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  };

  /** Same again for PUT and DELETE, which reassignment needs. */
  const send = async (method, path, payload) => {
    const res = await fetch(path, {
      method: method,
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({ ok: false, error: "bad JSON" }));
    if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  };

  /** BOOK rows are [initials, name, country, motion, statusLine, hot]. */
  const toBookRow = (a) => [
    a.initials,
    a.name,
    a.entity,
    a.motion,
    a.line,
    a.owner ? 0 : 1, // "hot" lights the accounts with something open — here, no owner
  ];

  /** A CARDS entry, as the renderer expects it. */
  const toCard = (c) => ({
    s: c.scope,
    w: c.watch ? 1 : 0,
    r: c.reason,
    cust: c.account ? c.account.name : "—",
    custId: c.account ? c.account.id : null,
    geo: c.geo,
    h: c.headline,
    y: c.why,
    a: c.action,
    solid: c.solid ? 1 : 0,
    rev: c.evidence,
    ...(c.clock ? { clock: c.clock } : {}),
  });

  /** A minimal CUST entry so the company page can open for any live account. */
  const toCustStub = (a) => ({
    id: a.id,
    v: capital(a.line) + ".",
    s: [
      a.industry ? a.industry : null,
      a.domain ? a.domain : null,
      a.motion + " motion" + (a.motionEvidence === "inferred" ? " (inferred)" : ""),
      a.owner ? "Owned by " + a.owner.name : "No owner assigned",
    ]
      .filter(Boolean)
      .join(" · ") + ".",
    owner: a.owner ? a.owner.name : null,
    /* The id as well as the name. The reassign sheet pre-selects whoever holds
       the account, and reading that from the detail payload alone meant the
       sheet opened from a card — where the account has never been opened, so
       the detail has never been fetched — showed nobody picked and offered
       "Take it off everybody →" on an account that had an owner. */
    ownerId: a.owner ? a.owner.id : null,
    pe: [],
    no: [],
    la: [],
    ev: [],
    money: [],
    __stub: true,
  });

  const capital = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  /**
   * Apply the bootstrap payload onto the renderer's data objects.
   * Each block is independent, so one empty source cannot blank a surface.
   */
  /**
   * The team, as the standings and the reassign picker both read it.
   *
   * Two lists off one payload, and refetchable on their own: a reassignment
   * changes the book size beside every name, and both surfaces show it.
   */
  function applyStandings(standings, bag) {
    // Clear the sample leaderboard/reassign list up front — a real empty
    // response must win over the prototype's names, not leave them standing
    // in for a team that turned out to have nobody in it.
    bag.STANDINGS.length = 0;
    if (bag.REPS) bag.REPS.length = 0;
    if (!standings.length) return;
    if (bag.REPS) {
      /* Two admins can share a display name — ms_user.user_fname is not
         unique — so the email goes on the second line. Without it the list
         shows the same name twice and there is no way to tell which person
         you are handing an account to. */
      const seenName = new Map();
      standings.forEach((r) => seenName.set(r.name, (seenName.get(r.name) || 0) + 1));
      bag.REPS = standings.map((r) => [
        r.name,
        r.initials,
        [
          `${r.accounts.toLocaleString("en-IN")} account${r.accounts === 1 ? "" : "s"}`,
          r.email || (seenName.get(r.name) > 1 ? `id ${r.id}` : ""),
        ]
          .filter(Boolean)
          .join(" · "),
        r.isMe ? 1 : 0,
        /* The rep's MSG91 id. The reassign sheet selects by this rather than
           by list position: the list is ordered by book size and re-sorts the
           moment a reassignment lands, so an index picked before a save names
           a different person after it. */
        r.id,
      ]);
    }
    bag.STANDINGS.length = 0;
    standings.forEach((r) => {
      bag.STANDINGS.push([r.name, r.initials, r.accounts, "", "up", r.isMe ? 1 : 0]);
    });
  }

  /** Cards arrive on their own request; see the note in the bootstrap route. */
  function applyCards(cards, bag) {
    // A real "nothing matched" answer must clear the sample cards, not leave
    // them standing in as if they were still live — an empty response is a
    // fact about the account, not a reason to keep showing invented ones.
    bag.CARDS.length = 0;
    if (!cards || !cards.length) {
      // Genuinely empty is not mock — it is a real, successful answer of
      // zero. Pushing it into state.mock used to make the banner claim
      // "Sample data, not live: cards" for a page that had nothing fake on
      // it at all. Logged as real instead, same as the non-empty branch.
      state.real.push("cards (no signals matched right now)");
      return;
    }
    cards.forEach((c) => bag.CARDS.push(toCard(c)));
    state.real.push(cards.length + " cards from live scanners");
  }

  function apply(data, bag) {
    const real = [];
    const mock = [];

    state.me = data.me;
    /* The caller's Pulse role and what it lets them do. Advisory: the server
       checks the role again on every rule write. */
    state.role = data.role || null;
    /* Every country the customer base is in, for the lens. Not derived from
       the board: the board scores one page and most of it has no country. */
    state.countries = data.countries || null;
    /* The same, narrowed to this rep's own book — what the lens should show
       on "me" scope, so it doesn't offer 40 countries the person has no
       accounts in at all. */
    state.myCountries = data.myCountries || null;
    state.can = data.can || {};
    /* Two different questions, and they used to be answered by one value.
       `signedInAs` is the person holding the session — that is the identity the
       header and the profile page are about. `me` is the MSG91 rep whose book
       is on screen (PULSE_ME_USER_PID, or the largest book when unpinned),
       which is where the account count comes from. They are usually the same
       person and are not guaranteed to be, so the profile no longer shows the
       rep's name and address to whoever happens to be logged in. */
    state.signedInAs = data.signedInAs || null;
    if (bag.ME && data.signedInAs) {
      bag.ME.name = data.signedInAs.name;
      bag.ME.email_addr = data.signedInAs.email || null;
      real.push("who you are signed in as (" + data.signedInAs.email + ")");
    }
    /* Google connect state, kept on Pulse's own side (pulse_connection,
       migrations/012) rather than only in this tab's memory — so it reads the
       same after a reload and on another device. Only overwritten when the
       server actually answered the question, so a bootstrap with no session
       doesn't stomp what a just-finished connect already set locally. */
    if (bag.ME && data.connections) {
      bag.ME.gmail = data.connections.gmail ? 1 : 0;
      bag.ME.cal = data.connections.cal ? 1 : 0;
      bag.ME.slackapp = data.connections.slack ? 1 : 0;
      real.push("connection state (" + JSON.stringify(data.connections) + ")");
    }
    if (data.me) {
      if (bag.ME) bag.ME.accounts = data.me.accounts;
      real.push("the book on screen (" + data.me.name + ", " + data.me.accounts + " accounts)");
    }

    const wall = (data.wall || []).concat(data.myAccounts || []);
    const seen = new Set();
    const unique = wall.filter((a) => (seen.has(a.id) ? false : seen.add(a.id)));
    // A real (even empty) wall answer replaces the sample book — an owner with
    // zero accounts today must see zero, not the prototype's eighteen.
    bag.BOOK.length = 0;
    unique.forEach((a) => bag.BOOK.push(toBookRow(a)));
    unique.forEach((a) => {
      bag.CUST[a.name] = bag.CUST[a.name] || toCustStub(a);
      state.ids[a.name] = a.id;
    });
    state.wallNext = data.wallNext ?? null;
    real.push(unique.length + " accounts (ms_user + user_handled_by)");

    if (data.growth) {
      ["me", "team", "company"].forEach((scope) => {
        const g = bag.GROWTH[scope];
        if (!g) return;
        g.lab = data.growth.label;
        g.h = data.growth.headline;
        g.stats = data.growth.stats;
        delete g.score;
        delete g.delta;
      });
      real.push("growth stats (signups, payers, unowned)");
      // Not pushed to `mock`: deleting score/delta means pulse.js's own
      // render (`g.score==null?"":...`) shows nothing where the score would
      // go, not a fake number standing in for it. There is nothing fake on
      // screen here to disclose — flagging an honest, correctly-hidden gap
      // as "sample data" just confused people into thinking something was
      // broken. The gap itself is still real (no mailbox means no promise
      // tracking) — it is just not something a person can mistake for a
      // live number, so it does not belong in the same banner as CARDS/BOOK
      // ever showing invented content in place of real content.
    }

    // Carry the owner name onto every stub so the company header can show it.
    // The reassign sheet listed five invented people. These are the real reps,
    // with the number of accounts each actually owns.
    if (data.standings && data.standings.length) {
      applyStandings(data.standings, bag);
      real.push(`${data.standings.length} real reps in the reassign list`);
      real.push(data.standings.length + " reps in standings, ranked by accounts owned");
    }

    if (data.askCatalogue && data.askCatalogue.length) {
      state.catalogue = data.askCatalogue;

      // Ask's chips and its "Asked" tab both read HISTORY, keyed by the ASK id.
      // Replacing it with the live catalogue is what makes the surface real:
      // every chip now maps to a question backed by SQL.
      bag.HISTORY = data.askCatalogue.map((q, i) => [
        q.pinned ? 1 : 0,
        q.question,
        "answered from MySQL",
        q.id,
      ]);

      // A stub per question so the surface renders before its fetch lands.
      // Installed for every catalogue id — including ones the prototype never
      // had — and only skipped once a real answer has replaced it.
      data.askCatalogue.forEach((q) => {
        if (bag.ASK[q.id] && bag.ASK[q.id].__loaded) return;
        bag.ASK[q.id] = {
          q: q.question,
          big: "…",
          h: "Working it out.",
          p: "Querying MySQL.",
          brk: [],
          act: null,
          st: ["live"],
        };
      });

      // Open on a question the database can answer, not the prototype's sample.
      state.defaultAsk = data.askCatalogue[0].id;
      bag.S.ask = state.defaultAsk;
      real.push(data.askCatalogue.length + " Ask questions answered from SQL");
    }

    if (data.anomaly) {
      real.push("audit anomaly detection over admin_updation_log");
    }

    state.real = real;
    state.mock = mock;
    state.counts = data.counts;
    state.loaded = true;

    // ⌘K is assembled at load time from whatever BOOK held then — the sample
    // companies. Rebuild it now that the real ones are in.
    if (bag.rebuildPal) bag.rebuildPal(data.counts);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
    );
  }

  /**
   * Replace one Ask answer in place, then re-render.
   *
   * `append` is the Load more path: the new rows are added to what is already
   * on screen rather than replacing it, so the reader keeps their place.
   */
  async function loadAnswer(id, bag, render, append, fresh) {
    const existing = bag.ASK[id];
    const offset = append && existing && existing.nextCursor != null ? existing.nextCursor : 0;
    if (append && !offset) return;
    try {
      const { answer } = await get(
        "/api/pulse/ask?q=" + encodeURIComponent(id) +
          (offset ? "&offset=" + offset : "") + (fresh ? "&fresh=1" : ""),
      );
      const priorRows = append && existing && existing.rows ? existing.rows : [];
      bag.ASK[id] = {
        __loaded: true,
        q: answer.question,
        big: answer.big,
        h: answer.headline,
        p: answer.prose,
        brk: answer.breakdown || [],
        act: answer.action,
        st: answer.stamp,
        ...(answer.table
          ? {
              cols: answer.table.columns,
              rows: priorRows.concat(answer.table.rows),
              nextCursor: answer.table.nextCursor ?? null,
            }
          : {}),
      };
      render();
    } catch (err) {
      console.warn("[pulse] answer " + id + " failed:", err.message);
    }
  }

  /**
   * Turn a failure into something worth reading.
   *
   * The API's own message names the gateway, its error codes and the
   * environment variable that is missing — useful in a log, wrong in front of a
   * salesperson. The full text goes to the console instead.
   */
  function userFacingError(res) {
    const detail = (res && res.error) || "";
    if (detail) console.warn("[pulse] ask failed:", res && res.code, detail);
    const byCode = {
      NO_PAUTHKEY: "Answering typed questions needs a setting your admin has not turned on yet. The saved questions above still work.",
      AUTH: "Answering typed questions is misconfigured. Your admin will need to look at it.",
      RATE_LIMIT: "Too many questions at once. Try again in a moment.",
      TIMEOUT: "That took too long to work out. Try narrowing it — a single month, or one account.",
      REFUSED: "The query that came back was not safe to run, so nothing was executed.",
      BAD_PLAN: "The answer came back in a shape Pulse could not read. Your admin will need to look at it.",
      ASYNC_AGENT: "Answering typed questions is misconfigured. Your admin will need to look at it.",
      EMPTY: "Nothing came back. Try asking it a different way.",
      UNREACHABLE: "Could not reach the service that works out answers. Try again shortly.",
    };
    return byCode[res && res.code] || "Something went wrong working that out. Try asking it a different way.";
  }

  /**
   * Keep the header's store light current.
   *
   * Polled rather than derived from whichever request happened last: the store
   * can go while the app carries on serving MSG91 data perfectly, and that is
   * exactly the failure nobody notices. Sixty seconds is often enough to catch
   * it and rare enough to cost nothing.
   *
   * The three states are kept distinct on purpose. "Connected but nothing
   * migrated" and "cannot connect" both mean Autopilot is doing nothing, but
   * they are fixed by different things — one by running the migration, the
   * other by correcting PULSE_STORE_*.
   */
  function paintDot(id, state, title, detail) {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.state = state;
    el.dataset.tip = `${title}||${detail}`;
    const sr = el.querySelector(".sr");
    if (sr) sr.textContent = title;
  }

  async function checkStore() {
    try {
      const res = await fetch("/api/health/store", { headers: { accept: "application/json" } });
      const body = await res.json().catch(() => ({ ok: false, error: "bad JSON" }));
      if (body.ok && Number(body.tables) > 0) {
        paintDot("dbdot", "live", "Store connected",
          `${body.database} · ${body.tables} tables. Autopilot can write decisions.`);
      } else if (body.ok) {
        paintDot("dbdot", "empty", "Store empty",
          `Connected to ${body.database}, but it has no tables — the schema never migrated, so Autopilot will record nothing. Run npm run store:up.`);
      } else {
        paintDot("dbdot", "down", "Store unreachable",
          "Pulse cannot reach the database it writes to, so Autopilot is recording nothing. Check PULSE_STORE_HOST, PORT, USER and PASSWORD.");
      }
    } catch (err) {
      paintDot("dbdot", "down", "Store unreachable", "The health check itself failed: " + err.message);
    }
  }

  /**
   * The read connection. Distinct from the store check because this is the one
   * that is IP-bound: it works on a machine MSG91 has allowlisted and nowhere
   * else, which is why a deployed copy can look healthy and show nothing real.
   */
  async function checkMsg91() {
    try {
      const res = await fetch("/api/health/db", { headers: { accept: "application/json" } });
      const body = await res.json().catch(() => ({ ok: false, error: "bad JSON" }));
      if (body.ok) {
        paintDot("dbdot-msg91", "live", "MSG91 connected",
          `${body.database || "MSG91"}${body.serverVersion ? " · MySQL " + body.serverVersion : ""}. Accounts, payments and signups are real.`);
      } else {
        paintDot("dbdot-msg91", "down", "MSG91 unreachable",
          "Pulse cannot reach MSG91's database, so accounts and health are shown as empty/unavailable rather than guessed at. The host is IP-bound — this copy may not be allowlisted.");
      }
    } catch (err) {
      paintDot("dbdot-msg91", "down", "MSG91 unreachable", "The health check itself failed: " + err.message);
    }
  }

  const checkConnections = () => { checkMsg91(); checkStore(); };

  /**
   * Replace the audit feed with real staff actions.
   *
   * Used to patch `bag.AUTO.audit.f`/`.sys` — the prototype's own mock object
   * — in place, and only on success. That meant "still loading" and "the
   * fetch just failed" looked identical to a reader: the mock rows ("Sample
   * Rep 3 revealed…") just sat there either way, silently, forever, with
   * nothing on screen admitting it was not real. `state.audit` is a separate
   * value now, explicitly null until this answers — the Audit tab shows a
   * skeleton while it's null and an honest error if it stays null with
   * `state.auditError` set, instead of ever falling back to the seed copy.
   */
  async function loadAudit(bag, render) {
    try {
      // Two sources, one log. Legacy staff changes come from MSG91's own change
      // log; acts on Autopilot's records come from Pulse's store. Both answer
      // the Audit log's question — are the people behaving? — so they belong in
      // the same feed rather than in two places nobody cross-references.
      const [data, human] = await Promise.all([
        get("/api/pulse/audit?view=staff&limit=25"),
        get("/api/pulse/autopilot/decisions?view=human&limit=25").catch(() => ({ rows: [] })),
      ]);
      const humanRows = (human.rows || []).map((r) => [
        r.when,
        r.title,
        r.detail + " On Autopilot's own records.",
        "approve",
        "ok",
      ]);
      const f = humanRows.concat(
        // The kind used to be r.tag — "act" for admin_updation_log type 1 only,
        // everything else uncolored — so two rows both labeled "config" could
        // render one blue and one not, with nothing on screen explaining why.
        // "config" now drives both the label and the color consistently.
        data.rows.map((r) => [r.when, r.actor + " " + r.what, r.detail, "config", "config"]),
      );
      const sys = data.anomaly
        ? [
            "Anomaly",
            data.anomaly.actor +
              " changed " +
              data.anomaly.changes +
              " things across " +
              data.anomaly.accounts +
              " accounts in 24 hours.",
            data.anomaly.note + " Window " + data.anomaly.window + ".",
          ]
        // No anomaly right now is a real, good answer — not "not loaded yet" —
        // so this is an empty array, never the mock sentence left standing in.
        : [];
      state.audit = { f, sys };
      state.auditError = null;
      state.auditNext = data.nextCursor ?? null;
      // The old "abandoned at step N" feed had its own tab and no longer does:
      // suppression is an action type in Activity now, filtered by a chip. The
      // query is dropped rather than kept for a surface nothing renders.
      render();
    } catch (err) {
      state.auditError = err.message;
      console.warn("[pulse] audit failed:", err.message);
      render();
    }
  }

  /**
   * Replace the Autopilot feeds with real decisions.
   *
   * Live and the AI log are the same table read in order — Autopilot's promise
   * is "every decision AI made, with the evidence behind it", and that is
   * literally `SELECT * FROM pulse_decision ORDER BY at DESC`. Filtered is the
   * suppressions from the same table, which is why nothing is ever deleted.
   *
   * A genuinely empty answer ("nothing decided yet") must still set
   * state.autopilot, not return early — an early return here used to leave
   * it null forever, which reads identically to "still loading" downstream
   * (matePending in pulse.js), so a real, empty month sat behind a permanent
   * loading skeleton instead of the honest "hasn't decided anything" line.
   */
  async function loadAutopilot(bag, render) {
    try {
      const data = await get("/api/pulse/autopilot/decisions?limit=60");
      // The rows are handed over whole rather than flattened into the feed
      // tuple: Activity expands each one to its evidence, confidence and
      // policy, and none of that survives a five-element array.
      state.activity = data.rows;
      state.autopilot = data.summary;
      state.autopilotNext = data.nextCursor ?? null;

      // No banner here any more. "A signup is waiting on a person" is work, and
      // work belongs on Now where somebody is deciding what to do next — not on
      // a tab they open when they want to check whether they trust the AI.

      state.real.push("autopilot decisions (pulse_decision, " + data.summary.total + " rows)");

      render();
    } catch (err) {
      // Distinct from "nothing decided yet" above: that is a real, good answer
      // from the store. This is the store refusing to answer at all, and
      // state.autopilot staying null for that reason is what let "1,842
      // signals" — the prototype's own number — sit on screen looking real
      // indefinitely. autopilotError is what lets the header say so instead.
      state.autopilotError = err.message;
      console.warn("[pulse] autopilot decisions failed:", err.message);
      render();
    }
  }

  /**
   * Load more rows onto the Activity feed.
   *
   * The route already supports this (?before=<cursor>, same page size as the
   * first load) and loadAutopilot already captured the cursor into
   * state.autopilotNext — it was just never read anywhere, so Activity sat
   * capped at its first 60 rows with no way past them, unlike Audit's
   * identical pattern a few tabs over. Appends onto state.activity rather
   * than replacing it, same as loadMoreAudit does for state.audit.f.
   */
  async function loadMoreActivity(bag, render) {
    if (state.autopilotNext == null || state.activityLoadingMore) return;
    state.activityLoadingMore = true;
    render();
    try {
      const data = await get(
        "/api/pulse/autopilot/decisions?limit=60&before=" + encodeURIComponent(state.autopilotNext),
      );
      state.activity = (state.activity || []).concat(data.rows || []);
      state.autopilotNext = data.nextCursor ?? null;
    } catch (err) {
      console.warn("[pulse] more activity failed:", err.message);
    } finally {
      state.activityLoadingMore = false;
      render();
    }
  }

  /**
   * The "Drafted for a person" chip's own rows — not a filter over
   * state.activity's most-recent-60 window, which a busy day of unrelated
   * automation runs can push a real held draft clean out of (confirmed live:
   * 83 other decisions landed after 3 real held drafts inside one day).
   * Fetched once, lazily, the first time the chip is opened.
   */
  async function loadDrafted(bag, render) {
    if (state.activityDrafted) { render(); return; }
    try {
      const data = await get("/api/pulse/autopilot/decisions?view=drafted&limit=50");
      state.activityDrafted = data.rows;
      render();
    } catch (err) {
      console.warn("[pulse] drafted activity failed:", err.message);
      state.activityDraftedError = err.message;
      render();
    }
  }

  /**
   * The "Suppressed" chip's own rows — same fix as loadDrafted above, same
   * reason: `suppressed()` already existed server-side as its own query
   * (log.ts), nothing ever fetched it. The chip filtered `state.activity`'s
   * most-recent-60 window instead, which has exactly the same lossy-window
   * problem drafted had.
   */
  async function loadSuppressed(bag, render) {
    if (state.activitySuppressed) { render(); return; }
    try {
      const data = await get("/api/pulse/autopilot/decisions?view=filtered&limit=50");
      state.activitySuppressed = data.rows;
      render();
    } catch (err) {
      console.warn("[pulse] suppressed activity failed:", err.message);
      state.activitySuppressedError = err.message;
      render();
    }
  }

  /**
   * Drafts waiting on a person.
   *
   * Held is the only status this loads: released and discarded drafts are
   * history and belong in the log, not in a queue of things to do.
   */
  async function loadDrafts(bag, render) {
    try {
      const [d, p] = await Promise.all([
        get("/api/pulse/autopilot/drafts?status=held&limit=25"),
        get("/api/pulse/autopilot/policy"),
      ]);
      state.drafts = d.drafts;
      state.policy = p.policy;
      // Attach each held draft to the decision that produced it, so opening a
      // row in Activity shows the message rather than sending someone to hunt
      // for it on another tab.
      if (state.activity) {
        const bySignal = new Map(d.drafts.map((x) => [x.signalKey, x.id]));
        state.activity.forEach((r) => {
          if (r.agent === "signup-triage" && bySignal.has(r.signalKey)) r.draftId = bySignal.get(r.signalKey);
        });
      }
      render();
    } catch (err) {
      console.warn("[pulse] drafts failed:", err.message);
    }
  }

  /** Who is acting, as an id the store can key on — not the whole profile. */
  function actor() {
    const m = state.me;
    if (!m) return "unknown";
    return String(m.id || m.user_pid || m.name || "unknown");
  }

  /** Say why an action was refused, on the draft it was refused on. */
  function draftMessage(id, text) {
    const el = document.querySelector('[data-dmsg="' + id + '"]');
    if (el) el.textContent = text;
  }

  /**
   * Release a draft, with whatever the rep typed.
   *
   * The edited text is sent rather than the original, because the server checks
   * the price rule against what is actually going out — a rep can edit a price
   * in, and the control has to see it.
   */
  async function releaseDraft(id, body, bag, render) {
    try {
      const original = (state.drafts || []).find((d) => d.id === id);
      const edited = body != null && original && body.trim() !== original.body.trim();
      const res = await fetch("/api/pulse/autopilot/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "release", actor: actor(), body: edited ? body : undefined }),
      });
      const out = await res.json();
      if (!out.ok) { draftMessage(id, out.error || "could not release"); return; }
      await loadDrafts(bag, render);
      loadAutopilot(bag, render);
    } catch (err) {
      draftMessage(id, err.message);
    }
  }

  /**
   * Send a draft for real, through the sender's own connected Gmail — the
   * one call in this file that puts a message in front of an actual
   * customer. `cb`, unlike releaseDraft's, receives the whole result
   * ({ok, sentTo} or {ok:false, error}) rather than firing only on success:
   * the caller is expected to have already confirmed with the person before
   * this is called (see the confirm step at the [data-release] click site in
   * pulse.js) — this function's job is to report exactly what happened, not
   * to decide whether it should.
   */
  async function sendDraft(id, body, bag, cb) {
    try {
      const original = (state.drafts || []).find((d) => d.id === id);
      const edited = body != null && original && body.trim() !== original.body.trim();
      const res = await fetch("/api/pulse/autopilot/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "send", actor: actor(), body: edited ? body : undefined }),
      });
      const out = await res.json();
      if (out.ok) { await loadDrafts(bag, () => {}); loadAutopilot(bag, () => {}); }
      cb(out);
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  }

  async function discardDraft(id, bag, render) {
    try {
      const res = await fetch("/api/pulse/autopilot/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "discard", actor: actor() }),
      });
      const out = await res.json();
      if (!out.ok) { draftMessage(id, out.error || "could not discard"); return; }
      await loadDrafts(bag, render);
    } catch (err) {
      draftMessage(id, err.message);
    }
  }

  /** The kill switch. Writes the policy row the runner reads before every pass. */
  async function setSendingPaused(paused) {
    const res = await fetch("/api/pulse/autopilot/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused, actor: actor() }),
    });
    const out = await res.json();
    if (out.ok) state.policy = out.policy;
    return out.ok;
  }

  /**
   * The manifest, from pulse_policy.
   *
   * Falls back silently: if the store does not answer, pulse.js keeps showing
   * the constant it shipped with, which is the right behaviour for a statement
   * that must always be on screen.
   */
  async function loadManifest(bag, render) {
    try {
      const d = await get("/api/pulse/autopilot/manifest");
      state.manifest = d.manifest;
      render();
    } catch (err) {
      console.warn("[pulse] manifest failed:", err.message);
    }
  }

  async function manifestAction(payload, then) {
    try {
      const res = await fetch("/api/pulse/autopilot/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ actor: actor() }, payload)),
      });
      const out = await res.json();
      if (!out.ok) { console.warn("[pulse] rule change refused:", out.error); return; }
      // Re-read rather than patching state: an edit writes a new version, so the
      // row that comes back is not the row that was sent.
      await loadManifest(null, () => {});
      if (then) then(out.item);
    } catch (err) {
      console.warn("[pulse] rule change failed:", err.message);
    }
  }

  /**
   * Recompute one saved answer.
   *
   * `fresh=1` makes the server drop its TTL entry first. Without that the
   * request round-trips and hands back the identical numbers, which is
   * indistinguishable from a button that does nothing.
   */
  async function recomputeAnswer(id, bag, render) {
    if (!id) return;
    const a = bag.ASK[id];
    if (a) { a.__recomputing = true; render(); }
    await loadAnswer(id, bag, render, false, true);
    const b = bag.ASK[id];
    if (b) { b.__recomputing = false; b.__recomputedAt = new Date()
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
    render();
  }

  const addRule = (side, text, then) => manifestAction({ action: "add", side, text }, then);
  const editRule = (key, text, then) => manifestAction({ action: "edit", key, text }, then);
  const retireRule = (key, then) => manifestAction({ action: "retire", key }, then);

  /**
   * The month's written verdicts and the portfolio digest.
   *
   * Both are written by a separate month-end job, so this only reads. If the
   * month has not been run, the account page keeps its live stub sentence and
   * Room to grow keeps the prototype's ranked opportunities — an empty month
   * should still show a person what to do.
   */
  async function loadMonthly(bag, render) {
    try {
      const d = await get("/api/pulse/autopilot/monthly?scope=team");
      state.digest = d.digest;
      render();
    } catch (err) {
      console.warn("[pulse] digest failed:", err.message);
    }
  }

  /** One account's verdict, fetched when its page is opened. */
  async function loadVerdict(pid, render) {
    if (!pid || (state.verdicts && state.verdicts[pid] !== undefined)) return;
    state.verdicts = state.verdicts || {};
    try {
      const d = await get("/api/pulse/autopilot/monthly?account=" + encodeURIComponent(pid));
      state.verdicts[pid] = d.verdict;
      if (d.verdict) render();
    } catch (err) {
      state.verdicts[pid] = null;
    }
  }

  /**
   * System exceptions for Now.
   *
   * Loaded for Team and Company only. Fetched on every render of those scopes
   * rather than cached: an alert that is thirty seconds stale is useless, and
   * the query is four counts.
   */
  async function loadAlerts(render) {
    try {
      const d = await get("/api/pulse/autopilot/alerts");
      const before = JSON.stringify(state.alerts || []);
      state.alerts = d.alerts;
      if (render && before !== JSON.stringify(d.alerts)) render();
    } catch (err) {
      console.warn("[pulse] alerts failed:", err.message);
    }
  }

  /** The four motions' rules, from pulse_policy. */
  async function loadMotionRules(render) {
    try {
      const d = await get("/api/pulse/autopilot/rules");
      state.motionRules = d.rules;
      if (render) render();
    } catch (err) {
      console.warn("[pulse] motion rules failed:", err.message);
    }
  }

  /**
   * The automations actually built and running — pulse_automation, built via
   * the planner (build.ts), not the sentence-rule compiler. Shown alongside
   * the motion rules so a rule somebody built this way is not invisible next
   * to the ones seeded with the product.
   */
  async function loadAutomations(render) {
    try {
      const d = await get("/api/pulse/autopilot/automations");
      state.automations = d.automations || [];
      if (render) render();
    } catch (err) {
      console.warn("[pulse] automations failed:", err.message);
    }
  }

  async function ruleAction(payload, then) {
    try {
      const res = await fetch("/api/pulse/autopilot/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ actor: actor() }, payload)),
      });
      const out = await res.json();
      if (!out.ok) { console.warn("[pulse] rule change refused:", out.error); return null; }
      await loadMotionRules(null);
      if (then) then(out);
      return out;
    } catch (err) {
      console.warn("[pulse] rule change failed:", err.message);
      return null;
    }
  }

  const saveMotionRule = (key, english, then) => ruleAction({ action: "edit", key, english }, then);
  const retireMotionRule = (key, then) => ruleAction({ action: "retire", key }, then);

  /**
   * Build a live automation from a sentence: plan it, run every safety check,
   * and — unless `preview` is true — provision its agent on GTWY, subscribe
   * it on cron-job.org if it needs a schedule, and save it.
   *
   * With `preview: true` nothing is provisioned or saved; the response is
   * what *would* be built, for a person to read before a second call (same
   * arguments, preview: false) makes it real. This is the only confirm step
   * "NOTHING RUNS UNTIL YOU CONFIRM IT" has ever actually needed — see
   * showBuiltPreview() in pulse.js for where it is shown.
   */
  async function buildAutomation(motion, english, cb, eventName, preview) {
    try {
      const res = await fetch("/api/pulse/autopilot/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motion, english, ...(eventName ? { eventName } : {}), preview: Boolean(preview) }),
      });
      const out = await res.json();
      cb(out);
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  }

  /** The fixed event catalogue for the Rules page's "when this happens" dropdown. */
  async function loadEventCatalogue(cb) {
    try {
      const res = await fetch("/api/pulse/autopilot/build");
      const out = await res.json();
      cb(out.ok ? out.events : []);
    } catch {
      cb([]);
    }
  }

  /** Turn a built automation off — retires the row and tears down its cron job and agent. */
  async function retireAutomation(key, then) {
    try {
      const res = await fetch("/api/pulse/autopilot/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retire", key }),
      });
      const out = await res.json();
      if (then) then(out);
    } catch (err) {
      if (then) then({ ok: false, error: err.message });
    }
  }

  /** One automation's own recent decisions — the Automations tab's execution history. */
  async function loadAutomationHistory(key, cb) {
    try {
      const d = await get("/api/pulse/autopilot/decisions?automation=" + encodeURIComponent(key) + "&limit=20");
      cb(d.rows || []);
    } catch (err) {
      cb(null);
    }
  }

  /** Delete an automation entirely — tears down its cron job/agent and removes the row. */
  async function deleteAutomation(key, then) {
    try {
      const res = await fetch(
        "/api/pulse/autopilot/automations?key=" + encodeURIComponent(key),
        { method: "DELETE" },
      );
      const out = await res.json();
      if (then) then(out);
    } catch (err) {
      if (then) then({ ok: false, error: err.message });
    }
  }

  /** Replay a rule against decisions already made. Nothing is sent. */
  async function testMotionRule(key, cb) {
    try {
      const res = await fetch("/api/pulse/autopilot/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", key, days: 30 }),
      });
      const out = await res.json();
      cb(out.ok ? out.test : null);
    } catch (err) {
      cb(null);
    }
  }

  /**
   * Questions people have already asked, matching what is being typed.
   *
   * These are the cheapest answers in the app — the SQL is already written, so
   * picking one costs a query rather than a call to an agent. Worth putting in
   * front of someone before they retype the same question in different words.
   */
  /**
   * Questions people actually typed, most-asked first.
   *
   * The Asked tab used to list only the catalogue that shipped with the app, so
   * a question somebody asked this morning appeared nowhere — which made the
   * whole surface look like it was not recording anything.
   */
  /**
   * In flight — who holds the ball, from what Autopilot is actually doing.
   *
   * Replaces the prototype's sample rows only when there is something real to
   * show. An empty flight list is a legitimate state, but so is a brand-new
   * install with nothing decided yet, and those two should not look the same.
   */
  /** Let a stopped agent run again. Deliberate, and recorded against a person. */
  async function clearBreaker(agent, render) {
    try {
      const res = await fetch("/api/pulse/autopilot/breakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, actor: actor() }),
      });
      await res.json();
      await loadAlerts(null);
      if (render) render();
    } catch (err) {
      console.warn("[pulse] could not clear the breaker:", err.message);
    }
  }

  async function loadFlight(bag, render) {
    try {
      const d = await get("/api/pulse/autopilot/decisions?view=flight&limit=12");
      // Cleared even when there is nothing real to show: an early `return`
      // here left the hardcoded sample rows on screen forever whenever the
      // account genuinely had zero in-flight items, indistinguishable from
      // the fake data never having been replaced at all.
      bag.FLIGHT.length = 0;
      d.rows.forEach((r) => {
        // The renderer appends the "d" itself, so days stays a number here.
        bag.FLIGHT.push([r.account, r.what, r.ball, r.days, r.old ? 1 : 0, r.doing]);
      });
      state.real.push("in flight (drafts held, timers set, messages out)");
      state.flightLoaded = true;
      render();
    } catch (err) {
      console.warn("[pulse] in flight failed:", err.message);
      state.flightLoaded = true;
      render();
    }
  }

  async function loadAsked(render) {
    try {
      const d = await get("/api/pulse/nl");
      state.asked = d.asked || [];
      if (render) render();
    } catch (err) {
      console.warn("[pulse] asked list failed:", err.message);
    }
  }

  async function searchQuestions(q) {
    try {
      const d = await get("/api/pulse/nl?q=" + encodeURIComponent(q));
      return d.asked || [];
    } catch (err) {
      return [];
    }
  }

  /** Put a suppressed signup back in front of a person. */
  async function unsuppress(signalKey, bag, render) {
    try {
      const res = await fetch("/api/pulse/autopilot/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalKey }),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      // Re-read rather than patching the row in place: the reversal is itself a
      // decision row, so the feed has genuinely changed.
      await loadAutopilot(bag, render);
    } catch (err) {
      console.warn("[pulse] unsuppress failed:", err.message);
      render();
    }
  }

  /**
   * Open an account the reader has never had in their book — a decision log
   * row (`Scored Account 50`) carries only an id, not a name, and an
   * automation can easily score accounts nobody owns. Fetches the account by
   * id, builds the same stub `toCustStub` gives every other company on
   * first open, and hands the resolved name back so the caller can switch
   * the view the same way `openCompany` always has.
   */
  /**
   * "Done today · Company" — two hardcoded example rows before this
   * (public/pulse.js's DONE_C), never once reflecting anything that
   * actually happened. Real now: completed work items, company-wide, from
   * today. Fetched lazily, once, the first time Company scope is viewed.
   */
  async function loadDoneCompany(bag, render) {
    if (state.doneCompany) { render(); return; }
    try {
      const data = await get("/api/pulse/work?scope=done");
      state.doneCompany = (data.items || []).map((it) => [
        new Date(it.completedAt || it.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        it.title,
        it.outcome || (it.type === "promise" ? "promise kept" : "done"),
      ]);
      render();
    } catch (err) {
      console.warn("[pulse] done-today (company) failed:", err.message);
      state.doneCompany = [];
      render();
    }
  }

  /**
   * "Add accounts in bulk" — POST /api/pulse/prospects, two calls matching
   * the sheet's own two steps: check, then create only the confirmed `new`
   * rows. Real dedup against ms_user and existing prospects — see
   * lib/pulse/prospects.ts. No enrichment; the sheet's copy says so.
   */
  async function checkBulk(text, cb) {
    try {
      const res = await post("/api/pulse/prospects", { action: "check", text });
      cb(res);
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  }

  async function createBulk(rows, cb) {
    try {
      const res = await post("/api/pulse/prospects", {
        action: "create",
        rows: rows.map((r) => ({ companyName: r.companyName, domain: r.domain, email: r.email })),
      });
      cb(res);
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  }

  /**
   * "Log what happened", for real — POST /api/pulse/accounts/:id/log. `cb`
   * gets the whole response ({ok, extract, created} or {ok:false, error}):
   * the caller renders what was actually created, not a guess made before
   * the agent ran.
   */
  async function logWhatHappened(accountId, note, cb) {
    try {
      const res = await post("/api/pulse/accounts/" + accountId + "/log", { note });
      cb(res);
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  }

  async function loadAccountById(id, bag, cb) {
    try {
      const d = await get("/api/pulse/accounts/" + id);
      if (!d.ok || !d.account) { cb(null); return; }
      const a = d.account;
      state.ids[a.name] = a.id;
      bag.CUST[a.name] = bag.CUST[a.name] || toCustStub(a);
      cb(a.name);
    } catch (err) {
      console.warn("[pulse] account " + id + " failed:", err.message);
      cb(null);
    }
  }

  /**
   * A card's primary action, made real — see the audit against handover §4:
   * every card but "Your approval" fell through to a generic mark-done that
   * called no API at all. Two real things a click can mean:
   *
   *   claim   — "Take this account" / "Assign an owner" (Your hands). Pulse
   *             *can* do this one itself: PUT the owner to the signed-in rep,
   *             through the same endpoint the reassign sheet uses, so it gets
   *             the same audit trail (pulse_account_owner_event) for free.
   *             The underlying scanner condition (no owner) is now false, so
   *             the card genuinely will not return next fetch — not just
   *             hidden locally.
   *   track   — "Call them" / "Find out what stalled" (Your hands / Your
   *             knowledge). Pulse cannot place a call or read a mind — these
   *             stay real human work — so a click here writes a tracked
   *             work item (pulse_work_item, shows up in My Work) instead of
   *             silently discarding the card, then hands back the account id
   *             so the caller can open it.
   */
  async function claimAccount(accountId, cb) {
    if (!state.me || !state.me.id) { cb({ ok: false, error: "not signed in" }); return; }
    try {
      const res = await send("PUT", "/api/pulse/accounts/" + accountId + "/owner", {
        ownerId: state.me.id,
        note: "Claimed from a Now card",
      });
      cb({ ok: true, owner: res.owner });
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  }

  async function trackCard(accountId, type, title, reason, cb) {
    try {
      const res = await post("/api/pulse/work", {
        action: "create",
        accountId: String(accountId),
        type,
        title,
        reason,
        ownerId: state.me && state.me.id ? String(state.me.id) : undefined,
      });
      cb({ ok: true, item: res.item });
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  }

  /** Enrich a company page with its real detail the first time it is opened. */
  async function loadAccount(name, bag, render) {
    const id = state.ids[name];
    // The month's verdict is asked for whether or not the rest of the page is
    // already loaded — it is written by a different job on a different
    // schedule, so it can appear after the page did.
    if (id && bag.CUST[name]) {
      bag.CUST[name].pid = id;
      loadVerdict(id, render);
      /* Tags come back with the detail payload too, but they are also asked for
         on every open: they are the one thing on this page another person
         changes while you are looking at it, and the detail request is skipped
         entirely once the account is loaded. */
      loadTags(name, bag, render);
      loadContacts(name, bag, render);
    }
    if (!id || !bag.CUST[name] || !bag.CUST[name].__stub) return;
    try {
      const d = await get("/api/pulse/accounts/" + id);
      const c = bag.CUST[name];
      /* The board's score, with the four components behind it. */
      if (d.health) c.health = d.health;
      c.__stub = false;
      /* Who works at the company, from the members it invited. An empty list is
         the honest answer for a young account — and is itself a signal, since an
         account where you know one person churns at roughly twice the rate.

         This used to be assigned and then immediately overwritten by the notes
         four lines further down, so the section headed "People" showed
         somebody's call notes and the real people — the ones the page exists to
         let you pick from — were fetched from MSG91 and thrown away. They are
         two lists now, under two headings, and only the notes page. */
      c.pe = (d.people || []).map((p) => [p.name, p.email, p.role || "member"]);
      // Pulse's own additions to that list — see loadContacts below. Kept
      // separate from c.pe rather than merged into it: MSG91's list cannot be
      // added to or removed from here, and conflating the two would make a
      // hand-added contact look editable the same way, or an invited member
      // look removable, when only one of those is actually true.
      if (c.peMine === undefined) c.peMine = [];
      /* Autopilot's own record of this company: what it decided, what it wrote
         and is holding, and what it intends to do next. */
      c.autopilot = d.autopilot || null;
      /* Products, from lib/pulse/products.ts — entitlement in
         ms_user_services plus one evidence table per product. `routes` is still
         on the response and is still SMS plumbing; it is no longer pretending
         to be the product list. */
      c.la = (d.products || []).map((p) => [p.product, p.state, p.detail]);
      c.ev = (d.activity || []).map((a) => [a.when, a.what]);
      c.no = (d.comments || []).map((m) => [m.by, m.text.slice(0, 90), "noted " + m.when]);
      /* Who Pulse says owns this, and whether that is MSG91's answer or ours. */
      c.ownerSource = d.account ? d.account.ownerSource : "msg91";
      c.ownerBefore = d.account ? d.account.ownerBefore : null;
      c.ownerNote = d.account ? d.account.ownerNote : null;
      if (d.account && d.account.owner) c.owner = d.account.owner.name;
      else if (d.account) c.owner = "";
      c.ownerId = d.account && d.account.owner ? d.account.owner.id : null;
      c.__evNext = d.activityNext ?? null;
      c.__noNext = d.commentsNext ?? null;
      /* Tags arrive with the page, so they are on screen at the first paint
         rather than one request later. */
      if (Array.isArray(d.tags)) applyTags(name, d.tags, bag);
      render();
    } catch (err) {
      console.warn("[pulse] account " + id + " failed:", err.message);
    }
  }

  /* ── tags ─────────────────────────────────────────────────────────────────
     The prototype kept TAGS in the browser, so a tag was lost on reload and
     private to one tab. They are notes one person leaves for the next, so they
     live in Pulse's store now (pulse_account_tag) and this is the binding.

     The renderer's shape is [label, ai] where ai=1 draws the dashed border, so
     `source` maps onto that second element and vCust needs no changes. */

  function applyTags(name, tags, bag) {
    bag.TAGS[name] = tags.map((t) => [t.tag, t.source === "pulse" ? 1 : 0]);
  }

  /** Read one company's tags. Quiet on failure — the page is still worth it. */
  async function loadTags(name, bag, render) {
    const id = state.ids[name];
    if (!id) return;
    try {
      const d = await get("/api/pulse/accounts/" + id + "/tags");
      applyTags(name, d.tags || [], bag);
      render();
    } catch (err) {
      console.warn("[pulse] tags for " + name + " failed:", err.message);
    }
  }

  /**
   * Add one or more tags, then redraw from what the server says.
   *
   * The whole list comes back on the response rather than just the additions,
   * so two people tagging the same company converge on the same list instead
   * of each holding their own half of it.
   */
  async function addTags(name, tags, bag, render) {
    if (!tags.length) return;
    const id = state.ids[name];
    /* The prototype's sample companies have no id in MSG91's database, so there
       is nothing to tag against. Say that rather than accepting the tag and
       dropping it — a tag that vanishes on reload is the exact problem this
       replaced. */
    if (!id) {
      state.tagError = name + " is one of the prototype's sample companies, so there is no account to tag.";
      render();
      return;
    }
    try {
      const d = await post("/api/pulse/accounts/" + id + "/tags", { tags: tags });
      applyTags(name, d.tags || [], bag);
      state.tagError = null;
    } catch (err) {
      // Said out loud on the page rather than only in the console: the person
      // just typed this and needs to know it did not stick.
      state.tagError = err.message;
      console.warn("[pulse] adding tags to " + name + " failed:", err.message);
    }
    render();
  }

  /**
   * Flag the health score shown right now as wrong.
   *
   * Records disagreement (migrations/031_health_correction.sql) — it does not
   * change the score. A rep who thinks a score is wrong had no way to say so
   * anywhere in the product before this; the alternative was quietly
   * distrusting every score with no record it ever happened.
   */
  async function flagHealthScore(name, bag, render) {
    const id = state.ids[name];
    const cust = bag.CUST && bag.CUST[name];
    const h = cust && cust.health;
    if (!id || !h) {
      state.healthFlagError = "Nothing to flag — this account's score is not loaded yet.";
      render();
      return;
    }
    try {
      await post("/api/pulse/health/correction", {
        accountId: id,
        score: h.score,
        band: h.band,
        decidedBy: h.decidedBy === "ai" ? "ai" : "formula",
      });
      state.healthFlagged[name] = true;
      state.healthFlagError = null;
    } catch (err) {
      state.healthFlagError = err.message;
      console.warn("[pulse] flagging health score for " + name + " failed:", err.message);
    }
    render();
  }

  /** Remove a tag. Optimistic, then corrected by the server's own list. */
  async function removeTag(name, tag, bag, render) {
    const id = state.ids[name];
    if (!id) {
      // Sample company: the tag only ever existed in this tab, so forgetting
      // it here is the whole operation.
      bag.TAGS[name] = (bag.TAGS[name] || []).filter((t) => t[0] !== tag);
      render();
      return;
    }
    const before = bag.TAGS[name] || [];
    bag.TAGS[name] = before.filter((t) => t[0].toLowerCase() !== tag.toLowerCase());
    render();
    try {
      const res = await fetch(
        "/api/pulse/accounts/" + id + "/tags?tag=" + encodeURIComponent(tag),
        { method: "DELETE", headers: { accept: "application/json" } },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) throw new Error(body.error || "HTTP " + res.status);
      applyTags(name, body.tags || [], bag);
      state.tagError = null;
    } catch (err) {
      // Put it back. A tag that reappears is honest; one that silently stays
      // gone while the database still has it is not.
      bag.TAGS[name] = before;
      state.tagError = err.message;
      console.warn("[pulse] removing tag from " + name + " failed:", err.message);
    }
    render();
  }

  /**
   * People at a company that MSG91 never invited — pulse_account_contact
   * (migrations/021). "＋ Add a person" used to open the unrelated "Log what
   * happened" sheet; this is the real table and the real calls behind it.
   */
  async function loadContacts(name, bag, render) {
    const id = state.ids[name];
    if (!id) return;
    try {
      const d = await get("/api/pulse/accounts/" + id + "/contacts");
      const c = bag.CUST[name];
      if (c) c.peMine = (d.contacts || []).map((p) => [p.id, p.name, p.role]);
      render();
    } catch (err) {
      console.warn("[pulse] contacts for " + name + " failed:", err.message);
    }
  }

  async function addContact(name, personName, role, bag, render) {
    const id = state.ids[name];
    if (!id) {
      state.tagError = name + " is one of the prototype's sample companies, so there is no account to add a person to.";
      render();
      return;
    }
    try {
      const d = await post("/api/pulse/accounts/" + id + "/contacts", { name: personName, role: role || null });
      const c = bag.CUST[name];
      if (c) c.peMine = (d.contacts || []).map((p) => [p.id, p.name, p.role]);
      state.tagError = null;
    } catch (err) {
      state.tagError = err.message;
      console.warn("[pulse] adding a person to " + name + " failed:", err.message);
    }
    render();
  }

  async function removeContact(name, personId, bag, render) {
    const id = state.ids[name];
    if (!id) return;
    const c = bag.CUST[name];
    const before = c ? c.peMine : [];
    if (c) c.peMine = before.filter((p) => p[0] !== personId);
    render();
    try {
      const res = await fetch(
        "/api/pulse/accounts/" + id + "/contacts?id=" + personId,
        { method: "DELETE", headers: { accept: "application/json" } },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) throw new Error(body.error || "HTTP " + res.status);
    } catch (err) {
      if (c) c.peMine = before;
      console.warn("[pulse] removing a person from " + name + " failed:", err.message);
    }
    render();
  }

  /**
   * L2 commercial reveal (handover §5): fetched only when someone deliberately
   * asks for it, never with the page. In production this request is also the
   * event that writes the audit reveal record.
   */
  async function revealCommercial(name, bag, render) {
    const id = state.ids[name];
    const c = bag.CUST[name];
    if (!id || !c || c.__revealed) return;
    try {
      const d = await get("/api/pulse/accounts/" + id + "?reveal=1");
      const m = d.commercial;
      c.__revealed = true;
      c.money = m
        ? [
            [m.received.amount, "received · " + m.received.window, m.currency || ""],
            [m.walletCredit, "wallet credit", ""],
            [String(m.received.count), "payments", m.provisional ? "provisional" : ""],
          ]
        : [["—", "no payments on record", ""]];
      /* The rates half of "payments and rates". Never built until now — the
         page showed three payment tiles and the prototype's invented
         "₹0.128 current SMS rate" beside them. This is ms_user_pricing: what
         this account actually negotiated, per route. */
      c.rates = m && m.rates ? m.rates : [];
      /* Already fetched and thrown away before: accountCommercial returns the
         last five payments and nothing rendered them. */
      c.recent = m && m.recent ? m.recent : [];
      /* Who else has opened this section. The button has always said the
         reveal is recorded; now that it is, the record is worth showing to the
         person about to add themselves to it. */
      c.reveals = d.reveals || [];
      /* False when the audit row could not be written. The section says so
         rather than letting the button's promise stand unearned. */
      c.revealLogged = d.revealLogged !== false;
      render();
    } catch (err) {
      console.warn("[pulse] reveal " + id + " failed:", err.message);
    }
  }

  /**
   * Free-text question → Claude writes SQL → we run it and render the rows.
   *
   * The generated SQL is kept on the answer and shown under the table: a number
   * nobody can trace is worse than no number, and this is the one answer in the
   * app that a model composed rather than a person.
   */
  async function askCustom(question, bag, render) {
    const q = (question || "").trim();
    if (q.length < 3) return;

    bag.ASK.__custom = {
      q: q,
      loading: true,
      big: "",
      h: "Working out how to answer that.",
      /* Nothing user-facing names the gateway or the model behind it. The
         detail still goes to the console, so a failure is diagnosable without
         putting vendor names in front of a salesperson. */
      p: "Reading your question, then working out which numbers answer it.",
      brk: [],
      act: null,
      st: ["free text", "working"],
    };
    bag.S.ask = "__custom";
    bag.S.askTab = "ask";
    bag.S.v = "ask";
    bag.S.sel = new Set();
    render();

    let res;
    try {
      const r = await fetch("/api/pulse/nl", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      res = await r.json();
    } catch (err) {
      res = { ok: false, error: err.message };
    }

    if (!res || res.ok === false) {
      bag.ASK.__custom = {
        q: q,
        big: "—",
        h:
          res && res.code === "NO_PAUTHKEY"
            ? "Typed questions are not switched on yet."
            : "That did not work.",
        p: userFacingError(res),
        brk: [],
        act: null,
        st: ["free text", res && res.code ? String(res.code).toLowerCase() : "error"],
      };
      render();
      return;
    }

    if (!res.answerable) {
      bag.ASK.__custom = {
        q: q,
        big: "—",
        h: res.headline,
        p: "Nothing was queried. Pulse would rather say it cannot answer than return a number that looks right and is not.",
        brk: (res.caveats || []).map((c, i) => ["Why", c]),
        act: null,
        st: ["free text", "not answerable"],
      };
      render();
      return;
    }

    const stamp = ["free text", `${res.rows.length} rows`];
    if (res.confidence && res.confidence !== "high") stamp.push(res.confidence + " confidence");
    if (res.limitApplied) stamp.push(`capped at ${res.limitApplied}`);
    stamp.push(`${res.timing.planMs}ms to plan · ${res.timing.queryMs}ms to run`);

    /* `shape` decides how this renders. A single number belongs in the big slot,
       a two-column result reads better as a breakdown than as a table, and
       everything else is a table. Without this every answer looked like a grid. */
    const asBreakdown =
      res.shape === "breakdown" && res.rows.length && res.rows[0].length === 2;
    const asSingle = res.shape === "single_value" && res.rows.length === 1;

    /* Which tables the answer came from is worth keeping; the SQL itself is
       deliberately not shown (MSG91's call). It is held apart from the data
       rather than concatenated onto it, so paging the rows cannot page the
       provenance away with them. */
    const brkMeta = (res.tablesUsed || []).length
      ? [["Tables read", res.tablesUsed.join(", ")]]
      : [];
    const brkAll = asBreakdown ? res.rows.map((r) => [String(r[0]), String(r[1])]) : [];

    bag.ASK.__custom = {
      q: q,
      big: asSingle ? String(res.rows[0][res.rows[0].length - 1]) : String(res.rows.length),
      h: res.headline,
      /* The generated SQL is deliberately not rendered — MSG91's call. It is
         still on the API response and in the server log, so an answer can be
         traced when someone needs to; it just is not put in front of a
         salesperson. `tables_used` stays, because knowing which tables an
         answer came from is useful without being a query. */
      p: (res.caveats && res.caveats.length ? res.caveats.join(" ") : ""),
      /* A breakdown gets the same first-page treatment as a table. It used to
         render every row it was given, which is how a 200-row answer arrived
         as an unbroken wall with no Load more anywhere on it — the button
         lived only in the table branch. */
      brk: brkAll.slice(0, PAGE_ROWS),
      brkMeta: brkMeta,
      ...(brkAll.length ? { allBrk: brkAll, brkTotal: brkAll.length } : {}),
      act: null,
      st: stamp,
      ...(res.rows.length && !asBreakdown && !asSingle
        ? {
            cols: res.columns,
            /* The whole result is already here — the query ran once and the
               guard capped it server-side. Dropping all of it on screen buried
               the answer under a wall of rows, so only the first page renders
               and Load more slices further into the buffer. Deliberately not a
               second request: re-planning the same question can return
               different SQL, and the count under the table would stop matching
               the rows above it. */
            allRows: res.rows,
            total: res.rows.length,
            rows: res.rows.slice(0, PAGE_ROWS),
            nextCursor: res.rows.length > PAGE_ROWS ? PAGE_ROWS : null,
          }
        : {}),
    };
    render();
    // The question just answered is now stored (qcache), but the Asked tab's
    // count and list come from state.asked, loaded once at bootstrap. Without
    // this it only appeared there after a full page reload.
    loadAsked(render);
  }

  /**
   * ⌘K over real accounts.
   *
   * The palette used to filter only the prototype's sample companies, so
   * searching for a real customer found nothing. This queries the live index
   * and registers each hit in CUST, which is what lets the company page open
   * for an account that was never on the logo wall.
   *
   * `seq` guards against a slow response for "fal" landing after a fast one
   * for "falcon" and overwriting the newer results.
   */
  let searchSeq = 0;
  async function searchCompanies(q, bag, limit) {
    const mine = ++searchSeq;
    let rows = [];
    try {
      const data = await get(
        "/api/pulse/search?q=" + encodeURIComponent(q) + (limit ? "&limit=" + limit : ""),
      );
      rows = data.rows || [];
      state.searchMore = data.nextCursor != null;
    } catch (err) {
      console.warn("[pulse] search failed:", err.message);
      return null;
    }
    if (mine !== searchSeq) return null; // a newer query has since been typed

    rows.forEach((a) => {
      bag.CUST[a.name] = bag.CUST[a.name] || toCustStub(a);
      state.ids[a.name] = a.id;
    });
    return rows;
  }

  /**
   * Load more accounts onto the logo wall.
   *
   * The wall showed the first forty of ten thousand with no way forward. The
   * accounts endpoint already paged; nothing consumed the cursor.
   */
  async function loadMoreAccounts(bag, render) {
    if (state.wallNext == null) return;
    try {
      const data = await get("/api/pulse/accounts?limit=40&cursor=" + state.wallNext);
      const onWall = new Set(bag.BOOK.map((row) => row[1]));
      (data.rows || []).forEach((a) => {
        if (onWall.has(a.name)) return;
        bag.CUST[a.name] = bag.CUST[a.name] || toCustStub(a);
        state.ids[a.name] = a.id;
        bag.BOOK.push(toBookRow(a));
      });
      state.wallNext = data.nextCursor ?? null;
      render();
    } catch (err) {
      console.warn("[pulse] more accounts failed:", err.message);
    }
  }

  /**
   * Load more of one of the two per-account feeds — notes or recent activity.
   * `which` is "notes" or "recently".
   *
   * People are not here: `ms_invite_member` returns everybody a company has
   * invited and that is a handful, so the whole list comes with the page.
   */
  async function loadMoreAccountFeed(which, bag, render) {
    const name = bag.S.cust;
    const c = name && bag.CUST[name];
    const id = state.ids[name];
    if (!c || !id) return;
    const cursor = which === "notes" ? c.__noNext : c.__evNext;
    if (cursor == null) return;
    const param = which === "notes" ? "commentsFrom" : "activityFrom";
    try {
      const d = await get(`/api/pulse/accounts/${id}?${param}=${cursor}`);
      if (which === "notes") {
        c.no = (c.no || []).concat((d.comments || []).map((m) => [m.by, m.text.slice(0, 90), "noted " + m.when]));
        c.__noNext = d.commentsNext ?? null;
      } else {
        c.ev = c.ev.concat((d.activity || []).map((a) => [a.when, a.what]));
        c.__evNext = d.activityNext ?? null;
      }
      render();
    } catch (err) {
      console.warn("[pulse] more " + which + " failed:", err.message);
    }
  }

  /** Load more suppressed signups onto the Filtered feed. */
  /** Load more rows onto the audit feed. */
  async function loadMoreAudit(bag, render) {
    if (state.auditNext == null || state.auditLoadingMore) return;
    // Was still writing into bag.AUTO.audit.f — the mock object's own field —
    // which loadAudit stopped reading from the moment state.audit became the
    // real source of truth. The fetch was succeeding; the button just never
    // showed it, because nothing renders that field any more.
    state.auditLoadingMore = true;
    render();
    try {
      const data = await get("/api/pulse/audit?view=staff&limit=25&cursor=" + state.auditNext);
      state.audit.f = state.audit.f.concat(
        (data.rows || []).map((r) => [r.when, r.actor + " " + r.what, r.detail, "config", "config"]),
      );
      state.auditNext = data.nextCursor ?? null;
    } catch (err) {
      console.warn("[pulse] more audit failed:", err.message);
    } finally {
      state.auditLoadingMore = false;
      render();
    }
  }

  /**
   * The score band and the board.
   *
   * One request per scope, cached — the board is a bounded scoring pass over a
   * page of accounts and costs about a second, so switching scope back and
   * forth must not re-run it. Fetched after the first paint: Now is readable
   * without it, and the sample board is what shows until it lands.
   */
  /* ── how you write ────────────────────────────────────────────────────────
     Onboarding step 3 and the profile page both draw this. It was a hardcoded
     array of five, the same for everybody and reset by a reload; it is one
     row per trait per person now (pulse_user_voice, migrations/010). */
  state.voice = { traits: [], edited: false, loaded: false, error: null };

  function applyVoice(d, bag) {
    state.voice.traits = (d.traits || []).map((t) => t.trait);
    state.voice.edited = Boolean(d.edited);
    state.voice.loaded = true;
    state.voice.error = null;
    /* The renderer reads ONBSTATE.traits directly in a couple of places, so
       it is kept pointing at the same list rather than left to drift. */
    if (bag && bag.setVoice) bag.setVoice(state.voice.traits);
  }

  async function loadVoice(bag, render) {
    if (state.voice.loaded) return;
    try {
      applyVoice(await get("/api/pulse/voice"), bag);
    } catch (err) {
      /* Not fatal to onboarding: the step still renders, with the defaults and
         a line saying they are not being saved. */
      state.voice.error = err.message;
      state.voice.loaded = true;
      console.warn("[pulse] voice failed:", err.message);
    }
    render();
  }

  /**
   * The last 10 Gmail messages for Profile's "Recent mail" panel. Same
   * loaded-once-then-cached shape as loadVoice: cheap the first time, no
   * reason to refetch every time the tab re-renders.
   */
  async function loadGmailRecent(bag, render) {
    if (state.gmailRecentLoaded) return;
    try {
      const data = await get("/api/pulse/gmail/recent");
      state.gmailRecent = data.mails;
      state.gmailRecentError = null;
    } catch (err) {
      state.gmailRecentError = err.message;
      console.warn("[pulse] gmail recent failed:", err.message);
    }
    state.gmailRecentLoaded = true;
    render();
  }

  /* ── triggers ─────────────────────────────────────────────────────────────
     The listening half of ViaSocket: Gmail tells Pulse something happened
     rather than Pulse asking. `catalogue` is what could be subscribed to,
     `subscriptions` is what this member already subscribed to, and `since` is
     the event-id high-water mark the poll below carries.

     `since` starts at whatever the server says is current rather than at 0, so
     opening the page announces what arrives from now on instead of replaying
     every mail already in the table as a burst of toasts. */
  state.triggers = {
    loaded: false, loading: false, error: null,
    configured: true, connected: false,
    catalogue: [], subscriptions: [],
    since: 0, busy: null,
  };

  async function loadTriggers(bag, render, force) {
    const t = state.triggers;
    if (t.loading || (t.loaded && !force)) return;
    t.loading = true;
    try {
      const data = await get("/api/pulse/triggers?service=gmail");
      t.catalogue = data.catalogue || [];
      t.subscriptions = data.subscriptions || [];
      t.connected = Boolean(data.connected);
      t.configured = data.configured !== false;
      /* Only ever moved forward. A refresh mid-session must not rewind the
         cursor and re-toast what has already been shown. */
      if (!t.since) t.since = Number(data.since || 0);
      t.error = null;
    } catch (err) {
      /* Cleared, not left holding the last good answer: a stale catalogue
         rendered after a failed refresh is a list of triggers that may no
         longer exist, with nothing on screen saying the refresh failed. */
      t.catalogue = [];
      t.subscriptions = [];
      t.error = err.message;
      console.warn("[pulse] triggers failed:", err.message);
    }
    t.loading = false;
    t.loaded = true;
    render();
  }

  async function subscribeTrigger(triggerId, bag, render) {
    const t = state.triggers;
    t.busy = triggerId;
    t.error = null;
    render();
    const loadingId = window.pulseToast ? window.pulseToast.loading("Subscribing…") : null;
    try {
      const data = await post("/api/pulse/triggers", { triggerId, service: "gmail" });
      if (window.pulseToast) {
        if (loadingId) window.pulseToast.dismiss(loadingId);
        window.pulseToast.success("Now listening for " + (data.label || "that event") + ".");
      }
      await loadTriggers(bag, render, true);
    } catch (err) {
      t.error = err.message;
      if (window.pulseToast) {
        if (loadingId) window.pulseToast.dismiss(loadingId);
        window.pulseToast.error(err.message);
      }
    }
    t.busy = null;
    render();
  }

  async function unsubscribeTrigger(id, bag, render) {
    const t = state.triggers;
    t.busy = "sub-" + id;
    render();
    const loadingId = window.pulseToast ? window.pulseToast.loading("Stopping…") : null;
    try {
      await send("DELETE", "/api/pulse/triggers", { id });
      if (window.pulseToast) {
        if (loadingId) window.pulseToast.dismiss(loadingId);
        window.pulseToast.success("Stopped listening.");
      }
      await loadTriggers(bag, render, true);
    } catch (err) {
      t.error = err.message;
      if (window.pulseToast) {
        if (loadingId) window.pulseToast.dismiss(loadingId);
        window.pulseToast.error(err.message);
      }
    }
    t.busy = null;
    render();
  }

  /**
   * Ask what has landed, and toast it.
   *
   * Started once and left running for the life of the page. It polls rather
   * than holding a socket open because Pulse runs on serverless compute where
   * a long-lived connection has nowhere to live — and a toast a few seconds
   * late is not a defect.
   *
   * A failed poll is swallowed on purpose. This runs every fifteen seconds
   * forever; a network blip must not put an error toast on screen, and nothing
   * is lost because the cursor only advances on a successful read.
   */
  let triggerPollTimer = null;
  function startTriggerPolling(render, everyMs) {
    if (triggerPollTimer) return;
    const tick = async () => {
      const t = state.triggers;
      /* Nothing subscribed means nothing can arrive — skip the round trip
         rather than polling an endpoint that can only ever answer empty. */
      if (!t.since || !t.subscriptions.some((s) => s.state === "active")) return;
      try {
        const data = await get("/api/pulse/triggers/events?since=" + encodeURIComponent(t.since));
        (data.events || []).forEach((e) => {
          if (window.pulseToast) {
            window.pulseToast.success(e.summary ? e.label + ": " + e.summary : e.label);
          }
        });
        if (data.since) t.since = Number(data.since);
        if (data.events && data.events.length) render();
      } catch {
        /* See above: a blip is not news. */
      }
    };
    triggerPollTimer = setInterval(tick, everyMs || 15000);
  }

  async function addVoiceTrait(trait, bag, render) {
    const value = (trait || "").trim();
    if (value.length < 2) return;
    try {
      applyVoice(await post("/api/pulse/voice", { trait: value }), bag);
    } catch (err) {
      state.voice.error = err.message;
      console.warn("[pulse] adding a trait failed:", err.message);
    }
    render();
  }

  async function removeVoiceTrait(trait, bag, render) {
    try {
      applyVoice(await send("DELETE", "/api/pulse/voice?trait=" + encodeURIComponent(trait)), bag);
    } catch (err) {
      state.voice.error = err.message;
      console.warn("[pulse] removing a trait failed:", err.message);
    }
    render();
  }

  /* ── reassignment ─────────────────────────────────────────────────────────
     Ownership lives in MSG91's `user_handled_by`, which Pulse may only read, so
     a reassignment is recorded on Pulse's side (pulse_account_owner) and laid
     over MSG91's answer when an account is read. See migrations/009.

     `state.reassign` is what the sheet draws itself from: the unowned pile and
     the suggested split when it opens on "Unassigned", the outcome of the last
     save either way. It is kept here rather than in the renderer because the
     sheet is rebuilt on every render and would otherwise forget what it was
     told the moment anything else on the page changed. */
  state.reassign = { open: null, single: false, pick: null, loading: false, error: null, saved: null, pile: null, reps: null };

  /** Open the sheet. `name` is a company, or "Unassigned" for the whole pile. */
  function openReassign(name, single, bag, render) {
    const r = state.reassign;
    r.open = name;
    r.single = Boolean(single) && name !== "Unassigned";
    r.error = null;
    r.saved = null;
    /* Pre-selected to whoever holds it now, so "Reassign" on an account that
       already has an owner does not start from nothing and make you hunt for
       the name you are replacing. */
    const c = bag.CUST[name];
    r.pick = r.single && c && c.ownerId ? c.ownerId : null;
    render();
    if (!r.single && !r.pile) loadPile(bag, render);
    if (!r.reps) loadAssignable(render);
  }

  /**
   * Everyone this account may be handed to.
   *
   * The sheet used to draw the standings, which are built from who already owns
   * something — so a rep with no accounts was not in the list and there was no
   * way to give them their first one. Fetched once per session and kept, since
   * it changes only when somebody joins the team.
   */
  /**
   * Re-read the standings after a reassignment.
   *
   * Every rep in them carries a book size, and a reassignment has just changed
   * two of those numbers. The bulk path re-boots, which covers this among much
   * else; one account is not worth ten requests, so this is the one that moved.
   */
  async function loadStandings(bag, render) {
    try {
      const d = await get("/api/pulse/team?view=standings");
      applyStandings(d.standings || [], bag);
    } catch (err) {
      console.warn("[pulse] standings refresh failed:", err.message);
    }
    render();
  }

  async function loadAssignable(render) {
    try {
      const d = await get("/api/pulse/team?view=assignable&limit=200");
      state.reassign.reps = (d.rows || []).map((r) => [
        r.name,
        r.initials,
        [
          `${r.accounts.toLocaleString("en-IN")} account${r.accounts === 1 ? "" : "s"}`,
          r.email,
        ]
          .filter(Boolean)
          .join(" · "),
        r.isMe ? 1 : 0,
        r.id,
      ]);
    } catch (err) {
      /* Not fatal: the sheet falls back to the standings, which is the list it
         drew before this existed. Short by whoever owns nothing, and said so. */
      console.warn("[pulse] assignable reps failed:", err.message);
    }
    render();
  }

  function closeReassign(render) {
    state.reassign.open = null;
    state.reassign.error = null;
    state.reassign.saved = null;
    render();
  }

  /** Choose a rep in the sheet. Ids, not list positions — the list re-sorts. */
  function pickRep(id, render) {
    const r = state.reassign;
    /* Clicking the selected rep again clears it, which is how you say "take
       this off everybody" without a separate button for it. */
    r.pick = r.pick === id ? null : id;
    r.error = null;
    render();
  }

  /** The unowned pile and the split Pulse suggests for it. */
  async function loadPile(bag, render) {
    const r = state.reassign;
    r.loading = true;
    render();
    try {
      r.pile = await get("/api/pulse/reassign?limit=200");
    } catch (err) {
      r.error = err.message;
      console.warn("[pulse] unowned pile failed:", err.message);
    }
    r.loading = false;
    render();
  }

  /**
   * Save one account's new owner.
   *
   * `pick` of null is a real answer — the account is taken off everybody — so
   * this never refuses on an empty selection. The account page is reloaded
   * from the server afterwards rather than patched here: the owner shown has
   * to be the one the database will give the next person to open it.
   */
  async function saveReassign(bag, render) {
    const r = state.reassign;
    const name = r.open;
    const id = state.ids[name];
    if (!id) {
      r.error = name + " is one of the prototype's sample companies, so there is no account to reassign.";
      render();
      return;
    }
    r.loading = true;
    r.error = null;
    render();
    try {
      const d = await send("PUT", "/api/pulse/accounts/" + id + "/owner", { ownerId: r.pick });
      const c = bag.CUST[name];
      if (c) {
        c.owner = d.owner ? d.owner.name : "";
        c.ownerId = d.owner ? d.owner.id : null;
        c.ownerSource = d.source || "pulse";
        c.ownerBefore = d.before || null;
      }
      /* The wall row carries "no owner" as its hot flag, so it has to move too
         or the company stays lit on Now after being given to somebody. */
      const row = bag.BOOK.find((b) => b[1] === name);
      if (row) row[5] = d.owner ? 0 : 1;
      /* Left open, showing what happened. Closing on success put the outcome
         nowhere: the message was drawn only on a company page, so reassigning
         from a card on Now reported nothing at all, and the page it *was* drawn
         on did not check which account it belonged to — reassign one company,
         open another, and the second claimed the first one's new owner. */
      r.saved = d.owner
        ? name + " is now owned by " + d.owner.name + "."
        : name + " is now owned by nobody.";
      /* Every name in the picker carries a book size, and one of them just
         changed. Dropped rather than patched, so the next open reads it. */
      r.reps = null;
      loadStandings(bag, render);
    } catch (err) {
      r.error = err.message;
      console.warn("[pulse] reassign failed:", err.message);
    }
    r.loading = false;
    render();
  }

  /**
   * Apply the whole suggested split — every country group to its incumbent.
   *
   * Groups with no incumbent are skipped rather than dealt out to fill the
   * gap, and how many were skipped is said out loud: silently reassigning
   * two hundred accounts and eight hundred not is the kind of half-success
   * that costs a week to unpick.
   */
  async function applySplit(bag, render) {
    const r = state.reassign;
    if (!r.pile) return;
    const assignments = [];
    let skipped = 0;
    for (const g of r.pile.groups || []) {
      if (!g.suggested) { skipped += g.accounts; continue; }
      for (const accountId of g.accountIds) assignments.push({ accountId: accountId, ownerId: g.suggested.id });
    }
    if (!assignments.length) {
      r.error = "None of these countries has a rep already working it, so there is nothing to suggest.";
      render();
      return;
    }
    await applyAssignments(assignments, skipped, bag, render);
  }

  /** Give every account in the pile to one rep. */
  async function applyPileToOne(bag, render) {
    const r = state.reassign;
    if (!r.pile || r.pick == null) {
      r.error = "Pick who gets them first.";
      render();
      return;
    }
    const assignments = (r.pile.accounts || []).map((a) => ({
      accountId: a.id,
      accountName: a.name,
      ownerId: r.pick,
    }));
    await applyAssignments(assignments, 0, bag, render);
  }

  async function applyAssignments(assignments, skipped, bag, render) {
    const r = state.reassign;
    r.loading = true;
    r.error = null;
    render();
    try {
      const d = await post("/api/pulse/reassign", { assignments: assignments });
      r.saved =
        d.moved +
        " account" + (d.moved === 1 ? "" : "s") + " reassigned" +
        (skipped ? ", " + skipped + " left alone — no rep already works those countries" : "") +
        ".";
      r.pile = null;
      r.reps = null;
      r.pick = null;
      /* The wall, the counts and the standings all read ownership, and all
         three are now wrong. Refetching is cheaper than patching each. */
      /* `boot` is a method on the returned object, not a binding in here. */
      window.PulseLive.boot(bag, render).catch(() => {});
    } catch (err) {
      r.error = err.message;
      console.warn("[pulse] bulk reassign failed:", err.message);
    }
    r.loading = false;
    render();
  }

  const boards = {};
  async function loadBoard(scope, bag, render) {
    if (boards[scope] !== undefined) {
      state.boardLoaded = true;
      bag.setBoard(boards[scope]);
      render();
      return;
    }
    boards[scope] = null;
    // Health is scored per scope and takes seconds against a remote database.
    // Until it lands, the band counts must not show the prototype's numbers —
    // that is the section that made the page look like it changed its mind.
    state.boardLoaded = false;
    try {
      const d = await get("/api/pulse/board?scope=" + encodeURIComponent(scope));
      boards[scope] = d.board || null;
      if (boards[scope]) {
        // The route only ever scores a first page (see app/api/pulse/board/route.ts).
        // Carried on the board object itself so every renderer that already
        // reads `board.*` picks this up without a second wire to thread through.
        boards[scope].truncated = !!d.truncated;
        boards[scope].pageLimit = d.limit;
        state.real.push(
          "health for " +
            d.board.total +
            " accounts (ms_trans + ms_text_bal, weighted)",
        );
      }
      state.boardLoaded = true;
      bag.setBoard(boards[scope]);
      render();
    } catch (err) {
      // Failed is not pending, and must repaint to say so — leaving boardLoaded
      // true without a render() left the skeleton up (or, worse, whatever the
      // previous scope had drawn) looking like the real answer forever.
      state.boardLoaded = true;
      delete boards[scope];
      console.warn("[pulse] board failed:", err.message);
      render();
    }
  }

  return {
    clearBreaker,
    loadFlight,
    loadAsked,
    searchQuestions,
    buildAutomation,
    loadEventCatalogue,
    retireAutomation,
    deleteAutomation,
    loadAutomationHistory,
    loadAutomations,
    loadAccountById,
    claimAccount,
    trackCard,
    loadDrafted,
    loadSuppressed,
    checkBulk,
    createBulk,
    loadDoneCompany,
    logWhatHappened,
    loadMotionRules,
    saveMotionRule,
    retireMotionRule,
    testMotionRule,
    loadAlerts,
    loadMonthly,
    loadVerdict,
    loadManifest,
    addRule,
    editRule,
    retireRule,
    loadDrafts,
    releaseDraft,
    sendDraft,
    discardDraft,
    setSendingPaused,
    unsuppress,
    loadAutopilot,
    revealCommercial,
    loadMoreAccounts,
    loadMoreAudit,
    loadMoreActivity,
    loadMoreAccountFeed,
    /* Tags. These three were written but never put on the object, so every
       "Add a tag" click died on `PulseLive.addTags is not a function` and the
       ✕ on a tag did nothing at all. */
    loadTags,
    addTags,
    removeTag,
    flagHealthScore,
    loadContacts,
    addContact,
    removeContact,
    /* Reassignment. Real now: it writes to pulse_account_owner and the page
       reads its own write back. */
    loadVoice,
    addVoiceTrait,
    removeVoiceTrait,
    loadGmailRecent,
    /* Triggers — the listening half of ViaSocket. */
    loadTriggers,
    subscribeTrigger,
    unsubscribeTrigger,
    startTriggerPolling,
    openReassign,
    closeReassign,
    pickRep,
    saveReassign,
    applySplit,
    applyPileToOne,
    askCustom,
    searchCompanies,
    /**
     * Load the next page of the answer on screen.
     *
     * A typed answer already holds every row it will ever have, so paging it is
     * a local slice. A saved question pages against the database.
     */
    loadMoreAnswer(id, bag, render) {
      const a = bag.ASK[id];
      if (a && a.allBrk) {
        a.brk = a.allBrk.slice(0, a.brk.length + PAGE_ROWS);
        render();
        return;
      }
      if (a && a.allRows) {
        a.rows = a.allRows.slice(0, a.rows.length + PAGE_ROWS);
        a.nextCursor = a.allRows.length > a.rows.length ? a.rows.length : null;
        render();
        return;
      }
      return loadAnswer(id, bag, render, true);
    },
    /**
     * Fetch and apply. `bag` carries references to the renderer's data objects;
     * `render` is the renderer's own entry point.
     */
    /**
     * The cards on Now. Its own method rather than an inline fetch inside
     * boot() so the "Try again" the failure state offers can call exactly the
     * same path, instead of re-running the whole bootstrap to retry one query.
     */
    loadCards(bag, render) {
      state.cardsError = null;
      state.cardsLoaded = false;
      render();
      return get("/api/pulse/cards?per=4")
        .then((c) => {
          applyCards(c.cards, bag);
          state.cardsLoaded = true;
          render();
          this.report();
        })
        .catch((err) => {
          console.warn("[pulse] cards failed:", err.message);
          /* Failed is not pending — but it is not "here are some cards"
             either. This used to fall through to whatever bag.CARDS still
             held, which is the prototype's seven sample cards plus the
             sample duplicate-signup card spliced in after them. A failed
             request therefore put eight invented accounts on the main
             screen, captioned as live work, with nothing to tell a reader
             they were not real.

             Clear them and say what happened. An empty board with an honest
             error is worth more than a full one that is fiction. */
          bag.CARDS.length = 0;
          state.cardsError = err.message;
          state.cardsLoaded = true;
          render();
          this.report();
        });
    },
    checkConnections,
    async boot(bag, render) {
      /* Before anything else: neither light may sit on "checking" if the very
         first request is the one that fails. */
      checkConnections();
      /* Once. `boot` is called again after a bulk reassignment to re-read the
         wall and the standings, and every one of those calls used to start
         another 60-second poller that nothing ever cleared — two health
         requests a minute became four, then six. */
      if (!state.connectionPoll) state.connectionPoll = setInterval(checkConnections, 60_000);
      try {
        const data = await get("/api/pulse/bootstrap");
        apply(data, bag);
        render();

        /* ── loaded in the order the page is read ────────────────────────
           These twelve requests used to be fired in one burst, in an order
           that was very nearly the reverse of the order they appear on
           screen: loadCards first, and loadMonthly and loadAlerts — which
           fill the headline and the alert band at the very top — dead last.
           Whichever request happened to be quickest painted first, so the
           page filled from the bottom up and the top of it kept arriving
           after the reader had already scrolled past.

           Now they go in tiers matching the layout of Now, top to bottom:

             1  the headline, the alert band, the score band, the cards
                — everything above the fold
             2  in-flight and held drafts — the sections just below it
             3  the surfaces that are not on this page at all (Ask,
                Autopilot, the audit log, the manifest, the rules)

           Within a tier they still run concurrently, so this costs no wall
           clock against the old burst — what changes is which requests get
           the connection first when they contend. Between tiers it waits,
           which is what stops a request for a screen nobody is looking at
           from delaying the screen they are.

           allSettled: a tier that fails must not strand the tiers behind it.
           Each loader already reports its own failure to its own surface. */

        // 1 · above the fold, in the order it is read.
        await Promise.allSettled([
          loadMonthly(bag, render),                 // head — the digest headline
          loadAlerts(render),                       // sysband — the alert band
          loadBoard(bag.S.scope, bag, render),      // sband — the score band
          this.loadCards(bag, render),              // body — the cards
          ...(bag.S.scope === "company" ? [loadDoneCompany(bag, render)] : []),
        ]);

        // 2 · the sections immediately below it.
        await Promise.allSettled([
          loadFlight(bag, render),                  // flightSec — in flight
          loadDrafts(bag, render),                  // roomSec — held drafts
        ]);

        // 3 · other surfaces. Cheap, and they make the first click instant —
        // but not at the cost of the screen actually on display.
        await Promise.allSettled([
          state.defaultAsk ? loadAnswer(state.defaultAsk, bag, render) : null,
          loadManifest(bag, render),
          loadMotionRules(render),
          loadAutomations(render),
          loadAsked(render),
          // Autopilot's own decisions first, then the staff audit log. Both
          // write to the Filtered tab and the real suppressions must land last.
          loadAutopilot(bag, render).then(() => loadAudit(bag, render)),
        ]);
      } catch (err) {
        state.error = err.message;
        /* Bootstrap failed, so apply() never ran and every collection still
           holds whatever sample data it started with. Saying so in a
           dismissable banner was not enough — the banner is one line above a
           full screen of fiction, and dismissing it left the fiction.

           Emptied instead. The surfaces already know how to render "nothing
           here", and the error state below says why there is nothing. */
        bag.CARDS.length = 0;
        bag.BOOK.length = 0;
        Object.keys(bag.CUST).forEach((k) => delete bag.CUST[k]);
        state.cardsLoaded = true;
        state.mock = [];
        console.error(
          "[pulse] live data unavailable — showing empty/error states, not sample data:",
          err.message,
        );
        render();
        updateMockBanner();
      }
    },
    loadAnswer,
    recomputeAnswer,
    loadAccount,
    loadBoard,
    state,
    report() {
      const lines = ["%c[pulse] live from MySQL:%c"].concat(state.real.map((r) => "  ✓ " + r));
      if (state.mock.length) {
        lines.push("still the prototype's sample data:");
        state.mock.forEach((m) => lines.push("  · " + m));
      }
      console.log(lines.join("\n"), "font-weight:bold", "font-weight:normal");
      updateMockBanner();
    },
  };
})();
