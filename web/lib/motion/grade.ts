"use client";

import { useEffect } from "react";

// Section colour grading (mula-fx.js lines 162-181): the root element's background
// crossfades to the data-bg colour of whichever [data-bg] section owns the viewport
// mid-line (innerHeight * 0.55). Pass a ref to the grading root.
export function useSectionGrade(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const secs = Array.from(root.querySelectorAll<HTMLElement>("[data-bg]"));
    if (!secs.length) return;

    // mula-fx.js scanBg(): sections go transparent so the root's crossfading colour shows through.
    secs.forEach((el) => (el.style.backgroundColor = "transparent"));
    root.style.transition = "background-color 1.1s cubic-bezier(.4,0,.2,1)";
    let cur = "";
    let raf = 0;

    const grade = () => {
      raf = 0;
      const mid = window.innerHeight * 0.55;
      for (const s of secs) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          const c = s.getAttribute("data-bg") || "";
          if (c && c !== cur) {
            cur = c;
            root.style.backgroundColor = c;
          }
          break;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(grade);
    };

    grade();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);
}
