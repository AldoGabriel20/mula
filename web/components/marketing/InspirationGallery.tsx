import { INSPIRATION } from "@/lib/marketing/content";
import { paletteOf } from "./paletteSwatch";
import section from "./section.module.css";
import card from "./TemplateCard.module.css";

export function InspirationGallery() {
  return (
    <section className={section.section}>
      <div className={section.eyebrow}>
        <span />
        The Mula Journal
      </div>
      <h1 className={section.title}>Invitations, in the wild.</h1>
      <p className={section.lede}>Sample couples and hosts shown as placeholders.</p>
      <div className={section.grid}>
        {INSPIRATION.map((i) => {
          const pal = paletteOf(i.palette);
          return (
            <figure key={i.title} style={{ margin: 0, display: "grid", gap: 10 }}>
              <div className={card.preview} style={{ background: pal.bg }} />
              <figcaption>
                <div className={card.name}>{i.title}</div>
                <div className={card.meta}>{i.meta}</div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

export default InspirationGallery;
