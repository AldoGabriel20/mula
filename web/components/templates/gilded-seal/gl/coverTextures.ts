import type * as THREE from "three";
import type { FontRoles } from "@/lib/kit/tokens";

type Three = typeof THREE;
export type CoverText = { ini1: string; ini2: string; openingTitle: string; p1: string; p2: string; openingSubtitle: string; dateDots: string; guest: string; fonts: FontRoles };

type Ctx = CanvasRenderingContext2D;
const mk = (w: number, h: number): [HTMLCanvasElement, Ctx] => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return [cv, cv.getContext("2d")!];
};

/**
 * The procedural stationery of the cover scene (prototype `buildCover` texture block): paper with
 * grain and fibres, the invitation card in three passes (colour / roughness-metalness / bump), the
 * addressed envelope front, flap, liner, linen, reply card, petal, light sprite and the seal's bump
 * map. Everything is drawn with Canvas 2D at `R` px wide, so the scene needs no image files.
 */
export function makeTextures(THREE: Three, c: CoverText, R: number, anisotropy: number) {
  const HC = Math.round((R * 2) / 3);
  const FONT = { serif: c.fonts.display, sans: c.fonts.body, script: c.fonts.script };
  const all: THREE.Texture[] = [];

  const [noiseCv, nx] = mk(256, 256);
  {
    const img = nx.createImageData(256, 256);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    nx.putImageData(img, 0, 0);
  }
  const grain = (x: Ctx, w: number, h: number, amt: number) => {
    x.save();
    x.globalAlpha = Math.min(0.5, amt / 90);
    x.globalCompositeOperation = "overlay";
    x.fillStyle = x.createPattern(noiseCv, "repeat")!;
    x.fillRect(0, 0, w, h);
    x.restore();
  };
  const fibers = (x: Ctx, w: number, h: number, n: number) => {
    x.lineWidth = Math.max(1, w / 1024);
    for (let k = 0; k < n; k++) {
      x.strokeStyle = Math.random() < 0.5 ? `rgba(255,255,255,${(Math.random() * 0.08).toFixed(3)})` : `rgba(120,95,70,${(Math.random() * 0.05).toFixed(3)})`;
      const px = Math.random() * w;
      const py = Math.random() * h;
      const a = Math.random() * Math.PI;
      const l = 4 + (Math.random() * w) / 60;
      x.beginPath();
      x.moveTo(px, py);
      x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + (Math.random() - 0.5) * 4, py + Math.sin(a) * l * 0.5 + (Math.random() - 0.5) * 4, px + Math.cos(a) * l, py + Math.sin(a) * l);
      x.stroke();
    }
  };
  const paper = (w: number, h: number, base: string, amt = 12): [HTMLCanvasElement, Ctx] => {
    const [cv, x] = mk(w, h);
    x.fillStyle = base;
    x.fillRect(0, 0, w, h);
    grain(x, w, h, amt);
    fibers(x, w, h, Math.min(500, (w * h) / 4000));
    return [cv, x];
  };
  const tex = (cv: HTMLCanvasElement, srgb = true, rep = 0) => {
    const t = new THREE.CanvasTexture(cv);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    if (rep) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rep, rep);
    }
    all.push(t);
    return t;
  };
  const spaced = (x: Ctx, text: string, cx: number, cy: number, sp: number) => {
    const ch = [...text];
    const ws = ch.map((q) => x.measureText(q).width);
    let px = cx - (ws.reduce((a, b) => a + b, 0) + sp * (ch.length - 1)) / 2;
    x.textAlign = "left";
    ch.forEach((q, i) => {
      x.fillText(q, px, cy);
      px += ws[i] + sp;
    });
  };
  const diamond = (x: Ctx, cx: number, cy: number, r: number) => {
    x.beginPath();
    x.moveTo(cx, cy - r);
    x.lineTo(cx + r, cy);
    x.lineTo(cx, cy + r);
    x.lineTo(cx - r, cy);
    x.closePath();
  };

  // the invitation card: colour pass + ORM (roughness/metalness: gold lettering is metal) + bump
  const drawCard = (x: Ctx, w: number, h: number, mode: "color" | "orm" | "bump") => {
    const col = mode === "color" ? { ink: "#3A2F27", ink2: "#7E6436", gold: "#B08D52" } : mode === "orm" ? { ink: "rgb(0,200,0)", ink2: "rgb(0,200,0)", gold: "rgb(0,70,255)" } : { ink: "#8a8a8a", ink2: "#9a9a9a", gold: "#a4a4a4" };
    if (mode === "orm") {
      x.fillStyle = "rgb(0,220,0)";
      x.fillRect(0, 0, w, h);
    } else if (mode === "bump") {
      x.fillStyle = "#ffffff";
      x.fillRect(0, 0, w, h);
    }
    const u = w / 100;
    x.textBaseline = "middle";
    x.strokeStyle = col.gold;
    x.lineWidth = u * 0.16;
    x.strokeRect(u * 4.2, u * 4.2, w - u * 8.4, h - u * 8.4);
    x.lineWidth = u * 0.07;
    x.strokeRect(u * 5.3, u * 5.3, w - u * 10.6, h - u * 10.6);
    [[u * 5.3, u * 5.3], [w - u * 5.3, u * 5.3], [u * 5.3, h - u * 5.3], [w - u * 5.3, h - u * 5.3]].forEach(([a, b]) => {
      diamond(x, a, b, u * 0.6);
      x.fillStyle = col.gold;
      x.fill();
    });
    const my = h * 0.2;
    x.beginPath();
    x.arc(w / 2, my, h * 0.064, 0, Math.PI * 2);
    x.lineWidth = u * 0.12;
    x.stroke();
    x.fillStyle = col.gold;
    x.textAlign = "center";
    x.font = `italic 500 ${h * 0.066}px ${FONT.serif}`;
    x.fillText(`${c.ini1}&${c.ini2}`, w / 2, my + h * 0.004);
    x.fillStyle = col.ink2;
    x.font = `600 ${h * 0.024}px ${FONT.sans}`;
    spaced(x, c.openingTitle.toUpperCase(), w / 2, h * 0.355, h * 0.024 * 0.34);
    let ns = h * 0.15;
    let a = 0;
    let b = 0;
    let m = 0;
    const measure = () => {
      x.font = `300 ${ns}px ${FONT.serif}`;
      a = x.measureText(c.p1).width;
      b = x.measureText(c.p2).width;
      x.font = `400 ${ns * 0.62}px ${FONT.script}`;
      m = x.measureText("&").width;
    };
    measure();
    while (a + b + m + ns * 0.36 > w * 0.8 && ns > h * 0.06) {
      ns *= 0.94;
      measure();
    }
    let px = w / 2 - (a + b + m + ns * 0.36) / 2;
    const ny = h * 0.5;
    x.textAlign = "left";
    x.fillStyle = col.ink;
    x.font = `300 ${ns}px ${FONT.serif}`;
    x.fillText(c.p1, px, ny);
    px += a + ns * 0.18;
    x.fillStyle = col.gold;
    x.font = `400 ${ns * 0.62}px ${FONT.script}`;
    x.fillText("&", px, ny + ns * 0.05);
    px += m + ns * 0.18;
    x.fillStyle = col.ink;
    x.font = `300 ${ns}px ${FONT.serif}`;
    x.fillText(c.p2, px, ny);
    x.textAlign = "center";
    x.fillStyle = col.ink2;
    x.font = `italic 400 ${h * 0.042}px ${FONT.serif}`;
    x.fillText(c.openingSubtitle, w / 2, h * 0.635);
    x.strokeStyle = col.gold;
    x.lineWidth = u * 0.08;
    x.beginPath();
    x.moveTo(w / 2 - u * 9, h * 0.71);
    x.lineTo(w / 2 - u * 1.4, h * 0.71);
    x.moveTo(w / 2 + u * 1.4, h * 0.71);
    x.lineTo(w / 2 + u * 9, h * 0.71);
    x.stroke();
    diamond(x, w / 2, h * 0.71, u * 0.7);
    x.stroke();
    x.fillStyle = col.ink;
    x.font = `500 ${h * 0.026}px ${FONT.sans}`;
    spaced(x, c.dateDots, w / 2, h * 0.79, h * 0.026 * 0.3);
  };
  const [cardCv, cx1] = paper(R, HC, "#FBF7EF", 8);
  drawCard(cx1, R, HC, "color");
  const [ormCv, cx2] = mk(R, HC);
  drawCard(cx2, R, HC, "orm");
  const [bumpCv, cx3] = mk(R, HC);
  drawCard(cx3, R, HC, "bump");

  // envelope front, addressed to the guest
  const [frCv, fx] = paper(R, HC, "#F2E8D8", 12);
  const tri = (pts: number[][], fillStyle: string) => {
    fx.beginPath();
    fx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach((p) => fx.lineTo(p[0], p[1]));
    fx.closePath();
    fx.fillStyle = fillStyle;
    fx.fill();
  };
  tri([[0, HC], [R / 2, HC * 0.6], [R, HC]], "rgba(255,255,255,.16)");
  tri([[0, 0], [R / 2, HC * 0.6], [0, HC]], "rgba(120,92,64,.045)");
  tri([[R, 0], [R / 2, HC * 0.6], [R, HC]], "rgba(120,92,64,.03)");
  fx.lineWidth = Math.max(1.5, R / 800);
  fx.strokeStyle = "rgba(110,84,58,.3)";
  fx.beginPath();
  fx.moveTo(0, HC);
  fx.lineTo(R / 2, HC * 0.6);
  fx.lineTo(R, HC);
  fx.stroke();
  fx.strokeStyle = "rgba(255,255,255,.55)";
  fx.beginPath();
  fx.moveTo(0, HC + R / 500);
  fx.lineTo(R / 2, HC * 0.6 + R / 500);
  fx.lineTo(R, HC + R / 500);
  fx.stroke();
  fx.textBaseline = "middle";
  fx.fillStyle = "#7E6436";
  fx.font = `600 ${HC * 0.03}px ${FONT.sans}`;
  spaced(fx, "DEAR", R / 2, HC * 0.775, HC * 0.03 * 0.38);
  let gs = HC * 0.075;
  fx.font = `italic 400 ${gs}px ${FONT.serif}`;
  while (fx.measureText(c.guest).width > R * 0.6 && gs > HC * 0.03) {
    gs *= 0.93;
    fx.font = `italic 400 ${gs}px ${FONT.serif}`;
  }
  fx.textAlign = "center";
  fx.fillStyle = "#2F2620";
  fx.fillText(c.guest, R / 2, HC * 0.865);

  const [flapCv, flx] = paper(1024, 384, "#F4EBDD", 12);
  const fg = flx.createLinearGradient(0, 0, 0, 384);
  fg.addColorStop(0, "rgba(110,84,58,.09)");
  fg.addColorStop(1, "rgba(110,84,58,0)");
  flx.fillStyle = fg;
  flx.fillRect(0, 0, 1024, 384);
  flx.strokeStyle = "rgba(110,84,58,.16)";
  flx.lineWidth = 2;
  flx.beginPath();
  flx.moveTo(26, 0);
  flx.lineTo(512, 384 - 26);
  flx.lineTo(998, 0);
  flx.stroke();
  const [linerCv, lx] = mk(1024, 384);
  lx.fillStyle = "#D2ADA4";
  lx.fillRect(0, 0, 1024, 384);
  lx.strokeStyle = "rgba(255,255,255,.17)";
  lx.lineWidth = 1.5;
  for (let i = -400; i < 1424; i += 14) {
    lx.beginPath();
    lx.moveTo(i, 0);
    lx.lineTo(i + 384, 384);
    lx.moveTo(i + 384, 0);
    lx.lineTo(i, 384);
    lx.stroke();
  }
  lx.strokeStyle = "#C7A66A";
  lx.lineWidth = 4;
  lx.beginPath();
  lx.moveTo(34, 0);
  lx.lineTo(512, 384 - 34);
  lx.lineTo(990, 0);
  lx.stroke();
  grain(lx, 1024, 384, 10);
  const [genCv] = paper(1024, 1024, "#F1E7D7", 12);
  const [insideCv] = paper(1024, 1024, "#E6DAC8", 10);
  const [linenCv, lnx] = mk(512, 512);
  lnx.fillStyle = "#E7DFD3";
  lnx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 512; i += 3) {
    lnx.fillStyle = i % 6 ? "rgba(255,255,255,.07)" : "rgba(90,70,50,.05)";
    lnx.fillRect(0, i, 512, 1);
    lnx.fillStyle = i % 6 ? "rgba(90,70,50,.05)" : "rgba(255,255,255,.06)";
    lnx.fillRect(i, 0, 1, 512);
  }
  grain(lnx, 512, 512, 14);
  const [replyCv, rx] = paper(768, 1024, "#FAF5EC", 8);
  rx.strokeStyle = "#B08D52";
  rx.lineWidth = 3;
  rx.strokeRect(36, 36, 696, 952);
  rx.textBaseline = "middle";
  rx.fillStyle = "#B08D52";
  rx.textAlign = "center";
  rx.font = `italic 500 72px ${FONT.serif}`;
  rx.fillText(`${c.ini1}&${c.ini2}`, 384, 200);
  rx.fillStyle = "#7E6436";
  rx.font = `600 26px ${FONT.sans}`;
  spaced(rx, "KINDLY RESPOND", 384, 330, 9);
  rx.strokeStyle = "rgba(58,47,39,.25)";
  rx.lineWidth = 2;
  [520, 640, 760].forEach((y) => {
    rx.beginPath();
    rx.moveTo(130, y);
    rx.lineTo(638, y);
    rx.stroke();
  });
  const [petalCv, px] = mk(128, 160);
  const pg = px.createRadialGradient(64, 70, 6, 64, 80, 80);
  pg.addColorStop(0, "#F3DDD6");
  pg.addColorStop(1, "#C9978D");
  px.fillStyle = pg;
  px.beginPath();
  px.moveTo(64, 4);
  px.bezierCurveTo(118, 40, 124, 110, 88, 150);
  px.quadraticCurveTo(64, 162, 40, 150);
  px.bezierCurveTo(4, 110, 10, 40, 64, 4);
  px.fill();
  const [dotCv, dx] = mk(64, 64);
  const dg = dx.createRadialGradient(32, 32, 0, 32, 32, 32);
  dg.addColorStop(0, "rgba(255,255,255,1)");
  dg.addColorStop(0.4, "rgba(255,255,255,.35)");
  dg.addColorStop(1, "rgba(255,255,255,0)");
  dx.fillStyle = dg;
  dx.fillRect(0, 0, 64, 64);
  const [sealCv, sx] = mk(512, 512);
  sx.fillStyle = "#6a6a6a";
  sx.fillRect(0, 0, 512, 512);
  sx.strokeStyle = "#a0a0a0";
  sx.lineWidth = 10;
  sx.beginPath();
  sx.arc(256, 256, 214, 0, Math.PI * 2);
  sx.stroke();
  sx.shadowColor = "#ffffff";
  sx.shadowBlur = 10;
  sx.fillStyle = "#dedede";
  sx.textAlign = "center";
  sx.textBaseline = "middle";
  sx.font = `italic 500 200px ${FONT.serif}`;
  sx.fillText(`${c.ini1}&${c.ini2}`, 256, 262);

  return {
    all,
    card: tex(cardCv),
    orm: tex(ormCv, false),
    bump: tex(bumpCv, false),
    front: tex(frCv),
    flap: tex(flapCv),
    liner: tex(linerCv),
    generic: tex(genCv),
    inside: tex(insideCv),
    linen: tex(linenCv, true, 14),
    reply: tex(replyCv),
    petal: tex(petalCv),
    dot: tex(dotCv),
    seal: tex(sealCv, false),
  };
}
