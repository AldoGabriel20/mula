// Landing typefaces (prototype: Cormorant Garamond, Manrope, Bodoni Moda, Italiana, Pinyon Script,
// Unbounded). The woff2 files are the prototype's own embedded (variable) fonts, latin subset, so glyph
// metrics and line wraps match it exactly; next/font/google serves different file versions.
import localFont from "next/font/local";

const cormorant = localFont({
  src: [
    { path: "../../public/fonts/cormorant/CormorantGaramond-normal.woff2", style: "normal", weight: "300 700" },
    { path: "../../public/fonts/cormorant/CormorantGaramond-italic.woff2", style: "italic", weight: "300 700" },
  ],
  display: "swap", variable: "--l-cormorant", adjustFontFallback: false,
});
const manrope = localFont({ src: [{ path: "../../public/fonts/manrope/Manrope-normal.woff2", style: "normal", weight: "200 800" }], display: "swap", variable: "--l-manrope", adjustFontFallback: false });
const bodoni = localFont({
  src: [
    { path: "../../public/fonts/bodoni/BodoniModa-normal.woff2", style: "normal", weight: "400 900" },
    { path: "../../public/fonts/bodoni/BodoniModa-italic.woff2", style: "italic", weight: "400 900" },
  ],
  display: "swap", variable: "--l-bodoni", adjustFontFallback: false,
});
const italiana = localFont({ src: [{ path: "../../public/fonts/italiana/Italiana-normal.woff2", style: "normal", weight: "400" }], display: "swap", variable: "--l-italiana", adjustFontFallback: false });
const pinyon = localFont({ src: [{ path: "../../public/fonts/pinyon/PinyonScript-normal.woff2", style: "normal", weight: "400" }], display: "swap", variable: "--l-pinyon", adjustFontFallback: false });
const unbounded = localFont({ src: [{ path: "../../public/fonts/unbounded/Unbounded-normal.woff2", style: "normal", weight: "200 900" }], display: "swap", variable: "--l-unbounded", adjustFontFallback: false });

export const landingFontVars = [cormorant, manrope, bodoni, italiana, pinyon, unbounded].map((f) => f.variable).join(" ");

// Prototype font strings ("'Bodoni Moda', serif") → the matching CSS variable.
const MAP: Record<string, string> = {
  "Cormorant Garamond": "--l-cormorant",
  Manrope: "--l-manrope",
  "Bodoni Moda": "--l-bodoni",
  Italiana: "--l-italiana",
  "Pinyon Script": "--l-pinyon",
  Unbounded: "--l-unbounded",
};
export function fam(font: string | undefined): string | undefined {
  if (!font) return font;
  const m = font.match(/^'([^']+)',\s*(.+)$/);
  const v = m && MAP[m[1]];
  return v ? `var(${v}), ${m![2]}` : font;
}
export const SERIF = "var(--l-cormorant), serif";
export const SANS = "var(--l-manrope), sans-serif";
export const PINYON = "var(--l-pinyon), cursive";
