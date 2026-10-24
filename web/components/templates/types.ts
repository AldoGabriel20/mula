import type { Invite } from "@/lib/api/invite";

/**
 * live    — a guest's real invitation (RSVP and wishes hit the API)
 * preview — the host's draft (nothing is sent; the guestbook is read-only)
 * demo    — the landing page demo (prototype defaults, nothing is sent)
 */
export type TemplateMode = "live" | "preview" | "demo";

export type TemplateProps = {
  /** Required for live and preview; ignored by demo. */
  invite?: Invite;
  /** The link token (live only): RSVP and wishes are sent with it. */
  token?: string;
  mode: TemplateMode;
};
