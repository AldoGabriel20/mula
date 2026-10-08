import type { Metadata } from "next";
import { TipsPage } from "@/components/landing/pages/TipsPage";

export const metadata: Metadata = {
  title: "Tips — Mula",
  description: "Little things that make a big difference: short guides on design, timing and hosting.",
};

export default function Page() {
  return <TipsPage />;
}
