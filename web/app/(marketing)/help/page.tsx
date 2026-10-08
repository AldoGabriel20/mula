import type { Metadata } from "next";
import { StaticPage } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Help — Mula",
  description: "Get help with your Mula invitation: creating, customizing, sharing and RSVP.",
};

export default function HelpPage() {
  return (
    <StaticPage
      eyebrow="Help"
      title="How can we help?"
      paragraphs={[
        "Creating an invitation: start from a template, then edit names, date, venue and palette.",
        "Sharing: send one link, or personalized links so each guest is greeted by name.",
        "RSVP & guests: replies land in your dashboard; manage groups, seats and status there.",
        "Still stuck? Reach us from the Contact page and we'll help.",
      ]}
    />
  );
}
