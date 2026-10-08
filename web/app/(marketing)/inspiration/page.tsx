import type { Metadata } from "next";
import { InspirationPage } from "@/components/landing/pages/InspirationPage";

export const metadata: Metadata = {
  title: "Inspiration — Mula",
  description: "Invitations in the wild, colour stories, type pairings and event ideas from the Mula journal.",
};

export default function Page() {
  return <InspirationPage />;
}
