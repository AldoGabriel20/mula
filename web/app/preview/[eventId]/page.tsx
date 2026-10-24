import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PreviewClient } from "./PreviewClient";

// The host's draft: private to event members (the API enforces it), never indexed.
export const metadata: Metadata = {
  title: "Preview — Mula",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PreviewPage({ params }: { params: { eventId: string } }) {
  // same session gate as /app: signed-out visitors go to login and come back here
  if (!cookies().get("session")) redirect(`/login?next=${encodeURIComponent(`/preview/${params.eventId}`)}`);
  return <PreviewClient eventId={params.eventId} />;
}
