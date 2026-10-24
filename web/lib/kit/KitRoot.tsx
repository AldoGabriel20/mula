"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { KitFonts } from "./fonts";
import { manifestOf } from "./manifest";
import { readMotionPolicy, resolveMotionPolicy } from "./motion/policy";
import { resolveTheme, type Theme } from "./tokens";
import { KitContext, type KitMode, type KitState } from "./useTheme";

export type KitRegistry = { register(dispose: () => void): () => void };

/**
 * Wraps every template (docs/17 §8): resolves the theme, applies it as CSS variables on this element only
 * (never `:root`, so the dashboard chrome is untouched), emits the pairing's fonts, provides the manifest,
 * theme and motion policy to `useTheme()` / `useMotionPolicy()`, and runs registered cleanups on unmount.
 */
export function KitRoot({ slug, mode, theme, children }: { slug: string; mode: KitMode; theme?: Theme; children: ReactNode }) {
  const manifest = manifestOf(slug);
  if (!manifest) throw new Error(`KitRoot: no manifest for template "${slug}"`);
  const resolved = useMemo(() => resolveTheme(manifest, theme), [manifest, theme]);

  // the server renders for a mouse-less, motion-allowed device; the real answer lands in the first effect
  const [policy, setPolicy] = useState(() => resolveMotionPolicy({ reducedMotion: false, fine: false, themeLevel: resolved.motion.level, durationScale: resolved.motion.durationScale }));
  useEffect(() => setPolicy(readMotionPolicy(resolved.motion.level, resolved.motion.durationScale)), [resolved.motion.level, resolved.motion.durationScale]);

  const disposers = useRef(new Set<() => void>());
  const register = useCallback((fn: () => void) => {
    disposers.current.add(fn);
    return () => void disposers.current.delete(fn);
  }, []);
  useEffect(() => {
    const set = disposers.current;
    return () => {
      for (const fn of [...set].reverse()) {
        try {
          fn();
        } catch (e) {
          console.error(e);
        }
      }
      set.clear();
    };
  }, []);

  const state = useMemo<KitState & KitRegistry>(() => ({ slug, manifest, theme: resolved, policy, mode, register }), [slug, manifest, resolved, policy, mode, register]);
  return (
    <KitContext.Provider value={state}>
      <KitFonts fonts={resolved.fontIds} />
      {/* display: contents: the wrapper adds no box, only the inherited variables */}
      <div data-kit-root={slug} style={{ display: "contents", ...resolved.vars }}>
        {children}
      </div>
    </KitContext.Provider>
  );
}
