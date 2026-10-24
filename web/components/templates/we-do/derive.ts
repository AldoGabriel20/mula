import { fmtInZone, instantOf, localeOf, zoneParts } from "@/lib/kit/model";
import type { ModelMoment } from "@/lib/kit/model";
import type { WeDoConfig } from "./config";

/** "3:30 PM" (English) or "15.30" (Indonesian), in the zone. */
export function clock(d: Date, tz: string, language: string): string {
  const { h, min } = zoneParts(d, tz);
  if (language === "id") return `${String(h).padStart(2, "0")}.${min}`;
  return `${((h + 11) % 12) + 1}:${min} ${h < 12 ? "AM" : "PM"}`;
}

const utc = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const FALLBACK_MS = 4 * 36e5;

/** The icon a timeline row gets: by what the title says, else by position. */
export const ICON_KEYS = ["rings", "cocktail", "camera", "dinner", "speaker"] as const;
export type IconKey = (typeof ICON_KEYS)[number];
export function iconFor(title: string, i: number): IconKey {
  const t = title.toLowerCase();
  if (/akad|ceremon|pemberkatan|holy|vow|nikah/.test(t)) return "rings";
  if (/cocktail|welcome|koktail/.test(t)) return "cocktail";
  if (/photo|foto/.test(t)) return "camera";
  if (/dinner|lunch|reception|resepsi|makan|feast/.test(t)) return "dinner";
  if (/dance|party|music|band|after/.test(t)) return "speaker";
  return ICON_KEYS[i % ICON_KEYS.length];
}

/** Everything derived from the config that more than one section prints. Pure. */
export function derive(c: WeDoConfig) {
  const when = instantOf(c.weddingDate);
  const loc = localeOf(c.language);
  const tz = c.timezone;
  const up = (o: Intl.DateTimeFormatOptions) => (when ? fmtInZone(when, tz, loc, o).toUpperCase() : "");
  const id = c.language === "id";
  const dayName = up({ weekday: "long" });
  const monthName = up({ month: "long" });
  const dayNum = when ? fmtInZone(when, tz, loc, { day: "numeric" }) : "";
  const year = when ? fmtInZone(when, tz, loc, { year: "numeric" }) : "";
  const timeText = when ? `${id ? "PUKUL" : "AT"} ${clock(when, tz, c.language)}` : "";
  const first = c.partnerOne.split(/\s+/)[0];
  const second = c.partnerTwo.split(/\s+/)[0];

  const dayKey = (iso: string | null) => {
    const d = instantOf(iso);
    if (!d) return "";
    const p = zoneParts(d, tz);
    return `${p.y}-${p.m}-${p.d}`;
  };
  const mainDay = dayKey(c.weddingDate) || dayKey(c.events[0]?.startsAt ?? null);
  /** A row's time label; a moment on another day than the wedding carries its date. */
  const rowTime = (e: ModelMoment) => {
    const d = instantOf(e.startsAt);
    if (!d) return "";
    const t = clock(d, tz, c.language);
    return dayKey(e.startsAt) === mainDay ? t : `${fmtInZone(d, tz, loc, { day: "numeric", month: "short" })} · ${t}`;
  };

  // calendar links: the wedding's start, until the last moment's end (else four hours after the start)
  const start = when;
  const lastEnd = Math.max(...c.events.map((e) => instantOf(e.endsAt)?.getTime() ?? 0), 0);
  const end = start ? new Date(lastEnd > +start ? lastEnd : +start + FALLBACK_MS) : null;
  const venue = c.events.find((e) => e.venue || e.address);
  const where = [venue?.venue, venue?.address || c.address].filter(Boolean).join(", ");
  const summary = `Wedding ${first} & ${second}`;
  const cal =
    start && end
      ? {
          google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summary)}&dates=${utc(start)}/${utc(end)}&location=${encodeURIComponent(where)}`,
          yahoo: `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(summary)}&st=${utc(start)}&et=${utc(end)}&in_loc=${encodeURIComponent(where)}`,
          ics: ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mula//WeDo//EN", "BEGIN:VEVENT", `UID:${utc(start)}-${first}-${second}@mula`.replace(/\s/g, ""), `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`, `SUMMARY:${summary}`, `LOCATION:${where.replace(/[,;\\]/g, " ")}`, "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n"),
        }
      : null;

  const deadline = instantOf(c.rsvp.deadline);
  const rsvpBy = deadline ? `${id ? "sebelum" : "by"} ${fmtInZone(deadline, tz, loc, { day: "numeric", month: "long" })}` : "";

  return {
    dayName, monthName, dayNum, year, timeText, rsvpBy, cal, rowTime,
    names: `${first} & ${second}`,
    ini1: first.charAt(0).toUpperCase(),
    ini2: second.charAt(0).toUpperCase(),
    venues: c.events.filter((e) => e.venue || e.address).length ? c.events.filter((e) => e.venue || e.address) : c.events.slice(0, 1),
  };
}
export type Derived = ReturnType<typeof derive>;
