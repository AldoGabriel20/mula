import { useCallback, useEffect, useRef } from "react";

/**
 * Coalesce high-frequency events (mousemove can fire faster than the display refreshes) into
 * at most ONE callback per animation frame, using the most recent event. Each callback then does a
 * single layout read followed by writes — instead of forcing layout on every raw event.
 *
 * Returns [schedule, cancel]. Call `cancel()` when the interaction ends (mouseleave) so a frame
 * that was already queued can't re-apply state AFTER the reset (the element would stay tilted).
 */
export function useFrameThrottled<E>(fn: (e: E) => void): [(e: E) => void, () => void] {
  const latest = useRef<E | null>(null);
  const raf = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const cancel = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
    latest.current = null;
  }, []);

  useEffect(() => cancel, [cancel]); // also on unmount

  const schedule = useCallback((e: E) => {
    latest.current = e;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const ev = latest.current;
      latest.current = null;
      if (ev) fnRef.current(ev);
    });
  }, []);

  return [schedule, cancel];
}
