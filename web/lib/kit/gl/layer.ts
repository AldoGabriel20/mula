/** Full-screen triangle vertex shader shared by every fragment layer. */
export const VERT = `#version 300 es
in vec2 p; out vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

export type Uniforms = Record<string, number | [number, number] | [number, number, number]>;

export type GlLayer = {
  uniforms: Uniforms;
  render(extra?: Uniforms): void;
  destroy(): void;
};

/**
 * A full-screen WebGL2 triangle running `frag` (prototype `makeLayer`). Returns null when WebGL2 or
 * the shader is unavailable: callers fall back to the static CSS background. `dpr` scales the
 * backing store (the contour layers render at .6–.7 of device resolution on purpose).
 */
export function makeLayer(canvas: HTMLCanvasElement | null, frag: string, uniforms: Uniforms, dpr = 1): GlLayer | null {
  if (!canvas) return null;
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false });
  } catch {
    /* no context */
  }
  if (!gl) return null;
  const g = gl;
  try {
    const sh = (type: number, src: string) => {
      const s = g.createShader(type)!;
      g.shaderSource(s, src);
      g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader compile failed");
      return s;
    };
    const prog = g.createProgram()!;
    g.attachShader(prog, sh(g.VERTEX_SHADER, VERT));
    g.attachShader(prog, sh(g.FRAGMENT_SHADER, frag));
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog) ?? "program link failed");
    const vao = g.createVertexArray();
    g.bindVertexArray(vao);
    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(prog, "p");
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    const locs: Record<string, WebGLUniformLocation | null> = {};
    const U = (n: string) => (n in locs ? locs[n] : (locs[n] = g.getUniformLocation(prog, n)));
    return {
      uniforms: { ...uniforms },
      render(extra) {
        const rr = Math.min(2, (window.devicePixelRatio || 1) * dpr);
        const w = Math.max(1, Math.round(canvas.clientWidth * rr));
        const h = Math.max(1, Math.round(canvas.clientHeight * rr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        Object.assign(this.uniforms, extra || {});
        g.viewport(0, 0, w, h);
        g.useProgram(prog);
        g.bindVertexArray(vao);
        g.uniform2f(U("uRes"), w, h);
        for (const [k, v] of Object.entries(this.uniforms)) {
          const l = U(k);
          if (!l) continue;
          if (typeof v === "number") g.uniform1f(l, v);
          else if (v.length === 2) g.uniform2f(l, v[0], v[1]);
          else g.uniform3f(l, v[0], v[1], v[2]);
        }
        g.clearColor(0, 0, 0, 0);
        g.clear(g.COLOR_BUFFER_BIT);
        g.drawArrays(g.TRIANGLES, 0, 3);
      },
      destroy() {
        const e = g.getExtension("WEBGL_lose_context");
        if (e) e.loseContext();
      },
    };
  } catch (e) {
    console.warn("shader layer failed", e);
    return null;
  }
}
