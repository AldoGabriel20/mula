"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_COPY } from "./config";
import { useWd } from "./context";
import { Dust, useTilt } from "./fx";
import s from "./we-do.module.css";

export type Phase = "closed" | "opening" | "gone";

/**
 * The envelope moment: a paper envelope addressed to the guest, sealed with a gold wax monogram, floats in 3D in a
 * candlelit room. "Open Invitation" starts the music (it needs this click): the seal lifts, the flap folds back onto
 * its patterned liner, the card rises out and the camera moves through it, in a bloom of light, onto the hero. Page scroll is locked and the page behind is inert
 * until then. Reduced motion: it simply disappears.
 */
export function Cover({ phase, onOpen }: { phase: Phase; onOpen: () => void }) {
  const { config: c, d, engine } = useWd();
  const tilt = useTilt<HTMLDivElement>(12);
  const btn = useRef<HTMLButtonElement | null>(null);
  const known = c.guestName !== DEFAULT_COPY.guestName;
  const bg = c.heroPhoto?.url ? { backgroundImage: `url(${JSON.stringify(c.heroPhoto.url)})` } : {};

  useEffect(() => {
    if (phase !== "closed") return;
    engine.lock();
    btn.current?.focus({ preventScroll: true });
    return () => engine.unlock();
  }, [phase, engine]);

  return (
    <div ref={tilt} role="dialog" aria-modal="true" aria-label="Wedding invitation cover" className={s.cover} data-phase={phase}>
      <div className={s.room} aria-hidden="true">
        <div className={s.roomImg} style={bg} />
        <div className={`${s.leak} ${s.loop}`} />
      </div>
      <Dust density={0.7} />
      <div className={s.bloom} aria-hidden="true" />
      <div className={s.stage}>
        <p className={s.cKick}>The wedding of</p>
        <p className={s.cNames}>{c.partnerOne} <i className={s.gold}>&amp;</i> {c.partnerTwo}</p>
        <div className={s.env}>
          <div className={s.envBack} aria-hidden="true" />
          <div className={s.letter} aria-hidden="true">
            <span className={s.lKick}>{c.together}</span>
            <span className={s.mono}>
              <b className={s.gold}>{d.ini1}</b>
              <i className={s.gold}>&amp;</i>
              <b className={s.gold}>{d.ini2}</b>
            </span>
            {d.dots && <span className={s.lDate}>{d.dots}</span>}
          </div>
          <div className={s.pocket}>
            <div>
              <p className={s.cDear}>{known ? "Dear," : "To our"}</p>
              <p className={s.cGuest}>{known ? c.guestName : "beloved guest"}</p>
            </div>
          </div>
          <div className={s.flap} aria-hidden="true"><div><i className={s.liner} /></div></div>
          <div className={s.seal} aria-hidden="true">
            <span>{d.ini1}<i>&amp;</i>{d.ini2}</span>
          </div>
        </div>
        <div className={s.table} aria-hidden="true" />
        <p className={s.cNote}>We would be honoured to celebrate with you</p>
        <button ref={btn} type="button" className={s.openBtn} onClick={onOpen}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></svg>
          Open Invitation
        </button>
      </div>
    </div>
  );
}
