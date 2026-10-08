"use client";

import { useEffect, useRef } from "react";
import { useSectionGrade } from "@/lib/motion";
import { landingFontVars } from "./fonts";
import { LangProvider } from "./i18n";
import { LandingFx } from "./LandingFx";
import { LandingNav } from "./LandingNav";
import { LandingFooter } from "./LandingFooter";
import s from "./landing.module.css";

// Global (un-hashed) keyframes: sections reference them from inline `animation:` styles.
const KEYFRAMES = "@keyframes mulaEq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes mulaDot{0%,80%,100%{opacity:.25}40%{opacity:1}}@keyframes mulaPulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.2);opacity:0}}";

type Props = {
  children: React.ReactNode;
  active?: string; // nav item with the gold dot
  bg?: string; // root background before the first section grades it (prototype: the page's data-bg-root)
  fg?: string;
  startLight?: boolean; // nav starts ink-on-ivory (prototype MulaNav start-light)
  hover?: "gold" | "brown" | "fade"; // prototype per-page `a:hover` rule
  smooth?: boolean; // html scroll-behavior:smooth (Home only)
  pad?: 80 | 90 | 100; // html scroll-padding-top
};

// Frame shared by every prototype page: nav, footer, cursor + route-transition curtain, section
// colour grading and the language context. Each page mounts its own, like the prototype's pages did.
export function LandingShell({ children, active = "", bg = "#0E0C0B", fg = "#F4EEE4", startLight = false, hover = "gold", smooth = false, pad = 80 }: Props) {
  const root = useRef<HTMLDivElement>(null);
  useSectionGrade(root);
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = bg;
    return () => { document.body.style.background = prev; };
  }, [bg]);
  return (
    <LangProvider>
      <div ref={root} className={`${s.root} ${landingFontVars}`} data-bg-root="1" data-hover={hover} data-smooth={smooth ? "1" : undefined} data-pad={pad} style={{ background: bg, color: fg }}>
        <style>{KEYFRAMES}</style>
        <LandingFx />
        <LandingNav active={active} startLight={startLight} />
        <main id="main">{children}</main>
        <LandingFooter />
      </div>
    </LangProvider>
  );
}
