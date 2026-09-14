import Script from "next/script";
import { redirect } from "next/navigation";

import { gate } from "@/lib/pulse/guard";
import AccessRemoved from "./access-removed";

/* Fixed for the life of this server process, so it changes exactly on every
   deploy/restart and never mid-session — enough to bust a stale cached copy
   of the client scripts without churning the URL on every request. */
const BUILD_ID = String(Date.now());

/**
 * Pulse, behind the invite list.
 *
 * Every route renders this same shell — `/`, `/company/<name>`, `/ask/<q>`,
 * `/autopilot/<tab>`, `/profile`. The screens themselves are drawn by
 * public/pulse.js on the client; what the path does is tell it which one to
 * open on load, and give the browser's Back button somewhere to go back to.
 * The route files are one line each and exist only so those addresses resolve
 * on the server instead of 404ing on a refresh or a pasted link.
 *
 * middleware.ts has already established that the caller holds a valid session
 * before this renders. What is checked here is the other half — that the person
 * is *still* invited — because that answer lives in MySQL and middleware runs
 * on the Edge runtime (see lib/pulse/guard.ts).
 *
 * `gate(false)`: a Server Component render may not write cookies, so the
 * session is checked but not extended here. Extending is public/pulse-auth.js's
 * first act on load, through POST /api/auth/refresh.
 */
export default async function PulseShell() {
  const result = await gate(false);
  if (result.state === "anonymous") redirect("/login");
  if (result.state === "revoked") return <AccessRemoved email={result.session.user.email} />;

  /* The header used to carry the prototype's name. It carries the person who
     actually signed in now — server-rendered, so it is right on the first
     paint rather than after a fetch. */
  const me =
    result.state === "ok" || result.state === "unavailable"
      ? result.session.user
      : null;

  return (
    <>
      <header className="top">
        <button className="brand" data-nav="now">
          <span className="mark">P</span> Pulse
        </button>
        {/* Search is the centre of the header, not a button beside it — one wide
            bar you can hit from anywhere, exactly as in pulse-v2-game. The nav
            tabs are gone with it: the scope pills on Now are the navigation,
            and Ask and Autopilot live in the account menu. */}
        <div className="askbar" data-pal="" role="button" tabIndex={0}>
          <span>Ask or search anything</span>
          <span className="gr3"></span>
          <span className="kk2">⌘K</span>
        </div>
        <div className="who whow">
          <button id="abtn" style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <span className="whoname">{me?.name ?? "Pulse"}</span>{" "}
            <span className="avi">{me?.initials ?? "··"}</span>
          </button>
          <div className="amenu" id="amenu" hidden>
            <div className="hd2">{me ? `${me.name} · Sales` : "Signed in"}</div>
            <button data-nav="profile">Your profile and connections</button>
            <div className="sp"></div>
            <div className="hd2">Ask</div>
            <button data-nav="ask">Questions and answers</button>
            <div className="sp"></div>
            <div className="hd2">Autopilot</div>
            <button data-nav="auto" data-tab2="activity">What AI is doing now</button>
            <button data-nav="auto" data-tab2="rules">Rules and what it may do</button>
            <button data-nav="auto" data-tab2="connections">What Pulse is connected to</button>
            <button data-nav="auto" data-tab2="audit">Audit log · who saw what</button>
            <div className="sp"></div>
            <button id="startonb">Replay first-run setup</button>
            <div className="sp"></div>
            <div className="hd2">Access</div>
            {/* Pulse is invite-only, so the list of who is in is a surface, not
                a setting buried in a config file. Everyone who is in can see it
                and can invite. A real page (/members) rather than a sheet, so
                it has an address, survives a refresh, and can be linked to a
                teammate. */}
            <a href="/members">Members · who can sign in</a>
            <div className="sp"></div>
            <button data-signout="" style={{ color: "var(--muted)" }}>Sign out</button>
          </div>
        </div>
      </header>

      {/* Sample-data notice. Static markup, filled and shown by pulse-live.js
          once it knows which parts of the bootstrap answer had to fall back
          to the prototype's sample rows (state.mock) — previously that only
          ever reached the console. Sits above the content rather than inside
          #main so a re-render of the current screen never wipes it or a
          dismissal out. */}
      <div className="mockbar" id="mockbar" hidden role="status" aria-live="polite">
        <span className="mockdot" aria-hidden="true"></span>
        <span id="mockmsg"></span>
        <button id="mockx" aria-label="Dismiss">✕</button>
      </div>

      <main className="wrap" id="main" suppressHydrationWarning></main>

      <div className="pal" id="pal" hidden>
        <div className="pb" role="dialog" aria-modal="true" aria-label="Search">
          <div className="pi">
            <span className="kk">⌘K</span>
            <input
              id="pq"
              placeholder="Search companies, people — or ask a question"
              aria-label="Search or ask"
            />
            <span className="kk">esc</span>
          </div>
          <div className="pres" id="pres" suppressHydrationWarning></div>
          <div className="pf">
            <span>↑↓ MOVE</span>
            <span>↵ OPEN</span>
            <span>TYPE A QUESTION TO ASK PULSE</span>
          </div>
        </div>
      </div>
      <div id="tip" role="tooltip" suppressHydrationWarning></div>
      <div className="onb" id="onb" hidden>
        <div className="onbar">
          {/* Looked exactly like the real header's clickable brand button but
              was a bare span with no handler — a home button a person could
              see and click but that did nothing. Wired the same as the real
              one now: data-nav="now" closes onboarding and returns to Now
              (see the [data-nav] handler in public/pulse.js). */}
          <button type="button" className="brand" data-nav="now">
            <span className="mark">P</span> Pulse
          </button>
          <div className="steps" id="osteps" suppressHydrationWarning></div>
          <button className="skip" id="onbx">Close</button>
        </div>
        <div className="onbody">
          <div className="oc" id="oc" suppressHydrationWarning></div>
        </div>
      </div>
      <div className="pk" id="pk" hidden>
        <div className="pkb" id="pkb" role="dialog" aria-modal="true" suppressHydrationWarning></div>
      </div>
      <div className="ov" id="ov" hidden>
        <div className="sh" id="ovb" role="dialog" aria-modal="true" suppressHydrationWarning></div>
      </div>

      {/* Connection status, pinned bottom-left.
          Deliberately not in the header: it is reference, not navigation, and it
          is looked at when something seems wrong rather than on the way to
          somewhere. Bottom-left is where a status bar has lived since every IDE
          and browser put one there, and it stays out of the way of the scope
          pills and the card deck. Fixed rather than page-end so it is legible
          on a deploy without scrolling to find it. */}
      <footer className="dbbar" aria-label="Database connections">
        <span className="dbdots">
          <span
            id="dbdot-msg91"
            className="dbdot"
            data-state="unknown"
            data-tip="Checking MSG91||Asking whether Pulse can reach MSG91's database — the accounts, payments and signups it reads."
            role="status"
            aria-live="polite"
          >
            <i></i>
            <span className="sr">MSG91 database: checking</span>
          </span>
          <span className="dblbl">MSG91</span>
        </span>
        <span className="dbsep"></span>
        <span className="dbdots">
          <span
            id="dbdot"
            className="dbdot"
            data-state="unknown"
            data-tip="Checking the store||Asking whether Pulse can reach the database it writes decisions to."
            role="status"
            aria-live="polite"
          >
            <i></i>
            <span className="sr">Store: checking</span>
          </span>
          <span className="dblbl">Store</span>
        </span>
      </footer>

      {/* Who is signed in, handed to the client before either script runs.
          The profile page is about the person, and it used to learn who that
          was only once /api/pulse/bootstrap answered — until then it drew the
          MSG91 rep whose book is on screen, who is not necessarily the person
          looking at it. Seeding it here means the first paint is already the
          right person. */}
      {me ? (
        <Script id="pulse-me" strategy="beforeInteractive">
          {`window.PULSE_SIGNED_IN_AS=${JSON.stringify(me)}`}
        </Script>
      ) : null}
      {/* The live-data layer must be defined before the renderer runs. A build
          id on the query string means a fix here is never one stale cached
          copy away from looking unfixed — no-cache still asks the browser to
          revalidate, but a copy fetched before that header existed has no
          reason to; a new URL on every deploy leaves it nothing to reuse. */}
      <Script src={`/pulse-live.js?v=${BUILD_ID}`} strategy="afterInteractive" />
      <Script src={`/pulse.js?v=${BUILD_ID}`} strategy="afterInteractive" />
      {/* Session upkeep, sign out, and the members sheet. Last, so the menu it
          binds to and the sheet markup it fills are both already there. */}
      <Script src={`/pulse-auth.js?v=${BUILD_ID}`} strategy="afterInteractive" />
    </>
  );
}
