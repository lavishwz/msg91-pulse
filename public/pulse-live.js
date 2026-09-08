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
  const state = { loaded: false, error: null, real: [], mock: [], me: null, ids: {} };

  /** How many rows of an answer are on screen at once. Matches lib/pulse/ask.ts. */
  const PAGE_ROWS = 50;

  const get = async (path) => {
    const res = await fetch(path, { headers: { accept: "application/json" } });
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
    pe: [],
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
  /** Cards arrive on their own request; see the note in the bootstrap route. */
  function applyCards(cards, bag) {
    if (!cards || !cards.length) {
      state.mock.push("cards (no signals matched right now)");
      return;
    }
    bag.CARDS.length = 0;
    cards.forEach((c) => bag.CARDS.push(toCard(c)));
    state.real.push(cards.length + " cards from live scanners");
  }

  function apply(data, bag) {
    const real = [];
    const mock = [];

    state.me = data.me;
    if (data.me) {
      // The header and the profile page both read a hard-coded name.
      document.querySelectorAll("#abtn").forEach((el) => {
        el.innerHTML =
          escapeHtml(data.me.name) +
          ' <span class="avi">' +
          escapeHtml(data.me.initials) +
          "</span>";
      });
      const hd = document.querySelector(".amenu .hd2");
      if (hd) hd.textContent = data.me.name + " · Sales";
      // The profile page reads its identity from ME.
      if (bag.ME) {
        bag.ME.name = data.me.name;
        bag.ME.email_addr = data.me.email || null;
        bag.ME.accounts = data.me.accounts;
      }
      real.push("who you are (" + data.me.name + ", " + data.me.accounts + " accounts)");
    }

    const wall = (data.wall || []).concat(data.myAccounts || []);
    const seen = new Set();
    const unique = wall.filter((a) => (seen.has(a.id) ? false : seen.add(a.id)));
    if (unique.length) {
      bag.BOOK.length = 0;
      unique.forEach((a) => bag.BOOK.push(toBookRow(a)));
      unique.forEach((a) => {
        bag.CUST[a.name] = bag.CUST[a.name] || toCustStub(a);
        state.ids[a.name] = a.id;
      });
      state.wallNext = data.wallNext ?? null;
      real.push(unique.length + " accounts (ms_user + user_handled_by)");
    }

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
      mock.push("the score itself — weighted to promises and recoveries Pulse does not record yet");
    }

    // Carry the owner name onto every stub so the company header can show it.
    // The reassign sheet listed five invented people. These are the real reps,
    // with the number of accounts each actually owns.
    if (data.standings && data.standings.length && bag.REPS) {
      /* Two admins can share a display name — ms_user.user_fname is not
         unique — so the email goes on the second line. Without it the list
         shows the same name twice and there is no way to tell which person
         you are handing an account to. */
      const seenName = new Map();
      data.standings.forEach((r) => seenName.set(r.name, (seenName.get(r.name) || 0) + 1));
      bag.REPS = data.standings.map((r) => [
        r.name,
        r.initials,
        [
          `${r.accounts.toLocaleString("en-IN")} account${r.accounts === 1 ? "" : "s"}`,
          r.email || (seenName.get(r.name) > 1 ? `id ${r.id}` : ""),
        ]
          .filter(Boolean)
          .join(" · "),
        r.isMe ? 1 : 0,
      ]);
      real.push(`${data.standings.length} real reps in the reassign list`);
    }

    if (data.standings && data.standings.length) {
      bag.STANDINGS.length = 0;
      data.standings.forEach((s) => {
        bag.STANDINGS.push([
          s.name,
          s.initials,
          s.accounts,
          "",
          "up",
          s.isMe ? 1 : 0,
        ]);
      });
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
  async function loadAnswer(id, bag, render, append) {
    const existing = bag.ASK[id];
    const offset = append && existing && existing.nextCursor != null ? existing.nextCursor : 0;
    if (append && !offset) return;
    try {
      const { answer } = await get(
        "/api/pulse/ask?q=" + encodeURIComponent(id) + (offset ? "&offset=" + offset : ""),
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

  /** Replace the audit feed with real staff actions. */
  async function loadAudit(bag, render) {
    try {
      const data = await get("/api/pulse/audit?view=staff&limit=25");
      bag.AUTO.audit.f = data.rows.map((r) => [r.when, r.actor + " " + r.what, r.detail, "config", r.tag]);
      if (data.anomaly) {
        bag.AUTO.audit.sys = [
          "Anomaly",
          data.anomaly.actor +
            " changed " +
            data.anomaly.changes +
            " things across " +
            data.anomaly.accounts +
            " accounts in 24 hours.",
          data.anomaly.note + " Window " + data.anomaly.window + ".",
        ];
      }
      state.auditNext = data.nextCursor ?? null;
      const filtered = await get("/api/pulse/audit?view=filtered&limit=20");
      bag.AUTO.filtered.f = filtered.rows.map((r) => [r.when, r.what, r.why, r.tag, ""]);
      state.filteredNext = filtered.nextCursor ?? null;
      render();
    } catch (err) {
      console.warn("[pulse] audit failed:", err.message);
    }
  }

  /** Enrich a company page with its real detail the first time it is opened. */
  async function loadAccount(name, bag, render) {
    const id = state.ids[name];
    if (!id || !bag.CUST[name] || !bag.CUST[name].__stub) return;
    try {
      const d = await get("/api/pulse/accounts/" + id);
      const c = bag.CUST[name];
      c.__stub = false;
      c.la = (d.routes || []).map((r) => [
        r.product,
        r.balance > 0 ? "active" : "stopped",
        r.balance > 0 ? Math.round(r.balance).toLocaleString("en-IN") + " credits" : "no balance",
      ]);
      c.ev = (d.activity || []).map((a) => [a.when, a.what]);
      c.pe = (d.comments || []).map((m) => [m.by, m.text.slice(0, 90), "noted " + m.when]);
      c.__evNext = d.activityNext ?? null;
      c.__peNext = d.commentsNext ?? null;
      render();
    } catch (err) {
      console.warn("[pulse] account " + id + " failed:", err.message);
    }
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
   * `which` is "people" or "recently".
   */
  async function loadMoreAccountFeed(which, bag, render) {
    const name = bag.S.cust;
    const c = name && bag.CUST[name];
    const id = state.ids[name];
    if (!c || !id) return;
    const cursor = which === "people" ? c.__peNext : c.__evNext;
    if (cursor == null) return;
    const param = which === "people" ? "commentsFrom" : "activityFrom";
    try {
      const d = await get(`/api/pulse/accounts/${id}?${param}=${cursor}`);
      if (which === "people") {
        c.pe = c.pe.concat((d.comments || []).map((m) => [m.by, m.text.slice(0, 90), "noted " + m.when]));
        c.__peNext = d.commentsNext ?? null;
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
  async function loadMoreFiltered(bag, render) {
    if (state.filteredNext == null) return;
    try {
      const data = await get("/api/pulse/audit?view=filtered&limit=20&cursor=" + state.filteredNext);
      bag.AUTO.filtered.f = bag.AUTO.filtered.f.concat(
        (data.rows || []).map((r) => [r.when, r.what, r.why, r.tag, ""]),
      );
      state.filteredNext = data.nextCursor ?? null;
      render();
    } catch (err) {
      console.warn("[pulse] more filtered failed:", err.message);
    }
  }

  /** Load more rows onto the audit feed. */
  async function loadMoreAudit(bag, render) {
    if (state.auditNext == null) return;
    try {
      const data = await get("/api/pulse/audit?view=staff&limit=25&cursor=" + state.auditNext);
      bag.AUTO.audit.f = bag.AUTO.audit.f.concat(
        (data.rows || []).map((r) => [r.when, r.actor + " " + r.what, r.detail, "config", r.tag]),
      );
      state.auditNext = data.nextCursor ?? null;
      render();
    } catch (err) {
      console.warn("[pulse] more audit failed:", err.message);
    }
  }

  return {
    revealCommercial,
    loadMoreAccounts,
    loadMoreAudit,
    loadMoreFiltered,
    loadMoreAccountFeed,
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
    async boot(bag, render) {
      try {
        const data = await get("/api/pulse/bootstrap");
        apply(data, bag);
        render();

        // Cards next: they are the slowest query in the app and Now is useful
        // without them for the second it takes.
        get("/api/pulse/cards?per=4")
          .then((c) => {
            applyCards(c.cards, bag);
            render();
            this.report();
          })
          .catch((err) => {
            console.warn("[pulse] cards failed:", err.message);
            this.report();
          });

        // The question Ask opens on, so the first view of the surface is real.
        if (state.defaultAsk) loadAnswer(state.defaultAsk, bag, render);
        // Autopilot's logs are only needed once that surface is opened, but they
        // are cheap and make the first click instant.
        loadAudit(bag, render);
      } catch (err) {
        state.error = err.message;
        console.error(
          "[pulse] live data unavailable, showing the prototype's sample data instead:",
          err.message,
        );
        render();
      }
    },
    loadAnswer,
    loadAccount,
    state,
    report() {
      const lines = ["%c[pulse] live from MySQL:%c"].concat(state.real.map((r) => "  ✓ " + r));
      if (state.mock.length) {
        lines.push("still the prototype's sample data:");
        state.mock.forEach((m) => lines.push("  · " + m));
      }
      console.log(lines.join("\n"), "font-weight:bold", "font-weight:normal");
    },
  };
})();
