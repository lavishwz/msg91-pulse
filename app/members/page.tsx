import { redirect } from "next/navigation";

import { gate } from "@/lib/pulse/guard";
import AccessRemoved from "../access-removed";
import MembersClient from "./members-client";

export const metadata = { title: "Members · MSG91 Pulse" };

/**
 * /members — who can sign in to Pulse, as a real page.
 *
 * This used to be a sheet (public/pulse-auth.js's `#ov`/`#ovb` overlay,
 * opened from the account menu and closed with the rest of the app hidden
 * behind it) rather than a route of its own — no address bar entry, no
 * refresh-and-land-back-here, no link anybody could send a teammate. Pulse is
 * invite-only, and the one screen that answers "who is actually on the list"
 * deserves to be a place, not a popup.
 *
 * Auth follows pulse-shell.tsx's pattern exactly: middleware.ts has already
 * confirmed the session is valid; `gate(false)` re-checks the invite list
 * itself (that answer lives in MySQL, which the Edge runtime cannot reach) and
 * does not try to extend the session — extending happens once, from
 * pulse-auth.js's refresh loop, on every route including this one.
 */
export default async function MembersPage() {
  const result = await gate(false);
  if (result.state === "anonymous") redirect("/login");
  if (result.state === "revoked") return <AccessRemoved email={result.session.user.email} />;

  const me = result.session.user;

  return (
    <>
      <header className="top members-top">
        <a className="brand" href="/" aria-label="Pulse home">
          <span className="mark">P</span> Pulse
        </a>
        <nav className="members-nav" aria-label="Primary navigation">
          <a href="/">Now</a>
          <a href="/ask">Ask</a>
          <a href="/profile">Profile</a>
        </nav>
        <a className="who" href="/profile" aria-label="Open your profile">
          {me.name} <span className="avi">{me.initials}</span>
        </a>
      </header>
      <main className="wrap">
        <div className="mempage">
          <a className="back" href="/">
            ← Back to Pulse
          </a>
          <h1>Members</h1>
          <p className="sub">
            Pulse is invite-only: an MSG91 login is not enough, the address has to be on this
            list. Remove somebody and their open session stops working within a few minutes.
          </p>
          <MembersClient />
        </div>
      </main>
    </>
  );
}
