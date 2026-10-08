"use client";

import { useState } from "react";
import styles from "./invite.module.css";

// One-tap copy for gift details (account numbers, wallet numbers, addresses).
export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* clipboard unavailable (insecure context): the value is visible next to the button */
    }
  };
  return (
    <button type="button" className={styles.btn} onClick={copy} aria-live="polite">
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export default CopyButton;
