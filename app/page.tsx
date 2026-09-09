import Script from "next/script";
import { redirect } from "next/navigation";

import { gate } from "@/lib/pulse/guard";
import AccessRemoved from "./access-removed";

/**
 * Pulse, behind the invite list.
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
export default async function Page() {
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
            {me?.name ?? "Pulse"} <span className="avi">{me?.initials ?? "··"}</span>
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
            <button data-admin="">Admin · products, rates, team</button>
            <div className="sp"></div>
            <div className="hd2">Access</div>
            {/* Pulse is invite-only, so the list of who is in is a surface, not
                a setting buried in a config file. Everyone who is in can see it
                and can invite. */}
            <button data-members="">Members · who can sign in</button>
            <div className="sp"></div>
            <button data-signout="" style={{ color: "var(--muted)" }}>Sign out</button>
          </div>
        </div>
      </header>

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
          <span className="brand">
            <span className="mark">P</span> Pulse
          </span>
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

      {/* The live-data layer must be defined before the renderer runs. */}
      <Script src="/pulse-live.js" strategy="afterInteractive" />
      <Script src="/pulse.js" strategy="afterInteractive" />
      {/* Session upkeep, sign out, and the members sheet. Last, so the menu it
          binds to and the sheet markup it fills are both already there. */}
      <Script src="/pulse-auth.js" strategy="afterInteractive" />
    </>
  );
}
