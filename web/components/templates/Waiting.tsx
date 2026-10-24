import { manifestOf } from "@/lib/kit/manifest";

/**
 * What the visitor sees from the first byte until a template's chunk has loaded: the template's own
 * loading wash (manifest `veilFrom` → `veilTo`, else its page colour), so the swap is invisible.
 */
export function Waiting({ slug }: { slug: string }) {
  const t = manifestOf(slug)?.tokens;
  const from = t?.extra?.veilFrom;
  const to = t?.extra?.veilTo;
  const bg = from && to ? `radial-gradient(70% 60% at 50% 42%,${from} 0%,${to} 100%)` : (t?.color.bg ?? "#F7F2E9");
  return <div role="status" aria-label="Preparing your invitation" style={{ position: "fixed", inset: 0, zIndex: 220, background: bg }} />;
}
