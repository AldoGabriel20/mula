import type { Metadata } from "next";
import { StaticPage, CTA } from "@/components/marketing";

export const metadata: Metadata = {
  title: "About — Mula",
  description: "Mula makes digital invitations for the moments where something begins.",
};

export default function AboutPage() {
  return (
    <>
      <StaticPage
        eyebrow="About"
        title="Mula is made to celebrate what begins from here."
        paragraphs={[
          "Mula makes digital invitations for the moments where something begins — weddings, seventeenths, anniversaries and brand events.",
          "Every design starts in our studio and becomes yours: change the names, wording, palette and photos, then share a link that greets each guest by name.",
          "We believe every beginning deserves a beautiful story.",
        ]}
      />
      <CTA />
    </>
  );
}
