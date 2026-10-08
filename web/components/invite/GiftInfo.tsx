import type { InviteGift, InviteMethod } from "@/lib/api/invite";
import { CopyButton } from "./CopyButton";
import styles from "./invite.module.css";

const idr = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Only http(s) links are rendered as anchors (the API also enforces this on write).
const safeHref = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

const KIND: Record<string, string> = { bank: "Bank account", wallet: "Digital wallet", physical: "Send a gift" };

export function GiftInfo({ gifts, methods = [], title = "With gratitude" }: { gifts: InviteGift[]; methods?: InviteMethod[]; title?: string }) {
  if (gifts.length === 0 && methods.length === 0) return null;
  return (
    <div className={styles.section}>
      <h2 className={styles.h2}>{title}</h2>
      {methods.map((m, i) => (
        <div key={`m-${m.title}-${i}`} className={styles.row}>
          <span>
            <span className={styles.rowTitle}>{KIND[m.type] || "Gift"}{m.detail ? ` · ${m.detail}` : ""}</span>
            <br />
            <b style={{ fontWeight: 600 }}>{m.title}</b>
            {m.copy_value && <span className={styles.rowTitle}> · {m.copy_value}</span>}
          </span>
          {m.copy_value && <CopyButton value={m.copy_value} />}
        </div>
      ))}
      {gifts.map((g, i) => {
        const href = safeHref(g.url);
        return (
          <div key={`${g.title}-${i}`} className={styles.row}>
            <span>
              <span className={styles.rowTitle}>{g.description || "Gift"}</span>
              <br />
              <b style={{ fontWeight: 600 }}>{g.title}</b>
              {g.target_amount != null && <span className={styles.rowTitle}> · {idr(g.target_amount)}</span>}
            </span>
            {href && (
              <a className={styles.btn} href={href} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default GiftInfo;
