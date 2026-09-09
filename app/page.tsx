import Script from "next/script";

export default function Page() {
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
            Rhea Menon <span className="avi">RM</span>
          </button>
          <div className="amenu" id="amenu" hidden>
            <div className="hd2">Rhea Menon · Sales</div>
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
            <button style={{ color: "var(--muted)" }}>Sign out</button>
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

      {/* The live-data layer must be defined before the renderer runs. */}
      <Script src="/pulse-live.js" strategy="afterInteractive" />
      <Script src="/pulse.js" strategy="afterInteractive" />
    </>
  );
}
