import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationView } from "@/components/invite/InvitationView";
import { RsvpForm } from "@/components/invite/RsvpForm";
import { WishForm } from "@/components/invite/WishForm";
import { TemplateHost } from "@/components/templates/TemplateHost";
import { hasLiveTemplate } from "@/components/templates/registry";
import { fetchInvite } from "@/lib/api/invite";

// Per-link, per-guest response (records the open, shows the guest's own RSVP): always
// rendered on request, never statically cached or shared.
export const dynamic = "force-dynamic";

// The URL is a capability: keep it out of search indexes and never leak it through Referer
// (e.g. when a guest follows an outbound gift link).
export const metadata: Metadata = {
  title: "You’re invited — Mula",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invite = await fetchInvite(params.token);
  if (!invite) notFound(); // unknown, unpublished and revoked links are indistinguishable

  // a picked template with its own renderer takes over the whole page; anything else (no template,
  // a catalog design without a renderer) keeps the generic card
  if (hasLiveTemplate(invite.template)) {
    return <TemplateHost slug={invite.template} invite={invite} token={params.token} mode="live" />;
  }

  return (
    <InvitationView
      invite={invite}
      rsvp={invite.guest ? <RsvpForm token={params.token} guest={invite.guest} /> : undefined}
      wish={<WishForm token={params.token} guest={invite.guest} />}
    />
  );
}
