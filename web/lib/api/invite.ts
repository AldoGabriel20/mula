import { customInstance } from "./fetcher";
import type { Theme } from "../kit/tokens";

// Guest-facing API (no session; the token in the path is the credential).
// Server and client both use this: on the server it forwards to the API origin.

export type InviteSection = { type: string; content: Record<string, unknown> };
export type InviteGift = { title: string; description: string; url: string | null; target_amount: number | null };
export type InviteMethod = { type: "bank" | "wallet" | "physical"; title: string; detail: string; copy_value: string };
export type InviteLive = { provider: string; stream_url: string; status: "scheduled" | "live" | "ended" | string; starts_at: string | null };
export type InviteGuest = { name: string; rsvp_status: "pending" | "yes" | "no"; party_size: number; max_party: number };
/** One schedule moment this link may see (api/openapi.yaml InviteMoment). `photo_id` keys into `Invite.media`. */
export type InviteMoment = {
  label: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  address: string;
  /** "" or an https:// link */
  map_url: string;
  venue_note: string;
  dress_code: string;
  description: string;
  photo_id: string | null;
};
export type InviteWish = { id: string; name: string; message: string };
export type InviteWishPage = { items: InviteWish[]; next_cursor: string | null; total: number };
export type Invite = {
  /** template slug; null = none picked (render the generic card) */
  template: string | null;
  /** IANA zone every date is printed in */
  timezone: string;
  event_type: string;
  couple_a: string | null;
  couple_b: string | null;
  event_date: string | null;
  venue: string | null;
  palette: string;
  language: string;
  sections: InviteSection[];
  /** moments this link may see; [] when the schedule section is hidden */
  schedule: InviteMoment[];
  /** signed, session-less photo URLs by media id (only this event's photos; expire after hours) */
  media: Record<string, string>;
  /** true only on the host's draft view */
  preview: boolean;
  /** the host's visual overrides (`invitations.theme`, docs/17 §9.1); `{}` when nothing is changed */
  theme?: Theme;
  /** `templates.version` of the picked template (0 = none) */
  template_version?: number;
  gifts: InviteGift[];
  gift_methods: InviteMethod[];
  live: InviteLive | null;
  rsvp_deadline: string | null;
  guest: InviteGuest | null;
};

// Server components run in Node, where relative URLs don't resolve → they need the absolute
// API origin (same variable the next.config.js rewrite uses). In the BROWSER the base is ""
// so calls stay same-origin and go through the Next rewrite (cookies/CSRF work, no CORS).
const API = typeof window === "undefined" ? (process.env.API_ORIGIN ?? "http://localhost:8080") : "";

/** Server-side fetch. Returns null for 404 (unknown / unpublished / revoked). Never cached:
 *  a personal link reveals a guest's own data and records the open. */
export async function fetchInvite(token: string): Promise<Invite | null> {
  const res = await fetch(`${API}/api/v1/invite/${encodeURIComponent(token)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`invite fetch failed: ${res.status}`);
  return (await res.json()) as Invite;
}

export class InviteError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/v1/invite/${path}`, init);
  if (res.ok) return (res.status === 204 ? undefined : await res.json().catch(() => undefined)) as T;
  const j = await res.json().catch(() => ({}));
  throw new InviteError(res.status, j?.error?.code ?? "error", j?.error?.message ?? res.statusText);
}

const post = <T = void>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const submitRsvp = (token: string, v: { status: "yes" | "no"; party_size: number; meal?: string; note?: string }) =>
  post(`${encodeURIComponent(token)}/rsvp`, v);

/** Resolves with the stored wish (a personal link's author is the guest, whatever `name` says). */
export const submitWish = (token: string, v: { name?: string; message: string }) =>
  post<InviteWish>(`${encodeURIComponent(token)}/wish`, v);

/** One page of the guestbook, newest first. Pass the previous page's `next_cursor`; null ends the list. */
export const listWishes = (token: string, cursor?: string | null, limit?: number) => {
  const q = new URLSearchParams();
  if (limit) q.set("limit", String(limit));
  if (cursor) q.set("cursor", cursor);
  const qs = q.toString();
  return request<InviteWishPage>(`${encodeURIComponent(token)}/wishes${qs ? `?${qs}` : ""}`, { headers: { Accept: "application/json" }, cache: "no-store" });
};

/** The host's draft in the guest shape. BROWSER ONLY (same-origin + session cookie): a 401 sends the
 *  user to /login, other failures throw ApiError (404 = not a member, or no invitation created yet). */
export const fetchPreview = (eventId: string) =>
  customInstance<Invite>({ url: `/api/v1/events/${encodeURIComponent(eventId)}/invitation/preview`, method: "GET" });
