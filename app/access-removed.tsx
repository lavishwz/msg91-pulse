/**
 * What somebody sees when they are signed in but no longer invited.
 *
 * Deliberately not a redirect to /login: they hold a valid session, so the
 * guard would send them straight back here and the two would bounce. A plain
 * statement of what happened, and the one button that resolves it.
 */

export default function AccessRemoved({ email }: { email: string }) {
  return (
    <main className="authpage">
      <div className="authcard">
        <span className="brand">
          <span className="mark">P</span> Pulse
        </span>
        <h1>Your access has been removed</h1>
        <p>
          <b>{email}</b> is no longer on Pulse&apos;s invite list, so there is nothing
          here to show you. If that is a mistake, ask somebody on the team to
          invite you again — they will find you under Members.
        </p>
        <form action="/api/auth/logout" method="post">
          <button className="go" type="submit">Sign out</button>
        </form>
      </div>
    </main>
  );
}
