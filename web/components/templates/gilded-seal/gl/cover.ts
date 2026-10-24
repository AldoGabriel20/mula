import type * as THREE_NS from "three";
import type { CoverScene } from "../context";
import { clamp, ease as E, hash, lerp } from "@/lib/kit/motion/ease";
import { Spring } from "@/lib/kit/motion/spring";
import { makeTextures, type CoverText } from "./coverTextures";

type Three = typeof THREE_NS;

/** What the scene reads from the page each frame (the prototype read these off `this`). */
export type CoverState = {
  reduced: boolean;
  fine: boolean;
  pointer: { x: number; y: number };
  coverRiseStart: number | null;
  /** performance.now() at open; 0 = still idle. */
  openT0: number;
  openK: number;
};

export type CoverDeps = {
  canvas: HTMLCanvasElement;
  /** Cover root: its `[data-cover-fg]` sprigs follow the camera. */
  root: HTMLElement;
  text: CoverText;
  state(): CoverState;
};

/**
 * The opening cover (docs/15 §8.2): a linen table lit by a soft window, a wax-sealed envelope with the
 * guest's name, a ribbon, petals and drifting dust. Idle it leans with the pointer; `openT0` starts the
 * timeline that breaks the seal, opens the flap, lifts the card and flies the camera to its face.
 * A verbatim port of the prototype's `buildCover` (numbers, materials, timings), with its inputs made explicit.
 */
export function buildCover(THREE: Three, deps: CoverDeps): CoverScene {
  const { canvas } = deps;
  const c = deps.text;
  const V = THREE.Vector3;
  const cl = clamp;
  const L = lerp;
  const mobile = !deps.state().fine || innerWidth < 760;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping !== undefined ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  const BG = new THREE.Color("#E9E2D7");
  scene.background = BG;
  const fog = new THREE.Fog(BG, 12, 30);
  scene.fog = fog;

  // studio environment, prefiltered: gives the foil and wax something warm to reflect
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(20, 24, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color("#C9C2B8"), side: THREE.BackSide })));
  const softbox = (w: number, h: number, p: [number, number, number], col: string, s: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(s), side: THREE.DoubleSide }));
    m.position.set(p[0], p[1], p[2]);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  softbox(10, 6, [-6, 9, 5], "#FFF8F0", 3.2);
  softbox(6, 4, [7, 5, -3], "#FFF0E6", 1.5);
  softbox(12, 3, [0, 2, 10], "#F6F0E8", 1.1);
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  if ("environmentIntensity" in scene) scene.environmentIntensity = 0.6;

  const hemi = new THREE.HemisphereLight("#FFFCF7", "#D6CBBE", 0.78);
  scene.add(hemi);
  const key = new THREE.DirectionalLight("#FFF5EA", 1.85);
  key.position.set(-3.4, 7.5, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 24 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight("#FFF2EA", 0.6);
  fill.position.set(5, 3, 6);
  scene.add(fill);

  // ---- procedural stationery ----
  const R = mobile ? 1024 : 1536;
  const tx = makeTextures(THREE, c, R, aniso);

  // ---- materials ----
  const M = (o: THREE_NS.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...o });
  const mEdge = M({ color: "#E9DECD" });
  const mCardEdge = M({ color: "#F1E9DB" });
  const mGeneric = M({ map: tx.generic });
  const mInside = M({ map: tx.inside });
  const mFront = M({ map: tx.front });
  const mFlap = M({ map: tx.flap, side: THREE.FrontSide });
  const mLiner = M({ map: tx.liner, side: THREE.BackSide, roughness: 0.7 });
  const mCard = new THREE.MeshStandardMaterial({ map: tx.card, roughnessMap: tx.orm, metalnessMap: tx.orm, roughness: 1, metalness: 1, bumpMap: tx.bump, bumpScale: 0.5 });
  const mReply = M({ map: tx.reply });
  const mWax = new THREE.MeshPhysicalMaterial({ color: "#8F564E", roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.32, transparent: true });
  const mWaxTop = new THREE.MeshPhysicalMaterial({ color: "#8F564E", roughness: 0.4, clearcoat: 0.75, clearcoatRoughness: 0.3, bumpMap: tx.seal, bumpScale: 2.2, transparent: true });
  const shadowy = <T extends THREE_NS.Mesh>(m: T, cast = true, recv = true): T => {
    m.castShadow = cast;
    m.receiveShadow = recv;
    return m;
  };

  // ---- the table ----
  const table = shadowy(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), M({ map: tx.linen, roughness: 0.96 })), false, true);
  table.rotation.x = -Math.PI / 2;
  scene.add(table);
  const reply = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.006, 2.3), [mCardEdge, mCardEdge, mReply, mCardEdge, mCardEdge, mCardEdge]));
  reply.position.set(-1.35, 0.003, 0.62);
  reply.rotation.y = 0.32;
  scene.add(reply);
  // satin ribbon laid across the linen
  const curve = new THREE.CatmullRomCurve3([new V(1.1, 0, 1.3), new V(2.3, 0, 1.08), new V(3.1, 0, 0.1), new V(4.3, 0, -0.7), new V(6.2, 0, -0.4)]);
  const rg = new THREE.PlaneGeometry(0.2, 1, 1, 140);
  const rp = rg.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const u = rp.getY(i) + 0.5;
    const sd = rp.getX(i);
    const P = curve.getPointAt(u);
    const Tn = curve.getTangentAt(u);
    const tw = Math.sin(u * 9) * 0.35;
    rp.setXYZ(i, P.x - Tn.z * sd * Math.cos(tw), 0.008 + Math.abs(sd * Math.sin(tw)) * 0.6 + Math.sin(u * 14) * 0.004, P.z + Tn.x * sd * Math.cos(tw));
  }
  rg.computeVertexNormals();
  scene.add(shadowy(new THREE.Mesh(rg, new THREE.MeshPhysicalMaterial({ color: "#DDC2BA", roughness: 0.38, sheen: 1, sheenColor: new THREE.Color("#FFF1EA"), sheenRoughness: 0.4, side: THREE.DoubleSide }))));
  const mPetal = M({ map: tx.petal, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.6 });
  for (let i = 0; i < 11; i++) {
    const a = hash(i + 3) * Math.PI * 2;
    const rr = 2.1 + hash(i + 11) * 2.4;
    const pet = shadowy(new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.25), mPetal), false, true);
    pet.position.set(Math.cos(a) * rr * 1.25, 0.004 + i * 0.0004, Math.sin(a) * rr * 0.8 + 0.3);
    pet.rotation.set(-Math.PI / 2 + (hash(i) - 0.5) * 0.5, 0, hash(i + 7) * 6.28);
    scene.add(pet);
  }

  // ---- the envelope ----
  const env = new THREE.Group();
  env.position.y = 0.012;
  scene.add(env);
  const shapeGeo = (pts: number[][], vmin: number, vmax: number) => {
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 1.5) / 3, (pos.getY(i) - vmin) / (vmax - vmin));
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  };
  const base = shadowy(new THREE.Mesh(new THREE.BoxGeometry(3, 0.02, 2), [mEdge, mEdge, mInside, mGeneric, mEdge, mEdge]));
  base.position.y = 0.01;
  env.add(base);
  const card = shadowy(new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.008, 1.84), [mCardEdge, mCardEdge, mCard, mGeneric, mCardEdge, mCardEdge]));
  card.position.set(0, 0.025, 0);
  env.add(card);
  const front = shadowy(new THREE.Mesh(shapeGeo([[-1.5, -1], [1.5, -1], [1.5, 1], [0, -0.08], [-1.5, 1]], -1, 1), mFront));
  front.position.y = 0.03;
  env.add(front);
  const flapGeo = shapeGeo([[-1.5, 0], [1.5, 0], [0, -1.12]], -1.12, 0);
  const flapPivot = new THREE.Group();
  flapPivot.position.set(0, 0.046, -1);
  env.add(flapPivot);
  const flapOut = shadowy(new THREE.Mesh(flapGeo, mFlap));
  const flapIn = shadowy(new THREE.Mesh(flapGeo, mLiner));
  flapPivot.add(flapOut, flapIn);
  // wax seal: lathed puck with an irregular rim, embossed monogram on top
  const prof = [[0, 0], [0.29, 0], [0.315, 0.012], [0.322, 0.032], [0.31, 0.05], [0.27, 0.062], [0, 0.064]].map(([a, b]) => new THREE.Vector2(a, b));
  const sealGeo = new THREE.LatheGeometry(prof, 72);
  const sp = sealGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i);
    const z = sp.getZ(i);
    const rr = Math.hypot(x, z);
    if (rr > 0.2) {
      const an = Math.atan2(z, x);
      const f = 1 + 0.045 * Math.sin(an * 5 + 1.3) + 0.028 * Math.sin(an * 11 + 0.4);
      sp.setX(i, x * f);
      sp.setZ(i, z * f);
    }
  }
  sealGeo.computeVertexNormals();
  const seal = new THREE.Group();
  seal.position.set(0, 0.05, 0.1);
  env.add(seal);
  const sealBody = shadowy(new THREE.Mesh(sealGeo, mWax));
  seal.add(sealBody);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.245, 56), mWaxTop);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.0648;
  disc.receiveShadow = true;
  seal.add(disc);
  // gold flecks released by the seal
  const NB = 40;
  const bPos = new Float32Array(NB * 3);
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  const bVel = Array.from({ length: NB }, (_, i) => {
    const a = hash(i * 3.1) * Math.PI * 2;
    const s = 0.5 + hash(i * 7.7) * 1.3;
    return [Math.cos(a) * s, 1 + hash(i * 1.9) * 1.5, Math.sin(a) * s];
  });
  const bMat = new THREE.PointsMaterial({ size: 0.05, map: tx.dot, color: "#F0D9A0", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const burst = new THREE.Points(bGeo, bMat);
  burst.frustumCulled = false;
  env.add(burst);
  // dust in the light
  const ND = mobile ? 30 : 70;
  const dPos = new Float32Array(ND * 3);
  const dSeed: number[][] = [];
  for (let i = 0; i < ND; i++) dSeed.push([(hash(i + 0.1) - 0.5) * 9, 0.3 + hash(i + 0.2) * 3.4, (hash(i + 0.3) - 0.5) * 8, hash(i + 0.4) * 6.28]);
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: 0.045, map: tx.dot, color: "#FFF4DE", transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  dust.frustumCulled = false;
  scene.add(dust);

  // ---- camera ----
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.05, 80);
  const st = {
    D: 9,
    el0: 50,
    dF: 3,
    az: new Spring(0, { tension: 40, friction: 16 }),
    elS: new Spring(0, { tension: 40, friction: 16 }),
    hover: new Spring(0, { tension: 200, friction: 18 }),
    hovering: false,
  };
  const T_TAN = Math.tan(THREE.MathUtils.degToRad(15));
  const fit = () => {
    const w = innerWidth;
    const h = innerHeight;
    const asp = w / h;
    camera.aspect = asp;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const frac = asp < 0.8 ? 0.84 : asp < 1.25 ? 0.66 : 0.48;
    st.D = Math.max(3.3 / (frac * 2 * T_TAN * asp), 2.3 / (0.44 * 2 * T_TAN));
    st.el0 = asp < 0.8 ? 60 : 50;
    st.dF = Math.min(1.84 / (2 * T_TAN), 2.76 / (2 * T_TAN * asp)) * 0.9;
    fog.near = st.D + 3;
    fog.far = st.D + 22;
  };
  fit();
  const T4 = new V(0, 0.95, -0.9);
  const FL = new V(0, 1.25, -0.95);
  const FW = FL.clone().add(env.position);
  const fgEls = [...deps.root.querySelectorAll<HTMLElement>("[data-cover-fg]")];
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitables = [base, front, flapOut, sealBody, disc];
  const tmp = new V();
  const tgt = new V();
  const pos = new V();
  const camF = new V();

  const update = (time: number, dt: number) => {
    const S = deps.state();
    const rise = S.reduced ? 1 : S.coverRiseStart == null ? 0 : E.outQuad(cl((time - S.coverRiseStart) / 2000));
    const ot = S.openT0 ? (time - S.openT0) / (S.openK || 1) : -1;
    const idle = ot < 0;
    const P = (a: number, d: number, e: (t: number) => number = E.inOutCubic) => (ot < 0 ? 0 : e(cl((ot - a) / d)));
    st.az.target = idle && S.fine ? S.pointer.x * 4 : 0;
    st.elS.target = idle && S.fine ? -S.pointer.y * 2.5 : 0;
    st.az.step(dt);
    st.elS.step(dt);
    st.hover.target = idle && st.hovering ? 1 : 0;
    st.hover.step(dt);
    const s1 = P(0, 1000, E.outCubic);
    const raw4 = ot < 0 ? 0 : cl((ot - 1500) / 1350);
    const s4 = E.inOutCubic(raw4);
    const s5 = P(2700, 1300, E.inOutQuart);
    // camera: rise in, lean with the pointer, push in on open, then travel to the card
    const D = st.D * L(1.25, 1, rise) * L(1, 0.86, s1) * L(1, 0.8, s4);
    const el = L(st.el0 + L(-10, 0, rise) + 6 * s1 + st.elS.v, 30, s4);
    const az = THREE.MathUtils.degToRad(st.az.v);
    const er = THREE.MathUtils.degToRad(el);
    tgt.set(0, L(-0.15, 0, rise), -0.1).lerp(T4, s4);
    pos.set(Math.sin(az) * Math.cos(er), Math.sin(er), Math.cos(az) * Math.cos(er)).multiplyScalar(D).add(tgt);
    if (s5 > 0) {
      camF.copy(FW).add(tmp.set(0, 0, st.dF));
      pos.lerp(camF, s5);
      tgt.lerp(FW, s5);
    }
    camera.position.copy(pos);
    camera.lookAt(tgt);
    fgEls.forEach((f) => {
      f.style.translate = `${(-st.az.v * 7 * +(f.dataset.coverFg || 0)).toFixed(1)}px ${(st.elS.v * 6).toFixed(1)}px`;
    });
    key.intensity = 1.85 + 0.45 * s1;
    hemi.intensity = 0.78 + 0.08 * s1;
    key.position.x = -3.4 + Math.sin(time * 0.00021) * 0.35;
    // seal: press, lift and tumble away in 3D, release flecks
    const press = P(120, 160, E.outCubic);
    const fly = P(280, 950, E.outCubic);
    const fade = P(720, 430, (x) => x);
    seal.position.set(1.5 * fly, 0.05 + 0.014 * st.hover.v + 1.05 * fly, 0.1 + 0.55 * fly);
    seal.rotation.set(-2.4 * fly, 1.8 * fly, 1.2 * fly);
    const ss = 1 + 0.04 * st.hover.v;
    seal.scale.set(ss, ss * (1 - 0.18 * press * (1 - fly)), ss);
    mWax.opacity = mWaxTop.opacity = 1 - fade;
    seal.visible = fade < 1;
    const bt = ot < 330 ? -1 : (ot - 330) / 1000;
    if (bt >= 0 && bt < 1.3) {
      for (let i = 0; i < NB; i++) {
        const v = bVel[i];
        bPos[i * 3] = v[0] * bt * 0.8;
        bPos[i * 3 + 1] = 0.12 + v[1] * bt - 1.6 * bt * bt;
        bPos[i * 3 + 2] = 0.1 + v[2] * bt * 0.8;
      }
      bGeo.attributes.position.needsUpdate = true;
      bMat.opacity = 0.9 * (1 - bt / 1.3);
    } else bMat.opacity = 0;
    // flap on its hinge
    flapPivot.rotation.x = -Math.PI * 0.985 * P(650, 1050, E.inOutCubic);
    // card rises from the pocket, stands, then comes to camera
    const th = 1.25 * E.inOutCubic(cl(raw4 / 0.6));
    const zb = L(0.92, -0.9, E.inOutCubic(cl(raw4 / 0.55)));
    const yb = 0.025 + 0.72 * E.inOutCubic(cl((raw4 - 0.3) / 0.7));
    card.position.set(0, yb + 0.92 * Math.sin(th), zb - 0.92 * Math.cos(th));
    card.rotation.x = th;
    if (s5 > 0) {
      card.position.lerp(FL, s5);
      card.rotation.x = L(th, Math.PI / 2, s5);
    }
    // dust drifting through the light
    for (let i = 0; i < ND; i++) {
      const s = dSeed[i];
      dPos[i * 3] = s[0] + Math.sin(time * 0.00011 + s[3]) * 0.4;
      dPos[i * 3 + 1] = s[1] + Math.sin(time * 0.00023 + s[3] * 2) * 0.25;
      dPos[i * 3 + 2] = s[2] + Math.cos(time * 0.00009 + s[3]) * 0.3;
    }
    dGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  };

  const hover = (x: number, y: number) => {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hitables, false).length > 0;
    st.hovering = hit;
    canvas.style.cursor = hit ? "pointer" : "default";
  };

  const dispose = () => {
    scene.traverse((o) => {
      const m = o as THREE_NS.Mesh;
      if (m.geometry) m.geometry.dispose();
      ([] as THREE_NS.Material[]).concat(m.material || []).forEach((mt) => mt.dispose());
    });
    tx.all.forEach((t) => t.dispose());
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    try {
      renderer.forceContextLoss();
    } catch {
      /* already lost */
    }
  };
  try {
    renderer.compile(scene, camera);
  } catch {
    /* first frame compiles lazily */
  }
  // a slow machine drops to a lighter render path (see the watchdog in controller.ts)
  const degrade = () => {
    renderer.setPixelRatio(1);
    key.castShadow = false;
    renderer.shadowMap.autoUpdate = false;
    fit();
  };
  return { update, resize: fit, hover, dispose, degrade };
}
