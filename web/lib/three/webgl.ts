// Cheap capability probes — decide canvas vs. poster BEFORE loading three (~600 KB gzip).

export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

type NetInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Should the heavy 3D hero run on this device? (docs/04 per-breakpoint policy: desktop full,
 * tablet reduced, mobile = poster.) Decided up front so a phone never downloads three.js.
 *  - needs a fine pointer (desktop-class input; the MotionProvider's `fine`) AND a wide viewport
 *  - respects the data-saver flag and slow connections
 *  - skips very low-memory devices (navigator.deviceMemory, where exposed)
 */
export function canRunHeavy3D(fine: boolean): boolean {
  if (typeof window === "undefined") return false;
  if (!fine) return false; // touch-first devices → poster
  if (window.matchMedia("(max-width: 900px)").matches) return false; // narrow window → poster
  const nav = navigator as Navigator & { connection?: NetInfo; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)2g$|3g/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  return true;
}
