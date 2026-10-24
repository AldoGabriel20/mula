import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Invite } from "@/lib/api/invite";

vi.mock("next/font/local", () => ({ default: (o: { variable: string }) => ({ variable: o.variable, style: { fontFamily: o.variable } }) }));
vi.mock("lenis", () => ({ default: class { stop() {} start() {} raf() {} scrollTo() {} destroy() {} } }));
vi.mock("@/lib/api/invite", async (orig) => ({ ...(await orig<typeof import("@/lib/api/invite")>()), submitRsvp: vi.fn(), submitWish: vi.fn(), listWishes: vi.fn() }));

import GildedSeal from "./helpers/gilded-seal";
import { InviteError, listWishes, submitRsvp, submitWish } from "@/lib/api/invite";

const rsvpMock = vi.mocked(submitRsvp);
const wishMock = vi.mocked(submitWish);
const listMock = vi.mocked(listWishes);

let rafQueue: Map<number, FrameRequestCallback>;
let rafId: number;
const frame = (t: number) => {
  const cbs = [...rafQueue.values()];
  rafQueue.clear();
  cbs.forEach((cb) => cb(t));
};
const finishLoading = async () => {
  await vi.advanceTimersByTimeAsync(200);
  for (let t = 0; t < 120; t++) {
    frame(t * 50);
    await vi.advanceTimersByTimeAsync(50);
  }
};
/** Load, then press Open (the reduced path: no 3D scene in jsdom). */
const openCover = async (container: HTMLElement) => {
  await act(finishLoading);
  await act(async () => {
    [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Open Invitation"))!.click();
    await vi.advanceTimersByTimeAsync(1000);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  rafQueue = new Map();
  rafId = 0;
  rsvpMock.mockReset();
  wishMock.mockReset();
  listMock.mockReset();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (rafQueue.set(++rafId, cb), rafId));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => rafQueue.delete(id));
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("hover") || q.includes("pointer"), addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  Element.prototype.animate = vi.fn(() => ({ pause() {}, play() {}, cancel() {}, finish() {}, set currentTime(_v: number) {}, onfinish: null })) as unknown as typeof Element.prototype.animate;
});
afterEach(() => {
  cleanup(); // unmount while the stubs are still in place
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  // @ts-expect-error — test shim
  delete Element.prototype.animate;
});

const P1 = "11111111-1111-1111-1111-111111111111";
const P2 = "22222222-2222-2222-2222-222222222222";
const base = (over: Partial<Invite> = {}): Invite => ({
  template: "gilded-seal", timezone: "Asia/Jakarta", event_type: "wedding", couple_a: "Adrian", couple_b: "Isabella", event_date: "2027-06-12T03:00:00Z", venue: "Hall",
  palette: "Ivory", language: "en",
  sections: [{ type: "hero", content: {} }, { type: "rsvp", content: {} }, { type: "wishes", content: {} }],
  schedule: [], media: {}, preview: false, gifts: [], gift_methods: [], live: null, rsvp_deadline: null,
  guest: { name: "Sarah Wijaya", rsvp_status: "pending", party_size: 0, max_party: 3 },
  ...over,
});
const wishes = (n: number, from = 0) => Array.from({ length: n }, (_, i) => ({ id: `w${from + i}`, name: `Guest ${from + i}`, message: `Wish number ${from + i}` }));

describe("RSVP", () => {
  it("a personal link sends the reply, keeps the guest's name read-only and turns the card over", async () => {
    rsvpMock.mockResolvedValue(undefined);
    const { container } = render(<GildedSeal mode="live" invite={base()} token="tok" />);
    const rsvp = container.querySelector("#rsvp") as HTMLElement;
    const name = within(rsvp).getByPlaceholderText("As written on your invitation") as HTMLInputElement;
    expect(name.value).toBe("Sarah Wijaya");
    expect(name.readOnly).toBe(true);
    expect(within(rsvp).queryByLabelText("More guests")).toBeNull(); // only once "yes" is chosen
    fireEvent.click(within(rsvp).getByLabelText(/Joyfully accepts/));
    fireEvent.click(within(rsvp).getByLabelText("More guests"));
    fireEvent.change(within(rsvp).getByPlaceholderText(/Dietary needs/), { target: { value: "Vegetarian please" } });
    await act(async () => {
      fireEvent.submit(rsvp.querySelector("form")!);
    });
    expect(rsvpMock).toHaveBeenCalledWith("tok", { status: "yes", party_size: 2, note: "Vegetarian please" });
    expect(within(rsvp).getByText(/all 2 of you/)).toBeTruthy();
    expect(rsvp.querySelector("h3")!.textContent).toBe("Thank you, Sarah");
    expect(within(rsvp).queryByText(/preview, so your reply/)).toBeNull();
  });

  it("validates before sending, and a decline sends party size 0", async () => {
    rsvpMock.mockResolvedValue(undefined);
    const { container } = render(<GildedSeal mode="live" invite={base()} token="tok" />);
    const rsvp = container.querySelector("#rsvp") as HTMLElement;
    await act(async () => {
      fireEvent.submit(rsvp.querySelector("form")!);
    });
    expect(rsvpMock).not.toHaveBeenCalled();
    expect(within(rsvp).getByText("Please let us know whether you can attend.")).toBeTruthy();
    fireEvent.click(within(rsvp).getByLabelText(/Regretfully declines/));
    await act(async () => {
      fireEvent.submit(rsvp.querySelector("form")!);
    });
    expect(rsvpMock).toHaveBeenCalledWith("tok", { status: "no", party_size: 0, note: undefined });
    expect(within(rsvp).getByText(/We will miss you on the day/)).toBeTruthy();
  });

  it("explains a closed or revoked invitation and keeps the answers for a retry", async () => {
    const { container } = render(<GildedSeal mode="live" invite={base()} token="tok" />);
    const rsvp = container.querySelector("#rsvp") as HTMLElement;
    fireEvent.click(within(rsvp).getByLabelText(/Joyfully accepts/));
    for (const [err, text] of [
      [new InviteError(422, "rsvp_closed", "closed"), "Replies for this celebration are now closed."],
      [new InviteError(404, "not_found", "nope"), "This invitation is no longer available."],
      [new Error("network"), "We could not send your reply. Your answers are saved here, so please try again in a moment."],
    ] as const) {
      rsvpMock.mockRejectedValueOnce(err);
      await act(async () => {
        fireEvent.submit(rsvp.querySelector("form")!);
      });
      expect(rsvp.textContent).toContain(text);
    }
    expect((within(rsvp).getByLabelText(/Joyfully accepts/) as HTMLInputElement).checked).toBe(true);
  });

  it("a guest who already replied sees the thank-you side, and can change the reply", () => {
    const { container } = render(<GildedSeal mode="live" invite={base({ guest: { name: "Sarah Wijaya", rsvp_status: "yes", party_size: 2, max_party: 3 } })} token="tok" />);
    const rsvp = container.querySelector("#rsvp") as HTMLElement;
    expect(rsvp.querySelector("h3")!.textContent).toBe("Thank you, Sarah");
    expect(within(rsvp).getByText(/all 2 of you/)).toBeTruthy();
    fireEvent.click(within(rsvp).getByText("Change my reply"));
    expect((within(rsvp).getByLabelText(/Joyfully accepts/) as HTMLInputElement).checked).toBe(true);
  });

  it("a generic link only points to the personal one (no form, nothing sent)", () => {
    const { container } = render(<GildedSeal mode="live" invite={base({ guest: null })} token="tok" />);
    const rsvp = container.querySelector("#rsvp") as HTMLElement;
    expect(within(rsvp).getByText(/open the personal link/)).toBeTruthy();
    expect(rsvp.querySelector("form")).toBeNull();
  });

  it("preview and demo run the whole flow without sending, and say so", async () => {
    const { container } = render(<GildedSeal mode="demo" />);
    const rsvp = container.querySelector("#rsvp") as HTMLElement;
    fireEvent.change(within(rsvp).getByPlaceholderText("As written on your invitation"), { target: { value: "Aunt Mira" } });
    fireEvent.click(within(rsvp).getByLabelText(/Joyfully accepts/));
    await act(async () => {
      fireEvent.submit(rsvp.querySelector("form")!);
    });
    expect(rsvpMock).not.toHaveBeenCalled();
    expect(rsvp.querySelector("h3")!.textContent).toBe("Thank you, Aunt");
    expect(within(rsvp).getByText(/This invitation is a preview/)).toBeTruthy();
  });
});

describe("wishes", () => {
  it("live: reads the guestbook with the token, pages in more near the end, and posts as the guest", async () => {
    listMock.mockResolvedValueOnce({ items: wishes(5), next_cursor: "c1", total: 8 });
    listMock.mockResolvedValueOnce({ items: wishes(3, 5), next_cursor: null, total: 8 });
    wishMock.mockResolvedValue({ id: "new1", name: "Sarah Wijaya", message: "Warmest wishes" });
    const { container } = render(<GildedSeal mode="live" invite={base()} token="tok" />);
    const sec = container.querySelector("#wishes") as HTMLElement;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(listMock).toHaveBeenCalledWith("tok", null, 20);
    expect(within(sec).getByText("1 of 8")).toBeTruthy();
    expect(sec.querySelectorAll("figure")).toHaveLength(5); // never more than five cards in the DOM

    // stepping to within 4 of the end of what is loaded fetches the next page with the cursor
    await act(async () => {
      fireEvent.click(within(sec).getByLabelText("Next wish")); // 2nd of 5: four left, no fetch yet
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(listMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(within(sec).getByLabelText("Next wish")); // 3rd of 5: three left
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(listMock).toHaveBeenLastCalledWith("tok", "c1", 20);
    expect(listMock).toHaveBeenCalledTimes(2);

    // posting: a personal link sends no name; the new wish is first
    fireEvent.change(sec.querySelector("textarea")!, { target: { value: "Warmest wishes" } });
    await act(async () => {
      fireEvent.submit(sec.querySelector("form")!);
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(wishMock).toHaveBeenCalledWith("tok", { name: undefined, message: "Warmest wishes" });
    expect(within(sec).getByText(/Your wish has been shared with the couple/)).toBeTruthy();
    expect(within(sec).getByText("1 of 9")).toBeTruthy();
    expect(sec.querySelector("blockquote")!.textContent).toBe("Warmest wishes");
  });

  it("live, generic link: the guest types a name, and it is sent", async () => {
    listMock.mockResolvedValue({ items: [], next_cursor: null, total: 0 });
    wishMock.mockResolvedValue({ id: "n", name: "Walk-in", message: "Best wishes" });
    const { container } = render(<GildedSeal mode="live" invite={base({ guest: null })} token="tok" />);
    const sec = container.querySelector("#wishes") as HTMLElement;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(within(sec).getByText("No wishes yet")).toBeTruthy();
    await act(async () => {
      fireEvent.submit(sec.querySelector("form")!);
    });
    expect(within(sec).getByText("Please add your name.")).toBeTruthy();
    expect(wishMock).not.toHaveBeenCalled();
    fireEvent.change(sec.querySelector("input")!, { target: { value: "Walk-in" } });
    fireEvent.change(sec.querySelector("textarea")!, { target: { value: "Best wishes" } });
    await act(async () => {
      fireEvent.submit(sec.querySelector("form")!);
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(wishMock).toHaveBeenCalledWith("tok", { name: "Walk-in", message: "Best wishes" });
  });

  it("shows the error state with a retry when the guestbook cannot be loaded", async () => {
    listMock.mockRejectedValueOnce(new Error("down"));
    listMock.mockResolvedValueOnce({ items: wishes(1), next_cursor: null, total: 1 });
    const { container } = render(<GildedSeal mode="live" invite={base()} token="tok" />);
    const sec = container.querySelector("#wishes") as HTMLElement;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(within(sec).getByText("We could not load the wishes just now.")).toBeTruthy();
    await act(async () => {
      fireEvent.click(within(sec).getByText("Try again"));
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(within(sec).getAllByText("Wish number 0").length).toBeGreaterThan(0); // one wish fills every slot of the ring
  });

  it("demo: sample wishes, and a new wish stays on this device (no API call)", async () => {
    const { container } = render(<GildedSeal mode="demo" />);
    const sec = container.querySelector("#wishes") as HTMLElement;
    expect(within(sec).getByText("1 of 4")).toBeTruthy();
    fireEvent.change(sec.querySelector("input")!, { target: { value: "Tester" } });
    fireEvent.change(sec.querySelector("textarea")!, { target: { value: "From the test" } });
    await act(async () => {
      fireEvent.submit(sec.querySelector("form")!);
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(wishMock).not.toHaveBeenCalled();
    expect(listMock).not.toHaveBeenCalled();
    expect(within(sec).getByText(/shown on this device only/)).toBeTruthy();
    expect(within(sec).getByText("1 of 5")).toBeTruthy();
  });
});

describe("gallery and lightbox", () => {
  const withPhotos = () =>
    base({
      media: { [P1]: "/api/v1/media/" + P1 + "/file?sig=a", [P2]: "/api/v1/media/" + P2 + "/file?sig=b" },
      sections: [{ type: "hero", content: {} }, { type: "rsvp", content: {} }, { type: "gallery", content: { photos: [{ id: P1, alt: "First" }, { id: P2, alt: "Second" }] } }],
    });

  it("offers a full-screen view only for photographs that exist, and the corridor is as tall as its photos", () => {
    const { container } = render(<GildedSeal mode="live" invite={withPhotos()} token="tok" />);
    const g = container.querySelector("#gallery") as HTMLElement;
    expect(g.querySelectorAll("figure")).toHaveLength(2);
    expect(g.style.height).toBe("190svh"); // 100 + 2 × 45
    expect(g.querySelectorAll("button[aria-label^='View photo']")).toHaveLength(2);
    const demo = render(<GildedSeal mode="demo" />).container.querySelector("#gallery") as HTMLElement;
    expect(demo.querySelectorAll("figure")).toHaveLength(8);
    expect(demo.querySelectorAll("button[aria-label^='View photo']")).toHaveLength(0); // placeholders have nothing to expand
  });

  it("opens the viewer, locks scroll, steps with the arrows, closes with Escape and restores focus", async () => {
    const { container } = render(<GildedSeal mode="live" invite={withPhotos()} token="tok" />);
    await openCover(container);
    const open = container.querySelector("button[aria-label='View photo 1 full screen']") as HTMLButtonElement;
    open.focus();
    await act(async () => {
      open.click();
    });
    const dlg = screen.getByRole("dialog", { name: "Photo viewer" });
    expect(within(dlg).getByRole("img").getAttribute("alt")).toBe("First");
    expect(within(dlg).getByText("01 / 02 · First")).toBeTruthy();
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(within(dlg).getByLabelText("Close photo viewer"));
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(within(dlg).getByText("02 / 02 · Second")).toBeTruthy();
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(within(dlg).getByText("01 / 02 · First")).toBeTruthy(); // wraps
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(screen.queryByRole("dialog", { name: "Photo viewer" })).toBeNull();
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.activeElement).toBe(open);
  });

  it("a click on the backdrop closes it, a click on the photo does not", async () => {
    const { container } = render(<GildedSeal mode="live" invite={withPhotos()} token="tok" />);
    await openCover(container);
    await act(async () => {
      (container.querySelector("button[aria-label='View photo 2 full screen']") as HTMLButtonElement).click();
    });
    const dlg = screen.getByRole("dialog", { name: "Photo viewer" });
    fireEvent.click(within(dlg).getByRole("img"));
    expect(screen.queryByRole("dialog", { name: "Photo viewer" })).toBeTruthy();
    fireEvent.click(dlg);
    expect(screen.queryByRole("dialog", { name: "Photo viewer" })).toBeNull();
  });
});

describe("gift", () => {
  it("copies the account number without spaces and confirms, then goes back to normal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    const inv = base({ gift_methods: [{ type: "bank", title: "BCA", detail: "Adrian P.", copy_value: "1234 5678 90" }], sections: [{ type: "hero", content: {} }, { type: "rsvp", content: {} }, { type: "gift", content: {} }] });
    const { container } = render(<GildedSeal mode="live" invite={inv} token="t" />);
    const gift = container.querySelector("#gift") as HTMLElement;
    expect(within(gift).getByText("1234 5678 90")).toBeTruthy();
    await act(async () => {
      fireEvent.click(within(gift).getByText("Copy account number"));
    });
    expect(writeText).toHaveBeenCalledWith("1234567890");
    expect(within(gift).getByText("Copied")).toBeTruthy();
    expect(within(gift).getByText("Account number copied to your clipboard.")).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2700);
    });
    expect(within(gift).getByText("Copy account number")).toBeTruthy();
  });
});

describe("music", () => {
  class FakeAudio {
    static last: FakeAudio;
    listeners: Record<string, Array<() => void>> = {};
    paused = true;
    error: unknown = null;
    volume = 1;
    src = "";
    preload = "";
    loop = false;
    constructor() {
      FakeAudio.last = this;
    }
    addEventListener(t: string, fn: () => void) {
      (this.listeners[t] ??= []).push(fn);
    }
    emit(t: string) {
      (this.listeners[t] ?? []).forEach((f) => f());
    }
    play() {
      this.paused = false;
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
      this.emit("pause");
    }
    load() {}
    removeAttribute() {}
  }

  it("starts from the open click, shows the playing state, and never resumes after the guest pauses it", async () => {
    vi.stubGlobal("Audio", FakeAudio);
    const { container } = render(<GildedSeal mode="demo" />);
    expect(container.querySelector("button[aria-label*='usic']")).toBeNull(); // hidden behind the cover
    await openCover(container);
    expect(FakeAudio.last.paused).toBe(false); // started inside the click
    await act(async () => {
      FakeAudio.last.emit("playing");
    });
    const btn = container.querySelector("button[aria-label='Pause music']") as HTMLButtonElement;
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    await act(async () => {
      btn.click();
    });
    expect(FakeAudio.last.paused).toBe(true);
    expect(container.querySelector("button[aria-label='Play music']")).toBeTruthy();
    // tab hidden then shown: stays paused because the guest chose that
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(FakeAudio.last.paused).toBe(true);
  });

  it("pauses while the tab is hidden and resumes only if the tab switch paused it", async () => {
    vi.stubGlobal("Audio", FakeAudio);
    const { container } = render(<GildedSeal mode="demo" />);
    await openCover(container);
    await act(async () => {
      FakeAudio.last.emit("playing");
    });
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(FakeAudio.last.paused).toBe(true);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(FakeAudio.last.paused).toBe(false);
  });

  it("shows the error state for a missing file, and offers a retry", async () => {
    vi.stubGlobal("Audio", FakeAudio);
    const { container } = render(<GildedSeal mode="demo" />);
    await openCover(container);
    await act(async () => {
      FakeAudio.last.error = {};
      FakeAudio.last.emit("error");
    });
    expect(container.querySelector("button[aria-label='Music unavailable. Tap to try again.']")).toBeTruthy();
  });

  it("is absent when the invitation has no track", async () => {
    const { container } = render(<GildedSeal mode="live" invite={base()} token="t" />);
    await openCover(container);
    expect(container.querySelector("button[aria-label*='usic']")).toBeNull();
  });
});

describe("celebration and venue", () => {
  const two = () =>
    base({
      schedule: [
        { label: "The Ceremony", title: "Akad", starts_at: "2027-06-12T03:00:00Z", ends_at: null, venue: "Hall A", address: "Jl. A", map_url: "", venue_note: "", dress_code: "", description: "", photo_id: null },
        { label: "", title: "Dinner", starts_at: "2027-06-12T11:00:00Z", ends_at: null, venue: "Ballroom", address: "Jl. B", map_url: "", venue_note: "", dress_code: "Black tie", description: "", photo_id: null },
      ],
    });

  it("steps through moments with the arrows, tabs and keyboard; the end stops", async () => {
    const { container } = render(<GildedSeal mode="live" invite={two()} token="t" />);
    const sec = container.querySelector("#details") as HTMLElement;
    const current = () => [...sec.querySelectorAll("article")].find((a) => a.getAttribute("aria-hidden") === "false")!.querySelector("h3")!.textContent;
    expect(current()).toBe("Akad");
    expect((within(sec).getByLabelText("Previous event") as HTMLElement).style.opacity).toBe("0.35");
    fireEvent.click(within(sec).getByLabelText("Next event"));
    expect(current()).toBe("Dinner");
    fireEvent.click(within(sec).getByLabelText("Next event"));
    expect(current()).toBe("Dinner"); // clamped
    fireEvent.keyDown(sec.querySelector("[role=region]")!, { key: "ArrowLeft" });
    expect(current()).toBe("Akad");
    // the page is visibility:hidden until the cover opens (no layout shift while loading), so ask for hidden elements too
    fireEvent.click(within(sec).getByRole("button", { name: /Dinner/, hidden: true }));
    expect(current()).toBe("Dinner");
    expect(within(sec).getByText("Black tie")).toBeTruthy();
  });

  it("'See the venue' selects that moment's venue below", () => {
    const { container } = render(<GildedSeal mode="live" invite={two()} token="t" />);
    const venue = container.querySelector("#venue") as HTMLElement;
    const shown = () => [...venue.querySelectorAll("h3")].find((h) => h.parentElement?.getAttribute("aria-hidden") === "false")!.textContent;
    expect(shown()).toBe("Hall A");
    const links = within(container.querySelector("#details") as HTMLElement).getAllByText("See the venue");
    fireEvent.click(links[1]);
    expect(shown()).toBe("Ballroom");
    expect(within(venue).getAllByText("Open in Maps")[1].closest("a")!.getAttribute("href")).toContain("google.com/maps/search");
  });

  it("a single moment has no carousel controls", () => {
    const { container } = render(<GildedSeal mode="live" invite={base()} token="t" />);
    const sec = container.querySelector("#details") as HTMLElement;
    expect(within(sec).queryByLabelText("Next event")).toBeNull();
    expect(container.querySelector("#venue")!.querySelector("button[aria-label='Next venue']")).toBeNull();
  });
});
