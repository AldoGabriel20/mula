import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TipsPage } from "@/components/landing/pages/TipsPage";
import { TIPS } from "@/components/landing/data";

export function generateStaticParams() {
  return TIPS.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = TIPS.find((x) => x.slug === params.slug);
  return t ? { title: `${t.title} — Mula tips`, description: t.excerpt } : { title: "Tips — Mula" };
}

// The prototype keeps every tip on one page and opens the chosen one in place; /tips/<slug> is that
// same page with the tip already open.
export default function Page({ params }: { params: { slug: string } }) {
  if (!TIPS.some((t) => t.slug === params.slug)) notFound();
  return <TipsPage initialOpen={params.slug} />;
}
