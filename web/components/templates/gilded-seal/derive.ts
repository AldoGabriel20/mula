import { accentSplit, fmtInZone as fmt, instantOf as instant, localeOf, mapHref, roman, time12, zoneParts as parts } from "@/lib/kit/model";
import type { ConfigEvent, WeddingConfig } from "./config";

export type DerivedEvent = ConfigEvent & {
  n: number;
  numeral: string;
  dateLong: string;
  /** "6.00 PM", or "" when the moment has no time. */
  timeLabel: string;
  /** "6.00 PM – 9.00 PM" or just the start. */
  timeRange: string;
  mapHref: string;
  /** Index into `venues`. */
  vIdx: number;
};

export type DerivedVenue = {
  name: string;
  address: string;
  mapHref: string;
  note: string;
  /** Moment titles joined with " & " (the venue tab label). */
  label: string;
  events: { title: string; when: string }[];
  /** First moment photo of the venue (docs/15 D5). */
  photo: ConfigEvent["photo"];
};

export type Derived = {
  p1: string;
  p2: string;
  couple: string;
  ini1: string;
  ini2: string;
  guest: string;
  valid: boolean;
  displayDate: string;
  weekday: string;
  day: string;
  monthName: string;
  year: string;
  /** "12 · 06 · 2027" */
  dateDots: string;
  events: DerivedEvent[];
  venues: DerivedVenue[];
  rsvpByText: string;
  chapters: { title: string; text: string; n: string; delay: number }[];
  statementWords: string[];
};

const TBA = "Date to be announced";

/** Port of the prototype's `cfg()`: every string the markup prints, computed once per config. */
export function derive(c: WeddingConfig): Derived {
  const p1 = c.partnerOne.trim();
  const p2 = c.partnerTwo.trim();
  const tz = c.timezone;
  const loc = localeOf(c.language);
  const wedding = instant(c.weddingDate);
  const valid = !!wedding;
  const wd = wedding ?? new Date(NaN);

  const events: DerivedEvent[] = c.events.map((e, i) => {
    const start = instant(e.startsAt);
    const end = instant(e.endsAt);
    const day = start ?? wedding;
    const sp = start ? parts(start, tz) : null;
    const ep = end ? parts(end, tz) : null;
    const timeLabel = sp ? time12(sp.h, sp.min) : "";
    const endLabel = ep ? time12(ep.h, ep.min) : "";
    return {
      ...e,
      n: i + 1,
      numeral: roman(i + 1),
      dateLong: day ? fmt(day, tz, loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) || TBA : TBA,
      timeLabel,
      timeRange: endLabel && timeLabel ? `${timeLabel} – ${endLabel}` : timeLabel,
      mapHref: mapHref(e.mapUrl, e.venue, e.address),
      vIdx: 0,
    };
  });

  // moments sharing a venue name + address are one venue
  const groups = new Map<string, DerivedVenue>();
  events.forEach((e) => {
    const k = (e.venue + "|" + e.address).toLowerCase();
    if (!groups.has(k)) groups.set(k, { name: e.venue || "Venue to be announced", address: e.address, mapHref: e.mapHref, note: "", label: "", events: [], photo: null });
    const v = groups.get(k)!;
    v.events.push({ title: e.title, when: [e.dateLong, e.timeRange].filter(Boolean).join(" · ") });
    if (!v.note && e.venueNote) v.note = e.venueNote;
    if (!v.photo && e.photo) v.photo = e.photo;
    e.vIdx = [...groups.keys()].indexOf(k);
  });
  const venues = [...groups.values()].map((v) => ({ ...v, label: v.events.map((x) => x.title).join(" & ") }));

  const wp = wedding ? parts(wedding, tz) : null;
  return {
    p1,
    p2,
    couple: `${p1} & ${p2}`,
    ini1: p1.charAt(0).toUpperCase(),
    ini2: p2.charAt(0).toUpperCase(),
    guest: c.guestName,
    valid,
    displayDate: valid ? fmt(wd, tz, loc, { day: "numeric", month: "long", year: "numeric" }) || TBA : TBA,
    weekday: valid ? fmt(wd, tz, loc, { weekday: "long" }) : "",
    day: valid ? fmt(wd, tz, loc, { day: "numeric" }) : "—",
    monthName: valid ? fmt(wd, tz, loc, { month: "long" }) : "",
    year: valid ? fmt(wd, tz, loc, { year: "numeric" }) : "",
    dateDots: wp ? `${wp.d} · ${wp.m} · ${wp.y}` : "",
    events,
    venues,
    rsvpByText: rsvpBy(c, tz, loc),
    chapters: c.chapters.map((ch, i) => ({ ...ch, n: roman(i + 1), delay: 150 + i * 110 })),
    statementWords: c.statement.split(/\s+/).filter(Boolean),
  };
}

function rsvpBy(c: WeddingConfig, tz: string, loc: string): string {
  const d = instant(c.rsvp.deadline);
  const by = d ? fmt(d, tz, loc, { day: "numeric", month: "long", year: "numeric" }) : "";
  return by ? `Kindly reply by ${by}. We would be honoured to celebrate with you.` : "Kindly reply at your earliest convenience. We would be honoured to celebrate with you.";
}

/** Characters of a name for the staggered reveal (a space becomes a non-breaking one). */
export const splitChars = (name: string, d0 = 0, step = 45) => [...name].map((ch, i) => ({ c: ch === " " ? " " : ch, d: d0 + i * step }));

// ---- headings -----------------------------------------------------------------------------------

export const DEFAULT_HEADINGS = {
  story: ["How it ", "began"],
  celebration: ["Join us ", "for the day"],
  venue: ["Where we ", "gather"],
  gallery: ["Moments ", "in between"],
  gift: ["With ", "gratitude"],
  rsvp: ["Will you ", "join us?"],
  wishes: ["Wishes ", "for us"],
} as const satisfies Record<string, readonly [string, string]>;

/**
 * Heading as [lead, accent]. A host override wins and its LAST word becomes the accent italic
 * ("Our beginning" → "Our " + "beginning"); a single word is all accent.
 */
export function headingParts(key: keyof typeof DEFAULT_HEADINGS, override?: string): [string, string] {
  return accentSplit(override) ?? [...DEFAULT_HEADINGS[key]];
}
