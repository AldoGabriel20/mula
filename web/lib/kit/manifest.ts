import { MANIFESTS, type Manifest } from "./generated/manifests";

export type { ColorRole, Manifest, MotionLevel, SectionType } from "./generated/manifests";

/** The manifest of a template slug, or undefined for a slug the catalog does not know. */
export const manifestOf = (slug: string | null | undefined): Manifest | undefined => (slug ? MANIFESTS[slug] : undefined);
