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

  const toLogin = () => {
    window.location.href = "/login";
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

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("[pulse] logout call failed:", err.message);
    }
    // Either way: the cookie is gone or the guard will refuse the next request.
    toLogin();
  }

  /* ── 3. members ────────────────────────────────────────────────────────── */

  const state = { members: null, me: null, busy: false, msg: null, bad: false, focus: false };

  const ROLE_LABEL = { super_admin: "Super admin", admin: "Admin", member: "Member" };

  /** The invite list is drawn from what the server says this person may do. */
  const can = () => (state.me && state.me.can) || { invite: [], canRemoveOthers: false, canSetRole: false };

  function roleCell(m) {
    const label = ROLE_LABEL[m.role] || m.role;
    // A fixed role is a pill; a changeable one is a select. Same place, same
    // size, so the row does not reflow depending on who is looking at it.
    if (!can().canSetRole || m.founder) {
      return '<span class="pill" data-role="' + esc(m.role) + '">' + esc(label) + "</span>";
    }
    const opts = Object.keys(ROLE_LABEL)
      .map(
        (r) =>
          '<option value="' + r + '"' + (r === m.role ? " selected" : "") + ">" + ROLE_LABEL[r] + "</option>",
      )
      .join("");
    return (
      '<select class="memrole" data-roleid="' + m.id + '" data-was="' + esc(m.role) +
      '" aria-label="Member type for ' + esc(m.email) + '">' + opts + "</select>"
    );
  }

  function memberRow(m) {
    const who = m.name || m.email;
    const initials = (who.match(/\b\w/g) || ["·"]).slice(0, 2).join("").toUpperCase();
    const when = m.lastLoginAt
      ? "last signed in " + new Date(m.lastLoginAt).toLocaleDateString()
      : "has not signed in yet";
    const by =
      m.invitedBy === "system"
        ? "the founding super admin"
        : m.invitedBy === "bootstrap"
          ? "first person in"
          : "invited by " + m.invitedBy;
    const isMe = state.me && m.email.toLowerCase() === state.me.email.toLowerCase();
    // Removal is offered when it would be allowed: others only for admins and
    // above, and yourself always — leaving needs nobody's permission.
    const mayRemove = !m.founder && (isMe || can().canRemoveOthers);
    return (
      '<div class="mem">' +
      '<span class="av2">' + esc(initials) + "</span>" +
      '<span class="tx2"><b>' + esc(who) + (isMe ? " · you" : "") + "</b>" +
      "<span>" + esc(m.email) + " · " + esc(by) + " · " + esc(when) + "</span></span>" +
      '<span class="pill" data-on="' + esc(m.status) + '">' + esc(m.status) + "</span>" +
      roleCell(m) +
      (mayRemove
        ? '<button class="rm" data-rmid="' + m.id + '" data-rmemail="' + esc(m.email) +
          '" aria-label="Remove ' + esc(m.email) + '">' + (isMe ? "Leave" : "Remove") + "</button>"
        : '<span class="rm" aria-hidden="true"></span>') +
      "</div>"
    );
  }

  function inviteForm() {
    const allowed = can().invite;
    if (!allowed.length) {
      return '<div class="memmsg">Only admins and super admins can invite people. Ask one of the people above.</div>';
    }
    const opts = allowed
      .map((r) => '<option value="' + r + '">' + ROLE_LABEL[r] + "</option>")
      .join("");
    return (
      '<form class="memf" id="memform">' +
      '<input id="mememail" type="email" required placeholder="name@msg91.com" aria-label="Email to invite" />' +
      '<select id="memtype" aria-label="Member type">' + opts + "</select>" +
      '<button class="go solid" type="submit" id="memadd">Invite</button>' +
      "</form>" +
      '<div class="memhint">A member uses Pulse. An admin can invite and remove members. ' +
      "A super admin can do that to admins too, and change anybody's type.</div>"
    );
  }

  function drawMembers() {
    const body = $("#ovb");
    if (!body) return;

    let list;
    if (state.members === null) {
      list = '<div class="authwait">Loading the invite list…</div>';
    } else if (!state.members.length) {
      list = '<div class="memmsg">Nobody is on the list yet.</div>';
    } else {
      list = state.members.map(memberRow).join("");
    }

    body.innerHTML =
      "<h3>Members</h3>" +
      '<p class="sub">Pulse is invite-only: an MSG91 login is not enough, the address has to be on this list. ' +
      "Remove somebody and their open session stops working within a few minutes.</p>" +
      list +
      (state.members === null ? "" : inviteForm()) +
      (state.msg ? '<div class="memmsg" data-bad="' + (state.bad ? "1" : "0") + '">' + esc(state.msg) + "</div>" : "") +
      '<div class="row"><button class="go" id="ovx">Close</button></div>';

    const input = $("#mememail");
    if (input && state.focus) input.focus();
  }

  async function loadMembers() {
    try {
      const res = await fetch("/api/pulse/members", { headers: { accept: "application/json" } });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) return toLogin();
      if (!res.ok || body.ok === false) throw new Error(body.error || "HTTP " + res.status);
      state.members = body.members;
      state.me = body.me;
    } catch (err) {
      state.members = [];
      state.msg = "The invite list could not be read: " + err.message;
      state.bad = true;
    }
    drawMembers();
  }

  function openMembers() {
    const menu = $("#amenu");
    if (menu) menu.hidden = true;
    state.members = null;
    state.msg = null;
    state.bad = false;
    state.focus = false;
    drawMembers();
    $("#ov").hidden = false;
    loadMembers();
  }

  /** Every write says what happened in the same place, and then re-reads. */
  async function act(url, options, working, done) {
    if (state.busy) return;
    state.busy = true;
    state.msg = working;
    state.bad = false;
    drawMembers();
    try {
      const res = await fetch(url, options);
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) return toLogin();
      if (!res.ok || body.ok === false) throw new Error(body.error || "HTTP " + res.status);
      state.msg = done;
      state.bad = false;
    } catch (err) {
      state.msg = err.message;
      state.bad = true;
    } finally {
      state.busy = false;
      await loadMembers();
    }
  }

  function invite(email, role) {
    state.focus = true;
    return act(
      "/api/pulse/members",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email, role: role }),
      },
      "Inviting " + email + "…",
      email + " can now sign in as " + (ROLE_LABEL[role] || role).toLowerCase() + ".",
    );
  }

  function changeRole(id, role, email) {
    return act(
      "/api/pulse/members/" + encodeURIComponent(id),
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: role }),
      },
      "Changing " + email + "…",
      email + " is now " + (ROLE_LABEL[role] || role).toLowerCase() + ".",
    );
  }

  async function removeMember(id, email) {
    await act(
      "/api/pulse/members/" + encodeURIComponent(id),
      { method: "DELETE" },
      "Removing " + email + "…",
      email + " can no longer sign in.",
    );
    // Removing yourself is allowed — it is the way out. The refresh notices.
    if (state.me && email.toLowerCase() === state.me.email.toLowerCase() && !state.bad) refresh();
  }

  /* ── wiring ────────────────────────────────────────────────────────────── */

  /* Capture, because pulse.js's own document click handler closes the account
     menu on the way past and would swallow the target out from under us. */
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;

      if (t.closest("[data-signout]")) {
        e.preventDefault();
        signOut();
        return;
      }
      if (t.closest("[data-members]")) {
        e.preventDefault();
        openMembers();
        return;
      }
      const rm = t.closest("[data-rmid]");
      if (rm) {
        e.preventDefault();
        removeMember(rm.dataset.rmid, rm.dataset.rmemail);
      }
    },
    true,
  );

  /* A role select changes on `change`, not on click. `data-was` is what it was,
     so a refused change can be told apart from a no-op. */
  document.addEventListener(
    "change",
    (e) => {
      const sel = e.target;
      if (!(sel instanceof Element) || !sel.matches(".memrole")) return;
      const id = sel.dataset.roleid;
      const next = sel.value;
      if (next === sel.dataset.was) return;
      const row = state.members && state.members.find((m) => String(m.id) === String(id));
      changeRole(id, next, row ? row.email : "that member");
    },
    true,
  );

  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!(form instanceof Element) || form.id !== "memform") return;
      e.preventDefault();
      const input = $("#mememail");
      const type = $("#memtype");
      const email = ((input && input.value) || "").trim().toLowerCase();
      if (email) invite(email, (type && type.value) || "member");
    },
    true,
  );
})();
