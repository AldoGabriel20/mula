"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGuest } from "@/lib/kit/behaviors/useGuest";
import { useMusic } from "@/lib/kit/behaviors/useMusic";
import { useEngine } from "@/lib/kit/motion/useEngine";
import { useMotionPolicy, useTheme } from "@/lib/kit/useTheme";
import type { TemplateProps } from "../types";
import { demoConfig, mapInvite } from "./config";
import { ArContext, type Ar } from "./context";
import { Cover, type Phase } from "./cover";
import { derive } from "./derive";
import { Petals } from "./fx";
import { Closing, Collage, Countdown, Details, Dock, Gallery, Gift, Rsvp, Story, Wishes } from "./sections";
import s from "./arunika.module.css";

/**
 * "Arunika": a moody garden invitation in olive and wine. An olive envelope sealed in burgundy wax opens (the music
 * starts with that tap) on a painted lake and a shower of petals, then a scrapbook collage (names card, date card,
 * polaroids, wax seals, painted bouquets) that drifts in 3D with the pointer or the phone, followed by a countdown over
 * the lake, the love story, the day, gallery, gift, RSVP, guestbook and a calendar link. Colours and fonts come from the
 * kit (`--k-*`); the painted artwork keeps its own colours. Every motion layer steps down with the motion policy.
 */
export default function Arunika({ invite, token, mode }: TemplateProps) {
  const theme = useTheme();
  const policy = useMotionPolicy();
  const engine = useEngine({ themeLevel: theme.motion.level, durationScale: theme.motion.durationScale });
  const { search } = useGuest(invite?.guest?.name);
  const config = useMemo(() => {
    if (mode === "demo") return demoConfig(search);
    if (!invite) throw new Error("Arunika: live and preview modes need an invite");
    return mapInvite(invite, mode, search);
  }, [mode, invite, search]);
  const d = useMemo(() => derive(config), [config]);
  const music = useMusic(config.music, engine);

  const motion = policy.reduced || theme.motion.level === "off" ? "off" : theme.motion.level;
  // the editor's live preview shows the page itself, not the envelope
  const [phase, setPhase] = useState<Phase>(mode === "preview" ? "gone" : "closed");
  const opened = phase !== "closed";
  const root = useRef<HTMLDivElement | null>(null);
  const main = useRef<HTMLElement | null>(null);
  const [petals, setPetals] = useState(false);
  const [armed, setArmed] = useState(false); // reveals hide their content only once JS can show it again
  useEffect(() => {
    const el = root.current;
    if (!el || motion === "off" || typeof IntersectionObserver === "undefined") return;
    setArmed(true);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add(s.in), io.unobserve(e.target))), { threshold: 0.12 });
    const seen = new WeakSet<Element>();
    const scan = () => el.querySelectorAll(`.${s.rv}`).forEach((n) => !seen.has(n) && (seen.add(n), io.observe(n)));
    scan();
    const mo = new MutationObserver(scan); // sections that mount later (wishes loaded, form turned into the thank-you)
    mo.observe(el, { childList: true, subtree: true });
    return () => (io.disconnect(), mo.disconnect(), setArmed(false));
  }, [motion, config]);

  // the page behind the envelope is out of reach until it opens
  useEffect(() => {
    const m = main.current;
    if (!m) return;
    if (opened) m.removeAttribute("inert");
    else m.setAttribute("inert", "");
  }, [opened]);

  const open = useCallback(() => {
    if (config.show.music) music.play(); // inside the tap: autoplay rules allow it
    const focusTop = () => document.querySelector<HTMLElement>("[data-template='arunika'] h1")?.focus({ preventScroll: true });
    if (motion === "off") {
      setPhase("gone");
      requestAnimationFrame(focusTop);
      return;
    }
    setPhase("opening");
    setPetals(true);
    engine.later(5600 * policy.durationScale, () => setPetals(false));
    engine.later(3200 * policy.durationScale, () => {
      setPhase("gone");
      focusTop();
    });
  }, [config.show.music, music, motion, engine, policy.durationScale]);

  const value = useMemo<Ar>(() => ({ mode, token, config, d, engine, motion, fine: policy.fine, opened, music }), [mode, token, config, d, engine, motion, policy.fine, opened, music]);
  const intro = motion === "off" ? undefined : opened ? "play" : "wait";

  return (
    <ArContext.Provider value={value}>
      <div ref={root} data-template="arunika" data-motion={motion} data-reveal={armed ? "" : undefined} data-intro={intro} data-preview={mode === "preview" ? "" : undefined} className={s.root}>
        {phase !== "gone" && <Cover phase={phase} onOpen={open} />}
        <main ref={main} id="invitation">
          <Collage />
          <Countdown />
          <Story />
          <Details />
          <Gallery />
          <Gift />
          <Rsvp />
          <Wishes />
          <Closing />
        </main>
        <Dock />
        {petals && <Petals />}
      </div>
    </ArContext.Provider>
  );
}
