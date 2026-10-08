import { FEATURES } from "@/lib/marketing/content";
import styles from "./section.module.css";

export function FeatureShowcase() {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>
        <span />
        Features
      </div>
      <h1 className={styles.title}>Not just pretty templates. A complete invitation platform.</h1>
      <div className={styles.grid}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.card}>
            <h2 className={styles.cardTitle}>{f.title}</h2>
            <p className={styles.cardBody}>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureShowcase;
