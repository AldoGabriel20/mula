import type { Metadata } from "next";
import { Newsreader, Instrument_Sans } from "next/font/google";
import Providers from "./providers";
import { Grain } from "@/lib/motion";
import "./globals.css";

// Newsreader is the display face. Italic is used throughout (hero emphasis, names, footer
// statement) — loading it avoids the browser faking a slanted roman. `preload` stays on only
// for the upright face; the italic file is fetched when an italic glyph is first painted.
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--serif",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--sans",
});

export const metadata: Metadata = {
  title: "mula",
  description: "Celebration planning.",
};

// Set data-theme before paint for an explicit choice, so there's no theme flash.
// "system"/unset falls through to the prefers-color-scheme CSS in globals.css.
const themeInit = `(function(){try{var t=localStorage.getItem('mula-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Grain />
      </body>
    </html>
  );
}
