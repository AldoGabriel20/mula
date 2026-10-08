// Maps the onboarding form onto the events API shape (couple_a/couple_b/event_date/type).

/** "Raden & Cilla" / "Raden and Cilla" → ["Raden","Cilla"]; "Naya" → ["Naya", null]. */
export function splitNames(raw: string): [string | null, string | null] {
  const s = raw.trim();
  if (!s) return [null, null];
  const parts = s.split(/\s+(?:&|and|dan)\s+|\s*&\s*/i).map((p) => p.trim()).filter(Boolean);
  return [parts[0] ?? null, parts[1] ?? null];
}

/** <input type="date"> value (YYYY-MM-DD) → RFC3339 UTC at 09:00, or null. */
export function dateToRFC3339(d: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return `${d}T09:00:00Z`;
}

/** "17th Birthday" → "seventeenth-birthday"-style stable slug used as events.type. */
export function typeSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
