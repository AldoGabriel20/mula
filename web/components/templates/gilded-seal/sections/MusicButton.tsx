"use client";

import { useEffect, useRef } from "react";
import { useMusic } from "@/lib/kit/behaviors/useMusic";
import { useGs } from "../context";
import s from "../gilded-seal.module.css";

/**
 * Background music (docs/15 §8.12). It starts only from a guest gesture (the "open" click or this
 * button), fades in over 1.8 s, never resumes after an explicit pause, and pauses while the tab is
 * hidden (resuming only if it was the tab switch that paused it). A missing file shows the error
 * state and nothing else changes.
 */
export function MusicButton() {
  const { ctl, engine, config, showCover } = useGs();
  const { track, state, play, toggle } = useMusic(config.music, engine);
  const btn = useRef<HTMLButtonElement | null>(null);
  // the "open" click starts the music from inside the gesture (controller.finish → ctl.playMusic)
  useEffect(() => {
    if (!track) return;
    ctl.playMusic = play;
    return () => {
      ctl.playMusic = null;
    };
  }, [track, ctl, play]);

  // equaliser bars and spinner animate with WAAPI (skipped under reduced motion)
  const visible = !showCover && !!track;
  useEffect(() => {
    const root = btn.current;
    if (!root || engine.policy().reduced) return;
    root.querySelectorAll<SVGElement | HTMLElement>("[data-bar]").forEach((b, i) => b.animate([{ transform: "scaleY(.25)" }, { transform: "scaleY(1)" }], { duration: 480 + i * 140, direction: "alternate", iterations: Infinity, easing: "ease-in-out", delay: -i * 160 }));
    root.querySelector("[data-spin]")?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 1000, iterations: Infinity });
  }, [state, visible, engine]);

  if (!visible) return null;
  const label = state === "playing" ? "Pause music" : state === "loading" ? "Loading music" : state === "error" ? "Music unavailable. Tap to try again." : "Play music";
  return (
    <button ref={btn} type="button" onClick={toggle} aria-label={label} aria-pressed={state === "playing"} title={label} className={s.music} style={{ position: "fixed", right: "max(16px,env(safe-area-inset-right))", bottom: "max(16px,env(safe-area-inset-bottom))", zIndex: 90, width: 52, height: 52, padding: 0, borderRadius: "50%", border: "1px solid rgba(176,142,82,.6)", background: "rgba(252,249,243,.9)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", boxShadow: "0 16px 32px -16px rgba(60,40,25,.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--k-ink)", opacity: state === "error" ? 0.7 : 1, transition: "background .35s ease,opacity .35s ease" }}>
      <span aria-hidden="true" style={{ position: "absolute", inset: 4, borderRadius: "50%", border: "1px solid rgba(176,142,82,.25)" }} />
      {state === "playing" && (
        <span aria-hidden="true" style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 3, height: 16 }}>
          {[0.6, 0.9, 0.45, 0.75].map((h, i) => (
            <span key={i} data-bar="" style={{ width: 2, height: 16, background: "var(--k-x-eyebrow-soft)", transformOrigin: "50% 100%", transform: `scaleY(${h})` }} />
          ))}
        </span>
      )}
      {(state === "idle" || state === "paused") && (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" style={{ position: "relative", marginLeft: 2 }}>
          <path d="M4 2.5L13 8L4 13.5Z" fill="var(--k-ink)" />
        </svg>
      )}
      {state === "loading" && (
        <svg data-spin="" aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ position: "relative" }}>
          <circle cx="11" cy="11" r="8.5" stroke="rgba(126,100,54,.25)" strokeWidth="1.4" />
          <path d="M11 2.5A8.5 8.5 0 0 1 19.5 11" stroke="var(--k-x-eyebrow-soft)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      {state === "error" && (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--k-muted)" strokeWidth="1.3" style={{ position: "relative" }}>
          <path d="M7 13.5V3.5L14 2V11.5" />
          <circle cx="5" cy="13.5" r="2" />
          <circle cx="12" cy="11.5" r="2" />
          <path d="M2 2L16 16" />
        </svg>
      )}
    </button>
  );
}
