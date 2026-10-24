import { fmtInZone, instantOf, localeOf, zoneParts } from "@/lib/kit/model";
import type { ModelMoment } from "@/lib/kit/model";
import type { ArConfig } from "./config";

/** "4:00 PM" (English) or "16.00" (Indonesian), in the zone. */
export function clock(d: Date, tz: string, language: string): string {
  const { h, min } = zoneParts(d, tz);
  if (language === "id") return `${String(h).padStart(2, "0")}.${min}`;
  return `${((h + 11) % 12) + 1}:${min} ${h < 12 ? "AM" : "PM"}`;
}

const utc = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const FALLBACK_MS = 4 * 36e5;

/** Everything derived from the config that more than one section prints. Pure. */
export function derive(c: ArConfig) {
  const when = instantOf(c.weddingDate);
  const loc = localeOf(c.language);
  const tz = c.timezone;
  const fmt = (o: Intl.DateTimeFormatOptions) => (when ? fmtInZone(when, tz, loc, o) : "");
  const parts = when ? zoneParts(when, tz) : null;
  const pad = (n: number | string) => String(n).padStart(2, "0");
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
  const lastEnd = Math.max(...c.events.map((e) => instantOf(e.endsAt)?.getTime() ?? 0), 0);
  const end = when ? new Date(lastEnd > +when ? lastEnd : +when + FALLBACK_MS) : null;
  const where = [c.venue, c.address].filter(Boolean).join(", ");
  const summary = `Wedding ${first} & ${second}`;
  const cal =
    when && end
      ? {
          google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summary)}&dates=${utc(when)}/${utc(end)}&location=${encodeURIComponent(where)}`,
          ics: ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mula//Arunika//EN", "BEGIN:VEVENT", `UID:${utc(when)}-${first}-${second}@mula`.replace(/\s/g, ""), `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(when)}`, `DTEND:${utc(end)}`, `SUMMARY:${summary}`, `LOCATION:${where.replace(/[,;\\]/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n"),
        }
      : null;

  const deadline = instantOf(c.rsvp.deadline);
  const id = c.language === "id";
  return {
    weekday: fmt({ weekday: "long" }),
    dayNum: fmt({ day: "numeric" }),
    monthName: fmt({ month: "long" }),
    year: fmt({ year: "numeric" }),
    time: when ? clock(when, tz, c.language) : "",
    /** "12.06.27" */
    short: parts ? `${pad(parts.d)}.${pad(parts.m)}.${String(parts.y).slice(-2)}` : "",
    rsvpBy: deadline ? `${id ? "sebelum" : "by"} ${fmtInZone(deadline, tz, loc, { day: "numeric", month: "long", year: "numeric" })}` : "",
    cal,
    rowTime,
    first,
    second,
    ini1: first.charAt(0).toUpperCase(),
    ini2: second.charAt(0).toUpperCase(),
    venues: c.events.filter((e) => e.venue || e.address).length ? c.events.filter((e) => e.venue || e.address) : c.events.slice(0, 1),
  };
}
export type Derived = ReturnType<typeof derive>;
