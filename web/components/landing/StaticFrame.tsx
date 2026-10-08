"use client";

import type { CSSProperties } from "react";
import { LandingShell } from "./LandingShell";

// The prototype has no design for about / contact / faq / help / privacy / terms. They still get the
// prototype nav, footer and route-transition curtain (so moving between any two pages animates the
// same way) and sit on its ivory ground, with the app tokens their content uses pinned to ivory values.
const TOKENS = {
  "--bg": "#F4EEE4", "--bg2": "#E8D9BF", "--sf": "#FBF8F3", "--rs": "#FFFFFF", "--line": "rgba(14,12,11,.14)", "--line2": "rgba(14,12,11,.3)",
  "--ink": "#0E0C0B", "--ink2": "#4A423A", "--mut": "#5E554C", "--dot": "#8A5F38", "--dotd": "#8A5F38", "--onink": "#F4EEE4",
  "--serif": "var(--l-cormorant), serif", "--sans": "var(--l-manrope), sans-serif",
  background: "#F4EEE4", color: "#0E0C0B", paddingTop: 76, minHeight: "70vh", colorScheme: "light",
} as CSSProperties;

export function StaticFrame({ children }: { children: React.ReactNode }) {
  return (
    <LandingShell bg="#F4EEE4" fg="#0E0C0B" startLight hover="brown">
      <section data-bg="#F4EEE4" data-nav="light" style={TOKENS}>
        {children}
      </section>
    </LandingShell>
  );
}
