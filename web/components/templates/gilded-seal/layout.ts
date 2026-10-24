import type { DeckWish } from "./config";
import { clamp } from "@/lib/kit/motion/ease";

// Pure geometry for the art-directed layouts (docs/15 §8). No DOM, no React: everything here is a
// function of the viewport and the data, so it is unit-tested and shared by the sections.

export const WIDE = 880; // hero / carousels switch to their wide arrangement
export const isWide = (vw: number) => vw >= WIDE;

// ---- hero ---------------------------------------------------------------------------------------

export type HeroLayout = {
  pL: number; pT: number; pW: number; pH: number;
  tL: number; tT: number; tW: number;
  /** Name font size in px. */
  ns: number;
  align: "flex-start" | "center";
  talign: "left" | "center";
  gap: number;
  /** Whether the hero line is shown. */
  line: boolean;
  /** Opacity of the paper fade at the photo's foot. */
  fade: number;
  silkT: number;
  ampM: string;
  indent: string;
};

/** Two art-directed arrangements sized from the live viewport (prototype `heroLayout`). */
export function heroLayout(vw: number, vh: number, p1: string, p2: string): HeroLayout {
  const maxLen = Math.max(p1.length, p2.length, 4);
  if (vw >= WIDE) {
    const pH = Math.round(Math.min(vh * 0.78, 900));
    const pW = Math.round(Math.min(vw * 0.36, pH * 0.74));
    const pL = Math.round(vw * 0.91 - pW);
    const pT = Math.round((vh - pH) / 2 + vh * 0.015);
    const tL = Math.round(vw * 0.075);
    const tW = Math.max(300, Math.round(pL - tL - vw * 0.03));
    const ns = Math.round(Math.min(vw * 0.085, 150, tW / (maxLen * 0.5)));
    const tH = ns * 2.6 + 260;
    return { pL, pT, pW, pH, tL, tT: Math.max(40, Math.round((vh - tH) / 2)), tW, ns, align: "flex-start", talign: "left", gap: 26, line: true, fade: 0, silkT: Math.round(pT + pH * 0.66), ampM: ".02em 0 -.04em .9em", indent: ".55em" };
  }
  const ns = Math.round(Math.min(72, (vw - 40) / (maxLen * 0.5)));
  const tH = ns * 2.6 + 150;
  const pT = Math.round(Math.max(24, vh * 0.06));
  let pW = Math.min(vw * 0.78, 380);
  let pH = pW * 1.3;
  const avail = vh - pT - tH - 40 + 70;
  if (pH > avail) {
    pH = Math.max(240, avail);
    pW = Math.min(pW, pH / 1.08);
  }
  return { pL: Math.round((vw - pW) / 2), pT, pW: Math.round(pW), pH: Math.round(pH), tL: 20, tT: Math.round(pT + pH - 70), tW: vw - 40, ns, align: "center", talign: "center", gap: 16, line: false, fade: 1, silkT: Math.round(pT + pH * 0.55), ampM: ".02em auto -.04em auto", indent: "0" };
}

// ---- celebration (event carousel) ---------------------------------------------------------------

export type EventLayout = { w: number; h: number; ml: number; cols: string; rows: string; imgM: string; imgR: string; pad: string };

export function eventLayout(vw: number): EventLayout {
  const wide = isWide(vw);
  const w = wide ? Math.round(Math.min(900, vw * 0.7)) : Math.round(vw - 36);
  return {
    w,
    h: wide ? 500 : 620,
    ml: -w / 2,
    cols: wide ? "42% minmax(0,1fr)" : "minmax(0,1fr)",
    rows: wide ? "minmax(0,1fr)" : "220px minmax(0,1fr)",
    imgM: wide ? "18px 0 18px 18px" : "12px 12px 0",
    imgR: wide ? "999px 999px 2px 2px" : "2px",
    pad: wide ? "40px 48px 40px 44px" : "22px 24px 26px",
  };
}

export type EventSlide = { tf: string; op: number; z: number; vis: "visible" | "hidden"; visDelay: string; hidden: boolean; inactive: boolean; tab: 0 | -1 };

/** Where slide `i` sits when slide `active` is current: a 3D coverflow when wide, a plain slide when narrow. */
export function eventSlide(i: number, active: number, vw: number, reduced: boolean): EventSlide {
  const wide = isWide(vw);
  const w = eventLayout(vw).w;
  const d = i - active;
  const a = Math.abs(d);
  return {
    tf: reduced ? (d === 0 ? "none" : `translate3d(${d * 110}%,0,0)`) : wide ? `translate3d(${Math.round(d * w * 0.74)}px,0,${-a * 300}px) rotateY(${-d * 26}deg)` : `translate3d(${d * (w + 16)}px,0,0) scale(${a ? 0.94 : 1})`,
    op: a === 0 ? 1 : a === 1 && !reduced ? 0.5 : 0,
    z: 10 - a,
    vis: a > 1 ? "hidden" : "visible",
    visDelay: a > 1 ? "1s" : "0s",
    hidden: d !== 0,
    inactive: d !== 0,
    tab: d === 0 ? 0 : -1,
  };
}

// ---- venue --------------------------------------------------------------------------------------

export type VenueLayout = { cols: string; photoCol: string; infoCol: string; infoRow: string; infoM: string; photoH: number };

export function venueLayout(vw: number, vh: number): VenueLayout {
  const wide = isWide(vw);
  return {
    cols: wide ? "repeat(12,minmax(0,1fr))" : "minmax(0,1fr)",
    photoCol: wide ? "1 / 9" : "1",
    infoCol: wide ? "8 / 13" : "1",
    infoRow: wide ? "1" : "2",
    infoM: wide ? "0" : "-56px 12px 0",
    photoH: wide ? Math.round(Math.max(520, Math.min(vh * 0.8, 720))) : Math.round(Math.min(vw * 1.05, 460)),
  };
}

export type VenueSlide = { hidden: boolean; tab: 0 | -1; z: number; clip: string; sc: number; op: number; ty: string; vis: "visible" | "hidden"; visDelay: string; inDelay: string };

export function venueSlide(i: number, active: number): VenueSlide {
  const on = i === active;
  return {
    hidden: !on,
    tab: on ? 0 : -1,
    z: on ? 2 : 1,
    clip: on ? "inset(0% 0% 0% 0%)" : i < active ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)",
    sc: on ? 1 : 1.14,
    op: on ? 1 : 0,
    ty: on ? "none" : "translateY(16px)",
    vis: on ? "visible" : "hidden",
    visDelay: on ? "0s" : ".7s",
    inDelay: on ? ".25s" : "0s",
  };
}

// ---- wishes -------------------------------------------------------------------------------------

export const WISH_SLOTS = 5; // at most this many cards are ever in the DOM

export type WishLayout = { h: number; pad: number; cardH: number };
export const wishLayout = (vw: number): WishLayout => {
  const wide = isWide(vw);
  const h = wide ? 400 : 440;
  return { h, pad: wide ? 46 : 28, cardH: h - 36 };
};

export type WishSlot = DeckWish & { fs: number; lines: number; hidden: boolean; z: number; tf: string; op: number };

/**
 * The five DOM cards of the deck (a ring buffer keyed by `index mod 5`): the previous card flies off
 * left, the current one sits on top, the next two peek out behind it. `index` is the unbounded
 * position (`wishV`); wishes repeat when there are fewer than five.
 */
export function wishSlots(all: DeckWish[], index: number, vw: number): WishSlot[] {
  const nw = all.length;
  if (!nw) return [];
  const wide = isWide(vw);
  const { cardH, pad } = wishLayout(vw);
  const slots: WishSlot[] = [];
  for (let j = 0; j < WISH_SLOTS; j++) {
    let p = index - 1;
    while ((((p % WISH_SLOTS) + WISH_SLOTS) % WISH_SLOTS) !== j) p++;
    const d = p - index;
    const w = all[((p % nw) + nw) % nw];
    const L = w.message.length;
    const fs = wide ? (L <= 90 ? 29 : L <= 170 ? 23 : 19) : L <= 90 ? 24 : L <= 170 ? 21 : 18;
    const shown = d === 0 || (d >= 1 && d <= Math.min(2, nw - 1));
    slots.push({
      ...w,
      fs,
      lines: Math.max(3, Math.floor((cardH - pad * 2 - 76) / (fs * 1.45))),
      hidden: d !== 0,
      z: d === -1 ? 12 : 10 - d,
      tf: d === -1 ? "translate3d(-115%,-10px,40px) rotate(-8deg)" : d === 0 ? "none" : `translate3d(0,${d * 16}px,${-d * 70}px) rotate(${d % 2 ? 1.2 : -1}deg)`,
      op: d === 0 ? 1 : shown ? (d === 1 ? 0.75 : 0.45) : 0,
    });
  }
  return slots;
}

// ---- gallery corridor ---------------------------------------------------------------------------

/** x (vw), y (svh), rotateY (deg) of the first eight figures; later ones cycle through it. */
const FIG = [
  [-21, -3, 11],
  [20, 4, -11],
  [-17, -6, 9],
  [23, 2, -12],
  [-23, 5, 12],
  [18, -4, -10],
  [-19, 3, 10],
  [0, 0, 0],
] as const;

export type GalleryFigure = { i: number; z: number; x: number; y: number; rot: number };
export type GalleryPlan = {
  figures: GalleryFigure[];
  /** Camera travel in px at the end of the section: reaches the last figure. */
  camZMax: number;
  /** Section height in svh (the sticky stage is 100svh; each figure adds 45svh of scroll). */
  heightSvh: number;
};

export function galleryPlan(n: number): GalleryPlan {
  const figures: GalleryFigure[] = Array.from({ length: n }, (_, i) => {
    const last = i === n - 1;
    const f = last ? FIG[7] : FIG[i % 8 === 7 ? 6 : i % 8]; // the centred slot is reserved for the last figure
    return { i, z: -500 - 950 * i, x: f[0], y: f[1], rot: f[2] };
  });
  const lastZ = n ? 500 + 950 * (n - 1) : 500;
  return { figures, camZMax: lastZ - 300, heightSvh: 100 + n * 45 };
}

/** Opacity of a figure at camera depth `camZ`: fades in from far away, out as it passes the camera. */
export function figureOpacity(z: number, camZ: number): number {
  const d = z + camZ;
  return clamp((d + 5200) / 2600) * (1 - clamp((d - 120) / 380));
}

// ---- ring ticks ---------------------------------------------------------------------------------

export type Tick = { x1: string; y1: string; x2: string; y2: string; w: number };

/** The 60 minute ticks around the gilded ring (every fifth is longer and heavier). */
export const TICKS: Tick[] = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2;
  const major = i % 5 === 0;
  const r1 = major ? 284 : 290;
  const r2 = 300;
  const s = Math.sin(a);
  const c = Math.cos(a);
  return { x1: (300 + r1 * s).toFixed(2), y1: (300 - r1 * c).toFixed(2), x2: (300 + r2 * s).toFixed(2), y2: (300 - r2 * c).toFixed(2), w: major ? 1.4 : 0.8 };
});
