"use client";

import { createContext, createRef, useContext, type MutableRefObject } from "react";
import { createStore, type Store } from "@/lib/kit/store";
import type { TemplateMode } from "../types";
import type { WeddingConfig } from "./config";
import type { Derived } from "./derive";
import type { Engine } from "@/lib/kit/motion/engine";
import type { createParallax } from "@/lib/kit/motion/parallax";
import type { Reveals } from "@/lib/kit/motion/reveals";
import type { Spring } from "@/lib/kit/motion/spring";
import type { Stack } from "./engine/stack";

type R<T extends Element = HTMLDivElement> = MutableRefObject<T | null>;

/** Every element the engine or a frame callback touches directly (prototype `this.r`). */
export type Refs = {
  root: R; veil: R; veilMark: R; veilFill: R<HTMLSpanElement>; veilBar: R;
  cover: R; coverCanvas: R<HTMLCanvasElement>; shaft: R; coverHead: R; coverFoot: R;
  main: R<HTMLElement>; stack: R;
  hero: R<HTMLElement>; heroBg: R<HTMLCanvasElement>; heroCam: R; burn: R<HTMLCanvasElement>; petals: R; heading: R<HTMLHeadingElement>; scrollDot: R;
  statement: R<HTMLElement>; halo: R<SVGSVGElement>;
  date: R<HTMLElement>; dateBg: R<HTMLCanvasElement>; seamTop: R<HTMLCanvasElement>; seamBottom: R<HTMLCanvasElement>;
  ring: R; ringGlow: R<SVGCircleElement>; ringArc: R<SVGCircleElement>; ringHead: R<SVGGElement>;
  gallery: R<HTMLElement>; gallerySticky: R; galleryStage: R; galleryCam: R; galleryHead: R; galleryCount: R; galleryBar: R;
  closing: R<HTMLElement>; closingBg: R<HTMLCanvasElement>; closingArch: R;
  pinPulse: R; lbClose: R; evTrack: R; vnTrack: R; wishDeck: R; rsvpThanks: R<HTMLHeadingElement>;
};

export const makeRefs = (): Refs => {
  const keys = ["root", "veil", "veilMark", "veilFill", "veilBar", "cover", "coverCanvas", "shaft", "coverHead", "coverFoot", "main", "stack", "hero", "heroBg", "heroCam", "burn", "petals", "heading", "scrollDot", "statement", "halo", "date", "dateBg", "seamTop", "seamBottom", "ring", "ringGlow", "ringArc", "ringHead", "gallery", "gallerySticky", "galleryStage", "galleryCam", "galleryHead", "galleryCount", "galleryBar", "closing", "closingBg", "closingArch", "pinPulse", "lbClose", "evTrack", "vnTrack", "wishDeck", "rsvpThanks"] as const;
  return Object.fromEntries(keys.map((k) => [k, createRef()])) as unknown as Refs;
};

export type Phase = "idle" | "opening" | "done";

/** The three.js envelope scene (gl/cover.ts, GS-022). */
export type CoverScene = {
  update(time: number, dt: number): void;
  resize(): void;
  hover(x: number, y: number): void;
  dispose(): void;
  degrade(): void;
};

/** Per-frame callbacks the sections register; the root calls them only while their section is near the viewport. */
export type FrameKey = "hero" | "statement" | "date" | "gallery" | "closing" | "galleryButtons";
export type FrameFn = (time: number, dt: number, vw: number, vh: number) => void;

/**
 * Mutable, non-rendering state shared by the root and the sections (prototype instance fields).
 * Nothing here triggers a React render: per-frame work writes to the DOM directly.
 */
export type Ctl = {
  phase: Phase;
  loadProgress: number;
  loadDone: boolean;
  veilLifted: boolean;
  veilSpr: Spring;
  coverRiseStart: number | null;
  /** performance.now() when the opening timeline started; 0 = not started. */
  openT0: number;
  /** Intro speed factor: cinematic 1 (brisk .62). */
  openK: number;
  seq: Animation[];
  heroAnims: Animation[];
  burnStart: number | null;
  petalsOn: boolean;
  vis: Record<string, boolean>;
  stack: Stack | null;
  reveals: Reveals | null;
  parallax: ReturnType<typeof createParallax> | null;
  frames: Partial<Record<FrameKey, FrameFn>>;
  /** undefined until detected (idle task after first paint). */
  lowGL: boolean | undefined;
  glSubs: Set<(low: boolean) => void>;
  cover3d: CoverScene | null;
  /** Set by gl/cover.ts; null = no 3D cover (the static card is used). */
  buildCover: ((THREE: typeof import("three")) => CoverScene) | null;
  /** Hero entrance (GS-030): plays at `delay` ms and pushes its animations to `heroAnims`. */
  heroPlay: ((delay: number) => void) | null;
  /** Background music (GS-041): started inside the guest's "open" click so autoplay rules allow it. */
  playMusic: (() => void) | null;
  /** Reduced motion: turn the gallery corridor into a flat grid (GS-036). */
  flattenGallery: (() => void) | null;
  /** Lightbox (GS-036): return true when the key was handled. */
  lightboxKey: ((e: KeyboardEvent) => boolean) | null;
  onResize: Array<() => void>;
  /** Index of the venue shown in The Venue; The Celebration's "See the venue" sets it. */
  venue: Store<number>;
  /** Lightbox: the gallery index being viewed, null = closed. */
  lightbox: Store<number | null>;
};

export const makeCtl = (veilSpr: Spring): Ctl => ({
  phase: "idle", loadProgress: 0, loadDone: false, veilLifted: false, veilSpr,
  coverRiseStart: null, openT0: 0, openK: 1, seq: [], heroAnims: [], burnStart: null, petalsOn: false,
  vis: {}, stack: null, reveals: null, parallax: null, frames: {}, lowGL: undefined, glSubs: new Set(),
  cover3d: null, buildCover: null, heroPlay: null, playMusic: null, flattenGallery: null, lightboxKey: null, onResize: [], venue: createStore(0), lightbox: createStore<number | null>(null),
});

export type Gs = {
  mode: TemplateMode;
  /** Link token (live mode only). */
  token?: string;
  config: WeddingConfig;
  d: Derived;
  engine: Engine;
  refs: Refs;
  ctl: Ctl;
  vw: number;
  vh: number;
  reduced: boolean;
  fine: boolean;
  showVeil: boolean;
  showCover: boolean;
  coverFallback: boolean;
  opening: boolean;
  /** "Open Invitation" / tap the envelope. */
  open(): void;
  /** "Skip intro" / Esc while opening. */
  skip(): void;
  /** Register a per-frame callback; returns the unregister function. */
  registerFrame(key: FrameKey, fn: FrameFn): () => void;
  /** Run `fn(lowGL)` once the GPU class is known (immediately if it already is). */
  onGl(fn: (low: boolean) => void): () => void;
};

export const GsContext = createContext<Gs | null>(null);

export function useGs(): Gs {
  const g = useContext(GsContext);
  if (!g) throw new Error("useGs must be used inside <GildedSeal>");
  return g;
}
