"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Theme preference: an explicit choice, or "system" (follows prefers-color-scheme).
export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "mula-theme"; // matches the prototype

type ThemeCtx = {
  theme: ThemePref;
  resolved: ResolvedTheme;
  setTheme: (t: ThemePref) => void;
  toggle: () => void;
};

const Context = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(pref: ThemePref): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

// applyRoot mirrors the prototype: data-theme only for an explicit choice, so the
// CSS prefers-color-scheme fallback drives "system".
function applyRoot(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = pref;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Hydrate from storage once mounted.
  useEffect(() => {
    let pref: ThemePref = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePref | null;
      if (stored === "light" || stored === "dark" || stored === "system") pref = stored;
    } catch {
      /* storage unavailable */
    }
    setThemeState(pref);
    setResolved(resolve(pref));
    applyRoot(pref);
  }, []);

  // Track OS changes while on "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(systemTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    setResolved(resolve(t));
    applyRoot(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolve(theme) === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return <Context.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</Context.Provider>;
}
