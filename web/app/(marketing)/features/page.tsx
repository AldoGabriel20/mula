import type { Metadata } from "next";
import { FeaturesPage } from "@/components/landing/pages/FeaturesPage";

export const metadata: Metadata = {
  title: "Features — Mula",
  description: "A complete invitation platform: templates, customization, personalized guest links, RSVP and more.",
};

export default function Page() {
  return <FeaturesPage />;
}
