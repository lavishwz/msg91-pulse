"use client";

/**
 * The login handshake, in two cases.
 *
 * 1. Proxy has sent the browser back with ?proxy_auth_token&user_ref_id&
 *    company_ref_id — post them to /api/auth/login, which mints the session,
 *    and go where the person was headed.
 * 2. A fresh arrival — load MSG91's proxy-auth widget and let it render itself
 *    into the container below. The widget owns the whole password/OTP/SSO
 *    business; Pulse never sees a credential.
 *
 * The widget script is third-party and loaded by hand rather than with
 * next/script, because it has to be injected once, after the container exists,
 * and only in case 2.
 */

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const WIDGET_SRC = "https://36blocks.com/assets/proxy-auth/proxy-auth.js";

declare global {
  interface Window {
    initVerification?: (config: unknown) => void;
  }
}

/** Only same-site paths, so ?next= cannot be used to bounce somebody offsite. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function LoginForm({ referenceId }: { referenceId: string }) {
  const params = useSearchParams();
  /* "working" covers the token exchange only. A fresh arrival starts at
     "widget" so the container the MSG91 script renders into is in the layout,
     with a size, before initVerification() is ever called — see below. */
  const [status, setStatus] = useState<"working" | "widget" | "error">("working");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const proxyAuthToken = params.get("proxy_auth_token");
    const userRefId = params.get("user_ref_id");
    const companyRefId = params.get("company_ref_id");
    const next = safeNext(params.get("next"));

    // Case 1: back from Proxy with a token to exchange.
    if (proxyAuthToken && userRefId) {
      (async () => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              proxy_auth_token: proxyAuthToken,
              user_ref_id: userRefId,
              company_ref_id: companyRefId,
            }),
          });
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) throw new Error(body.error ?? `Sign-in failed (${res.status})`);
          // A full navigation, not router.replace(). The app past this point
          // is pulse.js/pulse-live.js — a vanilla bootstrap that fetches
          // everything on page load, not a React tree Next's client router
          // re-renders. router.replace() swapped the route without ever
          // re-running that bootstrap, so a first sign-in showed the navbar
          // and nothing else until a manual reload ran it for real. A real
          // navigation runs it exactly once, right away, like a reload does.
          window.location.href = next;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Sign-in failed");
          setStatus("error");
        }
      })();
      return;
    }

    // Case 2: a fresh arrival. The widget needs the reference id to render.
    if (!referenceId) {
      setError(
        "REFERENCEID is not set, so the MSG91 sign-in widget cannot load. See docs/auth.md.",
      );
      setStatus("error");
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.type = "text/javascript";
    script.onload = () => {
      /* The script defines initVerification a moment after it loads rather than
         on load, so it is waited for instead of assumed. Bounded, so a widget
         that never initialises says so instead of spinning for ever. */
      let waited = 0;
      const timer = setInterval(() => {
        if (typeof window.initVerification === "function") {
          clearInterval(timer);
          /* Unhide the container first, and let the browser lay it out, before
             handing it to the widget.
             The container is `hidden` while status is "working", and this used
             to call initVerification() and only then setStatus("widget") — so
             the widget was initialised into a box with no layout and no size.
             A widget that measures its container at init gets zero, renders
             nothing, and reports no error: the page sits there with a heading
             and an empty space where the sign-in should be. That is the
             intermittent blank /login, and it is intermittent because it
             depends on whether the script was already cached and how quickly
             it defined initVerification. */
          /* Captured before the frame callback: the narrowing from the
             typeof check above does not survive into a closure. */
          const init = window.initVerification;
          setStatus("widget");
          requestAnimationFrame(() => {
          init({
            referenceId,
            type: "authorization",
            addInfo: { redirect_path: `/login${next === "/" ? "" : `?next=${encodeURIComponent(next)}`}` },
            success: (data: unknown) => console.debug("[pulse] proxy widget success", data),
            failure: (err: unknown) => {
              console.error("[pulse] proxy widget failure", err);
              setError("MSG91 could not verify that sign-in. Try again.");
              setStatus("error");
            },
          });
          /**
           * `init()` neither throws nor calls `failure` when it simply
           * declines to render — confirmed live: the widget script loads,
           * `initVerification` runs without error, the container is
           * correctly sized, and it stays empty regardless (most likely this
           * domain is not on the widget's allowed-origin list yet — a
           * config question for whoever registered `referenceId`, not a
           * bug in the call above). Silence read as "still loading"
           * forever, so a person watched a permanently blank box with
           * nothing to act on. This says so instead, once it is sure: after
           * giving the widget a real window to render in.
           */
          // No cleanup path here — this is a one-shot flow (the page either
          // navigates away on success or the person reloads), matching this
          // effect's existing pattern of not tearing the script/interval
          // above down on unmount either.
          setTimeout(() => {
            const el = document.getElementById(referenceId);
            if (el && el.childElementCount === 0) {
              setError(
                "The MSG91 sign-in widget loaded but did not render anything. " +
                  "This usually means the current address is not registered for this " +
                  "sign-in widget yet — ask whoever set up REFERENCEID to check its " +
                  "allowed domains, then reload.",
              );
              setStatus("error");
            }
          }, 6000);
          });
          return;
        }
        waited += 100;
        if (waited >= 10_000) {
          clearInterval(timer);
          setError("The MSG91 sign-in widget loaded but never started. Reload to try again.");
          setStatus("error");
        }
      }, 100);
    };
    script.onerror = () => {
      setError("The MSG91 sign-in widget could not be loaded. Check the network and reload.");
      setStatus("error");
    };
    document.body.appendChild(script);
  }, [params, referenceId]);

  return (
    <>
      {/* The widget renders itself into an element whose id is the reference id.
          Hidden while "working": that state covers both before the widget has
          anything to show (case 2, first arrival) and after it has cleared
          its own UI to hand control back here (case 1, the token exchange) —
          an empty box with nothing in it read as the login box reappearing
          for no reason in exactly that second case. */}
      <div id={referenceId} className="authwidget" hidden={status === "working"} />
      {status === "working" && (
        <div className="authwait" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} />
          <span>Signing you in…</span>
        </div>
      )}
      {error && (
        <div className="autherr" role="alert">
          <b>Not signed in.</b> {error}
        </div>
      )}
    </>
  );
}
