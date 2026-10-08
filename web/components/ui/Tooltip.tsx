"use client";

import { useId, useState } from "react";
import styles from "./Tooltip.module.css";

type Props = {
  label: string;
  children: React.ReactElement;
};

// Shows on hover and focus; links via aria-describedby for screen readers.
export function Tooltip({ label, children }: Props) {
  const [show, setShow] = useState(false);
  const id = useId();

  return (
    <span
      className={styles.wrap}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      aria-describedby={id}
    >
      {children}
      {show && (
        <span role="tooltip" id={id} className={styles.bubble}>
          {label}
        </span>
      )}
    </span>
  );
}

export default Tooltip;
