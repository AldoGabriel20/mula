// Guest-facing API (no session; the token in the path is the credential).
// Server and client both use this: on the server it forwards to the API origin.

export type InviteSection = { type: string; content: Record<string, unknown> };
export type InviteGift = { title: string; description: string; url: string | null; target_amount: number | null };
export type InviteMethod = { type: "bank" | "wallet" | "physical"; title: string; detail: string; copy_value: string };
export type InviteLive = { provider: string; stream_url: string; status: "scheduled" | "live" | "ended" | string; starts_at: string | null };
export type InviteGuest = { name: string; rsvp_status: "pending" | "yes" | "no"; party_size: number; max_party: number };
export type Invite = {
  event_type: string;
  couple_a: string | null;
  couple_b: string | null;
  event_date: string | null;
  venue: string | null;
  palette: string;
  language: string;
  sections: InviteSection[];
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

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${API}/api/v1/invite/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return;
  const j = await res.json().catch(() => ({}));
  throw new InviteError(res.status, j?.error?.code ?? "error", j?.error?.message ?? res.statusText);
}

export const submitRsvp = (token: string, v: { status: "yes" | "no"; party_size: number; meal?: string; note?: string }) =>
  post(`${encodeURIComponent(token)}/rsvp`, v);

export const submitWish = (token: string, v: { name?: string; message: string }) =>
  post(`${encodeURIComponent(token)}/wish`, v);
