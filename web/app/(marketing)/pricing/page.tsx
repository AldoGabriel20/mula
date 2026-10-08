import type { Metadata } from "next";
import { PricingPage } from "@/components/landing/pages/PricingPage";

export const metadata: Metadata = {
  title: "Pricing — Mula",
  description: "Simple pricing, per celebration. Pay once per event — no subscription, no per-guest fees.",
};

export default function Page() {
  return <PricingPage />;
}
