"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    /* sw.js calls skipWaiting()/clients.claim() so a new version takes over
       an already-open tab immediately rather than waiting for it to close —
       right for a shell that's re-stamped with a fresh BUILD_ID on every
       deploy, but it means the scripts already running in this tab (loaded
       under the old worker) are now paired with a different one underneath
       them. One reload, the moment control actually changes hands, is what
       keeps a long-lived tab from running that mismatched half-old session
       indefinitely; the guard is so a second controllerchange (there is
       only ever one per page load) can't start a reload loop. */
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);
  return null;
}
