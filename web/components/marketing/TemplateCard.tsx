import Link from "next/link";
import type { Template } from "@/lib/marketing/content";
import { paletteOf } from "./paletteSwatch";
import styles from "./TemplateCard.module.css";

export function TemplateCard({ t }: { t: Template }) {
  const pal = paletteOf(t.palette);
  const initials = t.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join(" & ");
  return (
    <Link href={`/templates/${t.slug}`} className={styles.card}>
      <div className={styles.preview} style={{ background: pal.bg }}>
        <span className={styles.mono} style={{ color: pal.fg }}>{initials}</span>
      </div>
      <span className={styles.name}>{t.name}</span>
      <span className={styles.meta}>
        {t.category} · {t.style} · {t.palette}
      </span>
    </Link>
  );
}

export default TemplateCard;
