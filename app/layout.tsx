import type { Metadata } from "next";
import { Bodoni_Moda, Geist_Mono, Host_Grotesk, Shippori_Mincho, Staatliches } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { Experience } from "@/components/experience/Experience";
import "./globals.css";

const display = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const text = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Japanese appears only as accents (market names, chapter spines), so it is not preloaded;
// browsers fetch just the unicode-range slices those few characters need.
const ja = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["400", "500"],
  subsets: ["latin"],
  preload: false,
});

// The "figma" theme (docs/overhaul.md, decisions): Satoshi for display and text, Staatliches for the
// narrow subheadings. Satoshi is the user's named exception to the OFL rule (ITF Free Font License,
// self-hosting allowed; licence kept in ./fonts/satoshi). Neither preloads, so the default theme
// pays no bytes for them; browsers fetch a face only once a theme uses it.
const satoshi = localFont({
  src: "./fonts/satoshi/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  preload: false,
});

const condensed = Staatliches({
  variable: "--font-staatliches",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

// `?theme=current|figma` picks the token set (app/globals.css). It runs before first paint and is kept
// for the session, so the choice survives the in-app move to /cars/<slug>. The server never reads the
// query, which keeps every route static. Default is "figma" (user, 2026-10-10: it's the one under active
// work); `?theme=current` still opens the other system for comparison.
const themeScript = `(function(){try{var t=new URLSearchParams(location.search).get("theme");if(t==="current"||t==="figma")sessionStorage.setItem("arcade-theme",t);else t=sessionStorage.getItem("arcade-theme");document.documentElement.dataset.theme=t==="current"?"current":"figma"}catch(e){}})()`;

export const metadata: Metadata = {
  title: {
    default: "Arcade · A showroom for modern classics",
    template: "%s · Arcade",
  },
  description:
    "Thirteen classics from 1972 to 2008, each shown as a 3D model built to its real spec beside the seller's photos. A concept: every listing is fiction.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${text.variable} ${mono.variable} ${ja.variable} ${satoshi.variable} ${condensed.variable}`}
      // The theme script sets data-theme before hydration.
      suppressHydrationWarning
    >
      <body>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Experience />
        {children}
      </body>
    </html>
  );
}
