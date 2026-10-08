"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "@/lib/motion";
import { canRunHeavy3D, hasWebGL, type InvitationHandle } from "@/lib/three";
import styles from "./InvitationCanvas.module.css";

type Props = {
  mode?: "hero" | "float";
  onPhase?: (name: string) => void;
};

// Lazily mounts the three.js invitation on capable, desktop-class, motion-OK devices. Otherwise
// (reduced motion / touch or narrow / data-saver / no WebGL / load failure) it keeps the poster. The
// wrapper's fixed aspect-ratio means no layout shift either way.
export function InvitationCanvas({ mode = "hero", onPhase }: Props) {
  const { reduce, fine } = useMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false); // card materialized → fade poster out

  useEffect(() => {
    // Decide BEFORE importing three: reduced motion, no WebGL, touch/narrow/low-end/data-saver
    // devices all keep the poster and never download the 3D bundle (docs/04: mobile = poster).
    if (reduce || !fine || !hasWebGL() || !canRunHeavy3D(fine)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: InvitationHandle | null = null;
    let cancelled = false;

    import("@/lib/three/invitation")
      .then(({ mountInvitation }) =>
        mountInvitation(canvas, {
          mode,
          onPhase: (name) => {
            if (name === "ready") setReady(true);
            onPhase?.(name);
          },
        }),
      )
      .then((h) => {
        if (cancelled) h.destroy();
        else handle = h;
      })
      .catch(() => {
        /* WebGL/load failure → poster stays */
      });

    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, [reduce, fine, mode, onPhase]);

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={`${styles.poster} ${ready ? styles.posterHidden : ""}`} role="img" aria-label="Wedding invitation of Raka & Celine">
        <div className={styles.posterArch}>
          <span className={styles.posterMono}>R &amp; C</span>
        </div>
      </div>
    </div>
  );
}

export default InvitationCanvas;
