import Link from "next/link";
import { ARTICLES } from "@/lib/marketing/content";
import styles from "./section.module.css";

export function ArticleList() {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>
        <span />
        Tips
      </div>
      <h1 className={styles.title}>Planning something beautiful.</h1>
      <p className={styles.lede}>Little things that make a big difference.</p>
      <div className={styles.grid}>
        {ARTICLES.map((a) => (
          <Link key={a.slug} href={`/tips/${a.slug}`} className={styles.card} style={{ textDecoration: "none", color: "inherit" }}>
            <h2 className={styles.cardTitle}>{a.title}</h2>
            <p className={styles.cardBody}>{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ArticleList;
