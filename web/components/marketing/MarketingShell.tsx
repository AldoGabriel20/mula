"use client";

import { usePathname } from "next/navigation";
import { StaticFrame } from "@/components/landing/StaticFrame";

// Pages that have a prototype design ("/" and the five nav pages plus their detail routes) mount
// their own LandingShell (nav, footer, transition). Every other marketing page is framed by the
// same shell so navigation between any two public pages behaves identically.
const OWN_SHELL = /^\/(features|pricing|inspiration|templates|tips)(\/|$)/;

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (pathname === "/" || OWN_SHELL.test(pathname)) return <>{children}</>;
  return <StaticFrame>{children}</StaticFrame>;
}

export default MarketingShell;
