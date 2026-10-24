"use client";

import { createContext, useContext } from "react";
import type { Manifest } from "./manifest";
import type { MotionPolicy } from "./motion/policy";
import type { ResolvedTheme } from "./tokens";

export type KitMode = "live" | "preview" | "demo";

export type KitState = { slug: string; manifest: Manifest; theme: ResolvedTheme; policy: MotionPolicy; mode: KitMode };

export const KitContext = createContext<KitState | null>(null);

function useKit(): KitState {
  const k = useContext(KitContext);
  if (!k) throw new Error("kit hooks must be used inside <KitRoot>");
  return k;
}

/** Run `dispose` when the template unmounts (engine, GL contexts, audio). Returns the early remover. */
export function useKitCleanup(): (dispose: () => void) => () => void {
  return (useKit() as KitState & { register: (d: () => void) => () => void }).register;
}

/** The resolved theme (colours, fonts, motion level) of the template being rendered. */
export const useTheme = (): ResolvedTheme => useKit().theme;
/** The template's manifest (capabilities, sections). */
export const useManifest = (): Manifest => useKit().manifest;
/** Device + host motion policy (docs/17 §7.3): the one place reduced motion is decided. */
export const useMotionPolicy = (): MotionPolicy => useKit().policy;
