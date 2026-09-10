import type { Metadata, Viewport } from "next";
import Script from "next/script";
import ToastBridge from "./toast-bridge";
import SwRegister from "./sw-register";
import "./globals.css";
import "./quirks-compat.css";

export const metadata: Metadata = {
  title: "MSG91 Pulse",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pulse",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

/* A real, device-width viewport — this is what makes the app's own
   `@media (max-width: …)` rules fire on phones instead of only on a resized
   desktop window, and it's required for the page to be installable as a PWA.
   `viewportFit: cover` lets the layout run into the safe-area on notched
   phones; globals.css pads around it with `env(safe-area-inset-*)`. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1E75B9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap"
        />
      </head>
      {/* Browser extensions (ColorZilla, Grammarly and friends) stamp attributes
          onto <body> before React hydrates — `cz-shortcut-listen="true"` is the
          one this project kept tripping over. React compares the DOM it finds
          against the HTML the server sent, sees an attribute it did not write,
          and logs a hydration mismatch that nobody can fix from inside the app.
          Suppressed here and nowhere else: the warning is worth keeping for
          every element Pulse actually renders. */}
      <body suppressHydrationWarning>
        {children}
        <ToastBridge />
        <SwRegister />
        {/* ViaSocket's embed — defines window.openViasocketConnection on every
            route, not just the profile page, so any "Connect …" button can
            call it. Standalone: no iframe, no stylesheet, nothing fetched
            until a button actually opens a connection. */}
        <Script src="https://embed.viasocket.com/prod-connectcomponent.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
