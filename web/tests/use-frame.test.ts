import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFrameThrottled } from "@/lib/motion/useFrame";

// Deterministic rAF: callbacks only run when we flush.
let queue: Map<number, FrameRequestCallback>;
let nextId: number;
const flush = () => {
  const cbs = [...queue.values()];
  queue.clear();
  cbs.forEach((cb) => cb(0));
};

beforeEach(() => {
  queue = new Map();
  nextId = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.set(++nextId, cb);
    return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
});
afterEach(() => vi.unstubAllGlobals());

describe("useFrameThrottled", () => {
  it("coalesces a burst of events into ONE frame carrying the latest event", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useFrameThrottled<{ n: number }>(fn));
    const [schedule] = result.current;
    for (let n = 1; n <= 100; n++) schedule({ n });
    expect(queue.size).toBe(1);
    expect(fn).not.toHaveBeenCalled();
    flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ n: 100 });
  });

  it("cancel() drops a queued frame so it cannot re-apply state after a reset", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useFrameThrottled<number>(fn));
    const [schedule, cancel] = result.current;
    schedule(1);
    schedule(2);
    cancel();
    flush();
    expect(fn).not.toHaveBeenCalled();
    schedule(3); // still usable afterwards
    flush();
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("cancels a pending frame on unmount", () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useFrameThrottled<number>(fn));
    result.current[0](1);
    unmount();
    flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("always calls the latest handler (no stale closure)", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ f }) => useFrameThrottled<number>(f), { initialProps: { f: first } });
    result.current[0](1);
    rerender({ f: second });
    flush();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(1);
  });
});
