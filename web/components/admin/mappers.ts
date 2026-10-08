import { eventLabel } from "./event-label";

// Maps API payloads onto the shapes the prototype logic (logic.ts) renders. The prototype's own
// mock data stays in logic.ts for the parts the API has no equivalent for (see docs/dashboard notes).

export type Lang = "en" | "id" | "ms";
const LOCALE: Record<Lang, string> = { en: "en-GB", id: "id-ID", ms: "ms-MY" };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const EVENT_TYPE_LABEL: Record<string, string> = {
  wedding: "Wedding", birthday: "Birthday", "17th-birthday": "17th Birthday", anniversary: "Anniversary", engagement: "Engagement",
  "product-launch": "Product launch", "private-celebration": "Private celebration", other: "Other",
};
// Which prototype copy preset (greeting, tagline, close line) an event type borrows.
const PRESET: Record<string, "wedding" | "birthday" | "launch"> = {
  wedding: "wedding", engagement: "wedding", anniversary: "wedding", other: "wedding",
  birthday: "birthday", "17th-birthday": "birthday", "private-celebration": "birthday", "product-launch": "launch",
};

export const longDate = (d: Date, lang: Lang) => {
  const p = new Intl.DateTimeFormat(LOCALE[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("weekday")}, ${g("day")} ${g("month")} ${g("year")}`;
};
export const shortDM = (d: Date) => `${d.getDate()} ${MON[d.getMonth()]}`;
export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
export const idr = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

/** The event as the prototype's `P[evt]` / `LC[evt]` entries. */
export function buildEvent(e: any | null, P: any, LC: any, ready: number, sched: any[], createdAt?: string) {
  const preset = PRESET[e?.type] ?? "wedding";
  const base = P[preset], lcb = LC[preset];
  const d = e?.event_date ? new Date(e.event_date) : null;
  const a = e?.couple_a || "", b = e?.couple_b || "";
  const host = e ? eventLabel(e) : "Your celebration";
  const now = new Date();
  const days = d ? Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 864e5)) : 0;
  const sent = createdAt ? new Date(createdAt) : now;
  const off = (n: number) => (d ? shortDM(new Date(d.getTime() - n * 864e5)) : "—");
  const msd = [shortDM(sent), shortDM(now), off(28), off(17), off(7), d ? shortDM(d) : "—", "After"];
  const type = EVENT_TYPE_LABEL[e?.type] ?? "Celebration";
  const city = (e?.venue || "").split(",").slice(-1)[0].trim();
  const P2 = {
    ...base, type, host, a: a || host, amp: a && b ? "&" : "", b, date: d ? longDate(d, "en") : "Date to be set",
    dshort: d ? `${String(d.getDate()).padStart(2, "0")} · ${String(d.getMonth() + 1).padStart(2, "0")} · ${d.getFullYear()}` : "— · — · —",
    day: d ? String(d.getDate()) : "—", mon: d ? MON[d.getMonth()] : "", city: city || "—", days, ready, msd, events: sched,
  };
  const LC2: any = {};
  (["en", "id", "ms"] as Lang[]).forEach((l) => (LC2[l] = { ...lcb[l], date: d ? longDate(d, l) : "—" }));
  return { P: P2, LC: LC2 };
}

// ---- guests ----------------------------------------------------------------------------------
export const guestStatus = (g: any) => (g.rsvp_status === "yes" ? "Attending" : g.rsvp_status === "no" ? "Not attending" : g.opened ? "Pending" : "Invited");
export function toGuest(g: any, id: number) {
  const st = guestStatus(g);
  return {
    id, uid: g.id, name: g.name, group: g.group_name || (g.vip ? "VIP" : "Friends"), st, j: st === "Attending" || st === "Not attending" ? 3 : g.opened ? 2 : 1,
    party: g.rsvp_status === "yes" && g.party_size ? g.party_size : 1 + (g.plus_ones || 0), table: g.table_label || "—", phone: g.phone || "—", vip: !!g.vip, invite: g.invite_path,
    notes: g.notes || "", email: g.email || "", invitedAt: g.invited_at || null,
  };
}

// ---- tasks -----------------------------------------------------------------------------------
const PRI: Record<string, string> = { high: "High", normal: "Normal", low: "Low" };
export function toTodo(t: any, id: number) {
  const due = t.due_at ? new Date(t.due_at) : null;
  const soon = !due || due.getTime() - Date.now() < 21 * 864e5;
  return { id, uid: t.id, title: t.title, cat: t.category || "Planning", due: due ? shortDM(due) : "Anytime", pri: PRI[t.priority] || "Normal", done: !!t.done, ph: soon ? "Soon" : "Later" };
}

// ---- schedule --------------------------------------------------------------------------------
export const VIS_LABEL: Record<string, string> = { everyone: "Everyone", invite_only: "Invite only", family_only: "Family only" };
export const VIS_VALUE: Record<string, string> = { Everyone: "everyone", "Invite only": "invite_only", "Family only": "family_only" };
export function toMoment(s: any, id: number, open: boolean) {
  const d = s.starts_at ? new Date(s.starts_at) : null;
  const ymd = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";
  const e = s.ends_at ? new Date(s.ends_at) : null;
  return { id, uid: s.id, name: s.title, date: ymd, s: d ? hhmm(d) : "—", en: e ? hhmm(e) : "", venue: s.venue || "Add a venue", addr: s.address || "", dress: s.dress_code || "—", vis: VIS_LABEL[s.visibility] || "Everyone", desc: s.description || "", open, starts_at: s.starts_at, ends_at: s.ends_at };
}

// ---- registry --------------------------------------------------------------------------------
export function toRegistry(g: any, id: number) {
  return { id, uid: g.id, name: g.title, desc: g.description || "", price: g.target_amount || 0, qty: g.quantity || 1, got: g.claimed || 0, url: g.url || "" };
}

// ---- gift methods ----------------------------------------------------------------------------
export const METHOD_LABEL: Record<string, string> = { bank: "Bank account", wallet: "Digital wallet", physical: "Physical gift" };
export const METHOD_VALUE: Record<string, string> = { "Bank account": "bank", "Digital wallet": "wallet", "Physical gift": "physical" };
export const toMethod = (m: any, id: number) => ({ id, uid: m.id, type: METHOD_LABEL[m.type] || "Bank account", title: m.title, detail: m.detail || "", copy: m.copy_value || "" });

// ---- team / activity -------------------------------------------------------------------------
const ROLE_LABEL: Record<string, string> = { owner: "Owner", cohost: "Co-host", planner: "Planner", family: "Family", usher: "Usher" };
export const ROLE_VALUE: Record<string, string> = Object.fromEntries(Object.entries(ROLE_LABEL).map(([k, v]) => [v, k]));
export const toMember = (m: any, id: number) => ({ id, uid: m.id, n: m.name || m.email.split("@")[0], r: ROLE_LABEL[m.role] || "Family", e: m.email, on: m.status === "active" });
export const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "Just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`;
  return `${Math.round(s / 86400)} days ago`;
};

// ---- purchases -------------------------------------------------------------------------------
const TX_STATUS: Record<string, string> = { paid: "Paid", pending: "Pending", failed: "Failed", refunded: "Refunded", settled: "Paid" };
export function toTx(i: any) {
  const d = i.issued_at ? new Date(i.issued_at) : null;
  return { id: i.id.slice(0, 8).toUpperCase(), uid: i.id, date: d ? `${String(d.getDate()).padStart(2, "0")} ${MON[d.getMonth()]} ${d.getFullYear()}` : "—", desc: i.description, method: "—", amt: i.amount, st: TX_STATUS[String(i.status).toLowerCase()] || "Pending" };
}

// ---- palettes --------------------------------------------------------------------------------
// API palette names → the prototype's six palettes (index into logic.pals), and back.
export const PALETTE_TO_PROTO: Record<string, number> = { Ivory: 0, Midnight: 1, Forest: 2, Blush: 3, Stone: 4 };
export const PROTO_TO_PALETTE = ["Ivory", "Midnight", "Forest", "Blush", "Stone", "Midnight"];

// ---- check-in --------------------------------------------------------------------------------
/** Arrival counts in the six quarter-hour slots the event-day chart shows (from 30 min before the start). */
export function arrivalBars(arrivals: any[], eventDate?: string | null): number[] {
  const out = [0, 0, 0, 0, 0, 0];
  if (!eventDate) return out;
  const t0 = new Date(eventDate).getTime() - 30 * 60000;
  for (const a of arrivals) {
    const i = Math.floor((new Date(a.checked_in_at).getTime() - t0) / (15 * 60000));
    if (i >= 0 && i < 6) out[i] += 1;
  }
  return out;
}
