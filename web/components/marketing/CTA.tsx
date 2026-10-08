import Link from "next/link";
import { Button } from "@/components/ui";
import styles from "./section.module.css";

type Props = { href?: string; label?: string; title?: string };

// Conversion band reused at the foot of marketing pages.
export function CTA({ href = "/register", label = "Start your next beginning", title = "Mula is made to celebrate what begins from here." }: Props) {
  return (
    <section className={styles.section} style={{ textAlign: "center" }}>
      <h2 className={styles.title} style={{ marginInline: "auto" }}>
        {title}
      </h2>
      <div style={{ marginTop: 28 }}>
        <Link href={href}>
          <Button variant="primary">{label} →</Button>
        </Link>
      </div>
    </section>
  );
}

export default CTA;
