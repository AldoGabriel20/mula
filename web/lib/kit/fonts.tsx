import { FONT_FAMILIES } from "./generated/fonts";
import type { FontRoles } from "./tokens";

/** `@font-face` rules for the families a pairing uses, nothing else. Unquoted names/urls on purpose: React escapes quotes in <style> text. */
export function fontFaceCss(ids: Iterable<string>): string {
  const rules: string[] = [];
  for (const id of new Set(ids)) {
    const fam = FONT_FAMILIES[id];
    if (!fam) continue;
    for (const f of fam.files) {
      rules.push(`@font-face{font-family:${fam.name};font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${f.src}) format(woff2)}`);
    }
  }
  return rules.join("\n");
}

/** First file of each family: what the first paint needs (the italic cut loads when it is used). */
export function preloadSources(ids: Iterable<string>): string[] {
  return [...new Set(ids)].flatMap((id) => FONT_FAMILIES[id]?.files.slice(0, 1).map((f) => f.src) ?? []);
}

const idsOf = (f: FontRoles) => [f.display, f.body, f.script, ...(f.mono ? [f.mono] : [])];

/**
 * Self-hosted fonts for the selected pairing (docs/17 §7.2): `@font-face` + `<link rel=preload>` for those
 * families only, `font-display: swap`. Server-safe, so the preloads are in the first HTML.
 */
export function KitFonts({ fonts }: { fonts: FontRoles }) {
  const ids = idsOf(fonts);
  return (
    <>
      {preloadSources(ids).map((src) => (
        <link key={src} rel="preload" as="font" type="font/woff2" href={src} crossOrigin="anonymous" />
      ))}
      <style data-kit-fonts="">{fontFaceCss(ids)}</style>
    </>
  );
}
