"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useGuest } from "@/lib/kit/behaviors/useGuest";
import { useMusic } from "@/lib/kit/behaviors/useMusic";
import { useEngine } from "@/lib/kit/motion/useEngine";
import { useMotionPolicy, useTheme } from "@/lib/kit/useTheme";
import type { TemplateProps } from "../types";
import { Defs } from "./art";
import { demoConfig, mapInvite } from "./config";
import { WdContext, type Wd } from "./context";
import { Cover, type Phase } from "./cover";
import { derive } from "./derive";
import { Gift, Rsvp, SaveTheDate, Wishes } from "./forms";
import { Dock, Marquee } from "./fx";
import { Countdown, Day, Details, Gallery, Hero, Player, Story, Venue } from "./sections";
import s from "./we-do.module.css";

/**
 * "We Do": a monochrome, story-first wedding invitation with a film finish. A 3D card with the guest's name opens
 * onto a lit hero (the music starts with that click), then paper and darkroom rows: countdown, venue, timeline,
 * details, story, gallery, gift, RSVP, guestbook and a calendar link. Colours and fonts come from the kit (`--k-*`);
 * every motion layer (opening sequence, scroll reveals, dust, tilt, loops) steps down with the motion policy.
 */
export default function WeDo({ invite, token, mode }: TemplateProps) {
  const theme = useTheme();
  const policy = useMotionPolicy();
  const engine = useEngine({ themeLevel: theme.motion.level, durationScale: theme.motion.durationScale }); // before the effects below
  const { search } = useGuest(invite?.guest?.name);
  const config = useMemo(() => {
    if (mode === "demo") return demoConfig(search);
    if (!invite) throw new Error("WeDo: live and preview modes need an invite");
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
  const [armed, setArmed] = useState(false); // reveals hide their content only once JS can show it again
  useEffect(() => {
    const el = root.current;
    if (!el || motion === "off" || typeof IntersectionObserver === "undefined") return;
    setArmed(true);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add(s.in), io.unobserve(e.target))), { threshold: 0.15 });
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
    if (config.show.music) music.play(); // inside the click: autoplay rules allow it
    const focusHero = () => document.querySelector<HTMLElement>("[data-template='we-do'] h1")?.focus({ preventScroll: true });
    if (motion === "off") {
      setPhase("gone");
      requestAnimationFrame(focusHero);
      return;
    }
    setPhase("opening");
    engine.later(2600 * policy.durationScale, () => {
      setPhase("gone");
      focusHero();
    });
  }, [config.show.music, music, motion, engine, policy.durationScale]);

  const value = useMemo<Wd>(
    () => ({ mode, token, config, d, engine, reduced: policy.reduced, motion, fine: policy.fine, opened, music }),
    [mode, token, config, d, engine, policy.reduced, motion, policy.fine, opened, music],
  );

  // faded backdrops: a different host photo behind each section, when there are any
  const pool = [config.heroPhoto?.url, config.closing.photo?.url, ...config.story.photos.map((p) => p?.url), ...config.events.map((e) => e.photo?.url), ...config.gallery.map((g) => g.url)].filter((u): u is string => !!u);
  const side = (i: number) => (pool.length ? pool[i % pool.length] : null);
  const intro = motion === "off" ? undefined : opened ? "play" : "wait";
  // the hero's sequence waits for the envelope to open (none in the editor's preview)
  const lag = { "--lag": mode === "preview" ? "0s" : "1.5s" } as CSSProperties;

  return (
    <WdContext.Provider value={value}>
      <div ref={root} data-template="we-do" data-motion={motion} data-reveal={armed ? "" : undefined} data-intro={intro} className={s.root} style={lag}>
        <Defs />
        <div className={s.progress} aria-hidden="true" />
        {phase !== "gone" && <Cover phase={phase} onOpen={open} />}
        <main ref={main} id="invitation">
          <Hero side={side(0)} />
          <Marquee />
          <Player side={side(1)} />
          <Countdown side={side(2)} />
          <Venue side={side(3)} />
          <Day side={side(2)} />
          <Details side={side(4)} />
          <Story side={side(5)} />
          <Gallery side={side(6)} />
          <Gift side={side(7)} />
          <Rsvp side={side(0)} />
          <Wishes side={side(1)} />
          <SaveTheDate />
        </main>
        <Dock />
        <div className={`${s.grain} ${s.loop}`} aria-hidden="true" />
      </div>
    </WdContext.Provider>
  );
}
