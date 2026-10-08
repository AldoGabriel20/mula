import styles from "./section.module.css";

type Props = { eyebrow: string; title: string; paragraphs: string[] };

// Simple prose page for about / help / privacy / terms.
export function StaticPage({ eyebrow, title, paragraphs }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>
        <span />
        {eyebrow}
      </div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.prose}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export default StaticPage;
