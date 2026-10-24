"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Engine } from "../motion/engine";
import { useStore, type Store } from "../store";

export type LightboxInput = {
  /** Open index into the items (null = closed). A store, so a gallery button and the viewer can share it without re-rendering the root. */
  store: Store<number | null>;
  /** Indices of the items that can be shown (an item without a photo never takes part). */
  filled: number[];
  engine: Engine;
  /** Element to focus on open (the Close button). */
  focusRef: RefObject<HTMLElement | null>;
  /** The page's key router: the hook installs its handler while open and clears it on close. It returns true when it used the key. */
  setKeyHandler: (fn: ((e: KeyboardEvent) => boolean) | null) => void;
};

/**
 * Full-screen viewer behaviour (docs/17 §7.7): open index, ←/→/Esc, scroll lock while open, focus moves to Close and
 * returns to what had it. The template owns the markup.
 */
export function useLightbox({ store, filled, engine, focusRef, setKeyHandler }: LightboxInput) {
  const index = useStore(store);
  const isOpen = index !== null;
  const filledRef = useRef(filled);
  filledRef.current = filled;
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = (i: number) => {
    const f = filledRef.current;
    if (!f.length) return;
    store.set(f[((i % f.length) + f.length) % f.length]);
  };
  const step = (d: 1 | -1) => {
    const f = filledRef.current;
    if (!f.length) return;
    const k = f.indexOf(store.get() ?? -1);
    show(k < 0 ? 0 : k + d);
  };
  const close = () => store.set(null);

  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    engine.lock();
    focusRef.current?.focus();
    setKeyHandler((e) => {
      if (store.get() === null) return false;
      if (e.key === "Escape") store.set(null);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else return false;
      return true;
    });
    return () => {
      setKeyHandler(null);
      engine.unlock();
      lastFocus.current?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- step/show only read refs and the store
  }, [isOpen, engine, store, focusRef, setKeyHandler]);

  return { index, isOpen, step, close, show, open: (i: number) => store.set(i) };
}
