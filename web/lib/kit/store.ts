"use client";

import { useSyncExternalStore } from "react";

/** Tiny external store for state two sections share (venue index, lightbox) without re-rendering the root. */
export type Store<T> = { get(): T; set(v: T | ((prev: T) => T)): void; subscribe(fn: () => void): () => void };
export function createStore<T>(initial: T): Store<T> {
  let v = initial;
  const subs = new Set<() => void>();
  return {
    get: () => v,
    set: (n) => {
      const next = typeof n === "function" ? (n as (p: T) => T)(v) : n;
      if (Object.is(next, v)) return;
      v = next;
      subs.forEach((f) => f());
    },
    subscribe: (fn) => (subs.add(fn), () => subs.delete(fn)),
  };
}
/** Subscribe a component to a store (server snapshot = the initial value, so hydration matches). */
export function useStore<T>(s: Store<T>): T {
  return useSyncExternalStore(s.subscribe, s.get, s.get);
}
