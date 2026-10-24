"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TemplateProps } from "../types";
import { demoConfig, mapInvite } from "./config";
import { createController } from "./controller";
import { GsContext, makeCtl, makeRefs, type Gs } from "./context";
import { derive } from "./derive";
import { Spring } from "@/lib/kit/motion/spring";
import { useEngine } from "@/lib/kit/motion/useEngine";
import { useGuest } from "@/lib/kit/behaviors/useGuest";
import { useMotionPolicy, useTheme } from "@/lib/kit/useTheme";
import "./gilded-seal.global.css";
import s from "./gilded-seal.module.css";
import { Celebration } from "./sections/Celebration";
import { Closing } from "./sections/Closing";
import { Cover } from "./sections/Cover";
import { DateRing } from "./sections/DateRing";
import { Gallery } from "./sections/Gallery";
import { Gift } from "./sections/Gift";
import { Hero } from "./sections/Hero";
import { Lightbox } from "./sections/Lightbox";
import { MusicButton } from "./sections/MusicButton";
import { Rsvp } from "./sections/Rsvp";
import { Statement } from "./sections/Statement";
import { Story } from "./sections/Story";
import { Veil } from "./sections/Veil";
import { Venue } from "./sections/Venue";
import { Wishes } from "./sections/Wishes";

// The prototype's film grain: SVG fractal noise tiled over everything (z 300, ignores the pointer).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27180%27%20height=%27180%27%3E%3Cfilter%20id=%27n%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%27.85%27%20numOctaves=%272%27%20stitchTiles=%27stitch%27/%3E%3CfeColorMatrix%20values=%270%200%200%200%200.24%200%200%200%200%200.18%200%200%200%200%200.12%200%200%200%200.075%200%27/%3E%3C/filter%3E%3Crect%20width=%27100%25%27%20height=%27100%25%27%20filter=%27url%28%23n%29%27/%3E%3C/svg%3E\")";

/**
 * "Gilded Seal": the cinematic wedding invitation template (docs/15). The root owns the lifecycle
 * (veil → cover → opening → done), the shared engine and the context every section reads; the
 * sections own their markup and per-frame work.
 */
export default function GildedSeal({ invite, token, mode }: TemplateProps) {
  const theme = useTheme();
  const engine = useEngine({ themeLevel: theme.motion.level, durationScale: theme.motion.durationScale }); // declared first: it must mount before the effects below
  const refs = useRef(makeRefs()).current;
  const [ctl] = useState(() => makeCtl(new Spring(0, { tension: 10, friction: 30 })));

  // `?to=` is read after mount (the server has no query string) and only matters on generic links
  const { search } = useGuest(invite?.guest?.name);
  const config = useMemo(() => {
    if (mode === "demo") return demoConfig(search);
    if (!invite) throw new Error("GildedSeal: live and preview modes need an invite");
    return mapInvite(invite, mode, search);
  }, [mode, invite, search]);
  const d = useMemo(() => derive(config), [config]);

  const [showVeil, setShowVeil] = useState(true);
  const [showCover, setShowCover] = useState(true);
  const [coverFallback, setCoverFallback] = useState(false);
  const [opening, setOpening] = useState(false);
  const [vp, setVp] = useState({ w: 1280, h: 800 }); // matches the server render; the real size is set before the veil lifts
  const policy = useMotionPolicy();

  const vpRef = useRef(vp);
  vpRef.current = vp;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const [ctrl] = useState(() =>
    createController({
      engine,
      refs,
      ctl,
      set: { showVeil: setShowVeil, showCover: setShowCover, coverFallback: setCoverFallback, opening: setOpening, viewport: (w, h) => setVp({ w, h }) },
      getViewport: () => vpRef.current,
      getFonts: () => themeRef.current.fonts,
    }),
  );

  useEffect(() => {
    setVp({ w: innerWidth, h: innerHeight });
    ctrl.mount();
  }, [engine, ctrl]);

  // the stack's sticky tops depend on the viewport height
  useEffect(() => {
    ctl.stack?.layout();
  }, [ctl, vp.h]);

  const value = useMemo<Gs>(
    () => ({
      mode,
      token,
      config,
      d,
      engine,
      refs,
      ctl,
      vw: vp.w,
      vh: vp.h,
      reduced: policy.reduced,
      fine: policy.fine,
      showVeil,
      showCover,
      coverFallback,
      opening,
      open: ctrl.open,
      skip: ctrl.skip,
      registerFrame: ctrl.registerFrame,
      onGl: ctrl.onGl,
    }),
    [mode, token, config, d, engine, refs, ctl, vp, policy, showVeil, showCover, coverFallback, opening, ctrl],
  );

  return (
    <GsContext.Provider value={value}>
      <div ref={refs.root} data-template="gilded-seal" className={s.root} style={{ position: "relative", minHeight: "100vh", background: "var(--k-bg)", color: "var(--k-ink)", fontFamily: "var(--k-font-body)", overflowX: "clip" }}>
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 300, pointerEvents: "none", opacity: 0.8, backgroundImage: GRAIN }} />
        {showVeil && <Veil />}
        {showCover && <Cover />}
        {/* Hidden until the cover starts to open: the server renders it for a 1280×800 window, the first client effect
            lays it out for the real one, and that jump (CLS .9 on a throttled phone) must never be visible. */}
        <main ref={refs.main} id="invitation" style={{ visibility: showCover && !opening ? "hidden" : "visible" }}>
          <div ref={refs.stack} style={{ position: "relative", background: "#231D18" }}>
            <Hero />
            <Statement />
            <Story />
            <DateRing />
          </div>
          <Celebration />
          <Venue />
          <Gallery />
          <Gift />
          <Rsvp />
          <Wishes />
          <Closing />
        </main>
        <MusicButton />
        <Lightbox />
      </div>
    </GsContext.Provider>
  );
}
