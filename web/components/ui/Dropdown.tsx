"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Dropdown.module.css";

export type MenuItem = { label: string; onSelect: () => void };

type Props = {
  trigger: React.ReactNode;
  items: MenuItem[];
  label?: string; // accessible name for the trigger
};

export function Dropdown({ trigger, items, label = "Open menu" }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)}>
        {trigger}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                it.onSelect();
                setOpen(false);
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
