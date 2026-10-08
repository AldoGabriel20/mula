// Typefaces drawn onto the 3D invitation card. Declared HERE (not in app/layout.tsx) because
// only the three.js chunk needs them: this module is imported solely by lib/three/invitation.ts,
// which is itself only reached through a dynamic import — so these font files are never
// requested by phones, reduced-motion users, or any page that doesn't mount the scene.
//
// next/font self-hosts the files (no third-party request, no layout shift) and the weights/styles
// are exactly the faces the scene asks the canvas for.
import { Bodoni_Moda, Cormorant_Garamond, Manrope } from "next/font/google";

export const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["italic"], weight: ["400"], display: "swap" });
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500"], display: "swap" });
export const manrope = Manrope({ subsets: ["latin"], weight: ["500"], display: "swap" });

// Canvas 2D needs the real family name (not a CSS var). next/font exposes it via .style.fontFamily
// (e.g. "'__Bodoni_Moda_a1b2c3', '__Bodoni_Moda_Fallback_a1b2c3'").
export const FONT = {
  bodoni: bodoni.style.fontFamily,
  cormorant: cormorant.style.fontFamily,
  manrope: manrope.style.fontFamily,
};
