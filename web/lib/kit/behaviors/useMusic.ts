"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MUSIC_FADE_MS, MUSIC_VOLUME, trackByKey } from "@/lib/kit/music";
import { clamp } from "../motion/ease";
import type { Engine } from "../motion/engine";

export type MusicState = "idle" | "loading" | "playing" | "paused" | "error";

/**
 * Background music for every template (docs/17 §7.4, §7.7). It starts only from a guest gesture (`play` from the
 * "open" click, or `toggle` from the button), fades in over 1.8 s, never resumes after an explicit pause, and
 * pauses while the tab is hidden (resuming only if it was the tab switch that paused it). A missing file shows
 * the error state and nothing else changes. `trackKey` is a key of catalog/music.json; unknown or empty = no music.
 */
export function useMusic(trackKey: string | null | undefined, engine: Engine) {
  const track = trackByKey(trackKey);
  const src = track?.src ?? null;
  const [state, setState] = useState<MusicState>("idle");
  const audio = useRef<HTMLAudioElement | null>(null);
  const userPaused = useRef(false);
  const hiddenPaused = useRef(false);
  const playRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!src) return;
    const a = new Audio();
    a.preload = "none";
    a.loop = true;
    a.src = src;
    audio.current = a;
    const set = (st: MusicState) => setState(st);
    a.addEventListener("playing", () => set("playing"));
    a.addEventListener("waiting", () => {
      if (!a.paused) set("loading");
    });
    a.addEventListener("pause", () => setState((cur) => (cur === "error" ? cur : "paused")));
    a.addEventListener("ended", () => set("paused"));
    a.addEventListener("error", () => set("error"));

    const play = () => {
      if (userPaused.current) return;
      if (a.error) {
        try {
          a.load(); // a previous load failed: start over
        } catch {
          /* play() below reports it */
        }
      }
      setState("loading");
      try {
        a.volume = 0;
      } catch {
        /* some browsers fix the volume */
      }
      const fade = () => {
        const t0 = performance.now();
        const f = (time: number) => {
          const k = clamp((time - t0) / MUSIC_FADE_MS);
          try {
            a.volume = MUSIC_VOLUME * k;
          } catch {
            /* ignore */
          }
          if (k >= 1 || a.paused) engine.ticker.untick(f);
        };
        engine.ticker.tick(f);
      };
      let p: Promise<void> | undefined;
      try {
        p = a.play();
      } catch {
        return setState(a.error ? "error" : "paused");
      }
      if (p && p.then) p.then(fade, () => setState(a.error ? "error" : "paused"));
      else fade();
    };
    playRef.current = play;
    engine.listen(document, "visibilitychange", () => {
      if (document.hidden) {
        if (!a.paused) {
          hiddenPaused.current = true;
          a.pause();
        }
      } else if (hiddenPaused.current) {
        hiddenPaused.current = false;
        if (!userPaused.current) play();
      }
    });
    return () => {
      playRef.current = null;
      try {
        a.pause();
        a.removeAttribute("src");
        a.load();
      } catch {
        /* already torn down */
      }
      audio.current = null;
    };
  }, [src, engine]);

  /** Start (or resume) playback. Call it inside a user gesture so autoplay rules allow it. */
  const play = useCallback(() => playRef.current?.(), []);
  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (!a.paused && state !== "error") {
      userPaused.current = true;
      a.pause();
    } else {
      userPaused.current = false;
      playRef.current?.();
    }
  }, [state]);

  return { track, available: !!track, state, play, toggle };
}
