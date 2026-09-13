/**
 * The session, from the browser's side.
 *
 * Three jobs, all of them small:
 *
 *   1. Keep the session alive — and, more to the point, keep it *checked*. Each
 *      refresh re-reads the invite list on the server, so somebody removed from
 *      Pulse stops working within minutes rather than when their token expires.
 *      A 401 back means the answer was "no longer a member": the tab goes to
 *      /login rather than pretending nothing happened.
 *   2. Sign out.
 *   3. The members sheet — who can sign in, and the invite box.
 *
 * Written in the same plain-DOM style as pulse.js and loaded after it, so it
 * can lean on the sheet markup (#ov / #ovb) the renderer already owns.
 */
(function () {
  "use strict";

  /** Often enough that a removal bites quickly; rarely enough to be invisible. */
  const REFRESH_MS = 5 * 60 * 1000;

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  /* Preserve where this tab actually was, the same way middleware.ts's own
     refuse() does for a direct page load — found missing here: a session
     that expired mid-use (checked every 5 minutes, or on tab wake) sent the
     tab to bare "/login", with nothing saying where it had been. Logging
     back in after that landed on Home no matter what page the session
     expired on — indistinguishable from "refresh loses my page," except it
     needed no refresh at all, just time passing while the tab sat open. */
  const toLogin = () => {
    const next = location.pathname + location.search;
    window.location.href = next === "/" ? "/login" : "/login?next=" + encodeURIComponent(next);
  };

  /* ── 1. upkeep ─────────────────────────────────────────────────────────── */

  async function refresh() {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (res.status === 401) {
        toLogin();
        return;
      }
      // A 503 is Pulse failing to reach its own database, not a verdict about
      // this person. Leave the session alone and try again on the next tick.
    } catch (err) {
      console.warn("[pulse] session refresh failed:", err.message);
    }
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
  // A tab that was asleep may have missed several ticks; check on the way back.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });

  /* ── 2. sign out ───────────────────────────────────────────────────────── */

  /**
   * `signOut()` is a real network round trip (`/api/auth/logout`) followed
   * by a full navigation — on a slow connection that is a visible pause with
   * nothing on screen saying a click landed. `btn` is optional: the fallback
   * path some callers use has no element to disable.
   */
  async function signOut(btn) {
    if (btn) {
      btn.disabled = true;
      btn.dataset.origText = btn.textContent;
      btn.textContent = "Signing out…";
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("[pulse] logout call failed:", err.message);
    }
    // Either way: the cookie is gone or the guard will refuse the next request.
    // No need to restore the button — toLogin() navigates away regardless.
    toLogin();
  }

  /* ── 3. members ────────────────────────────────────────────────────────── */
  //
  // Used to live here as a sheet drawn into #ov/#ovb (state, roleCell,
  // memberRow, inviteForm, drawMembers, loadMembers, openMembers, act, invite,
  // changeRole, removeMember — all of it). It is now a real route,
  // app/members/page.tsx + members-client.tsx, calling the same
  // /api/pulse/members endpoints from React state instead of innerHTML. The
  // account-menu entry is a plain link to /members now, not a data-members
  // trigger, so there is nothing left here to wire up.

  /* ── wiring ────────────────────────────────────────────────────────────── */

  /* Capture, because pulse.js's own document click handler closes the account
     menu on the way past and would swallow the target out from under us. */
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;

      const so = t.closest("[data-signout]");
      if (so) {
        e.preventDefault();
        if (so.disabled) return; // already signing out — a second click is not a second sign-out
        signOut(so);
      }
    },
    true,
  );
})();
