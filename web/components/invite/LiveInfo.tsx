import type { InviteLive } from "@/lib/api/invite";
import styles from "./invite.module.css";

// Only http(s) links become anchors (the API also validates the stream URL on write).
const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : null);

// Shown only when the hosts allow it and the stream is not offline (the API omits `live` otherwise).
export function LiveInfo({ live, title = "Watch live" }: { live: InviteLive | null; title?: string }) {
  if (!live) return null;
  const href = safeHref(live.stream_url);
  const when = live.starts_at ? new Date(live.starts_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }) : "";
  return (
    <div className={styles.section}>
      <h2 className={styles.h2}>{title}</h2>
      <div className={styles.row}>
        <span>
          <span className={styles.rowTitle}>{live.status === "live" ? "Live now" : when ? `Starts ${when} UTC` : "Starting soon"}</span>
          <br />
          <b style={{ fontWeight: 600 }}>{live.provider || "Live stream"}</b>
        </span>
        {href && (
          <a className={styles.btn} href={href} target="_blank" rel="noopener noreferrer">
            Watch
          </a>
        )}
      </div>
    </div>
  );
}

export default LiveInfo;
