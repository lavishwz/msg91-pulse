/* First-run setup. One line, like every other route here — it exists only so
   /onboarding resolves on the server; public/pulse.js's router opens the
   overlay once the shell has loaded. See routeRead()/routePath() in
   public/pulse.js. */
export { default } from "../pulse-shell";
