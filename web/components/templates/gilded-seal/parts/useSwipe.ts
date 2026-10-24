"use client";

import { useMemo, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

/**
 * Horizontal swipe for a carousel (prototype `swipeFor`): locks to the dominant axis after 8 px, drags
 * the track 30 % of the finger distance, steps at 44 px and springs back. Buttons, links and form
 * fields never start a drag. Vertical scrolling is left alone (`touch-action: pan-y` on the host).
 */
export function useSwipe(step: (dir: 1 | -1) => void, track: RefObject<HTMLElement | null>, reduced: boolean) {
  const drag = useRef<{ x: number; y: number; dx: number; lock: boolean | null } | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;
  return useMemo(
    () => ({
      onPointerDown: (e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if ((e.target as Element).closest?.("button,a,input,textarea,select")) return;
        drag.current = { x: e.clientX, y: e.clientY, dx: 0, lock: null };
      },
      onPointerMove: (e: PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        d.dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (d.lock === null && (Math.abs(d.dx) > 8 || Math.abs(dy) > 8)) d.lock = Math.abs(d.dx) > Math.abs(dy);
        const t = track.current;
        if (d.lock && t && !reduced) {
          t.style.transition = "none";
          t.style.translate = `${(d.dx * 0.3).toFixed(1)}px 0px`;
        }
      },
      onPointerUp: () => {
        const d = drag.current;
        if (!d) return;
        drag.current = null;
        const t = track.current;
        if (t) {
          t.style.transition = "translate .6s cubic-bezier(.22,1,.36,1)";
          t.style.translate = "0px 0px";
        }
        if (d.lock && Math.abs(d.dx) > 44) stepRef.current(d.dx < 0 ? 1 : -1);
      },
    }),
    [track, reduced],
  );
}

/** ←/→ on a focused carousel region; text fields keep their own arrow keys. */
export function arrowKeys(step: (dir: 1 | -1) => void) {
  return (e: KeyboardEvent) => {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };
}
