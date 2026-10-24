import { describe, expect, it } from "vitest";
import type { Invite } from "@/lib/api/invite";
import { DEFAULT_COPY, demoConfig, mapInvite } from "@/components/templates/gilded-seal/config";
import { countdown, guestFromSearch, mapHref, time12 } from "@/lib/kit/model";
import { DEFAULT_HEADINGS, derive, headingParts, splitChars } from "@/components/templates/gilded-seal/derive";

const base = (over: Partial<Invite> = {}): Invite => ({
  template: "gilded-seal",
  timezone: "Asia/Jakarta",
  event_type: "wedding",
  couple_a: "Adrian",
  couple_b: "Isabella",
  event_date: "2027-06-11T23:30:00Z", // 12 June 06:30 in Jakarta, but still 11 June in UTC
  venue: "The Glasshouse",
  palette: "Ivory",
  language: "en",
  sections: [
    { type: "hero", content: {} },
    { type: "rsvp", content: {} },
  ],
  schedule: [],
  media: {},
  preview: false,
  gifts: [],
  gift_methods: [],
  live: null,
  rsvp_deadline: null,
  guest: null,
  ...over,
});

const moment = (o: Partial<Invite["schedule"][number]> = {}): Invite["schedule"][number] => ({
  label: "The Ceremony", title: "Akad", starts_at: "2027-06-12T03:00:00Z", ends_at: null, venue: "Hall A", address: "Jl. Sudirman 5", map_url: "", venue_note: "", dress_code: "", description: "", photo_id: null, ...o,
});

describe("derive: dates in the event's time zone", () => {
  it("prints the local day, not the UTC one (WIB 06:30 is the 12th, UTC says the 11th)", () => {
    const d = derive(mapInvite(base(), "live"));
    expect(d.displayDate).toBe("12 June 2027");
    expect(d.weekday).toBe("Saturday");
    expect(d.day).toBe("12");
    expect(d.monthName).toBe("June");
    expect(d.year).toBe("2027");
    expect(d.dateDots).toBe("12 · 06 · 2027");
  });
  it("follows the zone: the same instant is still the 11th in Los Angeles", () => {
    const d = derive(mapInvite(base({ timezone: "America/Los_Angeles" }), "live"));
    expect(d.day).toBe("11");
    expect(d.dateDots).toBe("11 · 06 · 2027");
  });
  it("uses Indonesian month and day names for language id", () => {
    const d = derive(mapInvite(base({ language: "id" }), "live"));
    expect(d.monthName).toBe("Juni");
    expect(d.weekday).toBe("Sabtu");
  });
  it("falls back when the date is missing or invalid", () => {
    const d = derive(mapInvite(base({ event_date: null }), "live"));
    expect(d.valid).toBe(false);
    expect(d.displayDate).toBe("Date to be announced");
    expect(d.day).toBe("—");
    expect(d.dateDots).toBe("");
  });
  it("survives an unknown time zone without throwing", () => {
    const d = derive(mapInvite(base({ timezone: "Mars/Base" }), "live"));
    expect(d.displayDate).toBe("Date to be announced");
  });
});

describe("derive: moments and venues", () => {
  it("formats times like the prototype (6.00 PM) and ranges", () => {
    expect(time12(18, "00")).toBe("6.00 PM");
    expect(time12(0, "05")).toBe("12.05 AM");
    expect(time12(12, "30")).toBe("12.30 PM");
    const c = mapInvite(base({ schedule: [moment({ starts_at: "2027-06-12T11:00:00Z", ends_at: "2027-06-12T14:30:00Z" })] }), "live");
    const e = derive(c).events[0];
    expect(e.timeLabel).toBe("6.00 PM");
    expect(e.timeRange).toBe("6.00 PM – 9.30 PM");
    expect(e.dateLong).toBe("Saturday, 12 June 2027");
    expect(e.numeral).toBe("I");
  });
  it("a moment without a start uses the wedding day and shows no time", () => {
    const e = derive(mapInvite(base({ schedule: [moment({ starts_at: null })] }), "live")).events[0];
    expect(e.timeLabel).toBe("");
    expect(e.dateLong).toBe("Saturday, 12 June 2027");
  });
  it("two moments at one venue make one venue with two lines; a new address makes a second", () => {
    const d = derive(
      mapInvite(base({ schedule: [moment({ title: "Akad" }), moment({ title: "Lunch", venue_note: "Garden" }), moment({ title: "Dinner", venue: "Ballroom", address: "Jl. Gatot 1" })] }), "live"),
    );
    expect(d.venues).toHaveLength(2);
    expect(d.venues[0].events.map((x) => x.title)).toEqual(["Akad", "Lunch"]);
    expect(d.venues[0].label).toBe("Akad & Lunch");
    expect(d.venues[0].note).toBe("Garden");
    expect(d.events.map((e) => e.vIdx)).toEqual([0, 0, 1]);
  });
  it("only https map links are used; anything else becomes a Maps search", () => {
    expect(mapHref("https://maps.app.goo.gl/x", "A", "B")).toBe("https://maps.app.goo.gl/x");
    for (const bad of ["javascript:alert(1)", "http://maps.example.com", "data:text/html,x", "", "not a url"]) {
      expect(mapHref(bad, "Hall A", "Jl. Sudirman 5")).toBe("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Hall A, Jl. Sudirman 5"));
    }
  });
  it("no moments → one fallback card from the event date and venue", () => {
    const c = mapInvite(base(), "live");
    expect(c.events).toHaveLength(1);
    expect(c.events[0]).toMatchObject({ label: "The Celebration", venue: "The Glasshouse", startsAt: "2027-06-11T23:30:00Z" });
  });
});

describe("mapInvite", () => {
  it("applies every fallback row of docs/15 §7.2", () => {
    const c = mapInvite(base({ couple_a: null, couple_b: "  " }), "live");
    expect(c.partnerOne).toBe("Partner");
    expect(c.partnerTwo).toBe("Partner");
    expect(c).toMatchObject({ heroLine: DEFAULT_COPY.heroLine, statement: DEFAULT_COPY.statement, closingMessage: DEFAULT_COPY.closingMessage, heroTitle: "The Wedding Of", guestName: "Our Beloved Guest", dressCode: "" });
    expect(c.gift.note).toBe(DEFAULT_COPY.giftNote);
    expect(c.rsvp.maxParty).toBe(1);
    expect(c.rsvp.mode).toBe("notice"); // generic link, live
  });
  it("hides sections that have nothing to show, and keeps the ones that do", () => {
    const empty = mapInvite(base(), "live");
    expect(empty.show).toEqual({ opening: false, story: false, gallery: false, gift: false, music: false, wishes: false, closing: false });
    const media = { "11111111-1111-1111-1111-111111111111": "/api/v1/media/11111111-1111-1111-1111-111111111111/file?sig=x" };
    const full = mapInvite(
      base({
        media,
        gift_methods: [{ type: "bank", title: "BCA", detail: "Adrian P.", copy_value: "123" }, { type: "physical", title: "Home", detail: "", copy_value: "" }],
        sections: [
          { type: "hero", content: { photo_id: "11111111-1111-1111-1111-111111111111", line: "Hello" } },
          { type: "opening", content: { statement: "Two hearts" } },
          { type: "story", content: { body: "How we met", chapters: [{ title: "One", text: "x" }, "junk", { title: "", text: "" }], photo_ids: ["11111111-1111-1111-1111-111111111111"] } },
          { type: "gallery", content: { photos: [{ id: "11111111-1111-1111-1111-111111111111", alt: "A" }, { id: "22222222-2222-2222-2222-222222222222", alt: "foreign" }] } },
          { type: "gift", content: { title: "Our thanks" } },
          { type: "wishes", content: {} },
          { type: "music", content: { track: "satie-gymnopedie-1" } },
          { type: "closing", content: { body: "Bye" } },
          { type: "rsvp", content: {} },
        ],
      }),
      "live",
    );
    expect(full.show).toEqual({ opening: true, story: true, gallery: true, gift: true, music: true, wishes: true, closing: true });
    expect(full.gift.methods).toEqual([{ kind: "bank", bank: "BCA", holder: "Adrian P.", number: "123" }]); // physical gifts have no account to copy
    expect(full.gallery).toEqual([{ url: media["11111111-1111-1111-1111-111111111111"], alt: "A" }]); // an id with no signed url is dropped
    expect(full.chapters).toEqual([{ title: "One", text: "x" }]);
    expect(full.photos.hero?.url).toContain("/file?sig=");
    expect(full.titles.gift).toBe("Our thanks");
    expect(full.heroLine).toBe("Hello");
  });
  it("treats host content as untrusted: wrong types and over-long strings are clamped or dropped", () => {
    const c = mapInvite(base({ sections: [{ type: "hero", content: { line: 7, title: "x".repeat(500) } }, { type: "opening", content: { statement: { a: 1 } } }, { type: "music", content: { track: "nope" } }, { type: "rsvp", content: {} }] }), "live");
    expect(c.heroLine).toBe(DEFAULT_COPY.heroLine);
    expect(c.heroTitle).toHaveLength(40);
    expect(c.statement).toBe(DEFAULT_COPY.statement);
    expect(c.music).toBeNull();
    expect(c.show.music).toBe(false);
  });
  it("personal links lock the name and use the guest; ?to= only counts on generic links", () => {
    const personal = mapInvite(base({ guest: { name: "Sarah Wijaya", rsvp_status: "yes", party_size: 2, max_party: 3 } }), "live", "?to=Mallory");
    expect(personal.guestName).toBe("Sarah Wijaya");
    expect(personal.rsvp).toMatchObject({ mode: "form", nameLocked: true, status: "yes", partySize: 2, maxParty: 3 });
    const generic = mapInvite(base(), "live", "?to=Aunt%20Mira");
    expect(generic.guestName).toBe("Aunt Mira");
    expect(generic.rsvp.nameLocked).toBe(false);
    expect(mapInvite(base(), "preview").rsvp.mode).toBe("form");
  });
  it("a host's draft shows the whole design: the sample's story and gallery stand in until real content exists; a published page does not", () => {
    const draft = mapInvite(base(), "preview");
    expect(draft.show).toMatchObject({ story: true, gallery: true });
    expect(draft.story).toContain("A placeholder for the couple's real love story");
    expect(draft.chapters.map((c) => c.title)).toEqual(["The first hello", "Growing together", "The question"]);
    expect(draft.gallery).toHaveLength(8);
    expect(draft.gallery.every((p) => p.url === null)).toBe(true); // empty frames, nothing to expand
    const live = mapInvite(base(), "live");
    expect(live.show).toMatchObject({ story: false, gallery: false });
    expect(live.story).toBe("");
    expect(live.gallery).toEqual([]);
    // what the host did write always wins over the placeholders
    const mine = mapInvite(base({ sections: [{ type: "hero", content: {} }, { type: "story", content: { body: "Our own words", chapters: [{ title: "Us", text: "x" }] } }, { type: "rsvp", content: {} }] }), "preview");
    expect(mine.story).toBe("Our own words");
    expect(mine.chapters).toEqual([{ title: "Us", text: "x" }]);
  });
  it("guestFromSearch caps at 60 characters and reads ?guest= too", () => {
    expect(guestFromSearch("?to=" + "a".repeat(100))).toHaveLength(60);
    expect(guestFromSearch("?guest=Budi")).toBe("Budi");
    expect(guestFromSearch("")).toBe("");
  });
});

describe("demo config", () => {
  it("is the prototype's configuration and shows every section", () => {
    const c = demoConfig("?to=Sarah");
    expect(c).toMatchObject({ partnerOne: "Adrian", partnerTwo: "Isabella", guestName: "Sarah", timezone: "Asia/Jakarta", mode: "demo" });
    expect(Object.values(c.show).every(Boolean)).toBe(true);
    expect(c.gallery).toHaveLength(8);
    expect(c.sampleWishes).toHaveLength(4);
    const d = derive(c);
    expect(d.displayDate).toBe("12 June 2027");
    expect(d.events.map((e) => e.timeLabel)).toEqual(["10.00 AM", "6.00 PM"]);
    expect(d.venues).toHaveLength(2);
  });
});

describe("headings, chars, countdown", () => {
  it("defaults come from the prototype; an override puts its last word in the accent", () => {
    expect(headingParts("story")).toEqual(["How it ", "began"]);
    expect(headingParts("celebration")).toEqual(["Join us ", "for the day"]);
    expect(headingParts("story", "Our beginning")).toEqual(["Our ", "beginning"]);
    expect(headingParts("story", "Forever")).toEqual(["", "Forever"]);
    expect(headingParts("story", "   ")).toEqual([...DEFAULT_HEADINGS.story]);
  });
  it("splits a name into staggered characters (a space is a non-breaking one)", () => {
    expect(splitChars("A B", 380)).toEqual([{ c: "A", d: 380 }, { c: " ", d: 425 }, { c: "B", d: 470 }]);
  });
  it("counts down, then ends", () => {
    const t0 = Date.parse("2027-06-12T00:00:00Z");
    expect(countdown("2027-06-12T01:02:03Z", t0)).toMatchObject({ running: true, ended: false, d: 0, h: "01", m: "02", s: "03" });
    expect(countdown("2027-06-12T00:00:00Z", t0)).toMatchObject({ running: false, ended: true, endedText: expect.stringContaining("begun") });
    expect(countdown("", t0)).toMatchObject({ running: false, ended: true, endedText: "The date will be announced soon." });
  });
  it("rsvpByText names the deadline in the event zone", () => {
    const d = derive(mapInvite(base({ rsvp_deadline: "2027-05-01T16:59:00Z" }), "live"));
    expect(d.rsvpByText).toBe("Kindly reply by 1 May 2027. We would be honoured to celebrate with you.");
    expect(derive(mapInvite(base(), "live")).rsvpByText).toContain("at your earliest convenience");
  });
});
