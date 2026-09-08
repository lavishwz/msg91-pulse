import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./quirks-compat.css";

export const metadata: Metadata = {
  title: "MSG91 Pulse",
};

/* pulse-prototype.html declares no viewport meta, so a phone lays the page out
   at the default 980px layout viewport and shrinks it to fit — which is why the
   prototype's own `@media (max-width:760px)` rules never fire on a real device.
   Next.js would otherwise emit `width=device-width, initial-scale=1` and change
   that, so pin the width to 980 to keep the prototype's behaviour exactly. The
   mobile rules still apply, as in the prototype, whenever the layout viewport
   itself is narrow (a resized desktop window). */
export const viewport: Viewport = {
  width: 980,
  // Explicitly unset: Next.js emits `initial-scale=1` otherwise, which would
  // show a 375px slice of the 980px layout instead of shrinking it to fit the
  // way the prototype's meta-less document does.
  initialScale: undefined,
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
      <body>{children}</body>
    </html>
  );
}
