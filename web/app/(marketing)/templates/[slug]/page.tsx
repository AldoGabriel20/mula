import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplatePage } from "@/components/landing/pages/TemplatePage";
import { BY_SLUG, TEMPLATES } from "@/components/landing/data";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = BY_SLUG[params.slug];
  return t
    ? { title: `${t.name} — Mula`, description: t.desc }
    : { title: "Template — Mula" };
}

export default function Page({ params }: { params: { slug: string } }) {
  if (!BY_SLUG[params.slug]) notFound();
  return <TemplatePage slug={params.slug} />;
}
