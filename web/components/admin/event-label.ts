// The events API returns couple_a / couple_b / type (not a `name`). Build one display
// label from them: "Raden & Cilla", "Naya", or the humanised type as a last resort.
export type EventLike = { couple_a?: string | null; couple_b?: string | null; type?: string | null };

export function eventLabel(e: EventLike): string {
  const a = e.couple_a?.trim();
  const b = e.couple_b?.trim();
  if (a && b) return `${a} & ${b}`;
  if (a || b) return (a || b) as string;
  const t = (e.type ?? "").replace(/-/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "Untitled celebration";
}
