# Signing in

Pulse reads MSG91's own accounts, payments, conversations and staff actions. So
it is invite-only, and "invite-only" is enforced in three places rather than
one.

## The shape of it

```
browser ──▶ /login ──▶ MSG91 Proxy widget ──▶ back to /login?proxy_auth_token…
                                                       │
                                          POST /api/auth/login
                                                       │
                              ┌────────────────────────┴───────────────────────┐
                              │ 1. ask Proxy who this is (name, email, org)    │
                              │ 2. is that email in pulse_member?              │
                              │ 3. sign a 30-minute session cookie             │
                              └────────────────────────┬───────────────────────┘
                                                       ▼
                                      every later request: middleware.ts
```

**Pulse never sees a credential.** No passwords, no OTPs, no user table. MSG91's
Proxy service (`routes.msg91.com`) owns identity; the widget on `/login` is
theirs, and all Pulse gets back is three opaque values the browser could not
have invented, because Proxy only appends them after a login it accepted.

**Pulse does own the guest list.** `pulse_member` (migrations/003_members.sql,
004_member_roles.sql) is the only thing that decides who may in. Being a real
MSG91 user is not enough — a valid Proxy identity whose email is not on the list
is refused with "ask somebody who is already in to invite you". There is no
bootstrap path and no first-login grace: migration 004 seeds
`lavishgehlod@gmail.com` as the founding super admin, so the list is never empty
and "not invited" always means not invited, even on a brand new database.

## Member types

Three, and the ladder is the whole rule: you may bring in the level below you,
never your own and never above.

| | Uses Pulse | Invites | Removes | Changes types |
|---|---|---|---|---|
| **Member** | yes | — | only themselves (leaving) | — |
| **Admin** | yes | members | members, and themselves | — |
| **Super admin** | yes | anyone | anyone | anyone |

The type is chosen when inviting, and a super admin can change it afterwards on
the same sheet. It is read from the database on every request rather than put in
the session token, so a promotion or a demotion takes effect on the person's
next request instead of at their next login.

Two floors keep the list from locking everybody out:

- **The founding super admin cannot be removed or demoted.** Seeded by migration
  004 and re-asserted in code (`FOUNDING_SUPER_ADMIN`), so a row edited by hand
  in the database cannot demote them either. Not a back door — that account
  still has to pass the same Proxy login as everybody else.
- **The last super admin cannot step down.** Promote somebody else first.

Leaving, on the other hand, is always yours to do whatever your type: it needs
nobody's permission and it is the only exit that does not depend on somebody
else being around.

The rules are pure functions in `lib/pulse/member-roles.ts` — `denyInvite`,
`denyRemove`, `denySetRole`, each returning the sentence to show the person
rather than a boolean — and are covered by `tests/members.test.mjs`. They are
enforced server-side; the select boxes on the members sheet are a convenience,
not the rule.

## Where each check lives, and why it is split

| | Runs on | Checks |
|---|---|---|
| `middleware.ts` | Edge | The session cookie is a valid, unexpired Pulse JWT. Everything except `/login` and `/api/auth/*`. |
| `lib/pulse/guard.ts` | Node | That the email is *still* in `pulse_member`. Called by the page render and by `POST /api/auth/refresh`. |
| `app/api/auth/login` | Node | The invite list, at the moment a session is minted. |

The split is not a preference. Next 15's middleware runs on the Edge runtime
only, and the invite list is a MySQL table — `mysql2` cannot run there. So the
membership re-check has to happen on the Node side, and the session cookie is
deliberately short (30 minutes, `SESSION_TTL_SECONDS`) because between two
Node-side checks its expiry is the only thing bounding how long a removed
member's old cookie keeps working.

Nobody is signed out mid-shift for it: `public/pulse-auth.js` posts to
`/api/auth/refresh` on load, every five minutes, and whenever a sleeping tab
comes back. Each of those re-reads the list (behind a 30-second cache) and
re-mints the cookie. A refresh that comes back 401 means the answer was "no
longer a member", and the tab goes to `/login`.

Every check fails **closed**. A database Pulse cannot reach refuses logins and
ends sessions rather than waving them through — the list is what makes Pulse
closed, and an unreadable list is not an open one. The one softening: an
unreachable store during a *refresh* answers 503 and leaves the cookie alone,
so a database blip does not sign the whole team out; the session still expires
on its own within the half hour.

## Removing somebody

Members → Remove, on the account menu. Their next request within about five
minutes fails, and they land back on `/login` where the invite gate turns them
away. The cache entry for that person is dropped on the way out, so the removal
is live immediately for anything that asks again — the five minutes is only the
browser's own refresh interval.

## Machine callers

`/api/pulse/autopilot/{tick,run,monthly}` and `/api/pulse/store/migrate` are
called by a schedule, not a person, and authenticate with
`AUTOPILOT_TICK_SECRET` instead of a session. The guard compares that secret
too, so a wrong one is turned away before it reaches the handler. An unset
secret means those endpoints are reachable by nobody at all — which is what the
handlers themselves already insisted on.

## Configuring it

Two variables are enough:

```
REFERENCEID=1258584i17889575326aa1535c30048   # Pulse's app id on Proxy
JWT_SECRET=<openssl rand -base64 48>                       # signs the session cookie
```

`PROXY_ADMIN_TOKEN` is optional. With it, Pulse resolves identities through
Proxy's admin API — the same call the ViaSocket admin panel makes — and can
prefill an invitee's display name. Without it, login falls back to asking Proxy
about the visitor using the visitor's own token, which needs no key at all.

Changing `JWT_SECRET` invalidates every session; changing
`REFERENCEID` points the widget at a different registered app.

## Files

| File | What it is |
|---|---|
| `app/login/page.tsx`, `app/login/login-form.tsx` | The door. Widget injection and the token exchange. |
| `app/api/auth/login` | Proxy identity → invite check → session cookie. |
| `app/api/auth/refresh` | Re-check the list, extend the session. |
| `app/api/auth/logout` | Invalidate on Proxy's side, clear the cookies. |
| `app/api/auth/session` | Who the browser is signed in as. |
| `app/api/pulse/members` | The invite list: read, invite, remove. |
| `app/api/pulse/accounts/[id]/tags` | Company tags — any member may add or remove. |
| `lib/pulse/auth.ts` | Signing and verifying the session JWT. |
| `lib/pulse/proxy.ts` | The two ways to ask Proxy who somebody is. |
| `lib/pulse/members.ts` | The list itself, and the login gate. |
| `lib/pulse/member-roles.ts` | Member types and the permission ladder, pure. |
| `lib/pulse/guard.ts` | The Node-side membership re-check. |
| `lib/pulse/membership-cache.ts` | 30 seconds of memory in front of that check. |
| `middleware.ts` | The session gate on every request. |
| `public/pulse-auth.js` | Session upkeep, sign out, the members sheet. |
| `app/access-removed.tsx` | What a removed member sees. |
| `migrations/003_members.sql` | `pulse_member`. |
| `migrations/004_member_roles.sql` | `role`, and the founding super admin. |
| `tests/members.test.mjs` | The ladder, tested without a database. |
