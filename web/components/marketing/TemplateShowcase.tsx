"use client";

import { useMemo, useState } from "react";
import { Chip, Button, EmptyState } from "@/components/ui";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/marketing/content";
import { TemplateCard } from "./TemplateCard";
import section from "./section.module.css";

// Client gallery with category + featured filtering.
// ponytail: filters a static list; swap for GET /templates query when it exists.
export function TemplateShowcase() {
  const [cat, setCat] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const shown = useMemo(
    () => TEMPLATES.filter((t) => (cat === "All" || t.category === cat) && (!featuredOnly || t.featured)),
    [cat, featuredOnly],
  );

  return (
    <section className={section.section}>
      <div className={section.eyebrow}>
        <span />
        Templates
      </div>
      <h1 className={section.title}>Find the design that feels like you.</h1>
      <p className={section.lede}>Every design is composed in the Mula studio for a particular kind of celebration.</p>

      <div className={section.eyebrow} style={{ marginTop: 28, flexWrap: "wrap", textTransform: "none", letterSpacing: 0 }}>
        {TEMPLATE_CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
        <Chip active={featuredOnly} onClick={() => setFeaturedOnly((f) => !f)}>
          Featured
        </Chip>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title="Nothing matches yet"
          message="Try clearing filters."
          action={
            <Button size="sm" onClick={() => {
              setCat("All");
              setFeaturedOnly(false);
            }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className={section.grid}>
          {shown.map((t) => (
            <TemplateCard key={t.slug} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}

export default TemplateShowcase;
