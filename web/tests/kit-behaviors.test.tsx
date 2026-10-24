import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as inviteApi from "@/lib/api/invite";
import { useCountdown } from "@/lib/kit/behaviors/useCountdown";
import { useGuest } from "@/lib/kit/behaviors/useGuest";
import { useLightbox } from "@/lib/kit/behaviors/useLightbox";
import { useMusic } from "@/lib/kit/behaviors/useMusic";
import { useRsvp } from "@/lib/kit/behaviors/useRsvp";
import { useWishes, type KitWish } from "@/lib/kit/behaviors/useWishes";
import { Engine } from "@/lib/kit/motion/engine";
import { createStore } from "@/lib/kit/store";

vi.mock("@/lib/api/invite", async (orig) => {
  const real = await orig<typeof import("@/lib/api/invite")>();
  return { ...real, submitRsvp: vi.fn(), submitWish: vi.fn(), listWishes: vi.fn() };
});
const api = vi.mocked(inviteApi);

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  api.submitRsvp.mockReset().mockResolvedValue(undefined);
  api.submitWish.mockReset();
  api.listWishes.mockReset().mockResolvedValue({ items: [], next_cursor: null, total: 0 });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const rsvpIn = { status: "pending" as const, partySize: 1, maxParty: 3, prefillName: "Sarah Wijaya" };

describe("useRsvp", () => {
  it("live with a token sends the reply and turns the card", async () => {
    const { result } = renderHook(() => useRsvp({ mode: "live", token: "tok", ...rsvpIn }));
    act(() => result.current.chooseAttend("yes"));
    act(() => result.current.stepGuests(1));
    act(() => result.current.editMessage("vegetarian"));
    await act(() => result.current.submit());
    expect(api.submitRsvp).toHaveBeenCalledWith("tok", { status: "yes", party_size: 2, note: "vegetarian" });
    expect(result.current.status).toBe("sent");
    expect(result.current.done).toBe(true);
    act(() => result.current.edit());
    expect(result.current.status).toBe("idle");
    expect(result.current.attend).toBe("yes"); // previous answers kept
  });

  it.each(["preview", "demo"] as const)("%s runs the whole flow and sends nothing", async (mode) => {
    const { result } = renderHook(() => useRsvp({ mode, token: "tok", ...rsvpIn }));
    act(() => result.current.chooseAttend("no"));
    await act(() => result.current.submit());
    expect(api.submitRsvp).not.toHaveBeenCalled();
    expect(result.current.status).toBe("demo");
    expect(result.current.done).toBe(true);
  });

  it("live without a token (a generic link) never posts", async () => {
    const { result } = renderHook(() => useRsvp({ mode: "live", ...rsvpIn }));
    act(() => result.current.chooseAttend("yes"));
    await act(() => result.current.submit());
    expect(api.submitRsvp).not.toHaveBeenCalled();
  });

  it("validates before anything is sent, and clears an error as the guest fixes it", async () => {
    const { result } = renderHook(() => useRsvp({ mode: "live", token: "t", ...rsvpIn, prefillName: "" }));
    await act(() => result.current.submit());
    expect(result.current.errors).toMatchObject({ name: "Please enter your name.", attend: "Please let us know whether you can attend." });
    act(() => result.current.editName("Rina"));
    expect(result.current.errors.name).toBe("");
    act(() => result.current.editMessage("x".repeat(301)));
    act(() => result.current.chooseAttend("yes"));
    await act(() => result.current.submit());
    expect(result.current.errors.message).toMatch(/300/);
    expect(api.submitRsvp).not.toHaveBeenCalled();
  });

  it("maps API failures to a message and keeps the answers", async () => {
    api.submitRsvp.mockRejectedValueOnce(new inviteApi.InviteError(422, "rsvp_closed", "closed"));
    const { result } = renderHook(() => useRsvp({ mode: "live", token: "t", ...rsvpIn }));
    act(() => result.current.chooseAttend("yes"));
    await act(() => result.current.submit());
    expect(result.current.status).toBe("error");
    expect(result.current.failure).toMatch(/closed/);
    expect(result.current.attend).toBe("yes");
    api.submitRsvp.mockRejectedValueOnce(new Error("net"));
    await act(() => result.current.submit());
    expect(result.current.failure).toMatch(/could not send/);
  });

  it("a pre-replied guest starts on the back; the stepper stays within 1..max; a late prefill applies until the guest types", () => {
    const { result, rerender } = renderHook((p: { name: string }) => useRsvp({ mode: "live", token: "t", status: "yes", partySize: 2, maxParty: 3, prefillName: p.name }), { initialProps: { name: "" } });
    expect(result.current.done).toBe(true);
    expect(result.current.guests).toBe(2);
    act(() => result.current.stepGuests(1));
    act(() => result.current.stepGuests(1));
    expect(result.current.guests).toBe(3);
    for (let i = 0; i < 5; i++) act(() => result.current.stepGuests(-1));
    expect(result.current.guests).toBe(1);
    rerender({ name: "Sarah" });
    expect(result.current.name).toBe("Sarah");
    act(() => result.current.editName("Mine"));
    rerender({ name: "Other" });
    expect(result.current.name).toBe("Mine");
  });
});

const wishIn = { nameLocked: false, guestName: "Sarah", samples: [{ id: "s1", name: "Nadia", message: "Hello", relation: "Friend" }] as KitWish[] };

describe("useWishes", () => {
  it("live: loads the guestbook, posts through the API and puts the stored wish first", async () => {
    api.listWishes.mockResolvedValueOnce({ items: [{ id: "a", name: "Budi", message: "Congrats" }], next_cursor: "c1", total: 5 });
    api.submitWish.mockResolvedValueOnce({ id: "z", name: "Sarah", message: "Love you" });
    const onAdded = vi.fn();
    const { result } = renderHook(() => useWishes({ mode: "live", token: "tok", ...wishIn, onAdded }));
    await act(async () => {});
    expect(api.listWishes).toHaveBeenCalledWith("tok", null, 20);
    expect(result.current.all.map((w) => w.id)).toEqual(["a"]);
    expect(result.current.total).toBe(5);
    act(() => result.current.editName("Sarah W"));
    act(() => result.current.editText("Love you"));
    await act(() => result.current.submit());
    expect(api.submitWish).toHaveBeenCalledWith("tok", { name: "Sarah W", message: "Love you" });
    expect(result.current.all.map((w) => w.id)).toEqual(["z", "a"]);
    expect(result.current.status).toBe("sent");
    expect(result.current.thanks).toBe("Sarah");
    await new Promise((r) => setTimeout(r, 5));
    expect(onAdded).toHaveBeenCalled();
  });

  it("a personal link sends no name (the API uses the guest's own)", async () => {
    api.submitWish.mockResolvedValueOnce({ id: "z", name: "Sarah", message: "Hi" });
    const { result } = renderHook(() => useWishes({ mode: "live", token: "tok", ...wishIn, nameLocked: true }));
    await act(async () => {});
    act(() => result.current.editText("Hi"));
    await act(() => result.current.submit());
    expect(api.submitWish).toHaveBeenCalledWith("tok", { name: undefined, message: "Hi" });
  });

  it("demo shows the samples and keeps a new wish on the device; preview shows nothing and never fetches", async () => {
    const demo = renderHook(() => useWishes({ mode: "demo", ...wishIn }));
    await act(async () => {});
    expect(demo.result.current.all.map((w) => w.id)).toEqual(["s1"]);
    act(() => demo.result.current.editName("Rina"));
    act(() => demo.result.current.editText("Cheers"));
    await act(() => demo.result.current.submit());
    expect(demo.result.current.status).toBe("local");
    expect(demo.result.current.all.map((w) => w.message)).toEqual(["Cheers", "Hello"]);

    const prev = renderHook(() => useWishes({ mode: "preview", token: "tok", ...wishIn }));
    await act(async () => {});
    expect(prev.result.current.all).toEqual([]);
    expect(prev.result.current.empty).toBe(true);
    expect(api.listWishes).not.toHaveBeenCalled();
    expect(api.submitWish).not.toHaveBeenCalled();
  });

  it("prefetches the next page near the end, dedupes by id, and shows an error with a retry", async () => {
    const page = (ids: string[], next: string | null) => ({ items: ids.map((id) => ({ id, name: "n" + id, message: "m" + id })), next_cursor: next, total: 9 });
    api.listWishes.mockResolvedValueOnce(page(["1", "2", "3", "4", "5"], "c1")).mockResolvedValueOnce(page(["5", "6"], null));
    const { result } = renderHook(() => useWishes({ mode: "live", token: "tok", ...wishIn }));
    await act(async () => {});
    await act(async () => result.current.step(1)); // 4 remain: not yet
    expect(api.listWishes).toHaveBeenCalledTimes(1);
    await act(async () => result.current.step(1)); // 3 remain: fetches the next page
    expect(api.listWishes).toHaveBeenLastCalledWith("tok", "c1", 20);
    expect(result.current.all.map((w) => w.id)).toEqual(["1", "2", "3", "4", "5", "6"]);

    api.listWishes.mockRejectedValueOnce(new Error("down"));
    const bad = renderHook(() => useWishes({ mode: "live", token: "t2", ...wishIn }));
    await act(async () => {});
    expect(bad.result.current.failed).toBe(true);
    api.listWishes.mockResolvedValueOnce(page(["9"], null));
    await act(async () => bad.result.current.reload());
    expect(bad.result.current.failed).toBe(false);
    expect(bad.result.current.all).toHaveLength(1);
  });

  it("validates the form", async () => {
    const { result } = renderHook(() => useWishes({ mode: "demo", ...wishIn }));
    await act(() => result.current.submit());
    expect(result.current.errors).toMatchObject({ name: "Please add your name.", text: "Please write a few words." });
  });
});

describe("useMusic", () => {
  class FakeAudio {
    static last: FakeAudio;
    paused = true; error: unknown = null; volume = 1; loop = false; preload = ""; src = "";
    private l = new Map<string, (() => void)[]>();
    constructor() { FakeAudio.last = this; }
    addEventListener(t: string, f: () => void) { this.l.set(t, [...(this.l.get(t) ?? []), f]); }
    emit(t: string) { (this.l.get(t) ?? []).forEach((f) => f()); }
    play() { this.paused = false; this.emit("playing"); return Promise.resolve(); }
    pause() { this.paused = true; this.emit("pause"); }
    load() {} removeAttribute() {}
  }
  beforeEach(() => vi.stubGlobal("Audio", FakeAudio));

  it("is absent without a known track and creates no audio", () => {
    const e = new Engine();
    const { result } = renderHook(() => useMusic("nope", e));
    expect(result.current.available).toBe(false);
    expect(result.current.track).toBeNull();
  });

  it("plays from the gesture, pauses by the guest for good, and the tab switch resumes only what it paused", async () => {
    const e = new Engine();
    e.mount();
    const { result } = renderHook(() => useMusic("satie-gymnopedie-1", e));
    expect(result.current.available).toBe(true);
    await act(async () => result.current.play());
    expect(result.current.state).toBe("playing");

    const hide = (v: boolean) => {
      Object.defineProperty(document, "hidden", { configurable: true, value: v });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    await act(async () => hide(true));
    expect(FakeAudio.last.paused).toBe(true);
    await act(async () => hide(false));
    expect(FakeAudio.last.paused).toBe(false); // the tab switch paused it, so it resumes

    act(() => result.current.toggle()); // the guest pauses
    expect(FakeAudio.last.paused).toBe(true);
    await act(async () => hide(true));
    await act(async () => hide(false));
    expect(FakeAudio.last.paused).toBe(true); // never resumes after a user pause
    await act(async () => result.current.play());
    expect(FakeAudio.last.paused).toBe(true);
    act(() => result.current.toggle()); // but the button can start it again
    expect(FakeAudio.last.paused).toBe(false);
    e.unmount();
  });

  it("shows the error state for a missing file", async () => {
    const e = new Engine();
    const { result } = renderHook(() => useMusic("satie-gymnopedie-1", e));
    FakeAudio.prototype.play = function () { this.error = new Error("404"); this.emit("error"); return Promise.reject(new Error("404")); };
    await act(async () => result.current.play());
    expect(result.current.state).toBe("error");
  });
});

describe("useLightbox", () => {
  it("opens, steps through filled items only, closes with Escape, locks scroll and returns focus", () => {
    const e = new Engine();
    const store = createStore<number | null>(null);
    const close = document.createElement("button");
    document.body.append(close);
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    let key: ((ev: KeyboardEvent) => boolean) | null = null;
    const setKey = (fn: typeof key) => void (key = fn);
    const { result } = renderHook(() => useLightbox({ store, filled: [0, 2, 3], engine: e, focusRef: { current: close }, setKeyHandler: setKey }));
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open(2));
    expect(result.current.index).toBe(2);
    expect(e.locked).toBe(true);
    expect(document.activeElement).toBe(close);
    expect(key).not.toBeNull();

    act(() => void key!(new KeyboardEvent("keydown", { key: "ArrowRight" })));
    expect(result.current.index).toBe(3);
    act(() => void key!(new KeyboardEvent("keydown", { key: "ArrowRight" })));
    expect(result.current.index).toBe(0); // wraps over filled items
    act(() => void key!(new KeyboardEvent("keydown", { key: "ArrowLeft" })));
    expect(result.current.index).toBe(3);
    expect(key!(new KeyboardEvent("keydown", { key: "a" }))).toBe(false);

    act(() => void key!(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(result.current.isOpen).toBe(false);
    expect(e.locked).toBe(false);
    expect(key).toBeNull();
    expect(document.activeElement).toBe(opener);
    close.remove();
    opener.remove();
  });

  it("with nothing to show, stepping does nothing", () => {
    const e = new Engine();
    const store = createStore<number | null>(null);
    const { result } = renderHook(() => useLightbox({ store, filled: [], engine: e, focusRef: { current: null }, setKeyHandler: () => {} }));
    act(() => result.current.step(1));
    expect(result.current.index).toBeNull();
  });
});

describe("useCountdown / useGuest", () => {
  it("counts down each second from mount", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2027-06-12T09:59:50Z"));
    const { result } = renderHook(() => useCountdown("2027-06-12T10:00:00Z"));
    expect(result.current).toMatchObject({ ready: true, running: true, s: "10" });
    act(() => void vi.advanceTimersByTime(4000));
    expect(result.current.s).toBe("06");
    act(() => void vi.advanceTimersByTime(7000));
    expect(result.current).toMatchObject({ ended: true, running: false });
  });

  it("reads ?to= after mount, caps it, and lets a personal link win", () => {
    window.history.replaceState({}, "", "/?to=" + "x".repeat(80));
    const generic = renderHook(() => useGuest(null));
    expect(generic.result.current.personal).toBe(false);
    expect(generic.result.current.name).toHaveLength(60);
    const personal = renderHook(() => useGuest("Sarah"));
    expect(personal.result.current).toMatchObject({ personal: true, name: "Sarah" });
    window.history.replaceState({}, "", "/");
  });
});
