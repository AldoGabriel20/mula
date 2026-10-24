/** True when WebGL is missing or software-rendered (SwiftShader, llvmpipe…): use the static fallbacks. */
export function detectLowGL(): boolean {
  try {
    const cv = document.createElement("canvas");
    const gl = (cv.getContext("webgl2") || cv.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    const lose = gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
    return /swiftshader|llvmpipe|software|basic render|softpipe/i.test(name);
  } catch {
    return true;
  }
}

type NetInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Data-saver or a 2g connection: skip the three.js cover (an extension of the prototype, docs/15 §7.7).
 * Slow-connection users still get the whole page, just with the static cover card.
 */
export function preferLite(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: NetInfo }).connection;
  return !!(c?.saveData || (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)));
}
