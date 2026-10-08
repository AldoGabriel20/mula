import styles from "./grain.module.css";

// Whole-page film-grain overlay. One GPU-composited fixed layer, no per-frame JS.
// Animation self-disables under reduced-motion (see grain.module.css).
export function Grain() {
  return <div className={styles.grain} aria-hidden="true" data-testid="grain" />;
}

export default Grain;
