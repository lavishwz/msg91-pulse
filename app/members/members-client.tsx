"use client";

/**
 * The invite list, interactive.
 *
 * A straight port of public/pulse-auth.js's members-sheet logic into React —
 * same endpoints (GET/POST /api/pulse/members, PATCH/DELETE
 * /api/pulse/members/[id]), same rules (abilities/denyInvite/denyRemove/
 * denySetRole all still enforced server-side; `can` here only decides what to
 * offer, never what to allow), same CSS classes (.mem/.pill/.memf/.memhint/
 * .memmsg, already styled in globals.css for the old sheet). What changed is
 * the shell: a route instead of an overlay drawn by innerHTML.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "../loader";

type Role = "super_admin" | "admin" | "member";

type Member = {
  id: number;
  email: string;
  name: string | null;
  status: "invited" | "active";
  role: Role;
  founder: boolean;
  invitedBy: string | null;
  invitedAt: string;
  lastLoginAt: string | null;
};

type Can = { invite: Role[]; canRemoveOthers: boolean; canSetRole: boolean };
type Me = { email: string; role: Role; can: Can };

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  member: "Member",
};
const ROLES: Role[] = ["super_admin", "admin", "member"];

function initialsFor(who: string): string {
  const m = who.match(/\b\w/g);
  return (m ? m.slice(0, 2) : ["·"]).join("").toUpperCase();
}

function invitedByLabel(invitedBy: string | null): string {
  if (invitedBy === "system") return "the founding super admin";
  if (invitedBy === "bootstrap") return "first person in";
  return `invited by ${invitedBy}`;
}

export default function MembersClient() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [focusEmail, setFocusEmail] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/pulse/members", { headers: { accept: "application/json" } });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
      setMembers(body.members);
      setMe(body.me);
      setLoadError(null);
    } catch (err) {
      setMembers([]);
      setLoadError(err instanceof Error ? err.message : "The invite list could not be read.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (me && !role) return;
    if (me && !me.can.invite.includes(role)) {
      setRole(me.can.invite[0] ?? "member");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  async function act(url: string, options: RequestInit, working: string, done: string) {
    if (busy) return;
    setBusy(true);
    setMsg({ text: working, bad: false });
    try {
      const res = await fetch(url, options);
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
      setMsg({ text: done, bad: false });
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "That did not work.", bad: true });
    } finally {
      setBusy(false);
      await load();
    }
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr) return;
    setFocusEmail(true);
    await act(
      "/api/pulse/members",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: addr, role }),
      },
      `Inviting ${addr}…`,
      `${addr} can now sign in as ${(ROLE_LABEL[role] || role).toLowerCase()}.`,
    );
    setEmail("");
  }

  async function onChangeRole(m: Member, next: Role) {
    if (next === m.role) return;
    await act(
      `/api/pulse/members/${encodeURIComponent(m.id)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: next }),
      },
      `Changing ${m.email}…`,
      `${m.email} is now ${(ROLE_LABEL[next] || next).toLowerCase()}.`,
    );
  }

  async function onRemove(m: Member) {
    const isSelf = me && m.email.toLowerCase() === me.email.toLowerCase();
    await act(
      `/api/pulse/members/${encodeURIComponent(m.id)}`,
      { method: "DELETE" },
      `Removing ${m.email}…`,
      `${m.email} can no longer sign in.`,
    );
    if (isSelf) router.replace("/login");
  }

  const can: Can = me?.can ?? { invite: [], canRemoveOthers: false, canSetRole: false };

  return (
    <div className="memblock">
      {members !== null &&
        (can.invite.length ? (
          <>
            <form className="memf" onSubmit={onInvite}>
              <input
                type="email"
                required
                placeholder="name@msg91.com"
                aria-label="Email to invite"
                value={email}
                autoFocus={focusEmail}
                disabled={busy}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                aria-label="Member type"
                value={role}
                disabled={busy}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {can.invite.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button className="go solid" type="submit" disabled={busy}>
                Invite
              </button>
            </form>
            <div className="memhint">
              A member uses Pulse. An admin can invite and remove members. A super admin can do
              that to admins too, and change anybody&apos;s type.
            </div>
          </>
        ) : (
          <div className="memmsg">
            Only admins and super admins can invite people. Ask one of the people below.
          </div>
        ))}

      {members === null ? (
        <Loader className="members-loader" label="Loading the invite list" />
      ) : loadError ? (
        <div className="memmsg" data-bad="1">
          The invite list could not be read: {loadError}
        </div>
      ) : !members.length ? (
        <div className="memmsg">Nobody is on the list yet.</div>
      ) : (
        <div className="memlist">
          {members.map((m) => {
            const who = m.name || m.email;
            const isMe = me != null && m.email.toLowerCase() === me.email.toLowerCase();
            const mayRemove = !m.founder && (isMe || can.canRemoveOthers);
            const when = m.lastLoginAt
              ? `last signed in ${new Date(m.lastLoginAt).toLocaleDateString()}`
              : "has not signed in yet";
            return (
              <div className="mem" key={m.id}>
                <span className="av2">{initialsFor(who)}</span>
                <span className="tx2">
                  <b>
                    {who}
                    {isMe ? " · you" : ""}
                  </b>
                  <span>
                    {m.email} · {invitedByLabel(m.invitedBy)} · {when}
                  </span>
                </span>
                <span className="pill" data-on={m.status}>
                  {m.status}
                </span>
                {can.canSetRole && !m.founder ? (
                  <select
                    className="memrole"
                    aria-label={`Member type for ${m.email}`}
                    value={m.role}
                    disabled={busy}
                    onChange={(e) => onChangeRole(m, e.target.value as Role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="pill" data-role={m.role}>
                    {ROLE_LABEL[m.role]}
                  </span>
                )}
                {mayRemove ? (
                  <button
                    className="rm"
                    disabled={busy}
                    aria-label={`Remove ${m.email}`}
                    onClick={() => onRemove(m)}
                  >
                    {isMe ? "Leave" : "Remove"}
                  </button>
                ) : (
                  <span className="rm" aria-hidden="true"></span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {msg && (
        <div className="memmsg" data-bad={msg.bad ? "1" : "0"}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
