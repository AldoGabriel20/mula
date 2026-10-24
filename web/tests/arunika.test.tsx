import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ArunikaRoot from "@/components/templates/arunika/Arunika";
import { seal } from "@/components/templates/arunika/art";
import { mapInvite } from "@/components/templates/arunika/config";
import { derive } from "@/components/templates/arunika/derive";
import type { TemplateProps } from "@/components/templates/types";
import type { Invite } from "@/lib/api/invite";
import { MANIFESTS } from "@/lib/kit/generated/manifests";
import { KitRoot } from "@/lib/kit/KitRoot";
import { resolveTheme } from "@/lib/kit/tokens";

vi.mock("lenis", () => ({ default: class { stop() {} start() {} raf() {} scrollTo() {} destroy() {} } }));

const Arunika = (p: TemplateProps) => (
  <KitRoot slug="arunika" mode={p.mode} theme={p.invite?.theme}>
    <ArunikaRoot {...p} />
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
  template: "arunika", timezone: "Asia/Makassar", event_type: "wedding", couple_a: "Raka", couple_b: "Nadia", event_date: "2027-06-12T08:00:00Z", venue: "Villa Arunika", palette: "Olive", language: "en",
  sections: [{ type: "hero", content: {} }, { type: "rsvp", content: {} }, { type: "wishes", content: {} }],
  schedule: [{ label: "", title: "Ceremony", starts_at: "2027-06-12T08:00:00Z", ends_at: null, venue: "Villa Arunika", address: "Ubud", map_url: "", venue_note: "", dress_code: "", description: "", photo_id: null }],
  media: {}, preview: false, gifts: [], gift_methods: [], live: null, rsvp_deadline: "2027-05-01T08:00:00Z", guest: null, ...over,
});

describe("Arunika", () => {
  it("derives the date in the invitation's zone", () => {
    expect(derive(mapInvite(invite(), "live"))).toMatchObject({ weekday: "Saturday", dayNum: "12", monthName: "June", year: "2027", time: "4:00 PM", short: "12.06.27", rsvpBy: "by 1 May 2027" });
  });

  it("a published page shows only what the host filled in", () => {
    expect(mapInvite(invite(), "live").show).toEqual({ story: false, gallery: false, gift: false, music: false, wishes: true });
  });

  it("escapes the initials it presses into the wax seal", () => {
    expect(seal(1, "<", "&")).not.toMatch(/>[<&]</);
  });

  it("the demo shows the whole invitation, reads only theme variables, and replies", () => {
    const { container } = render(<Arunika mode="demo" />);
    for (const id of ["top", "countdown", "story", "details", "gallery", "gift", "rsvp", "wishes", "closing"]) expect(container.querySelector(`section#${id}`), id).toBeTruthy();
    const html = (container.querySelector("[data-template]") as HTMLElement).outerHTML;
    const used = new Set([...html.matchAll(/var\((--k-[a-z0-9-]+)\)/g)].map((m) => m[1]));
    expect([...used].filter((v) => !(v in resolveTheme(MANIFESTS.arunika).vars))).toEqual([]);
    expect(container.querySelector("[data-template]")!.getAttribute("data-motion")).toBe("off");

    fireEvent.click(screen.getByRole("button", { name: "Open Invitation" }));
    const rsvp = container.querySelector("section#rsvp") as HTMLElement;
    fireEvent.change(within(rsvp).getByLabelText("Full name *"), { target: { value: "Sarah Lee" } });
    fireEvent.click(within(rsvp).getByLabelText(/Joyfully accept/));
    fireEvent.submit(within(rsvp).getByRole("button", { name: "Send RSVP" }).closest("form")!);
    expect(within(rsvp).getByText(/Thank you, Sarah/)).toBeTruthy();
  });
});
