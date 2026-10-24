import type { Invite, InviteLive } from "@/lib/api/invite";
import type { KitMode } from "../useTheme";
import { arr, guestFromSearch, obj, str } from "./format";

export { accentSplit, arr, fmtInZone, guestFromSearch, instantOf, localeOf, mapHref, obj, roman, str, time12, zoneParts } from "./format";
export { countdown, type Countdown } from "./time";

/** A photo a template can show. `url` is a signed, expiring media URL. */
export type ModelPhoto = { url: string; alt: string } | null;
export type ModelMoment = {
  /** Eyebrow above the title ("The Ceremony"); "" when the host wrote none. */
  label: string;
  title: string;
  /** ISO instants; null = no time set. */
  startsAt: string | null;
  endsAt: string | null;
  description: string;
  venue: string;
  address: string;
  /** "" or an https:// link. */
  mapUrl: string;
  venueNote: string;
  dressCode: string;
  photo: ModelPhoto;
};
export type ModelGiftMethod = { kind: "bank" | "wallet"; bank: string; holder: string; number: string };
export type ModelRsvp = {
  /** A personal link: there is a guest to attach a reply to. */
  personal: boolean;
  status: "pending" | "yes" | "no";
  partySize: number;
  /** 1 + the plus-ones the host allowed. */
  maxParty: number;
  deadline: string | null;
};

/** The template-neutral view of an invitation (docs/17 §7.8): everything a renderer needs, none of its copy. */
export type InviteModel = {
  mode: KitMode;
  /** Couple names as the host wrote them ("" when missing: the template picks its placeholder). */
  partnerOne: string;
  partnerTwo: string;
  /** ISO instant of the main event ("" = not set). */
  weddingDate: string;
  timezone: string;
  language: string;
  guest: { name: string; personal: boolean };
  /** Section types present on the invitation (visible ones only: the API sends no hidden section). */
  has(type: string): boolean;
  /** A section's content, sanitised to an object. */
  content(type: string): Record<string, unknown>;
  moments: ModelMoment[];
  /** The schedule section's dress code, else the first moment's. */
  dressCode: string;
  giftMethods: ModelGiftMethod[];
  rsvp: ModelRsvp;
  live: InviteLive | null;
  /** A signed photo by media id, or null when the id is unknown to this event. */
  photo(id: unknown, alt: string): ModelPhoto;
};

/**
 * Invitation → model. `search` is `location.search` (for `?to=`, honoured on generic links only). Pure.
 * Gilded Seal's `mapInvite` is this plus its own copy and placeholders.
 */
export function buildInviteModel(invite: Invite, mode: KitMode, search = ""): InviteModel {
  const sections = new Map(invite.sections.map((s) => [s.type, s] as const));
  const photo = (id: unknown, alt: string): ModelPhoto => {
    const url = typeof id === "string" ? invite.media[id] : undefined;
    return url ? { url, alt } : null;
  };
  const personal = !!invite.guest;
  const schedule = obj(sections.get("schedule")?.content);
  const moments: ModelMoment[] = invite.schedule.map((m) => ({
    label: str(m.label, 40),
    title: m.title,
    startsAt: m.starts_at,
    endsAt: m.ends_at,
    description: m.description,
    venue: m.venue ?? "",
    address: m.address,
    mapUrl: m.map_url,
    venueNote: m.venue_note,
    dressCode: m.dress_code.trim(),
    photo: photo(m.photo_id, m.title),
  }));
  return {
    mode,
    partnerOne: (invite.couple_a ?? "").trim(),
    partnerTwo: (invite.couple_b ?? "").trim(),
    weddingDate: invite.event_date ?? "",
    timezone: invite.timezone,
    language: invite.language,
    guest: { name: invite.guest ? invite.guest.name : guestFromSearch(search), personal },
    has: (type) => sections.has(type),
    content: (type) => obj(sections.get(type)?.content),
    moments,
    dressCode: str(schedule.dress_code, 60) || moments.map((m) => m.dressCode).find(Boolean) || "",
    giftMethods: invite.gift_methods
      .filter((m): m is typeof m & { type: "bank" | "wallet" } => m.type === "bank" || m.type === "wallet")
      .map((m): ModelGiftMethod => ({ kind: m.type, bank: m.title, holder: m.detail, number: m.copy_value })),
    rsvp: {
      personal,
      status: invite.guest?.rsvp_status ?? "pending",
      partySize: Math.max(1, invite.guest?.party_size || 1),
      maxParty: Math.max(1, invite.guest?.max_party ?? 1),
      deadline: invite.rsvp_deadline,
    },
    live: invite.live,
    photo,
  };
}

/** Items of a content array as objects (anything else is dropped). */
export const objects = (v: unknown): Record<string, unknown>[] => arr(v).map(obj);
