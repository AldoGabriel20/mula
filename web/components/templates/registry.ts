/**
 * Which template slugs have a renderer. Generated from each catalog manifest by
 * `make templates`; server-safe on purpose (no components here): pages decide with it, then hand the slug to
 * <TemplateHost>, the client-only loader. `templates.slug` is what the public invitation returns in `template`.
 */
export { TEMPLATE_SLUGS, hasLiveTemplate, type TemplateSlug } from "@/lib/kit/generated/registry";
