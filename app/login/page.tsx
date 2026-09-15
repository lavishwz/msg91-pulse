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
          <LoginForm referenceId={referenceId} />
        </Suspense>
      </div>
    </main>
  );
}
