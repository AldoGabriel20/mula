import { FONT_FAMILIES, FONT_PAIRINGS } from "./generated/fonts";
import { PALETTES, type Palette } from "./generated/palettes";
import type { ColorRole, Manifest, MotionLevel } from "./manifest";

/** What a host stores per invitation (`invitations.theme`, docs/17 §9.1). Every key is optional. */
export type Theme = { palette?: string; fontPairing?: string; motion?: MotionLevel; tokens?: Record<string, string> };

export type FontRoles = { display: string; body: string; script: string; mono?: string };

export type ResolvedTheme = {
  /** CSS variables for the template root: --k-bg … --k-font-* … --k-motion-scale, --k-x-<extra>. */
  vars: Record<string, string>;
  /** The same colours as a typed object, for canvas / WebGL code that cannot read CSS variables per frame. */
  colors: Record<ColorRole, string> & Record<string, string>;
  /** Font family ids per role. */
  fontIds: FontRoles;
  /** CSS `font-family` values per role ("Cormorant Garamond", Georgia, serif) — also valid in canvas `ctx.font`. */
  fonts: FontRoles;
  motion: { level: MotionLevel; durationScale: number };
  /** Palette actually applied (id), or null. */
  palette: string | null;
  pairing: string | null;
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const CORE: ColorRole[] = ["bg", "surface", "ink", "inkSoft", "muted", "accent", "accentSoft", "line", "danger", "onAccent"];

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/** A palette by catalog id, or by a legacy `invitations.palette` label ("Forest"). */
export function paletteByIdOrAlias(key: string | null | undefined, palettes: Palette[] = PALETTES): Palette | undefined {
  if (!key) return undefined;
  return palettes.find((p) => p.id === key) ?? palettes.find((p) => p.aliases.includes(key));
}

const family = (id: string): string => {
  const f = FONT_FAMILIES[id];
  return f ? `"${f.name}", ${f.fallback}` : "inherit";
};

/**
 * Manifest defaults → palette → host overrides (docs/17 §6.3). Pure.
 *   - a palette applies only when the template lists it in `customizable.palette` (a template that
 *     lists none keeps its own colours whatever the legacy label says);
 *   - a font pairing and a motion level apply only when listed in `customizable`;
 *   - a host colour applies only for a role in `customizable.tokens` and only as #RRGGBB.
 * The device's motion policy (reduced motion) is applied later, in `resolveMotionPolicy`.
 */
export function resolveTheme(manifest: Manifest, theme: Theme = {}, palettes: Palette[] = PALETTES): ResolvedTheme {
  const can = manifest.customizable;
  const colors: Record<string, string> = { ...manifest.tokens.color, ...(manifest.tokens.extra ?? {}) };

  const pal = paletteByIdOrAlias(theme.palette, palettes);
  const palette = pal && can.palette.includes(pal.id) ? pal : undefined;
  if (palette) {
    for (const [k, v] of Object.entries({ ...palette.color, ...(palette.extra ?? {}) })) if (k in colors && HEX.test(v)) colors[k] = v;
  }
  for (const [role, v] of Object.entries(theme.tokens ?? {})) if (can.tokens.includes(role) && role in colors && HEX.test(v)) colors[role] = v;

  const pairing = theme.fontPairing && can.fontPairings.includes(theme.fontPairing) ? FONT_PAIRINGS.find((p) => p.id === theme.fontPairing) : undefined;
  const fontIds: FontRoles = pairing
    ? { display: pairing.display, body: pairing.body, script: pairing.script, mono: pairing.mono }
    : { ...manifest.tokens.font };

  const level = theme.motion && can.motion.includes(theme.motion) ? theme.motion : manifest.tokens.motion.level;
  const durationScale = manifest.tokens.motion.durationScale ?? 1;

  const fonts: FontRoles = { display: family(fontIds.display), body: family(fontIds.body), script: family(fontIds.script), ...(fontIds.mono ? { mono: family(fontIds.mono) } : {}) };
  const vars: Record<string, string> = {};
  for (const role of CORE) vars[`--k-${kebab(role)}`] = colors[role];
  for (const k of Object.keys(manifest.tokens.extra ?? {})) vars[`--k-x-${kebab(k)}`] = colors[k];
  vars["--k-font-display"] = fonts.display;
  vars["--k-font-body"] = fonts.body;
  vars["--k-font-script"] = fonts.script;
  if (fonts.mono) vars["--k-font-mono"] = fonts.mono;
  vars["--k-motion-scale"] = String(durationScale);

  return { vars, colors: colors as ResolvedTheme["colors"], fontIds, fonts, motion: { level, durationScale }, palette: palette?.id ?? null, pairing: pairing?.id ?? null };
}

/** WCAG contrast ratio of two #RRGGBB colours (the API and the theme panel use the same rule, docs/17 §6.4). */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const ch = (i: number) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The text pairs that must stay readable in any theme (mirrors api/internal/catalog TextPairs). */
export const TEXT_PAIRS: [ColorRole, ColorRole][] = [["ink", "bg"], ["inkSoft", "bg"], ["muted", "bg"], ["onAccent", "accent"]];
