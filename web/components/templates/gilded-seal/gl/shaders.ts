// Shader sources, copied verbatim from the prototype (docs/15 §8.14). Do not "tidy" them.


/** Silk contour field: the backdrop shared by hero, date and closing. */
export const FRAG_CONTOUR = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer;
uniform vec3 uBase; uniform vec3 uLine; uniform float uAlpha; uniform vec3 uGlow; uniform float uGlowAmt; uniform float uScale; uniform float uVig;
float field(vec2 p, float t){
  return sin(p.x * 1.05 + t * .11) + sin(p.y * 1.35 - t * .09 + sin(p.x * .55 + t * .05)) + sin((p.x - p.y) * .78 + t * .06) + .85 * sin(length(p - vec2(1.3, .5)) * 1.6 - t * .15);
}
void main(){
  float asp = uRes.x / uRes.y;
  vec2 p = (vUv - .5) * vec2(asp, 1.) * uScale;
  float t = uTime;
  p += .37 * vec2(sin(p.y * .66 + t * .21), cos(p.x * .58 - t * .17));
  float v = field(p, t) * 2.5;
  float f = fract(v); float d = min(f, 1. - f);
  float line = 1. - smoothstep(0., fwidth(v) * 1.4, d);
  vec2 q = (vUv - (uPointer * .5 + .5)) * vec2(asp, 1.);
  float light = exp(-dot(q, q) * 3.2);
  vec3 col = mix(uBase, uGlow, light * uGlowAmt * .35);
  col = mix(col, uLine, line * uAlpha * (.55 + .45 * light));
  vec2 vq = (vUv - .5) * vec2(asp * .8, 1.);
  col *= 1. - uVig * dot(vq, vq);
  o = vec4(col, 1.);
}`;

/** Gilded burn: paper over the hero photograph dissolving top to bottom along a glowing front. */
export const FRAG_BURN = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uP; uniform vec3 uPaper; uniform vec3 uGold;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n(p); p *= 2.03; a *= .5; } return s; }
void main(){
  float asp = uRes.x / uRes.y;
  float nz = fbm(vUv * vec2(asp, 1.) * 4. + 3.1);
  float th = (1. - vUv.y) * .55 + nz * .45;
  float front = mix(-.12, 1.12, uP);
  float intact = smoothstep(front - .025, front + .025, th);
  float glow = clamp(4. * intact * (1. - intact), 0., 1.);
  vec3 col = uPaper - h(vUv * uRes) * .035;
  col = mix(col, uGold * 1.25, glow);
  float a = max(intact, glow * .85);
  o = vec4(col * a, a);
}`;
