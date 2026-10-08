import type { Metadata } from "next";
import { StaticPage } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Terms — Mula",
  description: "The terms of using Mula.",
};

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Terms"
      title="Terms of use."
      paragraphs={[
        "Placeholder terms. By using Mula you agree to use it for lawful celebrations and to respect your guests' privacy.",
        "You own your event content; Mula hosts and renders it on your behalf.",
        "The final terms are published at launch.",
      ]}
    />
  );
}
