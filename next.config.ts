import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // These three drive the entire app once a page loads — a stale cached copy
  // in someone's browser reproduces exactly like an unfixed bug, indistin-
  // guishable from the real thing, and a plain reload does not always pull a
  // fresh one without an explicit header saying so. no-cache forces the
  // browser to revalidate on every load rather than trust what it already
  // has, so a fix here is never one browser-cache away from looking unfixed.
  async headers() {
    return [
      {
        source: "/:file(pulse\\.js|pulse-live\\.js|pulse-auth\\.js)",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
