/**
 * Arunika's painted artwork, generated (ported from the mock, docs/wedding-invitation.html): bouquets of roses,
 * hydrangeas, dahlias, orchids and callas, a calla sprig, the envelope pocket and a lake at golden hour with swans.
 * Each is a seeded, pure SVG string; the big ones are served as cached data URLs so a bouquet is one element on the
 * page (one raster, cheap to sway) instead of a few thousand SVG nodes. The wax seal stays inline: it prints the
 * couple's initials in the template's script font, which an SVG image cannot load.
 */
const NS = "http://www.w3.org/2000/svg";
const f = (n: number) => +n.toFixed(2);
type R = () => number;
function rng(seed: number): R {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pol = (r: number, a: number): [number, number] => [f(r * Math.cos(a)), f(r * Math.sin(a))];
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length)];
const url = (svg: string) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
const memo = new Map<string, string>();
const cached = (key: string, make: () => string) => memo.get(key) ?? (memo.set(key, make()), memo.get(key)!);

const DEFS = `<radialGradient id="gShade" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
<linearGradient id="gCalla" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2a0c29"/><stop offset=".55" stop-color="#4b1a49"/><stop offset="1" stop-color="#7a3b72"/></linearGradient>
<filter id="fDrop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.4" flood-color="#2b1a14" flood-opacity=".32"/></filter>`;

const ROSES = {
  burgundy: { base: "#3f0815", petals: ["#6a1226", "#7a1a2f", "#5a0d1f", "#842136"], inner: "#2e0410", edge: "#22030b" },
  wine: { base: "#4b0a18", petals: ["#861a2c", "#952436", "#701425", "#9e2d3d"], inner: "#3a0612", edge: "#2a040c" },
  blush: { base: "#9c6670", petals: ["#c4949b", "#d2a7ab", "#b48089", "#dab5b5"], inner: "#835058", edge: "#6f414a" },
};
type Rose = (typeof ROSES)["wine"];
const HYD = {
  pink: ["#c79aa0", "#b88790", "#d8b4b4", "#a77a86", "#e3cfc9", "#c7a9a4"],
  sage: ["#c7cfa6", "#b3bd8c", "#dfe0c6", "#a9b38a", "#e9e6d2", "#c3c8a0"],
  mauve: ["#9a6f86", "#b48aa0", "#c9a6b6", "#8c6a7c", "#d9c4c9"],
  antique: ["#b9a08a", "#a9b08a", "#c69a9a", "#8f9a6e", "#d6c3b0", "#b98f93"],
  white: ["#f1eee4", "#e6e4d6", "#f7f5ee", "#dfe2cf", "#ece6da"],
};

const leaf = (x: number, y: number, len: number, w: number, ang: number, col: string) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="M0 0 Q${f(w)} ${f(-len * 0.45)} 0 ${f(-len)} Q${f(-w)} ${f(-len * 0.5)} 0 0Z" fill="${col}"/><path d="M0 0 Q${f(w * 0.15)} ${f(-len * 0.5)} 0 ${f(-len * 0.92)}" stroke="rgba(25,35,10,.35)" stroke-width=".5" fill="none"/></g>`;

function rose(r: R, x: number, y: number, rad: number, p: Rose) {
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)})"><circle r="${f(rad * 1.02)}" fill="${p.base}"/>`;
  [[1, 6, 0.62], [0.8, 5, 0.7], [0.6, 5, 0.78], [0.42, 4, 0.9], [0.26, 3, 1.05]].forEach(([k, n, span], ri) => {
    const off = r() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = off + (i * 2 * Math.PI) / n, r1 = rad * k * 0.5, r2 = rad * k * 1.04;
      const [x1, y1] = pol(r1, a - span), [x2, y2] = pol(r1, a + span), [c1x, c1y] = pol(r2, a - span * 0.75), [c2x, c2y] = pol(r2, a + span * 0.75), [ix, iy] = pol(r1 * 0.45, a);
      const col = p.petals[(i + ri + Math.floor(r() * 2)) % p.petals.length];
      s += `<path d="M${x1} ${y1}C${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}Q${ix} ${iy} ${x1} ${y1}Z" fill="${col}" stroke="${p.edge}" stroke-width="${f(rad * 0.03)}" stroke-opacity=".6"/>`;
    }
  });
  return s + `<circle r="${f(rad * 0.13)}" fill="${p.inner}"/><circle r="${f(rad * 1.03)}" fill="url(#gShade)"/></g>`;
}
function hydrangea(r: R, x: number, y: number, rad: number, cols: string[]) {
  let s = `<g transform="translate(${f(x)} ${f(y)})">`;
  const n = Math.round(rad * rad * 0.1), pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, rr = Math.sqrt(t) * rad * 0.9, a = i * 2.39996 + r() * 0.3;
    pts.push([rr * Math.cos(a) + (r() - 0.5) * 2.5, rr * Math.sin(a) + (r() - 0.5) * 2.5]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  for (const [px, py] of pts) {
    const sz = rad * 0.17 * (0.8 + r() * 0.45), c = pick(r, cols);
    s += `<g transform="translate(${f(px)} ${f(py)}) rotate(${f(r() * 90)})"><circle r="${f(sz * 0.85)}" cx=".6" cy=".9" fill="#2a2018" opacity="${py > rad * 0.35 ? 0.16 : 0.06}"/>`;
    for (let k = 0; k < 4; k++) s += `<ellipse cx="${f(sz * 0.42)}" rx="${f(sz * 0.46)}" ry="${f(sz * 0.34)}" transform="rotate(${k * 90 + f((r() - 0.5) * 14)})" fill="${c}" stroke="rgba(70,50,50,.28)" stroke-width=".3"/>`;
    s += `<circle r="${f(sz * 0.11)}" fill="#e7dfbf"/></g>`;
  }
  return s + "</g>";
}
function dahlia(r: R, x: number, y: number, rad: number) {
  const cols = ["#3a1638", "#4f2350", "#62305f", "#2f0f2d", "#73406d"];
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)})">`;
  for (const [k, n] of [[1, 18], [0.78, 15], [0.55, 12], [0.33, 8]]) {
    for (let i = 0; i < n; i++) s += `<ellipse cx="${f(rad * k * 0.52)}" rx="${f(rad * k * 0.52)}" ry="${f(rad * 0.085 + rad * k * 0.03)}" transform="rotate(${f((i * 360) / n + r() * 8)})" fill="${pick(r, cols)}" stroke="#1d071c" stroke-width=".25" stroke-opacity=".6"/>`;
  }
  return s + `<circle r="${f(rad * 0.14)}" fill="#24091f"/><circle r="${f(rad)}" fill="url(#gShade)" opacity=".7"/></g>`;
}
function orchid(r: R, x: number, y: number, rad: number) {
  const c = pick(r, ["#8e5a8f", "#9c6b98", "#7d4a7c"]);
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)})">`;
  for (let i = 0; i < 5; i++) s += `<ellipse cx="${f(rad * 0.5)}" rx="${f(rad * 0.55)}" ry="${f(rad * (i % 2 ? 0.3 : 0.4))}" transform="rotate(${i * 72})" fill="${c}" stroke="#4a2347" stroke-width=".3" stroke-opacity=".5"/>`;
  return s + `<circle r="${f(rad * 0.22)}" fill="#5b2650"/><circle r="${f(rad * 0.08)}" fill="#e7d68a"/></g>`;
}
function calla(r: R, x0: number, y0: number, len: number, ang: number, sc = 1) {
  const a = ((ang - 90) * Math.PI) / 180, ex = x0 + len * Math.cos(a), ey = y0 + len * Math.sin(a);
  const bend = (r() - 0.5) * len * 0.35, mx = (x0 + ex) / 2 + bend * Math.cos(a + Math.PI / 2), my = (y0 + ey) / 2 + bend * Math.sin(a + Math.PI / 2);
  const d = `M${f(x0)} ${f(y0)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`;
  return `<path d="${d}" stroke="#5f7a34" stroke-width="${f(1.7 * sc)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#a7bf6a" stroke-width="${f(0.5 * sc)}" fill="none" opacity=".6"/><g transform="translate(${f(ex)} ${f(ey)}) rotate(${f(ang + (r() - 0.5) * 25)}) scale(${f(sc)})"><path d="M0 2C-3 -4 -7.5 -14 -5.5 -24C-4.5 -29.5 1 -33.5 5.5 -31.5C3 -27 4.2 -20 6.2 -14C7.4 -8 3.4 -2 0 2Z" fill="url(#gCalla)"/><path d="M-5 -23.5C-2 -29 2.5 -31.5 5.5 -31.5" stroke="#a46a9c" stroke-width=".7" fill="none"/><path d="M-.6 -6L-1.8 -17" stroke="#d1b860" stroke-width="1.3" stroke-linecap="round" opacity=".85"/></g>`;
}
function amaranth(r: R, x0: number, y0: number, len: number, sway: number) {
  let s = "";
  const steps = Math.round(len / 2), cols = ["#9fae58", "#8fa04c", "#b3bf6c", "#7e8f40", "#a8b660"];
  for (let i = 0; i < steps; i++) {
    const t = i / steps, x = x0 + sway * Math.sin(t * Math.PI * 0.9) * t + (r() - 0.5) * 1.3, y = y0 + t * len, rad = 2.3 * (1 - t * 0.62);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${pick(r, cols)}"/><circle cx="${f(x + (r() - 0.5) * 2)}" cy="${f(y + 0.8)}" r="${f(rad * 0.7)}" fill="${pick(r, cols)}"/>`;
  }
  return s;
}
function gyp(r: R, x: number, y: number, n: number, spread = 16) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const cx = x + (r() - 0.5) * spread, cy = y + (r() - 0.5) * spread;
    s += `<path d="M${f(x)} ${f(y)}L${f(cx)} ${f(cy)}" stroke="#9aa77a" stroke-width=".3"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(0.9 + r() * 0.9)}" fill="#f8f6ef" stroke="#cfc8b5" stroke-width=".25"/>`;
  }
  return s;
}
function berries(r: R, x: number, y: number, n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += `<circle cx="${f(x + (r() - 0.5) * 14)}" cy="${f(y + (r() - 0.5) * 14)}" r="${f(2.4 + r() * 1.6)}" fill="${pick(r, ["#2e0816", "#3d0c1d", "#4a1426"])}" stroke="#1a030a" stroke-width=".3"/>`;
  return s;
}

export type BouquetOpts = { flip?: boolean; callaAng?: number; hang?: number; hangLen?: number; callas?: number; white?: boolean; orchid?: boolean };

/** A hand-tied bouquet (viewBox 200 × 240), as a CSS `url()`. */
export function bouquet(seed: number, o: BouquetOpts = {}) {
  return cached(`b${seed}${JSON.stringify(o)}`, () => {
    const r = rng(seed), cx = 100, cy = 100, J = () => (r() - 0.5) * 8;
    let s = "";
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + r() * 0.4, [lx, ly] = pol(26 + r() * 10, a);
      s += leaf(cx + lx, cy + ly, 32 + r() * 22, 7 + r() * 4, (a * 180) / Math.PI + 90, pick(r, ["#5d6b3a", "#6e7c45", "#4f5c30", "#7d8a50"]));
    }
    for (let i = 0; i < (o.hang ?? 3); i++) s += amaranth(r, cx - 26 + r() * 52, cy + 12 + r() * 10, (30 + r() * 34) * (o.hangLen || 1), (r() - 0.5) * 18);
    const cn = o.callas ?? 2;
    for (let i = 0; i < cn; i++) s += calla(r, cx + (r() - 0.5) * 12, cy - 4, 42 + r() * 24, (o.callaAng ?? -35) + (i - (cn - 1) / 2) * 18 + (r() - 0.5) * 10, 0.95 + r() * 0.2);
    for (let i = 0; i < 6; i++) {
      const [gx, gy] = pol(34 + r() * 10, r() * Math.PI * 2);
      s += gyp(r, cx + gx, cy + gy, 9);
    }
    s += hydrangea(r, cx - 22 + J(), cy - 4 + J(), 25, HYD.pink);
    s += hydrangea(r, cx + 24 + J(), cy + 6 + J(), 23, o.white ? HYD.white : HYD.sage);
    s += hydrangea(r, cx + 2 + J(), cy + 26 + J(), 19, HYD.antique);
    s += hydrangea(r, cx + 12 + J(), cy - 22 + J(), 15, HYD.mauve);
    s += dahlia(r, cx + 30 + J(), cy + 28 + J(), 12) + dahlia(r, cx - 30 + J(), cy + 22 + J(), 10);
    s += berries(r, cx - 16, cy - 26, 4) + berries(r, cx + 34, cy - 6, 3);
    s += rose(r, cx - 6 + J(), cy - 2 + J(), 16, ROSES.burgundy);
    s += rose(r, cx + 18 + J(), cy + 20 + J(), 13, ROSES.wine);
    s += rose(r, cx - 24 + J(), cy + 14 + J(), 11.5, ROSES.burgundy);
    s += rose(r, cx + 22 + J(), cy - 14 + J(), 9.5, r() > 0.5 ? ROSES.blush : ROSES.wine);
    s += rose(r, cx - 34 + J(), cy - 6 + J(), 8.5, ROSES.wine) + rose(r, cx + 6 + J(), cy + 30 + J(), 9, ROSES.burgundy);
    if (o.orchid !== false) s += orchid(r, cx + 36 + J(), cy + 10 + J(), 7) + orchid(r, cx - 36 + J(), cy - 8 + J(), 6) + orchid(r, cx + 6, cy + 40 + J(), 6);
    for (let i = 0; i < 5; i++) {
      const [gx, gy] = pol(18 + r() * 20, r() * Math.PI * 2);
      s += gyp(r, cx + gx, cy + gy, 6, 12);
    }
    const flip = o.flip ? `transform="translate(200 0) scale(-1 1)"` : "";
    return url(`<svg xmlns="${NS}" width="400" height="480" viewBox="0 0 200 240"><defs>${DEFS}</defs><g ${flip}><g filter="url(#fDrop)"><g transform="translate(100 96) scale(1.42) translate(-100 -100)">${s}</g></g></g></svg>`);
  });
}

/** Three callas and two leaves leaning over the envelope (viewBox 240 × 130). */
export const sprig = () =>
  cached("sprig", () => {
    const r = rng(4);
    let s = "";
    [[-58, 150], [-50, 138], [-66, 126]].forEach(([a, l], i) => (s += calla(r, 214 - i * 4, 112 + i * 2, l, a, 1.6)));
    s += leaf(170, 96, 30, 6, -70, "#6e7c45") + leaf(178, 100, 24, 5, -48, "#5d6b3a");
    return url(`<svg xmlns="${NS}" width="480" height="260" viewBox="0 0 240 130"><defs>${DEFS}</defs><g filter="url(#fDrop)">${s}</g></svg>`);
  });

function treeClumps(r: R, x0: number, x1: number, base: number, maxH: number, count: number, light: string[], dark: string[], dots = 46) {
  let s = "";
  for (let c = 0; c < count; c++) {
    const cx = x0 + r() * (x1 - x0), h = maxH * (0.45 + r() * 0.55), w = h * (0.55 + r() * 0.45), top = base - h;
    for (let i = 0; i < dots; i++) {
      const t = Math.pow(r(), 0.8), yy = top + t * h, spread = w * (0.25 + 0.75 * Math.sin((Math.min(1, t * 1.4) * Math.PI) / 2));
      const x = cx + (r() - 0.5) * spread, rad = 2.2 + r() * 5.2 * (0.6 + t * 0.6);
      const lit = (x < cx - spread * 0.05 && t < 0.55) || r() < 0.12;
      s += `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(rad)}" fill="${pick(r, lit ? light : dark)}"/>`;
    }
  }
  return s;
}
const swan = (x: number, y: number, k: number, dir = 1) =>
  `<g transform="translate(${x} ${y}) scale(${k * dir} ${k})"><ellipse cx="0" cy="3.2" rx="15" ry="2" fill="#000" opacity=".12"/><g transform="translate(0 5.8) scale(1 -1)" opacity=".28"><path d="M-14 0C-16 -6 -8 -9 0 -8C6 -8 10 -6 12 -2C13 1 8 3 0 3C-8 3 -13 2 -14 0Z" fill="#f4f2ec"/><path d="M9 -4C13.5 -10 9 -16 11 -22" stroke="#f4f2ec" stroke-width="2.4" fill="none"/></g><path d="M-14 0C-16 -6 -8 -9 0 -8C6 -8 10 -6 12 -2C13 1 8 3 0 3C-8 3 -13 2 -14 0Z" fill="#f4f2ec"/><path d="M-12 -2C-6 -10 4 -9.5 8 -4C2 -5.5 -6 -4.5 -12 -2Z" fill="#dedad0"/><path d="M9 -4C13.5 -10 9 -16 11 -22C12 -26.5 16 -26.5 17 -23.5" stroke="#f4f2ec" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="17" cy="-23.5" rx="2.3" ry="1.6" fill="#f4f2ec"/><path d="M18.5 -24.6L22.8 -22.6L18.6 -22.2Z" fill="#d46a2a"/><circle cx="18.6" cy="-23.8" r=".75" fill="#1f1f1f"/></g>`;

/** A painted lake at golden hour (400 × 260): wooded banks, their reflection, mist and three swans. */
export const lake = () =>
  cached("lake", () => {
    const r = rng(5);
    const light = ["#7d8a5c", "#8c9868", "#71804f", "#99a274"], dark = ["#3b4629", "#46522f", "#2f3a22", "#55613b", "#4c5834"];
    const back = treeClumps(r, 90, 330, 140, 46, 14, ["#9aa58c", "#a7b099", "#8f9b80"], ["#7f8b70", "#87927a"], 30);
    const left = treeClumps(r, -20, 150, 152, 118, 13, light, dark) + treeClumps(r, -30, 60, 152, 140, 4, light, dark);
    const right = treeClumps(r, 265, 420, 152, 104, 11, light, dark) + treeClumps(r, 350, 430, 152, 128, 3, light, dark);
    const reeds = Array.from({ length: 40 }, () => {
      const x = r() * 140 - 10, h = 6 + r() * 12;
      return `<path d="M${f(x)} 154q${f((r() - 0.5) * 3)} ${f(-h / 2)} ${f((r() - 0.5) * 4)} ${f(-h)}" stroke="${pick(r, ["#6c7a42", "#8a9556", "#55623a"])}" stroke-width=".7" fill="none"/>`;
    }).join("");
    return url(`<svg xmlns="${NS}" width="1200" height="780" viewBox="0 0 400 260"><defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdd3cc"/><stop offset=".55" stop-color="#eee6d8"/><stop offset="1" stop-color="#e2d6c2"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc9b8"/><stop offset=".4" stop-color="#9ca796"/><stop offset="1" stop-color="#55634f"/></linearGradient>
<radialGradient id="sun" cx="58%" cy="56%" r="40%"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".75"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/></radialGradient>
<filter id="b1" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="5"/><feGaussianBlur stdDeviation=".55"/></filter>
<filter id="b3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter>
<filter id="rf" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6 3.5"/></filter>
<filter id="nz"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .35  0 0 0 0 .3  0 0 0 .9 0"/></filter>
<clipPath id="cw"><rect y="151" width="400" height="110"/></clipPath></defs>
<rect width="400" height="260" fill="url(#s)"/><rect width="400" height="260" fill="url(#sun)"/>
<ellipse cx="220" cy="80" rx="140" ry="44" fill="#f7efe0" opacity=".6" filter="url(#b3)"/>
<g filter="url(#b3)" opacity=".85">${back}</g><g id="tl" filter="url(#b1)">${left}</g><g id="tr" filter="url(#b1)">${right}</g>
<path d="M-5 148C60 144 120 152 190 149C260 146 330 152 405 147V156H-5Z" fill="#5a663f" filter="url(#b3)"/>
<rect y="151" width="400" height="109" fill="url(#w)"/>
<g clip-path="url(#cw)"><g transform="translate(0 303) scale(1 -1)" opacity=".5" filter="url(#rf)"><use href="#tl"/><use href="#tr"/></g></g>
<ellipse cx="232" cy="176" rx="70" ry="9" fill="#ffe4b8" opacity=".35" filter="url(#b3)"/>
<g filter="url(#b1)">${reeds}</g>
<g stroke="#f6f0e2" stroke-linecap="round" opacity=".38" filter="url(#b3)"><path d="M150 172H240" stroke-width="1.6"/><path d="M110 184H200" stroke-width="1.2"/><path d="M210 198H310" stroke-width="1.2"/><path d="M50 216H160" stroke-width="1"/><path d="M240 232H350" stroke-width="1"/></g>
${swan(150, 208, 1.3, 1)}${swan(232, 191, 1, -1)}${swan(322, 224, 1.5, -1)}
<rect width="400" height="260" filter="url(#nz)" opacity=".13"/></svg>`);
  });

/** The envelope's front pocket (300 × 200, stretched), as inline SVG markup; the colours are CSS values (variables work). */
export const pocket = (body: string, lip: string) =>
  `<svg xmlns="${NS}" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0L148 104Q150 106 152 104L300 0V200H0Z" style="fill:${body}"/><path d="M0 0L146 106Q150 108 154 106L300 0" fill="none" stroke="#000" stroke-opacity=".18"/><path d="M0 200L146 90Q150 87 154 90L300 200Z" style="fill:${lip}"/><path d="M0 200L146 90Q150 87 154 90L300 200" fill="none" stroke="#fff" stroke-opacity=".14"/><path d="M0 200L146 90Q150 87 154 90L300 200" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2" transform="translate(0 -1.5)"/></svg>`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
/** A burgundy wax seal with the couple's initials pressed in, as inline SVG markup (viewBox 100). */
export function seal(seed: number, a: string, b: string) {
  const r = rng(seed);
  let d = "";
  for (let i = 0; i <= 26; i++) {
    const [x, y] = pol(46 + (r() - 0.5) * 5 + (i % 3 === 0 ? 2 : 0), (i / 26) * Math.PI * 2);
    d += `${i ? "L" : "M"}${f(50 + x)} ${f(50 + y)}`;
  }
  const g = `ws${seed}`;
  const A = esc(a), B = esc(b);
  return `<svg xmlns="${NS}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><radialGradient id="${g}a" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#9a3a50"/><stop offset=".45" stop-color="#6d1d30"/><stop offset="1" stop-color="#3a0814"/></radialGradient><radialGradient id="${g}b" cx="55%" cy="60%" r="70%"><stop offset="0" stop-color="#7c2539"/><stop offset="1" stop-color="#521122"/></radialGradient></defs><path d="${d}Z" fill="url(#${g}a)" stroke="#3a0814" stroke-width=".8" stroke-linejoin="round"/><circle cx="50" cy="50" r="33" fill="url(#${g}b)" stroke="#3a0814" stroke-opacity=".6" stroke-width="1.6"/><circle cx="50" cy="50" r="31" fill="none" stroke="#b05468" stroke-opacity=".55" stroke-width=".8"/><g style="font-family:var(--k-font-script)" font-size="36" text-anchor="middle"><text x="44.6" y="59.6" fill="#b05468" opacity=".7">${A}</text><text x="44" y="59" fill="#3f0a17">${A}</text><text x="57.6" y="65.6" fill="#b05468" opacity=".7">${B}</text><text x="57" y="65" fill="#3f0a17">${B}</text></g><ellipse cx="36" cy="28" rx="13" ry="6" fill="#fff" opacity=".16" transform="rotate(-30 36 28)"/></svg>`;
}
