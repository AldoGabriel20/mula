/* Mula — 3D invitation object (three.js), ported from the prototype mula-3d.js.
 * Logic preserved verbatim; only the THREE import is swapped to the bundled module.
 * mountInvitation(canvas, { mode:'hero'|'float', layout(w,h)=>{x,y,s,rot}, onPhase(name) })
 */
import * as THREE from "three";
import { FONT } from "./fonts";

type Ctx = CanvasRenderingContext2D;
type Layout = { x: number; y: number; s: number; rot: number };
export type MountOpts = {
  mode?: "hero" | "float";
  layout?: (w: number, h: number) => Partial<Layout>;
  onPhase?: (name: string) => void;
};
export type InvitationHandle = {
  setScroll(p: number): void;
  relayout(): void;
  destroy(): void;
};


// Canvas 2D font shorthand built from the REAL (hashed) next/font family names, so the card is
// drawn in the loaded typefaces — not whatever generic fallback the visitor's OS provides.
type Fam = "bodoni" | "cormorant" | "manrope";
const FALLBACK: Record<Fam, string> = { bodoni: "serif", cormorant: "serif", manrope: "sans-serif" };
const face = (style: "normal" | "italic", weight: number, px: number, fam: Fam) =>
  `${style} ${weight} ${px}px ${FONT[fam]}, ${FALLBACK[fam]}`;

const PW = 1.9,
  PH = 2.7,
  PD = 0.018;
const TW = 1024,
  TH = Math.round((1024 * PH) / PW);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

type DrawSet = {
  col: HTMLCanvasElement;
  orm: HTMLCanvasElement;
  bump: HTMLCanvasElement;
  mask: HTMLCanvasElement;
  ink(fn: (c: Ctx) => void, color?: string): void;
  foil(fn: (c: Ctx) => void): void;
  blind(fn: (c: Ctx) => void): void;
};

function makeSet(base: string): DrawSet {
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = TW;
    c.height = TH;
    return c;
  };
  const col = mk(),
    orm = mk(),
    bump = mk(),
    mask = mk();
  const cc = col.getContext("2d")!,
    oc = orm.getContext("2d")!,
    bc = bump.getContext("2d")!,
    mc = mask.getContext("2d")!;
  cc.fillStyle = base;
  cc.fillRect(0, 0, TW, TH);
  oc.fillStyle = "rgb(0,215,0)";
  oc.fillRect(0, 0, TW, TH);
  bc.fillStyle = "rgb(128,128,128)";
  bc.fillRect(0, 0, TW, TH);
  for (const [ctx, amt] of [
    [cc, 7],
    [bc, 22],
  ] as [Ctx, number][]) {
    const img = ctx.getImageData(0, 0, TW, TH),
      d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amt;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }
  const gold = cc.createLinearGradient(0, 0, TW, TH);
  gold.addColorStop(0, "#9C7740");
  gold.addColorStop(0.35, "#E6CD94");
  gold.addColorStop(0.55, "#B48E52");
  gold.addColorStop(0.8, "#EBD6A4");
  gold.addColorStop(1, "#8F6C3A");
  return {
    col,
    orm,
    bump,
    mask,
    ink(fn, color = "#3A2F27") {
      cc.save();
      cc.fillStyle = cc.strokeStyle = color;
      fn(cc);
      cc.restore();
      bc.save();
      bc.fillStyle = bc.strokeStyle = "rgb(108,108,108)";
      fn(bc);
      bc.restore();
    },
    foil(fn) {
      cc.save();
      cc.fillStyle = cc.strokeStyle = gold;
      fn(cc);
      cc.restore();
      oc.save();
      oc.fillStyle = oc.strokeStyle = "rgb(0,70,255)";
      fn(oc);
      oc.restore();
      bc.save();
      bc.fillStyle = bc.strokeStyle = "rgb(205,205,205)";
      fn(bc);
      bc.restore();
      mc.save();
      mc.fillStyle = mc.strokeStyle = "#fff";
      fn(mc);
      mc.restore();
    },
    blind(fn) {
      bc.save();
      bc.fillStyle = bc.strokeStyle = "rgb(190,190,190)";
      fn(bc);
      bc.restore();
    },
  };
}

function spaced(ctx: Ctx, text: string, cx: number, y: number, sp: number) {
  const chars = [...text];
  const w = chars.reduce((a, ch) => a + ctx.measureText(ch).width, 0) + sp * (chars.length - 1);
  let x = cx - w / 2;
  ctx.textAlign = "left";
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + sp;
  }
}
function arch(ctx: Ctx, cx: number, top: number, w: number, bottom: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(cx - r, bottom);
  ctx.lineTo(cx - r, top + r);
  ctx.arc(cx, top + r, r, Math.PI, 0);
  ctx.lineTo(cx + r, bottom);
  ctx.stroke();
}

function drawRight(S: DrawSet) {
  S.ink((c) => {
    c.font = face("normal", 500, 26, "manrope");
    spaced(c, "THE WEDDING OF", TW / 2, 230, 9);
  }, "#6B5A48");
  S.foil((c) => {
    c.lineWidth = 3;
    arch(c, TW / 2, 300, 580, 1010);
    c.lineWidth = 1.4;
    arch(c, TW / 2, 322, 536, 990);
  });
  S.foil((c) => {
    c.textAlign = "center";
    c.font = face("italic", 400, 156, "bodoni");
    c.fillText("Raka", TW / 2, 640);
    c.font = face("italic", 400, 84, "bodoni");
    c.fillText("&", TW / 2, 755);
    c.font = face("italic", 400, 156, "bodoni");
    c.fillText("Celine", TW / 2, 905);
  });
  S.foil((c) => {
    c.fillRect(TW / 2 - 34, 1072, 68, 2);
  });
  S.ink((c) => {
    c.font = face("normal", 500, 25, "manrope");
    spaced(c, "SATURDAY · 12 APRIL 2027", TW / 2, 1140, 6);
  });
  S.ink((c) => {
    c.textAlign = "center";
    c.font = face("italic", 400, 38, "cormorant");
    c.fillText("four o’clock in the afternoon", TW / 2, 1200);
    c.font = face("normal", 500, 40, "cormorant");
    c.fillText("The Glasshouse, Jakarta", TW / 2, 1252);
  });
  S.ink((c) => {
    c.font = face("normal", 500, 18, "manrope");
    spaced(c, "MULA", TW / 2, 1390, 10);
  }, "#9A8A78");
}
function drawLeft(S: DrawSet) {
  S.ink((c) => {
    c.textAlign = "center";
    c.font = face("italic", 400, 44, "cormorant");
    c.fillText("Together with their families", TW / 2, 250);
  }, "#4A3D33");
  S.foil((c) => {
    c.lineWidth = 3;
    c.beginPath();
    c.arc(TW / 2, 640, 265, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(TW / 2, 640, 242, 0, Math.PI * 2);
    c.stroke();
  });
  S.foil((c) => {
    c.textAlign = "center";
    c.font = face("italic", 400, 250, "bodoni");
    c.fillText("R", TW / 2 - 70, 700);
    c.fillText("C", TW / 2 + 80, 780);
  });
  S.blind((c) => {
    c.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      c.beginPath();
      c.arc(TW / 2 + Math.cos(a) * 300, 640 + Math.sin(a) * 300, 5, 0, Math.PI * 2);
      c.fill();
    }
  });
  S.ink((c) => {
    c.textAlign = "center";
    c.font = face("italic", 400, 38, "cormorant");
    ["and everyone who has shaped their story,", "request the honour of your presence", "as they begin."].forEach((l, i) =>
      c.fillText(l, TW / 2, 1060 + i * 54),
    );
  }, "#4A3D33");
}
function drawOuter(S: DrawSet) {
  S.blind((c) => {
    c.lineWidth = 3;
    c.beginPath();
    c.arc(TW / 2, TH / 2, 300, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(TW / 2, TH / 2, 280, 0, Math.PI * 2);
    c.stroke();
  });
  S.foil((c) => {
    c.textAlign = "center";
    c.font = face("italic", 400, 120, "bodoni");
    c.fillText("R & C", TW / 2, TH / 2 + 40);
  });
  S.ink((c) => {
    c.font = face("normal", 500, 20, "manrope");
    spaced(c, "XII · IV · MMXXVII", TW / 2, TH / 2 + 400, 8);
  }, "#7A6A58");
}

function material(S: DrawSet, renderer: THREE.WebGLRenderer) {
  const tex = (cv: HTMLCanvasElement, srgb?: boolean) => {
    const t = new THREE.CanvasTexture(cv);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  return new THREE.MeshPhysicalMaterial({
    map: tex(S.col, true),
    roughnessMap: tex(S.orm),
    metalnessMap: tex(S.orm),
    bumpMap: tex(S.bump),
    bumpScale: 1.2,
    roughness: 1,
    metalness: 1,
    sheen: 0.5,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color("#FFF1DF"),
    transparent: true,
    opacity: 0,
  });
}

function samples(S: DrawSet, xOff: number, n: number, out: number[]) {
  const d = S.mask.getContext("2d")!.getImageData(0, 0, TW, TH).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < TH; y += 4) for (let x = 0; x < TW; x += 4) if (d[(y * TW + x) * 4] > 128) pts.push([x, y]);
  for (let i = 0; i < n && pts.length; i++) {
    const [x, y] = pts[(Math.random() * pts.length) | 0];
    out.push(xOff + (x / TW) * PW, PH / 2 - (y / TH) * PH, PD / 2 + 0.004);
  }
}

export async function mountInvitation(canvas: HTMLCanvasElement, opts: MountOpts = {}): Promise<InvitationHandle> {
  const mode = opts.mode || "hero";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 9.5);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color("#0A0807");
  const box = (w: number, h: number, c: [number, number, number], pos: [number, number, number], rot: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), side: THREE.DoubleSide, toneMapped: false }),
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    env.add(m);
  };
  box(10, 4, [2.4, 2.1, 1.8], [0, 6, 1], [Math.PI / 2, 0, 0]);
  box(1.4, 9, [3.2, 2.6, 2.0], [-6, 1, 2], [0, Math.PI / 2, 0]);
  box(1, 6, [1.1, 1.3, 1.7], [6, 0, -1], [0, -Math.PI / 2, 0]);
  box(9, 2, [0.55, 0.45, 0.4], [0, -3, 7], [0, 0, 0]);
  scene.environment = pmrem.fromScene(env, 0.035).texture;

  const key = new THREE.DirectionalLight("#FFE2BF", 1.1);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const mouseLight = new THREE.PointLight("#FFD7A3", 14, 14, 2);
  mouseLight.position.set(0, 0, 3.5);
  scene.add(mouseLight);
  const sweep = new THREE.PointLight("#FFF0D8", 0, 10, 2);
  sweep.position.set(-5, 0.6, 2.4);
  scene.add(sweep);

  try {
    await Promise.race([
      Promise.all(
        [face("italic", 400, 150, "bodoni"), face("italic", 400, 40, "cormorant"), face("normal", 500, 40, "cormorant"), face("normal", 500, 26, "manrope")].map(
          (f) => document.fonts.load(f),
        ),
      ),
      new Promise<void>((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fonts optional */
  }

  const R = makeSet("#F2EBDF");
  drawRight(R);
  const L = makeSet("#EFE4D6");
  drawLeft(L);
  const O = makeSet("#ECE3D5");
  drawOuter(O);
  const edge = new THREE.MeshStandardMaterial({ color: "#C9A56E", metalness: 1, roughness: 0.28, transparent: true, opacity: 0 });
  const mR = material(R, renderer),
    mL = material(L, renderer),
    mO = material(O, renderer);
  const faceMats: THREE.Material[] = [mR, mL, mO, edge];

  const group = new THREE.Group();
  scene.add(group);
  const card = new THREE.Group();
  group.add(card);
  const geoR = new THREE.BoxGeometry(PW, PH, PD);
  geoR.translate(PW / 2, 0, 0);
  const geoL = new THREE.BoxGeometry(PW, PH, PD);
  geoL.translate(-PW / 2, 0, 0);
  const right = new THREE.Mesh(geoR, [edge, edge, edge, edge, mR, mO]);
  const left = new THREE.Mesh(geoL, [edge, edge, edge, edge, mL, mO]);
  card.add(right, left);
  const lineMat = new THREE.LineBasicMaterial({
    color: "#F1DDB0",
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  right.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoR), lineMat));
  left.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoL), lineMat));

  const sc = document.createElement("canvas");
  sc.width = sc.height = 64;
  const sg = sc.getContext("2d")!;
  const rg = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, "rgba(255,255,255,1)");
  rg.addColorStop(0.25, "rgba(255,240,215,.8)");
  rg.addColorStop(1, "rgba(255,230,200,0)");
  sg.fillStyle = rg;
  sg.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(sc);

  const N = mobile ? 1600 : 3600;
  const tgt: number[] = [];
  const perim = (x0: number, x1: number): [number, number, number] => {
    const p = Math.random() * 2 * (PW + PH);
    let x: number, y: number;
    if (p < PW) {
      x = x0 + p;
      y = PH / 2;
    } else if (p < PW + PH) {
      x = x1;
      y = PH / 2 - (p - PW);
    } else if (p < 2 * PW + PH) {
      x = x1 - (p - PW - PH);
      y = -PH / 2;
    } else {
      x = x0;
      y = -PH / 2 + (p - 2 * PW - PH);
    }
    return [x, y, PD / 2 + 0.004];
  };
  for (let i = 0; i < N * 0.38; i++) {
    const lo = Math.random() < 0.5 ? -PW : 0;
    tgt.push(...perim(lo, lo + PW));
  }
  samples(R, 0, N * 0.32, tgt);
  samples(L, -PW, N * 0.18, tgt);
  while (tgt.length < N * 3) tgt.push((Math.random() * 2 - 1) * PW, (Math.random() - 0.5) * PH, PD / 2 + 0.004);
  const cnt = tgt.length / 3;
  const startArr = new Float32Array(cnt * 3),
    delay = new Float32Array(cnt),
    pos = new Float32Array(cnt * 3);
  for (let i = 0; i < cnt; i++) {
    const r = 4 + Math.random() * 6,
      th = Math.random() * Math.PI * 2,
      ph = Math.acos(2 * Math.random() - 1);
    startArr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    startArr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
    startArr[i * 3 + 2] = r * Math.cos(ph) * 0.6;
    delay[i] = Math.random() * 0.7;
  }
  pos.set(startArr);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({
    size: mobile ? 0.05 : 0.038,
    map: sprite,
    color: "#F6DCAE",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  card.add(points);

  const Mdust = mobile ? 140 : 420;
  const dPos = new Float32Array(Mdust * 3),
    dSpd = new Float32Array(Mdust);
  for (let i = 0; i < Mdust; i++) {
    dPos[i * 3] = (Math.random() * 2 - 1) * 8;
    dPos[i * 3 + 1] = (Math.random() * 2 - 1) * 5;
    dPos[i * 3 + 2] = -5 + Math.random() * 8;
    dSpd[i] = 0.04 + Math.random() * 0.12;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({
    size: 0.03,
    map: sprite,
    color: "#E9CFA2",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dGeo, dMat);
  scene.add(dust);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: MouseEvent) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  };
  addEventListener("mousemove", onMove, { passive: true });
  let scroll = 0,
    visible = true,
    raf = 0,
    lay: Layout = { x: 0, y: 0, s: 1, rot: -0.3 };
  const resize = () => {
    const r = canvas.parentElement!.getBoundingClientRect();
    const w = Math.max(1, r.width),
      h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lay = Object.assign({ x: 0, y: 0, s: 1, rot: -0.3 }, opts.layout ? opts.layout(w, h) : {});
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement!);
  resize();
  const io = new IntersectionObserver(
    (es) => {
      visible = es[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  const skip = mode !== "hero" || reduce;
  const T0 = performance.now() - (skip ? 9000 : 0);
  const fired: Record<string, number> = {};
  const phase = (n: string) => {
    if (!fired[n]) {
      fired[n] = 1;
      opts.onPhase && opts.onPhase(n);
    }
  };
  let last = performance.now();

  function loop(now: number) {
    raf = 0;
    if (!visible) return;
    const t = (now - T0) / 1000,
      dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const amp = reduce ? 0.25 : 1;

    const gather = span(t, 0.3, 3.0);
    if (gather < 1 || t < 4.6) {
      for (let i = 0; i < cnt; i++) {
        const p = ease(clamp((t - 0.3 - delay[i]) / 2.0)),
          k = i * 3,
          sw = Math.sin(p * Math.PI) * 0.8;
        pos[k] = startArr[k] + (tgt[k] - startArr[k]) * p + Math.cos(i) * sw * 0.3;
        pos[k + 1] = startArr[k + 1] + (tgt[k + 1] - startArr[k + 1]) * p + Math.sin(i) * sw * 0.3;
        pos[k + 2] = startArr[k + 2] + (tgt[k + 2] - startArr[k + 2]) * p;
      }
      pGeo.attributes.position.needsUpdate = true;
    }
    pMat.opacity = span(t, 0.2, 1.0) * (1 - span(t, 3.0, 4.4));
    points.visible = pMat.opacity > 0.001;
    if (t > 1.2) phase("lines");
    lineMat.opacity = span(t, 1.3, 2.3) * (1 - span(t, 3.4, 4.8) * 0.9);
    const mat = ease(span(t, 2.3, 3.7));
    if (t > 2.3) phase("material");
    for (const m of faceMats) {
      m.opacity = mat;
      const done = mat >= 1;
      if (m.transparent === done) {
        m.transparent = !done;
        m.needsUpdate = true;
      }
    }
    dMat.opacity = 0.55 * span(t, 1.5, 4);
    if (t > 3.4) phase("ready");

    const fold = 0.3 * ease(span(t, 2.9, 4.6));
    left.rotation.y = fold;
    right.rotation.y = -fold;

    const intro = 1 - ease(span(t, 0, 4.8));
    const ty = lay.rot + Math.sin(t * 0.22) * 0.22 * amp + mouse.x * 0.32 * amp - intro * 0.6;
    const tx = Math.sin(t * 0.31) * 0.05 * amp - mouse.y * 0.16 * amp + scroll * 0.7;
    group.rotation.y += (ty - group.rotation.y) * 0.06;
    group.rotation.x += (tx - group.rotation.x) * 0.06;
    group.rotation.z = Math.sin(t * 0.17) * 0.02 * amp;
    group.position.set(lay.x, lay.y + Math.sin(t * 0.55) * 0.07 * amp + scroll * 1.6, -scroll * 1.2);
    const s = lay.s * (0.9 + 0.1 * ease(span(t, 0, 4.2)));
    group.scale.setScalar(s);
    camera.position.x += (mouse.x * 0.45 * amp - camera.position.x) * 0.04;
    camera.position.y += (mouse.y * 0.3 * amp - camera.position.y) * 0.04;
    camera.position.z = 9.5 + scroll * 1.5;
    camera.lookAt(0, 0, 0);

    mouseLight.position.set(mouse.x * 3.6, mouse.y * 2.4, 3.2);
    const sp = ((t - 3.4) % 9) / 1.9;
    if (t > 3.4 && sp <= 1) {
      sweep.intensity = Math.sin(sp * Math.PI) * 38;
      sweep.position.x = -5 + sp * 10;
    } else sweep.intensity = 0;

    for (let i = 0; i < Mdust; i++) {
      const k = i * 3 + 1;
      dPos[k] += dSpd[i] * dt;
      if (dPos[k] > 5) dPos[k] = -5;
    }
    dGeo.attributes.position.needsUpdate = true;
    dust.position.x = -mouse.x * 0.35;
    dust.position.y = -mouse.y * 0.2 - scroll * 1.5;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    setScroll(p: number) {
      scroll = clamp(p, 0, 1.5);
    },
    relayout: resize,
    destroy() {
      cancelAnimationFrame(raf);
      visible = false;
      ro.disconnect();
      io.disconnect();
      removeEventListener("mousemove", onMove);
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
