"use client";

import { useTheme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

// Sun/moon glyphs copied from the prototype icon set (dashboard-admin-prototype).
const SUN =
  "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4";
const MOON = "M16 12.5A6.5 6.5 0 0 1 7.5 4 6.5 6.5 0 1 0 16 12.5Z";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  // Show the icon of the theme you'd switch TO (prototype: sun while dark, moon while light).
  const d = resolved === "dark" ? SUN : MOON;

  return (
    <button type="button" className={styles.btn} onClick={toggle} aria-label="Switch light or dark">
      <svg className={styles.ic} viewBox="0 0 20 20">
        <path d={d} />
      </svg>
    </button>
  );
}

export default ThemeToggle;
