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
  const state = { loaded: false, error: null, real: [], mock: [], me: null, ids: {}, cardsLoaded: false, boardLoaded: false, autopilot: null, drafts: [], policy: null, manifest: null, motionRules: null, asked: [], digest: null, verdicts: {}, alerts: [], tagError: null };

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
    /* The caller's Pulse role and what it lets them do. Advisory: the server
       checks the role again on every rule write. */
    state.role = data.role || null;
    /* Every country the customer base is in, for the lens. Not derived from
       the board: the board scores one page and most of it has no country. */
    state.countries = data.countries || null;
    state.can = data.can || {};
    if (data.me) {
      /* The header is NOT written here any more. It carries the person who
         signed in — server-rendered from the session in app/page.tsx — and
         `data.me` is a different thing: the MSG91 rep whose book Pulse is
         showing (PULSE_ME_USER_PID). The two are usually the same person and
         will not always be, and the header has to say who you are signed in
         as. The profile page still reads the rep from ME below. */
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
          "Pulse cannot reach MSG91's database, so every account and number on screen is the prototype's sample data. The host is IP-bound — this copy may not be allowlisted.");
      }
    } catch (err) {
      paintDot("dbdot-msg91", "down", "MSG91 unreachable", "The health check itself failed: " + err.message);
    }
  }

  const checkConnections = () => { checkMsg91(); checkStore(); };

  /** Replace the audit feed with real staff actions. */
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
      bag.AUTO.audit.f = humanRows.concat(
        data.rows.map((r) => [r.when, r.actor + " " + r.what, r.detail, "config", r.tag]),
      );
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
      // The old "abandoned at step N" feed had its own tab and no longer does:
      // suppression is an action type in Activity now, filtered by a chip. The
      // query is dropped rather than kept for a surface nothing renders.
      render();
    } catch (err) {
      console.warn("[pulse] audit failed:", err.message);
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
   * If the store is unreachable the prototype's sample rows stay on screen. A
   * surface that has never decided anything should look like a prototype, not
   * like a broken page.
   */
  async function loadAutopilot(bag, render) {
    try {
      const data = await get("/api/pulse/autopilot/decisions?limit=60");
      if (!data.rows.length) return; // nothing decided yet — leave the sample
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
      console.warn("[pulse] autopilot decisions failed:", err.message);
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
      if (then) then();
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

  /**
   * Save a new rule, with whatever the compiler worked out.
   *
   * `compiled` carries the trigger, conditions and action in the shape the API
   * expects, plus whether the person said to turn it on. Without it the rule is
   * still saved — written down, visible, and marked as not running.
   */
  const addMotionRule = (motion, english, compiled, then) =>
    ruleAction(
      {
        action: "add",
        motion,
        english,
        machine: compiled && compiled.can_compile
          ? {
              when: compiled.when,
              if: compiled.conditions.map((c) => [c.field, c.op, coerce(c.value)]),
              stopIf: (compiled.stop_if || []).map((c) => [c.field, c.op, coerce(c.value)]),
              then: {
                act: compiled.act,
                do: compiled.do,
                reason: compiled.reason || undefined,
                sla_minutes: compiled.sla_minutes || undefined,
                days: compiled.days || undefined,
              },
              live: Boolean(compiled.live),
            }
          : { live: false },
      },
      then,
    );

  /**
   * The compiler returns every value as text, because a schema cannot know
   * which fields are numbers. The runner compares numerically, so "80" has to
   * become 80 — otherwise a score of 92 fails a >= "80" test.
   */
  function coerce(v) {
    if (v === "true") return true;
    if (v === "false") return false;
    if (v !== "" && !isNaN(Number(v))) return Number(v);
    return v;
  }

  /** Turn a sentence into a check. Once, at writing time. */
  async function compileRule(motion, english, cb) {
    try {
      const res = await fetch("/api/pulse/autopilot/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compile", motion, english }),
      });
      const out = await res.json();
      cb(out.ok ? out.compiled : null);
    } catch (err) {
      cb(null);
    }
  }
  const retireMotionRule = (key, then) => ruleAction({ action: "retire", key }, then);

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
      if (!d.rows.length) return;
      bag.FLIGHT.length = 0;
      d.rows.forEach((r) => {
        // The renderer appends the "d" itself, so days stays a number here.
        bag.FLIGHT.push([r.account, r.what, r.ball, r.days, r.old ? 1 : 0, r.doing]);
      });
      state.real.push("in flight (drafts held, timers set, messages out)");
      render();
    } catch (err) {
      console.warn("[pulse] in flight failed:", err.message);
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
         account where you know one person churns at roughly twice the rate. */
      if (Array.isArray(d.people) && d.people.length) {
        c.pe = d.people.map((p) => [p.name, p.email, p.role || "member"]);
      }
      /* Autopilot's own record of this company: what it decided, what it wrote
         and is holding, and what it intends to do next. */
      c.autopilot = d.autopilot || null;
      c.la = (d.routes || []).map((r) => [
        r.product,
        r.balance > 0 ? "active" : "stopped",
        r.balance > 0 ? Math.round(r.balance).toLocaleString("en-IN") + " credits" : "no balance",
      ]);
      c.ev = (d.activity || []).map((a) => [a.when, a.what]);
      c.pe = (d.comments || []).map((m) => [m.by, m.text.slice(0, 90), "noted " + m.when]);
      c.__evNext = d.activityNext ?? null;
      c.__peNext = d.commentsNext ?? null;
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

  /**
   * The score band and the board.
   *
   * One request per scope, cached — the board is a bounded scoring pass over a
   * page of accounts and costs about a second, so switching scope back and
   * forth must not re-run it. Fetched after the first paint: Now is readable
   * without it, and the sample board is what shows until it lands.
   */
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
      // Failed is not pending: fall back to the sample band rather than leaving
      // a skeleton up for ever.
      state.boardLoaded = true;
      delete boards[scope];
      console.warn("[pulse] board failed:", err.message);
    }
  }

  return {
    clearBreaker,
    loadFlight,
    loadAsked,
    searchQuestions,
    compileRule,
    loadMotionRules,
    saveMotionRule,
    addMotionRule,
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
    discardDraft,
    setSendingPaused,
    unsuppress,
    loadAutopilot,
    revealCommercial,
    loadMoreAccounts,
    loadMoreAudit,
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
    checkConnections,
    async boot(bag, render) {
      /* Before anything else: neither light may sit on "checking" if the very
         first request is the one that fails. */
      checkConnections();
      setInterval(checkConnections, 60_000);
      try {
        const data = await get("/api/pulse/bootstrap");
        apply(data, bag);
        render();

        // Cards next: they are the slowest query in the app and Now is useful
        // without them for the second it takes.
        get("/api/pulse/cards?per=4")
          .then((c) => {
            applyCards(c.cards, bag);
            state.cardsLoaded = true;
            render();
            this.report();
          })
          .catch((err) => {
            console.warn("[pulse] cards failed:", err.message);
            // Failed is not pending. Fall back to the prototype's cards rather
            // than leaving a skeleton on screen forever.
            state.cardsLoaded = true;
            render();
            this.report();
          });

        // The score band and the board for the scope Now opens on.
        loadBoard(bag.S.scope, bag, render);

        // The question Ask opens on, so the first view of the surface is real.
        if (state.defaultAsk) loadAnswer(state.defaultAsk, bag, render);
        // Autopilot's logs are only needed once that surface is opened, but they
        // are cheap and make the first click instant.
        // Autopilot's own decisions first, then the staff audit log. Both write
        // to the Filtered tab and the real suppressions must land last.
        loadAutopilot(bag, render).then(() => loadAudit(bag, render));
        loadDrafts(bag, render);
        loadManifest(bag, render);
        loadMotionRules(render);
        loadAsked(render);
        loadFlight(bag, render);
        loadMonthly(bag, render);
        loadAlerts(render);
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
    },
  };
})();
