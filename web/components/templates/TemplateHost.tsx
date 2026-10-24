"use client";

import { KitRoot } from "@/lib/kit/KitRoot";
import { RENDERERS } from "@/lib/kit/generated/registry.client";
import type { TemplateSlug } from "./registry";
import type { TemplateProps } from "./types";

/**
 * Each template is client-only and its own chunk (generated registry). Server-rendering it would ship ~100 KB of
 * HTML for a page that is hidden behind the cover anyway (and hydrate it for nothing); the visitor gets the
 * template's loading wash at once. `KitRoot` is server-rendered: theme variables and the font preloads are in the
 * first HTML.
 */
export function TemplateHost({ slug, ...props }: TemplateProps & { slug: TemplateSlug }) {
  const Template = RENDERERS[slug];
  return (
    <KitRoot slug={slug} mode={props.mode} theme={props.invite?.theme}>
      <Template {...props} />
    </KitRoot>
  );
}
