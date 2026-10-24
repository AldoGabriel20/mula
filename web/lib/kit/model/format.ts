// Template-neutral formatting: zone-aware dates, host-text hygiene, link safety. No template copy lives here.

/** "id" prints Indonesian month/day names, anything else en-GB. */
export const localeOf = (language: string) => (language === "id" ? "id-ID" : "en-GB");

/** Format an instant in a zone. A bad zone or locale degrades to "" instead of throwing. */
export function fmtInZone(d: Date, tz: string, locale: string, o: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: tz, ...o }).format(d);
  } catch {
    return "";
  }
}

/** Zone-local numeric parts of an instant (`h` is 0-23). Blanks on a bad zone. */
export function zoneParts(d: Date, tz: string) {
  const out = { y: "", m: "", d: "", h: 0, min: "" };
  try {
    for (const p of new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d)) {
      if (p.type === "year") out.y = p.value;
      else if (p.type === "month") out.m = p.value;
      else if (p.type === "day") out.d = p.value;
      else if (p.type === "hour") out.h = +p.value % 24;
      else if (p.type === "minute") out.min = p.value;
    }
  } catch {
    /* leave blanks */
  }
  return out;
}

/** 18, "00" → "6.00 PM". */
export function time12(h: number, min: string): string {
  return `${((h + 11) % 12) + 1}.${min} ${h < 12 ? "AM" : "PM"}`;
}

/** An ISO string as a Date, or null when empty / unparseable. */
export function instantOf(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(+d) ? null : d;
}

/** https only; anything else becomes a Google Maps search for the place. */
export function mapHref(mapUrl: string, venue: string, address: string): string {
  try {
    const u = new URL(mapUrl);
    if (u.protocol === "https:" && u.host) return u.toString();
  } catch {
    /* fall through */
  }
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([venue, address].filter(Boolean).join(", "));
}

/** `?to=` / `?guest=` from a query string, capped at 60 characters. */
export function guestFromSearch(search: string): string {
  try {
    const q = new URLSearchParams(search);
    return (q.get("to") || q.get("guest") || "").trim().slice(0, 60);
  } catch {
    return "";
  }
}

/**
 * The heading-override rule: a host's title wins and its LAST word is set in the accent (italic) style
 * ("Our beginning" → ["Our ", "beginning"]); a single word is all accent. Empty → null (use the template's own).
 */
export function accentSplit(override?: string): [string, string] | null {
  const t = override?.trim();
  if (!t) return null;
  const i = t.lastIndexOf(" ");
  return i < 0 ? ["", t] : [t.slice(0, i + 1), t.slice(i + 1)];
}

/** Host-authored JSON is untrusted: a string, trimmed and capped, or "". */
export const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
/** 1-based roman numeral, falling back to the digits past X. */
export const roman = (n: number) => ROMAN[n - 1] || String(n);
