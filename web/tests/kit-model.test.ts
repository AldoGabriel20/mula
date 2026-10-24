import { describe, expect, it } from "vitest";
import type { Invite } from "@/lib/api/invite";
import { accentSplit, buildInviteModel, countdown, fmtInZone, guestFromSearch, instantOf, mapHref, roman, str, time12, zoneParts } from "@/lib/kit/model";

// This file imports nothing from a template: the model must stand on its own (docs/17 §7.8).

const base = (over: Partial<Invite> = {}): Invite => ({
  template: "any", timezone: "Asia/Jakarta", event_type: "wedding", couple_a: " Adrian ", couple_b: "Isabella", event_date: "2027-06-11T23:00:00Z", venue: "Hall", palette: "Ivory", language: "en",
  sections: [{ type: "hero", content: { title: "Hi" } }, { type: "schedule", content: { dress_code: "Batik" } }],
  schedule: [
    { label: "The Ceremony", title: "Akad", starts_at: "2027-06-12T03:00:00Z", ends_at: null, venue: "Hall", address: "Jl. 1", map_url: "https://maps.example/x", venue_note: "North door", dress_code: " Formal ", description: "d", photo_id: "m1" },
  ],
  media: { m1: "/api/v1/media/m1/file?sig=abc" }, preview: false, gifts: [],
  gift_methods: [{ type: "bank", title: "BCA", detail: "Adrian", copy_value: "123" }, { type: "physical", title: "Home", detail: "", copy_value: "" }],
  live: null, rsvp_deadline: null, guest: null, ...over,
});

describe("buildInviteModel", () => {
  it("normalises names, instants, zone and moments", () => {
    const m = buildInviteModel(base(), "live");
    expect(m).toMatchObject({ mode: "live", partnerOne: "Adrian", partnerTwo: "Isabella", weddingDate: "2027-06-11T23:00:00Z", timezone: "Asia/Jakarta", language: "en" });
    expect(m.moments[0]).toMatchObject({ label: "The Ceremony", title: "Akad", mapUrl: "https://maps.example/x", venueNote: "North door", dressCode: "Formal" });
    expect(m.moments[0].photo).toEqual({ url: "/api/v1/media/m1/file?sig=abc", alt: "Akad" });
  });

  it("leaves missing names empty (the template picks its placeholder) and only signed photos resolve", () => {
    const m = buildInviteModel(base({ couple_a: null, couple_b: null }), "preview");
    expect(m.partnerOne).toBe("");
    expect(m.photo("m1", "x")).toEqual({ url: "/api/v1/media/m1/file?sig=abc", alt: "x" });
    expect(m.photo("other-event", "x")).toBeNull();
    expect(m.photo(7, "x")).toBeNull();
  });

  it("dress code: the schedule section's wins, else the first moment's", () => {
    expect(buildInviteModel(base(), "live").dressCode).toBe("Batik");
    expect(buildInviteModel(base({ sections: [] }), "live").dressCode).toBe("Formal");
    expect(buildInviteModel(base({ sections: [], schedule: [] }), "live").dressCode).toBe("");
  });

  it("gift methods keep bank and wallet only", () => {
    expect(buildInviteModel(base(), "live").giftMethods).toEqual([{ kind: "bank", bank: "BCA", holder: "Adrian", number: "123" }]);
  });

  it("a generic link has no personal guest; ?to= names them; a personal link wins over ?to=", () => {
    const generic = buildInviteModel(base(), "live", "?to=Rina");
    expect(generic.guest).toEqual({ name: "Rina", personal: false });
    expect(generic.rsvp.personal).toBe(false);
    const personal = buildInviteModel(base({ guest: { name: "Sarah", rsvp_status: "yes", party_size: 2, max_party: 3 } }), "live", "?to=Rina");
    expect(personal.guest).toEqual({ name: "Sarah", personal: true });
    expect(personal.rsvp).toMatchObject({ personal: true, status: "yes", partySize: 2, maxParty: 3 });
  });

  it("section lookups sanitise host JSON", () => {
    const m = buildInviteModel(base({ sections: [{ type: "story", content: "oops" as unknown as Record<string, unknown> }] }), "live");
    expect(m.has("story")).toBe(true);
    expect(m.has("gallery")).toBe(false);
    expect(m.content("story")).toEqual({});
    expect(m.content("gallery")).toEqual({});
  });
});

describe("zone-aware dates", () => {
  it("a 06:00 WIB moment is the next day in UTC and stays the right local day", () => {
    const d = new Date("2027-06-11T23:00:00Z");
    expect(fmtInZone(d, "Asia/Jakarta", "en-GB", { day: "numeric", month: "long" })).toBe("12 June");
    expect(fmtInZone(d, "UTC", "en-GB", { day: "numeric", month: "long" })).toBe("11 June");
    expect(zoneParts(d, "Asia/Jakarta")).toMatchObject({ d: "12", m: "06", y: "2027", h: 6, min: "00" });
  });
  it("degrades to blanks on a bad zone", () => {
    expect(fmtInZone(new Date(), "Mars/Base", "en-GB", { day: "numeric" })).toBe("");
    expect(zoneParts(new Date(), "Mars/Base").y).toBe("");
  });
  it("time12, roman numerals and instants", () => {
    expect(time12(18, "00")).toBe("6.00 PM");
    expect(time12(0, "30")).toBe("12.30 AM");
    expect(roman(4)).toBe("IV");
    expect(roman(11)).toBe("11");
    expect(instantOf("")).toBeNull();
    expect(instantOf("nope")).toBeNull();
    expect(instantOf("2027-01-01T00:00:00Z")).toBeInstanceOf(Date);
  });
});

describe("text and link hygiene", () => {
  it("heading override: the last word is the accent", () => {
    expect(accentSplit("Our beginning")).toEqual(["Our ", "beginning"]);
    expect(accentSplit("Together")).toEqual(["", "Together"]);
    expect(accentSplit("  ")).toBeNull();
    expect(accentSplit(undefined)).toBeNull();
  });
  it("map links: https only, else a search", () => {
    expect(mapHref("https://maps.app.goo.gl/x", "V", "A")).toBe("https://maps.app.goo.gl/x");
    expect(mapHref("javascript:alert(1)", "Hall", "Jl 1")).toBe("https://www.google.com/maps/search/?api=1&query=Hall%2C%20Jl%201");
    expect(mapHref("http://insecure", "Hall", "")).toContain("google.com/maps/search");
  });
  it("guest name from the link is capped at 60", () => {
    expect(guestFromSearch("?to=" + "a".repeat(100))).toHaveLength(60);
    expect(guestFromSearch("?guest=Budi")).toBe("Budi");
    expect(str("  x  ", 5)).toBe("x");
    expect(str(5, 5)).toBe("");
    expect(str("abcdef", 3)).toBe("abc");
  });
});

describe("countdown", () => {
  const at = Date.parse("2027-06-12T10:00:00Z");
  it("counts down", () => {
    const c = countdown("2027-06-12T10:00:00Z", at - (2 * 864e5 + 3 * 36e5 + 4 * 6e4 + 5000));
    expect(c).toMatchObject({ running: true, ended: false, d: 2, h: "03", m: "04", s: "05" });
  });
  it("ends at the instant, and an invalid date reads as announced later", () => {
    expect(countdown("2027-06-12T10:00:00Z", at)).toMatchObject({ running: false, ended: true, d: 0 });
    expect(countdown("", at).endedText).toMatch(/announced/);
  });
});
