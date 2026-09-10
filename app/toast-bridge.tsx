"use client";

import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

/**
 * Mounts react-hot-toast's own portal and hands its `toast()` function to
 * `window`. public/pulse.js is a plain script, not React — it has no other
 * way to reach a component tree — so this is what lets "Connecting…",
 * "Connected", "Could not start the connection" and similar in-flight
 * messages show as a toast instead of a blocking `alert()`.
 */
export default function ToastBridge() {
  useEffect(() => {
    window.pulseToast = toast;
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
