"use client";

import { useEffect, useMemo, useRef } from "react";
import { lake, pocket, sprig } from "./art";
import { DEFAULT_COPY } from "./config";
import { useAr } from "./context";
import { Bq, Seal, useDepth } from "./fx";
import s from "./arunika.module.css";

export type Phase = "closed" | "opening" | "gone";

/**
 * The envelope moment: an olive envelope addressed to the guest, sealed in burgundy wax with a calla sprig across it,
 * floats on cream paper between two bouquets. "Open Invitation" starts the music (it needs this tap): the seal pops,
 * the flap swings back onto its painted-lake liner, the card rises out and comes to the guest while petals fall, then
 * the collage takes over. Page scroll is locked and the page behind is inert until then. Reduced motion: it simply
 * disappears.
 */
export function Cover({ phase, onOpen }: { phase: Phase; onOpen: () => void }) {
  const { config: c, d, engine } = useAr();
  const depth = useDepth<HTMLDivElement>();
  const btn = useRef<HTMLButtonElement | null>(null);
  const known = c.guestName !== DEFAULT_COPY.guestName;
  const liner = useMemo(() => ({ backgroundImage: lake() }), []);
  const pocketSvg = useMemo(() => ({ __html: pocket("var(--env)", "var(--env-lip)") }), []);

  useEffect(() => {
    if (phase !== "closed") return;
    engine.lock();
    btn.current?.focus({ preventScroll: true });
    return () => engine.unlock();
  }, [phase, engine]);

  return (
    <div ref={depth} role="dialog" aria-modal="true" aria-label="Wedding invitation cover" className={s.cover} data-phase={phase}>
      <div className={s.coverPaper} aria-hidden="true" />
      <Bq seed={11} o={{ callaAng: -38, hang: 4, hangLen: 1.2 }} className={`${s.cBq} ${s.cBqL}`} />
      <Bq seed={23} o={{ flip: true, callaAng: -30, hang: 3, white: true }} className={`${s.cBq} ${s.cBqR}`} />
      <div className={s.stage}>
        <p className={s.cKick}>The wedding of</p>
        <p className={s.cNames}>
          <span>{c.partnerOne}</span> <i>&amp;</i> <span>{c.partnerTwo}</span>
        </p>
        <div className={s.envStage}>
          <div className={s.env}>
            <div className={s.envBack}>
              <div className={s.liner} style={liner} />
            </div>
            <div className={s.letter} aria-hidden="true">
              <span className={s.lScript}>You&apos;re invited</span>
              <span className={s.lCaps}>{c.partnerOne} &amp; {c.partnerTwo}</span>
              {d.short && <span className={s.lDate}>{d.short}</span>}
            </div>
            <div className={s.pocket} aria-hidden="true" dangerouslySetInnerHTML={pocketSvg} />
            <div className={s.addressee}>
              <span>{known ? "Dear" : "To our"}</span>
              <b>{known ? c.guestName : "beloved guest"}</b>
            </div>
            <div className={s.flapShadow} aria-hidden="true" />
            <div className={s.flap} aria-hidden="true">
              <div className={s.flapFront} />
              <div className={s.flapBack}>
                <div className={s.liner} style={liner} />
              </div>
            </div>
            <Seal seed={3} className={s.envSeal} />
          </div>
          <div className={s.sprig} aria-hidden="true" style={{ backgroundImage: sprig() }} />
        </div>
        <button ref={btn} type="button" className={s.openBtn} onClick={onOpen}>
          <span>Open Invitation</span>
        </button>
        <p className={s.cHint} aria-hidden="true">tap to open the magic</p>
      </div>
    </div>
  );
}
