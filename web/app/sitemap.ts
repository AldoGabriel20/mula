import type { MetadataRoute } from "next";
import { TEMPLATES, TIPS } from "@/components/landing/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://mula.id";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/features",
    "/pricing",
    "/templates",
    "/inspiration",
    "/tips",
    "/about",
    "/faq",
    "/help",
    "/contact",
    "/privacy",
    "/terms",
  ];
  const now = new Date();
  const pages = staticPaths.map((p) => ({ url: `${BASE}${p}`, lastModified: now }));
  const templates = TEMPLATES.map((t) => ({ url: `${BASE}/templates/${t.slug}`, lastModified: now }));
  const tips = TIPS.map((a) => ({ url: `${BASE}/tips/${a.slug}`, lastModified: now }));
  return [...pages, ...templates, ...tips];
}
