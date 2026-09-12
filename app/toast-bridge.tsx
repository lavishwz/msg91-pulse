"use client";

import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

/**
 * A message plus a close (×) button, rendered as one toast body — dismissing
 * one no longer means waiting out the 4s duration. react-hot-toast lets the
 * message itself be a render function that receives the toast instance, so
 * this reaches `t.id` for toast.dismiss() without pulse.js/pulse-live.js (the
 * plain-script call sites — Gmail trigger toasts, "Connected", etc.) needing
 * to know anything about it; they still just call `.success("text")`.
 */
function withClose(kind: typeof toast.success | typeof toast.error) {
  return (message: string, opts?: Parameters<typeof toast.success>[1]) =>
    kind(
      (t) => (
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              lineHeight: 1,
              padding: 0,
              opacity: 0.55,
              color: "inherit",
            }}
          >
            ×
          </button>
        </span>
      ),
      opts,
    );
}

/**
 * Mounts react-hot-toast's own portal and hands its `toast()` function to
 * `window`. public/pulse.js is a plain script, not React — it has no other
 * way to reach a component tree — so this is what lets "Connecting…",
 * "Connected", "Could not start the connection" and similar in-flight
 * messages show as a toast instead of a blocking `alert()`.
 */
export default function ToastBridge() {
  useEffect(() => {
    window.pulseToast = Object.assign(toast, {
      success: withClose(toast.success),
      error: withClose(toast.error),
    });
    return () => {
      delete window.pulseToast;
    };
  }, []);

  return <Toaster position="top-right" toastOptions={{ duration: 4000 }} />;
}

declare global {
  interface Window {
    pulseToast?: typeof toast;
  }
}
