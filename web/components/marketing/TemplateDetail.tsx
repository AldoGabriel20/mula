import Link from "next/link";
import { Button } from "@/components/ui";
import type { Template } from "@/lib/marketing/content";
import { paletteOf } from "./paletteSwatch";
import section from "./section.module.css";
import card from "./TemplateCard.module.css";

export function TemplateDetail({ t }: { t: Template }) {
  const pal = paletteOf(t.palette);
  return (
    <section className={section.section} style={{ display: "grid", gap: 32 }}>
      <div style={{ display: "grid", gap: 32, gridTemplateColumns: "minmax(0,1fr)", alignItems: "start" }}>
        <div className={card.preview} style={{ background: pal.bg, maxWidth: 420 }}>
          <span className={card.mono} style={{ color: pal.fg }}>{t.name}</span>
        </div>
        <div>
          <div className={section.eyebrow}>
            <span />
            {t.category}
          </div>
          <h1 className={section.title}>{t.name}</h1>
          <p className={section.lede}>
            A {t.style.toLowerCase()} design in {t.palette.toLowerCase()}. Each design is a starting point — change names,
            wording, palette and photos.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Link href="/register">
              <Button variant="primary">Use this design →</Button>
            </Link>
            <Link href="/templates">
              <Button variant="ghost">Back to all</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TemplateDetail;
