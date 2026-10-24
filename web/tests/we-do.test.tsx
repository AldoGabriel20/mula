import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WeDoRoot from "@/components/templates/we-do/WeDo";
import { demoConfig, mapInvite } from "@/components/templates/we-do/config";
import { derive, iconFor } from "@/components/templates/we-do/derive";
import type { TemplateProps } from "@/components/templates/types";
import type { Invite } from "@/lib/api/invite";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import { KitRoot } from "@/lib/kit/KitRoot";
import { resolveTheme } from "@/lib/kit/tokens";

vi.mock("lenis", () => ({ default: class { stop() {} start() {} raf() {} scrollTo() {} destroy() {} } }));

/** The template as TemplateHost mounts it. */
const WeDo = (p: TemplateProps) => (
  <KitRoot slug="we-do" mode={p.mode} theme={p.invite?.theme}>
    <WeDoRoot {...p} />
  </KitRoot>
);

beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const invite = (over: Partial<Invite> = {}): Invite => ({
  template: "we-do", timezone: "Asia/Jakarta", event_type: "wedding", couple_a: "Rani", couple_b: "Dimas", event_date: "2030-07-22T08:30:00Z", venue: "The Glasshouse", palette: "Noir", language: "en",
  sections: [{ type: "hero", content: { title: "We Do" } }, { type: "rsvp", content: {} }, { type: "wishes", content: {} }, { type: "gift", content: {} }],
  schedule: [
    { label: "", title: "Wedding Ceremony", starts_at: "2030-07-22T08:30:00Z", ends_at: "2030-07-22T10:00:00Z", venue: "The Glasshouse", address: "Jl. Kemang 8", map_url: "", venue_note: "Shuttle at 3 PM", dress_code: "", description: "", photo_id: null },
    { label: "", title: "Dinner Reception", starts_at: "2030-07-22T11:30:00Z", ends_at: null, venue: "", address: "", map_url: "", venue_note: "", dress_code: "", description: "", photo_id: null },
  ],
  media: {}, preview: false, gifts: [], gift_methods: [{ type: "bank", title: "BCA", detail: "Rani", copy_value: "123 456" }],
  live: null, rsvp_deadline: "2030-07-15T16:00:00Z", guest: null, ...over,
});

describe("We Do config and derived values", () => {
  it("builds the date block, time and countdown target in the invitation's zone", () => {
    const d = derive(mapInvite(invite(), "live"));
    expect(d).toMatchObject({ dayName: "MONDAY", monthName: "JULY", dayNum: "22", year: "2030", timeText: "AT 3:30 PM", names: "Rani & Dimas", rsvpBy: "by 15 July" });
  });

  it("prints Indonesian names and a 24-hour clock for language id", () => {
    const d = derive(mapInvite(invite({ language: "id" }), "live"));
    expect(d.monthName).toBe("JULI");
    expect(d.timeText).toBe("PUKUL 15.30");
  });

  it("timeline rows carry their time, and the date when the moment is on another day", () => {
    const c = mapInvite(invite({ schedule: [...invite().schedule, { ...invite().schedule[0], title: "Brunch", starts_at: "2030-07-23T03:00:00Z" }] }), "live");
    const d = derive(c);
    expect(c.events.map(d.rowTime)).toEqual(["3:30 PM", "6:30 PM", "23 Jul · 10:00 AM"]);
  });

  it("calendar links: start, end from the last moment, location, escaped", () => {
    const c = derive(mapInvite(invite(), "live")).cal!;
    expect(c.google).toContain("dates=20300722T083000Z/20300722T100000Z");
    expect(c.google).toContain("text=Wedding%20Rani%20%26%20Dimas");
    expect(c.yahoo).toContain("st=20300722T083000Z");
    expect(c.ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(c.ics).toContain("SUMMARY:Wedding Rani & Dimas");
    expect(derive(mapInvite(invite({ event_date: null }), "live")).cal).toBeNull();
  });

  it("icons follow the title, else the position", () => {
    expect(["Akad Nikah", "Cocktail Hour", "Photo Session", "Dinner", "Dance Party", "Something"].map((t, i) => iconFor(t, i))).toEqual(["rings", "cocktail", "camera", "dinner", "speaker", "rings"]);
  });

  it("a published page shows only what the host filled in; the draft shows the design", () => {
    expect(mapInvite(invite(), "live").show).toEqual({ story: false, gallery: false, gift: true, music: false, wishes: true });
    expect(mapInvite(invite(), "preview").show.gallery).toBe(true);
    expect(mapInvite(invite({ sections: [] }), "live").show.wishes).toBe(false);
  });

  it("a generic link replies by notice; a personal link locks the name", () => {
    expect(mapInvite(invite(), "live").rsvp).toMatchObject({ mode: "notice", nameLocked: false });
    expect(mapInvite(invite({ guest: { name: "Sarah", rsvp_status: "pending", party_size: 1, max_party: 2 } }), "live").rsvp).toMatchObject({ mode: "form", nameLocked: true, maxParty: 2 });
  });
});

describe("We Do rendering", () => {
  it("the demo shows the whole invitation and reads only theme variables", () => {
    const { container } = render(<WeDo mode="demo" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("WeDo");
    for (const id of ["top", "countdown", "venue", "day", "details", "gallery", "gift", "rsvp", "wishes", "closing"]) expect(container.querySelector(`section#${id}`), id).toBeTruthy();
    expect(container.querySelectorAll("section#day li")).toHaveLength(5);
    const html = (container.querySelector("[data-template]") as HTMLElement).outerHTML;
    const used = new Set([...html.matchAll(/var\((--k-[a-z0-9-]+)\)/g)].map((m) => m[1]));
    expect([...used].filter((v) => !(v in resolveTheme(MANIFESTS["we-do"]).vars))).toEqual([]);
    // reduced motion in this test: nothing waits for a reveal
    expect(container.querySelector("[data-template]")!.getAttribute("data-motion")).toBe("off");
  });

  it("RSVP asks for a name and an answer, then thanks without sending (demo)", () => {
    render(<WeDo mode="demo" />);
    const rsvp = document.getElementById("rsvp")!;
    fireEvent.submit(within(rsvp).getByRole("button", { name: "Send" }).closest("form")!);
    expect(within(rsvp).getByText("Please enter your name.")).toBeTruthy();
    expect(within(rsvp).getByText("Please let us know whether you can attend.")).toBeTruthy();
    fireEvent.change(within(rsvp).getByLabelText("Full name *"), { target: { value: "Sarah Lee" } });
    fireEvent.click(within(rsvp).getByLabelText(/Joyfully accept/));
    fireEvent.submit(within(rsvp).getByRole("button", { name: "Send" }).closest("form")!);
    expect(within(rsvp).getByText(/Thank you, Sarah/)).toBeTruthy();
    expect(within(rsvp).getByText("This is a demo: nothing was sent.")).toBeTruthy();
  });

  it("a generic live link shows the notice instead of the form", () => {
    render(<WeDo mode="live" token="t" invite={invite()} />);
    expect(screen.getByText(/personal link your hosts sent you/)).toBeTruthy();
  });

  it("wishes: a demo wish is kept on this device and the carousel steps", () => {
    render(<WeDo mode="demo" />);
    const w = document.getElementById("wishes")!;
    expect(within(w).getByText(/Wishing you a lifetime/)).toBeTruthy();
    fireEvent.click(within(w).getByRole("button", { name: "Next wish" }));
    expect(within(w).getByText(/May your home/)).toBeTruthy();
    fireEvent.change(within(w).getByLabelText("Your name"), { target: { value: "Rina" } });
    fireEvent.change(within(w).getByLabelText("Your wish"), { target: { value: "Selamat!" } });
    fireEvent.submit(within(w).getByRole("button", { name: "Send wish" }).closest("form")!);
    expect(within(w).getByText(/shown on this device only/)).toBeTruthy();
  });

  it("the calendar menu opens, offers three calendars and closes on Escape", () => {
    render(<WeDo mode="demo" />);
    fireEvent.click(screen.getByRole("button", { name: "Add to calendar" }));
    expect(screen.getByRole("link", { name: "Google Calendar" }).getAttribute("href")).toContain("calendar.google.com");
    expect(screen.getByRole("button", { name: /Apple/ })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("link", { name: "Google Calendar" })).toBeNull();
  });

  it("demoConfig names the guest from ?to=", () => {
    expect(demoConfig("?to=Sarah").guestName).toBe("Sarah");
  });
});
