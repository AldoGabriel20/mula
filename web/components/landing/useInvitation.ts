"use client";

import { useEffect, useRef, useState } from "react";
import { hasWebGL } from "@/lib/three";
import type { InvitationHandle, MountOpts } from "@/lib/three";

// The prototype mounts the 3D card on every device; we only skip it where it cannot work or
// would hurt (no WebGL, data-saver, 2g/3g). Skipped/failed → `failed` flips so the caller can
// show the InviteScreen fallback. three itself only loads through this dynamic import.
function allowed() {
  if (!hasWebGL()) return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (c?.saveData) return false;
  if (c?.effectiveType && /(^|-)2g$|3g/.test(c.effectiveType)) return false;
  return true;
}

export function useInvitation(canvas: React.RefObject<HTMLCanvasElement | null>, opts: () => MountOpts) {
  const handle = useRef<InvitationHandle | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    if (!allowed()) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    import("@/lib/three/invitation")
      .then(({ mountInvitation }) => mountInvitation(el, optsRef.current()))
      .then((h) => {
        if (cancelled) h.destroy();
        else handle.current = h;
      })
      .catch((e) => {
        console.warn("Mula 3D unavailable", e);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      handle.current?.destroy();
      handle.current = null;
    };
  }, [canvas]);

  return { handle, failed };
}
