"use client";

import { useCallback } from "react";
import { useLightbox } from "@/lib/kit/behaviors/useLightbox";
import { useGs } from "../context";
import { SANS, SERIF } from "../type";

const pad2 = (n: number) => String(n).padStart(2, "0");
const BTN = { position: "absolute", width: 48, height: 48, borderRadius: "50%", border: "1px solid rgba(232,215,173,.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } as const;

/**
 * Full-screen photo viewer (docs/15 §8.11): dark backdrop, previous / next / close, ←/→/Esc, a counter
 * with the photo's alt text. Opening freezes page scroll and focuses Close; closing restores both.
 * Only photographs that exist take part (the corridor never offers an empty frame).
 */
export function Lightbox() {
  const { refs: r, ctl, engine, config } = useGs();
  const photos = config.gallery;
  const filled = photos.map((p, i) => (p.url ? i : -1)).filter((i) => i >= 0);
  const setKeyHandler = useCallback((fn: ((e: KeyboardEvent) => boolean) | null) => {
    ctl.lightboxKey = fn;
  }, [ctl]);
  const { index: lb, step, close } = useLightbox({ store: ctl.lightbox, filled, engine, focusRef: r.lbClose, setKeyHandler });

  if (lb === null) return null;
  const photo = photos[lb];
  const k = Math.max(0, filled.indexOf(lb));
  const counter = `${pad2(k + 1)} / ${pad2(Math.max(1, filled.length))} · ${photo?.alt ?? ""}`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(e) => e.target === e.currentTarget && close()} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(26,21,18,.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(64px,9vh,96px) clamp(12px,8vw,120px)" }}>
      <figure style={{ margin: 0, width: "100%", height: "100%", maxWidth: 1100, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, pointerEvents: "none" }}>
        <div style={{ flex: "1 1 auto", minHeight: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {photo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed, expiring API URL
            <img src={photo.url} alt={photo.alt} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", boxShadow: "0 30px 80px rgba(0,0,0,.5)" }} />
          ) : (
            <div style={{ width: "min(560px,100%)", aspectRatio: "4/3", border: "1px dashed rgba(232,215,173,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: SERIF, fontStyle: "italic", fontSize: 21, lineHeight: 1.5, color: "var(--k-accent-soft)", textAlign: "center" }}>This photograph is unavailable.</div>
          )}
        </div>
        <figcaption style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".32em", textTransform: "uppercase", color: "#CDBFA9" }}>{counter}</figcaption>
      </figure>
      <button ref={r.lbClose as React.RefObject<HTMLButtonElement>} type="button" onClick={close} aria-label="Close photo viewer" style={{ ...BTN, top: 16, right: 16, background: "transparent" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" stroke="#F4ECDF" strokeWidth="1.3" aria-hidden="true">
          <path d="M2 2L14 14M14 2L2 14" />
        </svg>
      </button>
      <button type="button" onClick={() => step(-1)} aria-label="Previous photo" style={{ ...BTN, left: "clamp(8px,2vw,28px)", top: "50%", translate: "0 -50%", background: "rgba(26,21,18,.5)" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#F4ECDF" strokeWidth="1.3" aria-hidden="true">
          <path d="M10 2L4 8L10 14" />
        </svg>
      </button>
      <button type="button" onClick={() => step(1)} aria-label="Next photo" style={{ ...BTN, right: "clamp(8px,2vw,28px)", top: "50%", translate: "0 -50%", background: "rgba(26,21,18,.5)" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#F4ECDF" strokeWidth="1.3" aria-hidden="true">
          <path d="M6 2L12 8L6 14" />
        </svg>
      </button>
    </div>
  );
}
