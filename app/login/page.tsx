/**
 * /login — the only door.
 *
 * The screen itself is server-rendered; the handshake is client work, so it
 * lives in login-form.tsx. Nothing about who may enter is decided here: the
 * widget proves identity, POST /api/auth/login checks that identity against
 * the invite list, and this page only reports what came back.
 */

import { Suspense } from "react";
import Loader from "../loader";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in · MSG91 Pulse" };

export default function LoginPage() {
  const referenceId = (process.env.REFERENCEID ?? "").trim();
  // The proxy-auth widget below renders empty on a domain it does not
  // recognise — which is most machines running this locally, since nobody
  // registers a dev box on that allowed-origin list. Outside of a production
  // build, LoginForm also offers a plain email fallback that goes through the
  // same invite check and session cookie, so that config gap somewhere else
  // is never the reason nobody can sign in to test anything here.
  const devLoginAvailable = process.env.NODE_ENV !== "production";

  return (
    <main className="authpage">
      <div className="authcard">
        <span className="brand">
          <span className="mark">P</span> Pulse
        </span>
        <h1>Sign in</h1>
        <p>
          Pulse reads MSG91&apos;s own accounts, payments and conversations, so it is
          invite-only. Sign in with your MSG91 account; if you have not been
          invited yet, ask somebody on the team to add you.
        </p>

        {/* useSearchParams() bails out of prerendering, so the client half sits
            under a boundary of its own. */}
        <Suspense fallback={<Loader className="auth-loader" label="Loading the sign-in widget" />}>
          <LoginForm referenceId={referenceId} devLoginAvailable={devLoginAvailable} />
        </Suspense>
      </div>
    </main>
  );
}
