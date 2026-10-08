// Prototype typefaces for the auth screens and the admin dashboard: Newsreader (opsz + wght variable) and Instrument Sans, latin subset, exactly the
// files the prototype's Google Fonts link serves. next/font/google's Newsreader has no optical-size axis,
// so headings rendered ~3% wider than the prototype. Scoped to those frames; the rest of the app keeps
// its own fonts (app/layout.tsx).
import localFont from "next/font/local";

export const authSerif = localFont({
  src: [
    { path: "./files/Newsreader-normal.woff2", style: "normal", weight: "200 800" },
    { path: "./files/Newsreader-italic.woff2", style: "italic", weight: "200 800" },
  ],
  display: "swap",
  variable: "--auth-serif",
  adjustFontFallback: false,
});

export const authSans = localFont({
  src: [{ path: "./files/InstrumentSans-normal.woff2", style: "normal", weight: "400 700" }],
  display: "swap",
  variable: "--auth-sans",
  adjustFontFallback: false,
});
