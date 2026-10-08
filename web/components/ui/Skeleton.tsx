import styles from "./Skeleton.module.css";

type Props = {
  width?: string | number;
  height?: string | number;
  lines?: number;
};

// Loading placeholder. `lines` renders a stack (last line shortened).
export function Skeleton({ width = "100%", height = 16, lines = 1 }: Props) {
  if (lines > 1) {
    return (
      <div className={styles.lines} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={styles.skel}
            style={{ width: i === lines - 1 ? "60%" : "100%", height }}
          />
        ))}
      </div>
    );
  }
  return <span className={styles.skel} style={{ display: "block", width, height }} aria-hidden="true" />;
}

export default Skeleton;
