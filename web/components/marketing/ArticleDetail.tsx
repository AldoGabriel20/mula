import Link from "next/link";
import { Button } from "@/components/ui";
import type { Article } from "@/lib/marketing/content";
import styles from "./section.module.css";

export function ArticleDetail({ article }: { article: Article }) {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>
        <span />
        Tips
      </div>
      <h1 className={styles.title}>{article.title}</h1>
      <div className={styles.prose}>
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
        <Link href="/register">
          <Button variant="primary">Put it into practice →</Button>
        </Link>
        <Link href="/tips">
          <Button variant="ghost">More tips</Button>
        </Link>
      </div>
    </section>
  );
}

export default ArticleDetail;
