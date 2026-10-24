import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateHost } from "@/components/templates/TemplateHost";
import { TEMPLATE_SLUGS, hasLiveTemplate } from "@/components/templates/registry";
import { manifestOf } from "@/lib/kit/manifest";

// The live demo of a template (landing page): the prototype's sample content, nothing is sent
// anywhere. Rendered outside the marketing chrome so the template owns the whole viewport.
export function generateStaticParams() {
  return TEMPLATE_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const name = manifestOf(params.slug)?.name ?? "Template";
  return { title: `${name} — live demo · Mula`, description: `A live demo of the ${name} invitation.`, robots: { index: false, follow: true } };
}

export default function DemoPage({ params }: { params: { slug: string } }) {
  if (!hasLiveTemplate(params.slug)) notFound();
  return <TemplateHost slug={params.slug} mode="demo" />;
}
