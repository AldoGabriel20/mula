import type { Metadata } from "next";
import { StaticPage } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Privacy — Mula",
  description: "How Mula handles your data and your guests' information.",
};

export default function PrivacyPage() {
  return (
    <StaticPage
      eyebrow="Privacy"
      title="Your privacy."
      paragraphs={[
        "Placeholder policy. We collect only what we need to run your celebration: account details, event content and guest responses.",
        "Guest information is used to deliver invitations and record RSVPs, and is never sold.",
        "You can export or delete your event data at any time. The final policy is published at launch.",
      ]}
    />
  );
}
