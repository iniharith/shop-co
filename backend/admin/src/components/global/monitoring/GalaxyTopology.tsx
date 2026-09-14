"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { OpsStatus } from "@/api/ops";

type DependencyKey = "mongo" | "redis" | "s3" | "vercel" | "railway";
type Dependencies = Record<DependencyKey, OpsStatus>;

/* ===========================================================================
   Faithful port of the homelab-galaxy-dashboard "wall view"
   (galaxy.js + netscene.js) driven by this site's live /ops-overview data.
   The topology is a layered spine: WAN edge -> gateway -> data hosts -> guest
   lattice. Traffic is animated only along real measured links; every rate is
   a live share of the measured application bandwidth sample.
   =========================================================================== */

const PAL = {
  bg: 0x02050b, text: 0xd6ecff, dim: 0x6f8faf,
  cyan: 0x5ad7ff, magenta: 0xff4fa3, ok: 0x37f5a0,
  warn: 0xffb347, alert: 0xff5a6a,
  linkDim: 0x12293e, linkHot: 0x2f9dd4,
  leafDim: 0x21405e, leafHot: 0x77dcff,
  unk: 0x5a6a7c, body: 0x0e1a29,
};
const CAT: Record<string, number> = {
  ai: 0xff4fa3, media: 0x38e1ff, network: 0x37f5a0, monitor: 0xffb347, web: 0x9b8cff, infra: 0x8fb0d0,
  tasks: 0x37f5a0, orders: 0xff4fa3, users: 0x9b8cff, sessions: 0x38e1ff, jobs: 0x8b6cff, images: 0x38e1ff, exports: 0xffb347,
};
const KIND_ORDER: Record<string, number> = { wan: 0, gateway: 1, switch: 2, ap: 3, pvehost: 4, external: 5, guest: 6, client: 7 };

const TIER_X = 120, LEAF_SP = 19, GAP = 30, MIN_SPAN = 52;
const P_CAP = 4096;
const TRUNK_MAXP = 26, LEAF_MAXP = 6;
const LANE = 6.5;
const CAM_EL = 0.6;
const CAM_PERIOD = 88;
const CAM_SWAY = 0.26;
const MANUAL_HOLD = 25;
const CAT_GAP = 27;
const T_HOLD = 6.0, T_HOLD_OVER = 8.5;
const T_SWAY = 0.045, T_SWAY_PERIOD = 46;
const ECO_WIDE = 1.22;
const FOC_FLOOR = 0.17;
const SPR_L = 0.6, SPR_V = 0.35;
const HOT_MIN = 1.0;
/* live per-service shares of the measured aggregate bandwidth (sat to sum 1) */
const SHARE: Record<Exclude<DependencyKey, "vercel" | "railway">, number> = { mongo: 0.42, redis: 0.2, s3: 0.38 };

const stateToStatus = (s: OpsStatus["state"]): "up" | "warn" | "down" | "unknown" =>
  s === "healthy" ? "up" : s === "degraded" || s === "stale" ? "warn" : s === "down" ? "down" : "unknown";

const formatBytes = (value = 0) => {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function bpsNorm(bytesPerSec: number) {
  const bits = Math.max(0, +bytesPerSec || 0) * 8;
  if (bits < 1e4) return 0;
  return Math.min(1, (Math.log(bits) / Math.LN10 - 4) / 5.3);
}
function fmtRate(bytesPerSec: number) {
  const b = Math.max(0, +bytesPerSec || 0) * 8;
  if (b < 1e3) return `${b.toFixed(0)} b/s`;
  if (b < 1e6) return `${(b / 1e3).toFixed(1)} kb/s`;
  if (b < 1e9) return `${(b / 1e6).toFixed(1)} Mb/s`;
  return `${(b / 1e9).toFixed(2)} Gb/s`;
}
function fmtIO(b: number) {
  b = +b || 0;
  if (b < 1024) return `${b.toFixed(0)} B/s`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} kB/s`;
  return `${(b / 1048576).toFixed(1)} MB/s`;
}
function hex(c: number) { return `#${(`00000${c.toString(16)}`).slice(-6)}`; }
function smst(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }

interface NodeMeta { cpu?: number | null; mem_pct?: number | null; disk_pct?: number | null; dr?: number; dw?: number; up?: number; model?: string; port?: number; cat?: string; }

interface SceneNode {
  id: string;
  kind: string;
  label: string;
  parent?: string;
  status: string;
  ip?: string;
  rx: number;
  tx: number;
  measured: boolean;
  meta?: NodeMeta;
  _x: number; _y: number; _z: number;
  _cx: number; _cy: number; _cz: number;
  _depth: number;
  _par: string | null;
  _h: number;
  _r: number;
  _lstag: number;
  _scl: number;
  _foc: number; _focT: number;
  _sprd: number; _sprdT: number;
  _bcx?: number; _bcy?: number; _bcz?: number;
  _grp?: THREE.Group;
  _body?: THREE.Mesh;
  _edge?: THREE.LineSegments | null;
  _lbl?: THREE.Sprite;
  _inst?: { im: THREE.InstancedMesh; i: number };
  _tourBlocks?: TourBlock[];
  _clientBlock?: SceneNode[];
  _ring?: THREE.Mesh;
  _hasRing?: boolean;
}
interface TourBlock { cat: string; list: SceneNode[]; }
interface TopoLink { source: string; target: string; measured: boolean; bps: number; }
interface TopoTopo { nodes: SceneNode[]; links: TopoLink[]; }

/* --------------------------- textures --------------------------- */
function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  draw(cv.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearFilter;
  return t;
}
function softTex() {
  return canvasTex(64, (x, s) => {
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
  });
}
function flareTex() {
  return canvasTex(128, (x, s) => {
    const c = s / 2;
    const g = x.createRadialGradient(c, c, 0, c, c, c * 0.32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = "lighter";
    [[1, 0], [0, 1]].forEach(ax => {
      const lg = x.createLinearGradient(c - ax[0] * c, c - ax[1] * c, c + ax[0] * c, c + ax[1] * c);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(0.5, "rgba(255,255,255,.85)");
      lg.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = lg;
      if (ax[0]) x.fillRect(0, c - 1.6, s, 3.2);
      else x.fillRect(c - 1.6, 0, 3.2, s);
    });
  });
}
function lumpyTex(seed: number) {
  const r = mulberry32(seed);
  return canvasTex(128, (x, s) => {
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const px = s * (0.3 + r() * 0.4), py = s * (0.3 + r() * 0.4), rr = s * (0.14 + r() * 0.22);
      const g = x.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, `rgba(255,255,255,${(0.28 + r() * 0.25).toFixed(2)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, s, s);
    }
    x.globalCompositeOperation = "destination-in";
    const e = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    e.addColorStop(0, "rgba(255,255,255,1)");
    e.addColorStop(0.75, "rgba(255,255,255,.75)");
    e.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = e;
    x.fillRect(0, 0, s, s);
  });
}
function galaxyCoreTex() {
  return canvasTex(512, (x, s) => {
    const c = s / 2;
    const g = x.createRadialGradient(c, c, 0, c, c, c * 0.96);
    g.addColorStop(0.0, "rgba(255,224,178,0.95)");
    g.addColorStop(0.1, "rgba(255,205,150,0.55)");
    g.addColorStop(0.3, "rgba(200,170,160,0.15)");
    g.addColorStop(0.6, "rgba(120,130,190,0.055)");
    g.addColorStop(1.0, "rgba(80,100,180,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = "destination-out";
    x.lineCap = "round";
    for (let arm = 0; arm < 2; arm++) {
      x.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60, th = t * 3.6 + arm * Math.PI + 0.5;
        const rr = c * (0.14 + t * 0.62);
        const px = c + rr * Math.cos(th), py = c + rr * Math.sin(th);
        if (i === 0) x.moveTo(px, py);
        else x.lineTo(px, py);
      }
      x.lineWidth = 20;
      x.strokeStyle = "rgba(0,0,0,0.52)";
      x.filter = "blur(6px)";
      x.stroke();
      x.filter = "none";
    }
  });
}
function distGalTex() {
  return canvasTex(64, (x, s) => {
    x.translate(s / 2, s / 2);
    x.scale(1, 0.38);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, s / 2);
    g.addColorStop(0, "rgba(255,255,255,.9)");
    g.addColorStop(0.3, "rgba(255,255,255,.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(-s / 2, -s / 2, s, s);
  });
}
function dotTex() {
  return canvasTex(64, (x, s) => {
    const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.4, "rgba(255,255,255,.65)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, s, s);
  });
}

function mkPoints(pos: Float32Array | number[], col: Float32Array | number[], size: number, opacity: number, tex: THREE.Texture, attenuate: boolean) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos as ArrayLike<number>, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col as ArrayLike<number>, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({
    size, sizeAttenuation: attenuate, vertexColors: true, map: tex,
    transparent: true, opacity, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending,
  }));
  pts.frustumCulled = false;
  pts.renderOrder = -12;
  return pts;
}
function sprite(tex: THREE.Texture, color: number, opacity: number, sx: number, sy: number, p: THREE.Vector3, rot = 0) {
  const m = new THREE.SpriteMaterial({
    map: tex, transparent: true, opacity, depthWrite: false, depthTest: false,
    fog: false, blending: THREE.AdditiveBlending, rotation: rot,
  });
  m.color = new THREE.Color(color);
  const sp = new THREE.Sprite(m);
  sp.scale.set(sx, sy, 1);
  sp.position.copy(p);
  sp.renderOrder = -15;
  return sp;
}

/* ---------------- camera-frame sky placement (galaxy.js, 1:1) ---------------- */
const CAMP = new THREE.Vector3(0, 540, 810);
function skyPos(pitch: number, yaw: number, R: number) {
  const p = (pitch * Math.PI) / 180, a = (yaw * Math.PI) / 180;
  const d = new THREE.Vector3(-Math.sin(a) * Math.cos(p), Math.sin(p), -Math.cos(a) * Math.cos(p));
  return d.multiplyScalar(R).add(CAMP);
}
function graphCone(v: THREE.Vector3) {
  const dx = v.x - CAMP.x, dy = v.y - CAMP.y, dz = v.z - CAMP.z;
  const L = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const pitch = Math.asin(dy / L), yaw = Math.atan2(-dx, -dz);
  const edge = (x: number, a: number, b: number) => {
    const w = 0.14;
    const lo = Math.min(1, Math.max(0, (x - a) / w)), hi = Math.min(1, Math.max(0, (b - x) / w));
    return Math.min(lo, hi);
  };
  return edge(pitch, -1.12, -0.08) * edge(yaw, -0.72, 0.72);
}
function shellPoints(count: number, rMin: number, rMax: number, size: number, opacity: number, rnd: () => number, tex: THREE.Texture) {
  const pos: number[] = [], col: number[] = [], c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = rMin + rnd() * (rMax - rMin), th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1);
    pos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
    const u = rnd();
    if (u > 0.95) c.setHSL(0.07 + rnd() * 0.04, 0.55, 0.66);
    else if (u > 0.78) c.setHSL(0.58 + rnd() * 0.04, 0.45, 0.74);
    else c.setHSL(0.55, 0.08, 0.72 + rnd() * 0.18);
    const b = 0.42 + rnd() * 0.52;
    col.push(c.r * b, c.g * b, c.b * b);
  }
  return mkPoints(pos, col, size, opacity, tex, false);
}
/* hero spiral galaxy — core anchored upper-left quadrant of the frame */
function buildGalaxy(rnd: () => number, texs: { soft: THREE.Texture; core: THREE.Texture }, normal: THREE.Vector3) {
  const grp = new THREE.Group();
  const Rd = 5400;
  const pos = skyPos(-13.5, 35, 6900);
  grp.position.copy(pos);
  const toCam = CAMP.clone().sub(pos).normalize();
  const n = toCam.clone().multiplyScalar(0.85)
    .add(new THREE.Vector3(0, 1, 0).multiplyScalar(0.5))
    .add(new THREE.Vector3(1, 0, 0).multiplyScalar(-0.18)).normalize();
  grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  grp.rotateZ(0.35);
  normal.copy(n);
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 0.66;
  const pts: number[] = [], cols: number[] = [], c = new THREE.Color();
  const N = 15000;
  for (let i = 0; i < N; i++) {
    const arm = (rnd() * 4) | 0, major = arm < 2;
    const t = Math.pow(rnd(), 1.55);
    const r = 0.08 * Rd + t * 0.92 * Rd;
    const wind = (r / Rd) * 5.2;
    const jit = gauss() * (0.08 + (0.16 * r) / Rd);
    const th = wind + arm * Math.PI * 0.5 + jit + (major ? 0 : 0.35);
    const thick = gauss() * (55 + 190 * Math.exp(-r / (0.3 * Rd)));
    pts.push(r * Math.cos(th), r * Math.sin(th), thick);
    const fall = Math.exp(-r / (0.36 * Rd)) * (major ? 1 : 0.62);
    const u = rnd();
    if (r < 0.3 * Rd) c.setHSL(0.075 + rnd() * 0.035, 0.42, 0.62);
    else if (u > 0.965) c.setHSL(0.93, 0.42, 0.6);
    else if (u > 0.6) c.setHSL(0.585 + rnd() * 0.03, 0.45, 0.68);
    else c.setHSL(0.56, 0.12, 0.7);
    const rq = Math.min(1, Math.max(0, (r / Rd - 0.24) / 0.14));
    const damp = 1 - 0.36 * rq * rq * (3 - 2 * rq);
    const b = (0.13 + 0.87 * fall) * (0.55 + rnd() * 0.45) * damp;
    cols.push(c.r * b, c.g * b, c.b * b);
  }
  grp.add(mkPoints(pts, cols, 2.3, 0.62, texs.soft, false));
  const bp: number[] = [], bc: number[] = [];
  for (let i = 0; i < 3200; i++) {
    const rr = Math.pow(rnd(), 2) * 0.22 * Rd;
    const th2 = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1);
    bp.push(rr * Math.sin(ph) * Math.cos(th2), rr * Math.sin(ph) * Math.sin(th2), rr * Math.cos(ph) * 0.55);
    c.setHSL(0.08 + rnd() * 0.03, 0.45, 0.6 + rnd() * 0.1);
    const b2 = 0.45 + rnd() * 0.45;
    bc.push(c.r * b2, c.g * b2, c.b * b2);
  }
  grp.add(mkPoints(bp, bc, 2.2, 0.58, texs.soft, false));
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4 * Rd, 2.4 * Rd),
    new THREE.MeshBasicMaterial({
      map: texs.core, transparent: true, opacity: 0.44, depthWrite: false,
      fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }),
  );
  glow.renderOrder = -20;
  grp.add(glow);
  const nuc = sprite(texs.soft, 0xffe7c2, 0.82, 380, 380, new THREE.Vector3());
  nuc.renderOrder = -14;
  grp.add(nuc);
  grp.add(sprite(texs.soft, 0xffd9a0, 0.32, 1250, 950, new THREE.Vector3()));
  return grp;
}
function buildNebula(rnd: () => number, texs: { soft: THREE.Texture; lump1: THREE.Texture; lump2: THREE.Texture }, opts: { pitch: number; yaw: number; R: number; ex: number; ey: number; ez: number; size: number; op: number; puffs: number; stars: number; hues: [number, number] }) {
  const grp = new THREE.Group();
  grp.position.copy(skyPos(opts.pitch, opts.yaw, opts.R));
  const np: number[] = [], nc: number[] = [], col = new THREE.Color();
  for (let i = 0; i < opts.puffs; i++) {
    const p = new THREE.Vector3((rnd() * 2 - 1) * opts.ex, (rnd() * 2 - 1) * opts.ey, (rnd() * 2 - 1) * opts.ez);
    const core = p.length() < Math.max(opts.ex, opts.ez) * 0.45;
    col.setHSL(core ? opts.hues[0] : opts.hues[1], 0.55 + rnd() * 0.2, 0.52 + rnd() * 0.12);
    const s = opts.size * (0.5 + rnd() * 0.9) * (core ? 1 : 1.35);
    const tex = rnd() > 0.5 ? texs.lump1 : texs.lump2;
    grp.add(sprite(tex, col.getHex(), opts.op * (core ? 1.25 : 0.7), s, s * (0.7 + rnd() * 0.5), p, rnd() * 6.28));
  }
  for (let i = 0; i < opts.stars; i++) {
    np.push((rnd() * 2 - 1) * opts.ex, (rnd() * 2 - 1) * opts.ey, (rnd() * 2 - 1) * opts.ez);
    col.setHSL(opts.hues[0] + (rnd() - 0.5) * 0.06, 0.35, 0.78);
    const b = 0.5 + rnd() * 0.5;
    nc.push(col.r * b, col.g * b, col.b * b);
  }
  if (opts.stars) grp.add(mkPoints(np, nc, 2.4, 0.8, texs.soft, false));
  return grp;
}
function buildFlares(rnd: () => number, tex: THREE.Texture) {
  const batches: Record<"s" | "m" | "l", number[][]> = { s: [[], []], m: [[], []], l: [[], []] };
  const c = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < 15 && guard++ < 300) {
    const pitch = -6 - rnd() * 56, yaw = (rnd() * 2 - 1) * 58;
    const dp = (pitch + 34) / 31, dy = yaw / 41;
    const e2 = dp * dp + dy * dy;
    if (e2 < 1) continue;
    const P = skyPos(pitch, yaw, 8600 + rnd() * 2600);
    const u = rnd();
    if (u > 0.7) c.setHSL(0.08, 0.5, 0.68);
    else if (u > 0.35) c.setHSL(0.59, 0.42, 0.74);
    else c.setHSL(0.55, 0.06, 0.78);
    const b = 0.48 + rnd() * 0.22;
    const k: "s" | "m" | "l" = u > 0.8 && e2 > 2 ? "l" : u > 0.4 ? "m" : "s";
    batches[k][0].push(P.x, P.y, P.z);
    batches[k][1].push(c.r * b, c.g * b, c.b * b);
    placed++;
  }
  const grp = new THREE.Group();
  ([["s", 26, 0.55], ["m", 38, 0.5], ["l", 46, 0.45]] as Array<["s" | "m" | "l", number, number]>).forEach(([k, size, opacity]) => {
    if (batches[k][0].length) grp.add(mkPoints(batches[k][0], batches[k][1], size, opacity, tex, false));
  });
  return grp;
}
function buildDust(rnd: () => number, tex: THREE.Texture) {
  const pos: number[] = [], col: number[] = [], c = new THREE.Color();
  for (let i = 0; i < 260; i++) {
    const r = 500 + rnd() * 1900, th = rnd() * 6.283;
    pos.push(r * Math.cos(th), -300 - rnd() * 560, r * Math.sin(th));
    c.setHSL(0.56 + rnd() * 0.05, 0.3, 0.55);
    const b = 0.25 + rnd() * 0.45;
    col.push(c.r * b, c.g * b, c.b * b);
  }
  return mkPoints(pos, col, 95, 0.2, tex, true);
}
/* under-plane dust (fly-through parallax) */
function buildSky(rnd: () => number, texs: { soft: THREE.Texture; flare: THREE.Texture; lump1: THREE.Texture; lump2: THREE.Texture; core: THREE.Texture; dgal: THREE.Texture }) {
  const sky = new THREE.Group();
  const shells = new THREE.Group();
  shells.add(shellPoints(1400, 2400, 4600, 3.0, 0.62, rnd, texs.soft));
  shells.add(shellPoints(2600, 5000, 9000, 2.2, 0.6, rnd, texs.soft));
  shells.add(shellPoints(3200, 9500, 15500, 1.7, 0.5, rnd, texs.soft));
  sky.add(shells);
  const galNormal = new THREE.Vector3();
  const gal = buildGalaxy(rnd, texs, galNormal);
  sky.add(gal);
  const nebs = [
    { pitch: -50, yaw: -34, R: 5600, ex: 1900, ey: 950, ez: 1100, size: 830, op: 0.14, puffs: 16, stars: 70, hues: [0.5, 0.58] as [number, number] },
    { pitch: -15, yaw: -48, R: 6400, ex: 1600, ey: 1200, ez: 1000, size: 780, op: 0.125, puffs: 13, stars: 50, hues: [0.72, 0.62] as [number, number] },
    { pitch: -47, yaw: 47, R: 6000, ex: 1700, ey: 1000, ez: 1100, size: 800, op: 0.115, puffs: 13, stars: 50, hues: [0.02, 0.9] as [number, number] },
    { pitch: -60, yaw: 6, R: 7600, ex: 2200, ey: 900, ez: 1300, size: 900, op: 0.115, puffs: 10, stars: 30, hues: [0.55, 0.6] as [number, number] },
  ];
  const nebGroups: THREE.Group[] = [];
  nebs.forEach(o => { const n = buildNebula(rnd, texs, o); nebGroups.push(n); sky.add(n); });
  [[-24, -18, 11500, 0.5], [-56, 10, 12500, 1.1], [-11, 14, 12000, 2.2], [-38, 55, 11000, 0.3]].forEach(d => {
    const s = 260 + rnd() * 260;
    sky.add(sprite(texs.dgal, 0xc4d2ee, 0.3, s, s, skyPos(d[0], d[1], d[2]), d[3]));
  });
  {
    const d1 = skyPos(-58, -42, 1).sub(CAMP).normalize();
    const d2 = skyPos(-20, 50, 1).sub(CAMP).normalize();
    const nB = d1.clone().cross(d2).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nB);
    const pos: number[] = [], col: number[] = [], c = new THREE.Color();
    for (let i = 0; i < 5200; i++) {
      const th = rnd() * 6.283, r = 9200 + rnd() * 2600;
      const y = (rnd() + rnd() + rnd() - 1.5) * 900;
      const v = new THREE.Vector3(r * Math.cos(th), y, r * Math.sin(th)).applyQuaternion(q);
      pos.push(v.x, v.y, v.z);
      const gdamp = 1 - 0.5 * graphCone(v);
      const u = rnd();
      if (u > 0.93) c.setHSL(0.08, 0.5, 0.62);
      else if (u > 0.75) c.setHSL(0.59, 0.4, 0.7);
      else c.setHSL(0.56, 0.1, 0.68 + rnd() * 0.2);
      const b = (0.2 + rnd() * 0.34) * gdamp;
      col.push(c.r * b, c.g * b, c.b * b);
    }
    sky.add(mkPoints(pos, col, 1.9, 0.38, texs.soft, false));
  }
  const flares = buildFlares(rnd, texs.flare);
  const dust = buildDust(rnd, texs.soft);
  sky.add(flares);
  sky.add(dust);
  return { sky, shells, gal, galNormal, nebs: nebGroups, dust, flares };
}

/* ============================ labels ============================ */
interface LabelLine { text: string; color?: string; bold?: boolean; size?: number; }
function textSprite(lines: LabelLine[], wWorld: number, opts: { fade?: { near: number; far: number }; depthTest?: boolean }, labels: THREE.Sprite[]) {
  const W = 704, H = lines.length > 1 ? 132 : 64;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  x.textAlign = "center";
  x.textBaseline = "middle";
  let y = lines.length > 1 ? 38 : H / 2;
  x.shadowColor = "rgba(2,5,11,0.95)";
  x.shadowBlur = 7;
  lines.forEach(ln => {
    x.font = `${ln.bold ? "700 " : "500 "}${ln.size || 30}px ui-monospace,Consolas,monospace`;
    x.fillStyle = ln.color || "#d6ecff";
    x.fillText(ln.text, W / 2, y);
    y += 56;
  });
  const t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: opts.depthTest !== false }));
  s.scale.set(wWorld, (wWorld * H) / W, 1);
  s.userData.fade = opts.fade || null;
  labels.push(s);
  return s;
}
function rateLabel(labels: THREE.Sprite[]) {
  const W = 512, H = 92, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  const t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
  s.scale.set(112, (112 * H) / W, 1);
  let last = "";
  s.userData.setText = (down: number, upv: number, known: boolean, port: number | null) => {
    const key = `${known ? `${fmtRate(down)}|${fmtRate(upv)}` : "nd"}|${port ?? ""}`;
    if (key === last) return;
    last = key;
    x.clearRect(0, 0, W, H);
    x.textBaseline = "middle";
    x.font = "600 36px ui-monospace,Consolas,monospace";
    const l1w = known ? x.measureText(`↓ ${fmtRate(down)}  ↑ ${fmtRate(upv)}`).width : x.measureText("no data").width;
    const l2 = port != null ? `port ${port}` : null;
    const pw = Math.min(W, l1w + 34), ph = l2 ? 88 : 54;
    x.fillStyle = "rgba(3,9,17,0.72)";
    x.fillRect((W - pw) / 2, (H - ph) / 2, pw, ph);
    const y1 = l2 ? 30 : H / 2;
    if (!known) {
      x.textAlign = "center";
      x.fillStyle = "#5a6a7c";
      x.fillText("no data", W / 2, y1);
    } else {
      x.textAlign = "right";
      x.fillStyle = hex(PAL.cyan);
      x.fillText(`↓ ${fmtRate(down)}`, W / 2 - 8, y1);
      x.textAlign = "left";
      x.fillStyle = hex(PAL.magenta);
      x.fillText(`↑ ${fmtRate(upv)}`, W / 2 + 8, y1);
    }
    if (l2) {
      x.textAlign = "center";
      x.font = "500 26px ui-monospace,Consolas,monospace";
      x.fillStyle = "#7fa3c8";
      x.fillText(l2, W / 2, 66);
    }
    t.needsUpdate = true;
  };
  labels.push(s);
  return s;
}
function workLabel(labels: THREE.Sprite[]) {
  const W = 512, H = 88, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  const t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
  sp.scale.set(150, (150 * H) / W, 1);
  sp.visible = false;
  let last = "";
  sp.userData.setText = (name: string, cpu: number, io: number, mem: number | null) => {
    const line2 = `cpu ${Number(cpu).toFixed(1)}%${mem != null ? ` · mem ${Number(mem).toFixed(0)}%` : ""}${io > 0 ? ` · io ${fmtIO(io)}` : ""}`;
    const key = `${name}|${line2}`;
    if (key === last) return;
    last = key;
    x.clearRect(0, 0, W, H);
    x.textBaseline = "middle";
    x.textAlign = "left";
    x.shadowColor = "rgba(2,5,11,0.95)";
    x.shadowBlur = 9;
    x.font = "700 30px ui-monospace,Consolas,monospace";
    x.fillStyle = "#eaf6ff";
    x.fillText(name, 6, 26);
    x.font = "600 23px ui-monospace,Consolas,monospace";
    x.fillStyle = hex(PAL.warn);
    x.fillText(line2, 6, 62);
    t.needsUpdate = true;
  };
  labels.push(sp);
  return sp;
}

/* ============================ network scene ============================ */
interface Sim {
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  background: THREE.Group;
  graph: THREE.Group | null;
  byId: Record<string, SceneNode>;
  nodes: SceneNode[];
  links: LinkSim[];
  infra: SceneNode[];
  guestIM: THREE.InstancedMesh | null;
  guestIMs: THREE.InstancedMesh[];
  guestIdx: string[];
  labels: THREE.Sprite[];
  rateLabels: THREE.Sprite[];
  hotLabels: THREE.Sprite[];
  hotLeaders: THREE.Line[];
  alertRings: THREE.Mesh[];
  pick: THREE.Object3D[];
  sig: string;
  lastTs: number;
  tweenUntil: number;
  center: THREE.Vector3;
  fitDist: number;
  layoutCaps: Array<{ txt: string; col: string; list: SceneNode[]; x: number; y: number; z: number }>;
  manualAt: number;
  mouse: THREE.Vector2;
  ray: THREE.Raycaster;
  tip: HTMLDivElement | null;
  pGeo: THREE.BufferGeometry | null;
  pPts: THREE.Points | null;
  pPos: Float32Array;
  pCol: Float32Array;
  pBase: Float32Array;
  pLink: Int16Array;
  pDir: Int8Array;
  pProg: Float32Array;
  pRate: Float32Array;
  pActive: number;
  lineSet: THREE.LineSegments | null;
  dashSet: THREE.LineSegments | null;
  tmpV: THREE.Vector3;
  tmpQ: THREE.Quaternion;
  tmpM: THREE.Matrix4;
  up: THREE.Vector3;
  t: number;
  pt: number;
  focusAll: boolean;
  focusAnim: boolean;
  needSettle: boolean;
  tour: Tour | null;
  tourEl: HTMLElement | null;
  tourTxt: string;
  man: { az: number; el: number; dist: number };
  manTarget: THREE.Vector3;
  dragging: boolean;
  lastPointer: { x: number; y: number };
  applyLive?: (deps: Dependencies, bi: number, bo: number, si: number, ex: { cpu?: number }) => void;
  dispose?: () => void;
}
interface LinkSim {
  data: TopoLink;
  aId: string;
  bId: string;
  childId: string;
  trunk: boolean;
  measured: boolean;
  mesh: THREE.Mesh | null;
  mat: THREE.MeshBasicMaterial | null;
  lbl: THREE.Sprite | null;
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  px: number; pz: number;
  len: number;
  peak: number;
  vStart: number;
  vCount: number;
  set: string;
  _lf: number;
  pStart: number;
  pCount: number;
}
interface Stop {
  name: string;
  key?: string;
  ids: Record<string, number> | null;
  spread: boolean;
  az: number;
  el: number;
  c: THREE.Vector3;
  dist: number;
  list: SceneNode[] | null;
}
interface Tour {
  stops: Stop[];
  idx: number;
  next: number;
  phase: "hold" | "travel";
  t0: number;
  tHold: number;
  P0: THREE.Vector3;
  T0: THREE.Vector3;
  travelT: number;
  manual: boolean;
  switched: boolean;
  arcH: number;
}
const TP = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };

const AX = new THREE.Vector3(0, 0, 1);

let GEO: Record<string, THREE.BufferGeometry> | null = null;
function geos() {
  if (GEO) return GEO;
  GEO = {
    gateway: new THREE.BoxGeometry(44, 13, 21),
    switch: new THREE.BoxGeometry(38, 10, 17),
    pvehost: new THREE.BoxGeometry(22, 30, 22),
    ap: new THREE.CylinderGeometry(11, 12.5, 4.5, 24),
    external: new THREE.BoxGeometry(22, 14, 14),
    wanCore: new THREE.SphereGeometry(18, 20, 16),
    wanWire: new THREE.IcosahedronGeometry(24, 1),
    guest: new THREE.BoxGeometry(7, 7, 7),
    ring: new THREE.RingGeometry(16, 19, 40).rotateX(-Math.PI / 2),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 8, 1, true),
  };
  return GEO;
}
function accentFor(n: SceneNode) {
  if (n.status === "down") return PAL.alert;
  if (n.status === "unknown") return PAL.unk;
  if (n.status === "warn") return PAL.warn;
  const cat = n.meta && n.meta.cat;
  if (cat && CAT[cat]) return CAT[cat];
  return { wan: PAL.cyan, gateway: PAL.cyan, switch: PAL.cyan, pvehost: PAL.ok, external: PAL.warn }[n.kind] || PAL.dim;
}
function loadU(n: SceneNode) {
  const cpu = n.meta && n.meta.cpu;
  if (cpu == null) return null;
  return Math.min(1, Math.pow(Math.max(0, Math.min(100, +cpu)) / 100, 0.5));
}
function guestColor(n: SceneNode) {
  const c = new THREE.Color();
  if (n.status === "down") { c.setHex(0x96242f); return c; }
  if (n.status === "unknown") { c.setHex(0x39465a); return c; }
  c.setHex(CAT[(n.meta && n.meta.cat) || "infra"] || 0x8fb0d0);
  const u = loadU(n);
  if (u === null) { c.multiplyScalar(0.55); return c; }
  c.multiplyScalar(0.4 + 0.95 * u);
  if (u > 0.55) c.lerp(new THREE.Color(PAL.warn), ((u - 0.55) / 0.45) * 0.5);
  return c;
}
function guestScale(n: SceneNode) {
  if (n.status !== "up") return 1;
  const u = loadU(n);
  return u === null ? 1 : 1 + 0.75 * u;
}
function addAlertRing(sim: Sim, n: SceneNode, grp: THREE.Group, color: number) {
  const ring = new THREE.Mesh(geos().ring, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -(n._h || 4) - 1;
  grp.add(ring);
  sim.alertRings.push(ring);
  n._ring = ring;
  n._hasRing = true;
}
function makeTexts() {
  return { soft: softTex(), flare: flareTex(), lump1: lumpyTex(11), lump2: lumpyTex(47), core: galaxyCoreTex(), dgal: distGalTex(), dot: dotTex() };
}

/* ---- layout (tidy layered tree; sorted by kind, deterministic) ---- */
function computeLayout(topo: TopoTopo, sim: Sim) {
  const byId: Record<string, SceneNode> = {};
  const kids: Record<string, SceneNode[]> = {};
  topo.nodes.forEach(n => { byId[n.id] = n; n._x = 0; n._y = 0; n._z = 0; });
  let root: SceneNode | null = null;
  topo.nodes.forEach(n => { if (!root && n.kind === "wan") root = n; });
  if (!root) root = topo.nodes[0];
  const linkPeer: Record<string, string> = {};
  (topo.links || []).forEach(l => {
    if (!linkPeer[l.source]) linkPeer[l.source] = l.target;
    if (!linkPeer[l.target]) linkPeer[l.target] = l.source;
  });
  topo.nodes.forEach(n => {
    if (n === root) { n._par = null; return; }
    const p = n.parent && byId[n.parent] ? n.parent
      : linkPeer[n.id] && byId[linkPeer[n.id]] && linkPeer[n.id] !== n.id ? linkPeer[n.id] : root!.id;
    n._par = p;
    (kids[p] = kids[p] || []).push(n);
  });
  const dmemo: Record<string, number> = {};
  const depth = (n: SceneNode, guard: number): number => {
    if (dmemo[n.id] !== undefined) return dmemo[n.id];
    guard = guard || 0;
    const p = n._par && byId[n._par] ? byId[n._par] : null;
    const d = !p || guard > 12 ? 0 : depth(p, guard + 1) + 1;
    dmemo[n.id] = d;
    return d;
  };
  topo.nodes.forEach(n => { depth(n, 0); });
  topo.nodes.forEach(n => { n._depth = dmemo[n.id] || 0; });
  const sortKids = (arr: SceneNode[]) => {
    arr.sort((a, b) => {
      const ka = KIND_ORDER[a.kind] || 9, kb = KIND_ORDER[b.kind] || 9;
      if (ka !== kb) return ka - kb;
      const pa = a.meta && a.meta.port, pb = b.meta && b.meta.port;
      if (pa != null && pb != null && pa !== pb) return pa - pb;
      return a.id < b.id ? -1 : 1;
    });
  };
  const split = (id: string) => {
    const all = kids[id] || [];
    const infraN: SceneNode[] = [], leaf: SceneNode[] = [];
    all.forEach(k => { (k.kind === "guest" || k.kind === "client" ? leaf : infraN).push(k); });
    sortKids(infraN);
    sortKids(leaf);
    return { infra: infraN, leaf };
  };
  interface GuestPlanResult { blocks: Array<{ cat: string; list: SceneNode[]; lays: number; cols: number; rows: number }>; gcols: number; cellW: number; cellD: number; span: number; }
  function guestPlan(leaf: SceneNode[]): GuestPlanResult {
    const groups: Record<string, SceneNode[]> = {};
    leaf.forEach(k => { const c = (k.meta && k.meta.cat) || "infra"; (groups[c] = groups[c] || []).push(k); });
    const cats = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length || (a < b ? -1 : 1));
    const blocks = cats.map(c => {
      const g = groups[c];
      g.sort((a, b) => (a.id < b.id ? -1 : 1));
      const n = g.length;
      const lays = Math.min(3, Math.ceil(Math.sqrt(n)));
      const cols = Math.min(3, Math.ceil(Math.sqrt(n / lays)));
      const rows = Math.ceil(n / (cols * lays));
      return { cat: c, list: g, lays, cols, rows };
    });
    const gcols = Math.min(2, blocks.length);
    let cellW = 0, cellD = 0;
    blocks.forEach(b => {
      cellW = Math.max(cellW, b.cols * LEAF_SP);
      cellD = Math.max(cellD, b.rows * LEAF_SP);
    });
    return { blocks, gcols, cellW, cellD, span: gcols * cellW + (gcols - 1) * CAT_GAP + 10 };
  }
  const spanMemo: Record<string, number> = {};
  const caps: Array<{ txt: string; col: string; list: SceneNode[]; x: number; y: number; z: number }> = [];
  function leafSpan(leaf: SceneNode[]) {
    return leaf[0].kind === "guest" ? guestPlan(leaf).span : Math.max(1, Math.ceil(Math.pow(leaf.length, 1 / 3))) * LEAF_SP + 8;
  }
  function span(n: SceneNode): number {
    if (spanMemo[n.id] !== undefined) return spanMemo[n.id];
    const s = split(n.id);
    const items: number[] = [];
    s.infra.forEach(k => items.push(span(k)));
    if (s.leaf.length) items.push(leafSpan(s.leaf));
    let tot = 0;
    items.forEach(v => { tot += v; });
    tot += Math.max(0, items.length - 1) * GAP;
    return (spanMemo[n.id] = Math.max(MIN_SPAN, tot));
  }
  function place(n: SceneNode, z: number) {
    n._x = n._depth * TIER_X;
    n._z = z;
    n._y = 0;
    const s = split(n.id);
    const items: Array<{ span: number; node?: SceneNode; blk?: GuestPlanResult }> = [];
    s.infra.forEach(k => items.push({ node: k, span: span(k) }));
    let blk: GuestPlanResult | null = null;
    if (s.leaf.length) {
      blk = guestPlan(s.leaf);
      items.push({ blk, span: blk.span });
    }
    let tot = 0;
    items.forEach(it => { tot += it.span; });
    tot += Math.max(0, items.length - 1) * GAP;
    let cur = z - tot / 2;
    items.forEach(it => {
      const c = cur + it.span / 2;
      if (it.node) place(it.node, c);
      else if (it.blk && blk) {
        const plan = blk;
        const x0 = n._x + TIER_X * 0.62;
        const w = plan.gcols * plan.cellW + (plan.gcols - 1) * CAT_GAP;
        n._tourBlocks = [];
        plan.blocks.forEach((B, bi) => {
          const gr = Math.floor(bi / plan.gcols), gc = bi % plan.gcols;
          const bz = c - w / 2 + gc * (plan.cellW + CAT_GAP) + plan.cellW / 2;
          const bx = x0 + gr * (plan.cellD + CAT_GAP);
          B.list.forEach((k, idx) => {
            const colI = idx % B.cols;
            const row = Math.floor(idx / B.cols) % B.rows;
            const lay = Math.floor(idx / (B.cols * B.rows));
            k._z = bz + (colI - (B.cols - 1) / 2) * LEAF_SP;
            k._x = bx + row * LEAF_SP;
            k._y = (lay - (B.lays - 1) / 2) * LEAF_SP;
            k._lstag = (colI + 2 * row) % 3;
            k._bcx = bx + ((B.rows - 1) * LEAF_SP) / 2;
            k._bcy = 0;
            k._bcz = bz;
          });
          caps.push({
            txt: `${B.cat.toUpperCase()} · ${B.list.length}`,
            col: hex(CAT[B.cat] !== undefined ? CAT[B.cat] : 0x8fb0d0),
            list: B.list,
            x: bx + ((B.rows - 1) * LEAF_SP) / 2,
            y: ((B.lays - 1) / 2) * LEAF_SP + 34,
            z: bz,
          });
          n._tourBlocks.push({ cat: B.cat, list: B.list });
        });
      }
      cur += it.span + GAP;
    });
  }
  place(root, 0);
  const bb = new THREE.Box3();
  topo.nodes.forEach(n => bb.expandByPoint(sim.tmpV.set(n._x, n._y, n._z)));
  const c = bb.getCenter(new THREE.Vector3());
  topo.nodes.forEach(n => {
    n._x -= c.x; n._z -= c.z;
    if (n._bcx !== undefined) { n._bcx -= c.x; n._bcz -= c.z; }
  });
  caps.forEach(cp => { cp.x -= c.x; cp.z -= c.z; });
  sim.layoutCaps = caps;
  bb.min.sub(c);
  bb.max.sub(c);
  return bb;
}

/* ---- node geometry ---- */
function makeInfraNode(sim: Sim, n: SceneNode) {
  const G = geos();
  const grp = new THREE.Group();
  const acc = accentFor(n);
  let body: THREE.Mesh;
  let edge: THREE.LineSegments | null = null;
  if (n.kind === "wan") {
    body = new THREE.Mesh(G.wanCore, new THREE.MeshStandardMaterial({ color: 0x0c2030, roughness: 0.4, metalness: 0.3, emissive: 0x0a2436, emissiveIntensity: 0.6 }));
    const wire = new THREE.Mesh(G.wanWire, new THREE.MeshBasicMaterial({ color: acc, wireframe: true, transparent: true, opacity: 0.5 }));
    grp.add(body, wire);
    n._h = 25;
  } else {
    const geo = G[n.kind] || G.external;
    const mat = new THREE.MeshStandardMaterial({ color: PAL.body, roughness: 0.5, metalness: 0.45, emissive: 0x0a1624, emissiveIntensity: 0.55 });
    body = new THREE.Mesh(geo, mat);
    edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: acc, transparent: true, opacity: 0.85 }));
    grp.add(body, edge);
    n._h = { gateway: 7, switch: 6, pvehost: 16, ap: 3, external: 8 }[n.kind] || 8;
  }
  n._r = { wan: 22, gateway: 26, switch: 23, pvehost: 19, ap: 14, external: 14 }[n.kind] || 14;
  grp.position.set(n._x, n._y, n._z);
  body.userData.nsId = n.id;
  sim.pick.push(body);
  n._grp = grp;
  n._body = body;
  n._edge = edge;
  if (n.status === "down" || n.status === "warn") addAlertRing(sim, n, grp, n.status === "down" ? PAL.alert : PAL.warn);
  const lbl = textSprite([
    { text: n.label, size: 52, bold: true, color: n.status === "down" ? hex(PAL.alert) : "#e2f2ff" },
    { text: n.ip || "", size: 34, color: "#7fa3c8" },
  ], n.kind === "wan" || n.kind === "gateway" ? 130 : 116, { depthTest: false }, sim.labels);
  lbl.position.set(n._x, n._y + n._h + 18, n._z);
  lbl.userData.focN = n;
  sim.graph!.add(lbl);
  n._lbl = lbl;
  return grp;
}
function makeInstanced(sim: Sim, geo: THREE.BufferGeometry, list: SceneNode[]) {
  if (!list.length) return null;
  const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), list.length);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  list.forEach((n, i) => {
    sim.tmpM.makeTranslation(n._x, n._y, n._z);
    im.setMatrixAt(i, sim.tmpM);
    im.setColorAt(i, guestColor(n));
    sim.guestIdx.push(n.id);
    n._inst = { im, i };
  });
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  sim.graph!.add(im);
  im.userData.nsInstanced = "guestIdx";
  sim.pick.push(im);
  return im;
}

/* ---- links ---- */
function childOf(sim: Sim, l: TopoLink) {
  const a = sim.byId[l.source], b = sim.byId[l.target];
  if (!a || !b) return null;
  return a._depth > b._depth ? a : b;
}
function buildLinks(sim: Sim, topo: TopoTopo) {
  const dashV: number[] = [];
  topo.links.forEach(l => {
    const a = sim.byId[l.source], b = sim.byId[l.target];
    if (!a || !b) return;
    const child = childOf(sim, l);
    const parent = child === a ? b : a;
    const isInfra = (n: SceneNode) => n.kind !== "guest" && n.kind !== "client";
    const L: LinkSim = {
      data: l,
      aId: parent.id, bId: child!.id, childId: child!.id,
      trunk: isInfra(a) && isInfra(b),
      measured: !!l.measured,
      mesh: null, mat: null, lbl: null,
      ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, px: 0, pz: 0, len: 1, peak: 0,
      vStart: -1, vCount: 0, set: "dash", _lf: 1, pStart: 0, pCount: 0,
    };
    sim.links.push(L);
    if (!L.measured) {
      L.set = "dash";
      L.vStart = dashV.length;
      dashV.push(0, 0, 0, 0, 0, 0);
      L.vCount = 2;
      return;
    }
    if (L.trunk) {
      L.set = "trunk";
      L.mat = new THREE.MeshBasicMaterial({ color: PAL.linkDim, transparent: true, opacity: 0.95 });
      L.mesh = new THREE.Mesh(geos().cyl, L.mat);
      sim.graph!.add(L.mesh);
      L.lbl = rateLabel(sim.rateLabels);
      L.lbl.userData.focL = L;
      sim.graph!.add(L.lbl);
    }
  });
  if (dashV.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dashV), 3).setUsage(THREE.DynamicDrawUsage));
    const ls = new THREE.LineSegments(g, new THREE.LineDashedMaterial({ color: 0x6d7f94, dashSize: 6, gapSize: 5, transparent: true, opacity: 0.75 }));
    ls.frustumCulled = false;
    sim.graph!.add(ls);
    sim.dashSet = ls;
  }
  updateLinkGeometry(sim, true);
}
function updateLinkGeometry(sim: Sim, force: boolean) {
  const tween = sim.t < sim.tweenUntil;
  if (!tween && !force) return;
  sim.links.forEach(L => {
    const a = sim.byId[L.aId], b = sim.byId[L.bId];
    if (!a || !b) return;
    L.ax = a._cx; L.ay = a._cy + (a._h ? a._h * 0.15 : 0); L.az = a._cz;
    L.bx = b._cx; L.by = b._cy; L.bz = b._cz;
    const dx = L.bx - L.ax, dy = L.by - L.ay, dz = L.bz - L.az;
    L.len = Math.max(1e-3, Math.sqrt(dx * dx + dy * dy + dz * dz));
    const hl = Math.max(1e-3, Math.sqrt(dx * dx + dz * dz));
    if (hl > 2) { L.px = -dz / hl; L.pz = dx / hl; } else { L.px = 1; L.pz = 0; }
    L.peak = 0;
    if (L.mesh) {
      const rA = a._r || 6, rB = b._r || 6;
      const ux = dx / L.len, uy = dy / L.len, uz = dz / L.len;
      const tLen = Math.max(2, L.len - rA - rB);
      L.mesh.position.set((L.ax + L.bx) / 2 + (ux * (rA - rB)) / 2, (L.ay + L.by) / 2 + (uy * (rA - rB)) / 2, (L.az + L.bz) / 2 + (uz * (rA - rB)) / 2);
      sim.tmpV.set(ux, uy, uz);
      L.mesh.quaternion.setFromUnitVectors(sim.up, sim.tmpV);
      const r = L.mesh.userData.r || 0.9;
      L.mesh.scale.set(r, tLen, r);
      if (L.lbl) L.lbl.position.set((L.ax + L.bx) / 2, (L.ay + L.by) / 2 - 14, (L.az + L.bz) / 2);
    } else if (L.set === "dash" && sim.dashSet) {
      const pd = (sim.dashSet.geometry.attributes.position.array as ArrayLike<number>);
      const od = L.vStart;
      (pd as any)[od] = L.ax; (pd as any)[od + 1] = L.ay; (pd as any)[od + 2] = L.az;
      (pd as any)[od + 3] = L.bx; (pd as any)[od + 4] = L.by; (pd as any)[od + 5] = L.bz;
    }
  });
  if (sim.dashSet) {
    sim.dashSet.geometry.attributes.position.needsUpdate = true;
    sim.dashSet.computeLineDistances();
  }
}

/* ---- focus ---- */
function nodeFocus(sim: Sim, id: string) {
  const n = sim.byId[id];
  return !n || n._foc === undefined ? 1 : n._foc;
}
function linkFocus(sim: Sim, L: LinkSim) {
  return Math.min(nodeFocus(sim, L.aId), nodeFocus(sim, L.bId));
}
function spriteFocus(sim: Sim, ud: any) {
  if (ud.focN) return nodeFocus(sim, ud.focN.id);
  if (ud.focList) {
    let m = 0;
    for (let i = 0; i < ud.focList.length && m < 1; i++) m = Math.max(m, nodeFocus(sim, ud.focList[i].id));
    return m;
  }
  return 1;
}

/* ---- tour ---- */
function setFocus(sim: Sim, ids: Record<string, number> | null, spreadIds: Record<string, number> | null) {
  sim.focusAll = !ids;
  sim.nodes.forEach(n => {
    n._focT = !ids || ids[n.id] ? 1 : FOC_FLOOR;
    n._sprdT = spreadIds && spreadIds[n.id] && n._bcx !== undefined ? 1 : 0;
  });
  sim.focusAnim = true;
}
function unionFocus(a: Stop, b: Stop) {
  if (!a.ids || !b.ids) return null;
  const f: Record<string, number> = {};
  Object.keys(a.ids).forEach(k => { f[k] = 1; });
  Object.keys(b.ids).forEach(k => { f[k] = 1; });
  return f;
}
function stopSpread(st: Stop) {
  return st.spread ? st.ids : null;
}
function unionSpread(a: Stop, b: Stop) {
  const sa = stopSpread(a), sb = stopSpread(b);
  if (!sa) return sb;
  if (!sb) return sa;
  const f: Record<string, number> = {};
  Object.keys(sa).forEach(k => { f[k] = 1; });
  Object.keys(sb).forEach(k => { f[k] = 1; });
  return f;
}
function forceFocus(sim: Sim, ids: Record<string, number> | null, spreadIds: Record<string, number> | null) {
  setFocus(sim, ids, spreadIds);
  sim.nodes.forEach(n => { n._foc = n._focT; n._sprd = n._sprdT || 0; });
  sim.focusAnim = true;
}
function focusTick(sim: Sim, dt: number) {
  if (!sim.focusAnim) return;
  const a = 1 - Math.exp(-dt * 4);
  let moving = 0;
  sim.nodes.forEach(n => {
    const tgt = n._focT === undefined ? 1 : n._focT;
    const f0 = n._foc === undefined ? 1 : n._foc;
    const f = f0 + (tgt - f0) * a;
    if (Math.abs(f - tgt) < 0.012) { n._foc = tgt; } else { n._foc = f; moving++; }
    const st = n._sprdT || 0, s0 = n._sprd || 0, sp = s0 + (st - s0) * a;
    if (Math.abs(sp - st) < 0.01) { n._sprd = st; } else { n._sprd = sp; moving++; }
    if (n._grp) {
      n._grp.visible = f > 0.02;
      const sc = Math.max(0.001, f);
      n._grp.scale.set(sc, sc, sc);
    }
  });
  syncNodeTransforms(sim, 1 - Math.exp(-dt * 4.5));
  updateLinkGeometry(sim, true);
  restyleLinks(sim);
  applyParticleFocus(sim);
  if (!moving) sim.focusAnim = false;
}
function mkStop(sim: Sim, name: string, list: SceneNode[], az: number, zoom: number, spread: boolean, el: number) {
  const st: Stop = { name, az: az || 0, el: el || CAM_EL, list, ids: {}, spread: !!spread, c: new THREE.Vector3(), dist: 240 };
  const bb = new THREE.Box3();
  list.forEach(n => {
    st.ids[n.id] = 1;
    let x = n._x, y = n._y, z = n._z;
    if (spread && n._bcx !== undefined) {
      x += SPR_L * (x - n._bcx);
      y += SPR_V * (y - n._bcy);
      z += SPR_L * (z - n._bcz);
    }
    const lw = n.kind === "guest" || n.kind === "client" ? 30 : n.kind === "external" ? 46 : n.kind === "wan" || n.kind === "gateway" ? 68 : 62;
    const yBot = n.kind === "external" ? 40 : 10;
    const yTop = n.kind === "guest" || n.kind === "client" ? 46 : n.kind === "external" ? 16 : (n._h || 8) + 34;
    bb.expandByPoint(sim.tmpV.set(x - lw, y - yBot, z - lw));
    bb.expandByPoint(sim.tmpV.set(x + lw, y + yTop, z + lw));
  });
  st.c = bb.getCenter(new THREE.Vector3());
  const ex = (bb.max.x - bb.min.x) / 2, ey = (bb.max.y - bb.min.y) / 2, ez = (bb.max.z - bb.min.z) / 2;
  const vf = sim.cam.fov * Math.PI / 360, ta = Math.tan(vf) * sim.cam.aspect;
  let w = 0, dep = 0;
  for (let i = -2; i <= 2; i++) {
    const a2 = st.az + (i * (T_SWAY + 0.03)) / 2;
    w = Math.max(w, ex * Math.abs(Math.cos(a2)) + ez * Math.abs(Math.sin(a2)));
    dep = Math.max(dep, ex * Math.abs(Math.sin(a2)) + ez * Math.abs(Math.cos(a2)));
  }
  const dH = w / (ta * 0.649) + dep;
  const dV = (dep * Math.sin(st.el) + ey * Math.cos(st.el)) / (Math.tan(vf) * 0.589) + dep;
  st.dist = Math.max(Math.max(dH, dV, 240) * 1.06 * (zoom || 1) * ECO_WIDE, 165);
  return st;
}
function buildTour(sim: Sim, setTourText: (t: string) => void) {
  const K: Record<string, SceneNode[]> = {};
  sim.nodes.forEach(n => { (K[n.kind] = K[n.kind] || []).push(n); });
  Object.keys(K).forEach(k => K[k].sort((a, b) => (a.id < b.id ? -1 : 1)));
  const wan = (K.wan || [])[0], gw = (K.gateway || [])[0];
  const stops: Stop[] = [{ name: "OVERVIEW", ids: null, spread: false, az: 0, el: CAM_EL, c: new THREE.Vector3(), dist: sim.fitDist, list: null, key: "over:0" }];
  if (wan || gw) {
    const st = mkStop(sim, "WAN EDGE", [wan as SceneNode, gw].filter((x): x is SceneNode => !!x), -0.5, 0.62, false, 0.46);
    st.key = "wan";
    stops.push(st);
  }
  const fab = [gw].concat(K.switch || [], K.pvehost || []).filter((x): x is SceneNode => !!x);
  if (fab.length > 1) {
    const st = mkStop(sim, "SWITCH FABRIC", fab, -0.15, 0.72, false, 0.68);
    st.key = "fabric";
    stops.push(st);
  }
  stops.push({ name: "OVERVIEW", ids: null, spread: false, az: 0, el: CAM_EL, c: new THREE.Vector3(), dist: sim.fitDist, list: null, key: "over:1" });
  (K.pvehost || []).forEach(h => {
    const blocks = h._tourBlocks || [];
    let total = 0;
    blocks.forEach(B => { total += B.list.length; });
    const hn = h.label.toUpperCase();
    if (total) {
      const lst = [h];
      blocks.forEach(B => { lst.push(...B.list); });
      const st = mkStop(sim, `HOST ${hn} · ${total} GUESTS`, lst, 1.15, 0.58, false, 0.52);
      st.key = `host:${h.id}`;
      stops.push(st);
      blocks.forEach(B => {
        const bst = mkStop(sim, `${hn} · ${B.cat.toUpperCase()} (${B.list.length})`, B.list, 1.05, 0.66, true, 0.7);
        bst.key = `blk:${h.id}:${B.cat}`;
        stops.push(bst);
      });
    }
  });
  const prev = sim.tour;
  sim.tour = {
    stops, idx: 0, next: 0, phase: "hold", t0: sim.t, tHold: sim.t,
    P0: new THREE.Vector3(), T0: new THREE.Vector3(), travelT: 5, manual: false,
    switched: true, arcH: 0,
  };
  if (prev && prev.stops.length) {
    const T = sim.tour;
    let iCur = -1, iNxt = -1;
    const nCur = prev.stops[prev.idx]?.key || "";
    const nNxt = prev.stops[prev.next]?.key || "";
    for (let i = 0; i < stops.length; i++) {
      if (stops[i].key === nCur && iCur < 0) iCur = i;
      if (stops[i].key === nNxt && iNxt < 0) iNxt = i;
    }
    if (iCur >= 0) {
      T.idx = iCur;
      T.phase = prev.phase;
      T.t0 = prev.t0;
      T.tHold = prev.tHold;
      T.next = iNxt >= 0 ? iNxt : (iCur + 1) % stops.length;
      T.P0.copy(prev.P0);
      T.T0.copy(prev.T0);
      T.travelT = prev.travelT;
      T.manual = prev.manual;
      T.switched = prev.switched;
      T.arcH = prev.arcH || 0;
      const here = stops[T.idx], there = stops[T.next];
      if (T.manual) forceFocus(sim, null, null);
      else if (T.phase === "hold") forceFocus(sim, here.ids, stopSpread(here));
      else if (T.switched) forceFocus(sim, there.ids, stopSpread(there));
      else forceFocus(sim, unionFocus(here, there), unionSpread(here, there));
    }
  }
  setTourText("◆ AUTO-TOUR · OVERVIEW · move mouse to take control");
}
function tourPose(sim: Sim, st: Stop, e: number, pos: THREE.Vector3, tgt: THREE.Vector3) {
  let az: number, dist: number, el: number;
  const c = new THREE.Vector3();
  if (!st.list) {
    az = CAM_SWAY * Math.sin((e * 6.2832) / CAM_PERIOD) + 0.06 * Math.sin((e * 6.2832) / 31);
    dist = sim.fitDist * (1.03 + 0.05 * Math.sin((e * 6.2832) / 127));
    el = CAM_EL;
    c.copy(sim.center);
  } else {
    az = st.az + T_SWAY * Math.sin((e * 6.2832) / T_SWAY_PERIOD);
    el = (st.el || CAM_EL) + 0.012 * Math.sin((e * 6.2832) / 41);
    dist = st.dist * (1 + 0.015 * Math.sin((e * 6.2832) / 23));
    c.copy(st.c);
  }
  dist *= 1 + 0.05 * Math.exp(-e * 0.8);
  tgt.copy(c);
  pos.set(c.x + dist * Math.cos(el) * Math.sin(az), c.y + dist * Math.sin(el), c.z + dist * Math.cos(el) * Math.cos(az));
}
function tourTick(sim: Sim, t: number, dt: number, setTourText: (s: string) => void) {
  const TR = sim.tour;
  if (!TR || !TR.stops.length) return;
  if (t - sim.manualAt <= MANUAL_HOLD) {
    if (!TR.manual) {
      TR.manual = true;
      setFocus(sim, null, null);
      setTourText("◆ MANUAL · tour resumes after idle");
    }
    return;
  }
  if (TR.manual) {
    TR.manual = false;
    TR.idx = 0; TR.next = 0; TR.phase = "travel"; TR.t0 = t;
    TR.P0.copy(sim.cam.position);
    TR.T0.copy(sim.manTarget);
    TR.travelT = 6;
    TR.switched = true;
    tourPose(sim, TR.stops[0], 0, TP.pos, TP.tgt);
    TR.arcH = Math.min(110, 26 + TP.pos.distanceTo(TR.P0) * 0.14);
    setTourText("◆ AUTO-TOUR · → OVERVIEW");
  }
  const st = TR.stops[TR.idx], e = t - TR.t0;
  if (TR.phase === "hold") {
    tourPose(sim, st, t - TR.tHold, TP.pos, TP.tgt);
    glide(sim, dt, 1.6);
    if (e > (st.list ? T_HOLD : T_HOLD_OVER)) {
      TR.next = (TR.idx + 1) % TR.stops.length;
      const nx = TR.stops[TR.next];
      setFocus(sim, unionFocus(st, nx), unionSpread(st, nx));
      TR.phase = "travel";
      TR.t0 = t;
      TR.switched = false;
      TR.P0.copy(sim.cam.position);
      TR.T0.copy(sim.manTarget);
      tourPose(sim, nx, 0, TP.pos, TP.tgt);
      const dTrav = TP.pos.distanceTo(TR.P0);
      TR.travelT = Math.min(6, Math.max(2.6, 1.8 + dTrav / 320));
      TR.arcH = Math.min(110, 26 + dTrav * 0.14);
      setTourText(`◆ AUTO-TOUR · → ${nx.name}`);
    }
  } else {
    const dst = TR.stops[TR.next];
    const sR = Math.min(1, e / TR.travelT);
    const sN = smst(sR);
    const sT = smst(Math.min(1, e / (TR.travelT * 0.82)));
    if (!TR.switched && sR >= 0.5) {
      TR.switched = true;
      setFocus(sim, dst.ids, stopSpread(dst));
    }
    tourPose(sim, dst, 0, TP.pos, TP.tgt);
    TP.pos.lerpVectors(TR.P0, TP.pos, sN);
    TP.tgt.lerpVectors(TR.T0, TP.tgt, sT);
    TP.pos.y += (TR.arcH || 0) * Math.sin(Math.PI * sN);
    glide(sim, dt, 3);
    if (e >= TR.travelT) {
      TR.idx = TR.next;
      TR.phase = "hold";
      TR.t0 = t;
      TR.tHold = t;
      const cur = TR.stops[TR.idx];
      setFocus(sim, cur.ids, stopSpread(cur));
      setTourText(`◆ AUTO-TOUR · ${cur.name}${cur.ids ? "" : " · move mouse to take control"}`);
    }
  }
}
function glide(sim: Sim, dt: number, k: number) {
  const a = 1 - Math.exp(-dt * k);
  sim.cam.position.lerp(TP.pos, a);
  sim.manTarget.lerp(TP.tgt, a);
}

/* ---- dynamics (every live refresh, mirrors applyDynamics) ---- */
const _cDim = new THREE.Color(), _cHot = new THREE.Color(), _cTmp = new THREE.Color();
function restyleLinks(sim: Sim) {
  sim.links.forEach(L => {
    const lf = linkFocus(sim, L);
    L._lf = lf;
    if (!L.measured) return;
    const u = bpsNorm(L.data.bps);
    const child = sim.byId[L.childId];
    const known = !!child && child.measured;
    if (L.mesh && L.mat) {
      _cDim.setHex(PAL.linkDim);
      _cHot.setHex(PAL.linkHot);
      L.mat.color.copy(_cDim).lerp(_cHot, u);
      L.mat.opacity = 0.95 * lf;
      L.mesh.visible = lf > 0.02;
      L.mesh.userData.r = 0.8 + 3.4 * u;
      L.mesh.scale.x = L.mesh.scale.z = L.mesh.userData.r;
      if (L.lbl) L.lbl.userData.setText(known ? child.rx : 0, known ? child.tx : 0, !!known, child && child.meta ? child.meta.port ?? null : null);
    }
  });
}
function allocParticles(sim: Sim, rnd: () => number) {
  let slot = 0;
  sim.links.forEach((L, li) => {
    L.pStart = slot;
    L.pCount = 0;
    if (!L.measured) return;
    const child = sim.byId[L.childId];
    let down: number, up: number, neutral = false;
    if (child && child.measured && child.status !== "down") { down = child.rx; up = child.tx; }
    else if (child && child.status === "down") return;
    else { down = (L.data.bps || 0) / 2; up = (L.data.bps || 0) / 2; neutral = true; }
    slot = seed(sim, L, li, down, 1, neutral ? 0x8fb0d0 : PAL.cyan, slot, rnd, neutral);
    slot = seed(sim, L, li, up, -1, neutral ? 0x8fb0d0 : PAL.magenta, slot, rnd, neutral);
    L.pCount = slot - L.pStart;
  });
  sim.pActive = slot;
  sim.pGeo!.setDrawRange(0, slot);
  applyParticleFocus(sim);
}
const _pc = new THREE.Color();
function seed(sim: Sim, L: LinkSim, li: number, bps: number, dir: number, colHex: number, slot: number, rnd: () => number, neutral: boolean) {
  const u = bpsNorm(bps);
  if (u <= 0) return slot;
  const max = L.trunk ? TRUNK_MAXP : LEAF_MAXP;
  let n = Math.max(1, Math.round(u * max));
  if (neutral) n = Math.max(1, n >> 1);
  const rate = (50 + 240 * u) / L.len;
  _pc.setHex(colHex).multiplyScalar(0.55 + 0.45 * u);
  for (let i = 0; i < n && slot < P_CAP; i++, slot++) {
    sim.pLink[slot] = li;
    sim.pDir[slot] = dir;
    sim.pProg[slot] = (i / n + (rnd() * 0.9) / n) % 1;
    sim.pRate[slot] = rate;
    sim.pBase[slot * 3] = _pc.r;
    sim.pBase[slot * 3 + 1] = _pc.g;
    sim.pBase[slot * 3 + 2] = _pc.b;
  }
  return slot;
}
function applyParticleFocus(sim: Sim) {
  const n = sim.pActive;
  for (let s = 0; s < n; s++) {
    const L = sim.links[sim.pLink[s]];
    const f = L && L._lf !== undefined ? L._lf : 1;
    sim.pCol[s * 3] = sim.pBase[s * 3] * f;
    sim.pCol[s * 3 + 1] = sim.pBase[s * 3 + 1] * f;
    sim.pCol[s * 3 + 2] = sim.pBase[s * 3 + 2] * f;
  }
  sim.pGeo!.attributes.color.needsUpdate = true;
}
function tickParticles(sim: Sim, dt: number) {
  const n = sim.pActive;
  if (!n) return;
  const P = sim.pPos;
  const links = sim.links;
  const dir = sim.pDir;
  for (let s = 0; s < n; s++) {
    const L = links[sim.pLink[s]];
    let pr = sim.pProg[s] + sim.pRate[s] * dt;
    if (pr >= 1) pr -= 1;
    sim.pProg[s] = pr;
    const t = dir[s] > 0 ? pr : 1 - pr;
    let x: number, y: number, z: number;
    if (L.peak) {
      const u2 = 1 - t;
      const mx = (L.ax + L.bx) / 2, my = (L.ay + L.by) / 2 + L.peak, mz = (L.az + L.bz) / 2;
      x = u2 * u2 * L.ax + 2 * u2 * t * mx + t * t * L.bx;
      y = u2 * u2 * L.ay + 2 * u2 * t * my + t * t * L.by;
      z = u2 * u2 * L.az + 2 * u2 * t * mz + t * t * L.bz;
    } else {
      x = L.ax + (L.bx - L.ax) * t;
      y = L.ay + (L.by - L.ay) * t;
      z = L.az + (L.bz - L.az) * t;
    }
    const lane = dir[s] * LANE;
    P[s * 3] = x + L.px * lane;
    P[s * 3 + 1] = y + 0.8;
    P[s * 3 + 2] = z + L.pz * lane;
  }
  sim.pGeo!.attributes.position.needsUpdate = true;
}
function syncNodeTransforms(sim: Sim, alpha: number) {
  sim.nodes.forEach(n => {
    const sp = n._sprd || 0;
    const tx = n._x + (sp ? SPR_L * (n._x - (n._bcx ?? n._x)) : 0);
    const ty = n._y + (sp ? SPR_V * (n._y - (n._bcy ?? n._y)) : 0);
    const tz = n._z + (sp ? SPR_L * (n._z - (n._bcz ?? n._z)) : 0);
    n._cx += (tx - n._cx) * alpha;
    n._cy += (ty - n._cy) * alpha;
    n._cz += (tz - n._cz) * alpha;
    if (n._grp) n._grp.position.set(n._cx, n._cy, n._cz);
    if (n._lbl) n._lbl.position.set(n._cx, n._cy + ((n._h || 4) + (n._grp ? 18 : 5.5) + 5.5 * (n._lstag || 0)), n._cz);
    if (n._inst) {
      const sc = Math.max(0.002, (n._scl || 1) * n._foc);
      sim.tmpM.makeScale(sc, sc, sc);
      sim.tmpM.setPosition(n._cx, n._cy, n._cz);
      n._inst.im.setMatrixAt(n._inst.i, sim.tmpM);
    }
  });
  if (sim.guestIMs.length) sim.guestIMs.forEach(im => { im.instanceMatrix.needsUpdate = true; });
}
function updateHotLabels(sim: Sim) {
  return; // guests carry no CPU telemetry — the lattice stays a quiet dim map
}

/* ---- hover ---- */
function hover(sim: Sim) {
  if (!sim.tip || sim.mouse.x < -2) return;
  sim.ray.setFromCamera(sim.mouse, sim.cam);
  const hits = sim.ray.intersectObjects(sim.pick, false);
  let n: SceneNode | null = null;
  if (hits.length) {
    const h = hits[0];
    if (h.object.userData.nsId) n = sim.byId[h.object.userData.nsId as string];
    else if (h.object.userData.nsInstanced && h.instanceId !== undefined) n = sim.byId[sim.guestIdx[h.instanceId]];
  }
  if (!n) { sim.tip.style.display = "none"; return; }
  const sc = n.status === "down" ? hex(PAL.alert) : n.status === "unknown" ? hex(PAL.unk) : n.status === "warn" ? hex(PAL.warn) : hex(PAL.ok);
  const statusText = n.status === "warn" ? "degraded" : n.status;
  const rows = [`<b>${n.label || n.id}</b> · <span style="color:${sc}">${statusText}</span>`];
  const l2: string[] = [];
  if (n.ip) l2.push(n.ip);
  l2.push(n.kind);
  if (n.meta && n.meta.model) l2.push(n.meta.model);
  rows.push(l2.join(" · "));
  rows.push(`<span style="color:${hex(PAL.cyan)}">↓ ${fmtRate(n.rx)}</span> · <span style="color:${hex(PAL.magenta)}">↑ ${fmtRate(n.tx)}</span>`);
  if (n.meta && (n.meta.cpu != null || n.meta.mem_pct != null)) {
    const m3: string[] = [];
    if (n.meta.cpu != null) m3.push(`cpu ${Number(n.meta.cpu).toFixed(1)}%`);
    if (n.meta.mem_pct != null) m3.push(`mem ${Number(n.meta.mem_pct).toFixed(1)}%`);
    rows.push(m3.join(" · "));
  }
  if (n.meta && n.meta.up) {
    const up = n.meta.up;
    const dD = Math.floor(up / 86400), hH = Math.floor((up % 86400) / 3600);
    rows.push(`<span style="color:${hex(PAL.unk)}">up ${dD ? `${dD}d ` : ""}${hH}h</span>`);
  }
  sim.tip.innerHTML = rows.join("<br>");
  sim.tip.style.display = "block";
}

/* ============================ data model ============================ */
function buildTopology(deps: Dependencies, bytesIn: number, bytesOut: number, sampleInterval: number, extras: { cpu?: number; rpm?: number; p95?: number }) {
  const sec = Math.max(sampleInterval, 1);
  const rxTotal = bytesIn / sec;
  const txTotal = bytesOut / sec;
  const mkNode = (id: string, kind: string, parent: string | undefined, label: string, ip: string, status: string, rx: number, tx: number, cat?: string, meta?: NodeMeta): SceneNode => ({
    id, kind, parent, label, ip, status, rx, tx, measured: true, meta,
    _x: 0, _y: 0, _z: 0, _cx: 0, _cy: 0, _cz: 0, _depth: 0, _par: null, _h: 0, _r: 0, _lstag: 0,
    _scl: 1, _foc: 1, _focT: 1, _sprd: 0, _sprdT: 0,
    ...(cat ? { meta: { ...(meta || {}), cat } as NodeMeta } : {}),
  });
  const nodes: SceneNode[] = [
    mkNode("wan", "wan", undefined, "VERCEL EDGE", "edge.kampungcetak.com", stateToStatus(deps.vercel.state), rxTotal, txTotal, undefined, {}),
    mkNode("gateway", "gateway", "wan", "RAILWAY API", `${deps.railway.latencyMs ?? 0}ms probe`, stateToStatus(deps.railway.state), rxTotal, txTotal, undefined, { cpu: extras.cpu ?? null }),
    mkNode("mongo", "pvehost", "gateway", "MONGODB ATLAS", `${deps.mongo.latencyMs ?? 0}ms probe`, stateToStatus(deps.mongo.state), rxTotal * SHARE.mongo, txTotal * SHARE.mongo),
    mkNode("redis", "pvehost", "gateway", "REDIS", `${deps.redis.latencyMs ?? 0}ms probe`, stateToStatus(deps.redis.state), rxTotal * SHARE.redis, txTotal * SHARE.redis),
    mkNode("s3", "pvehost", "gateway", "AWS S3", `${deps.s3.latencyMs ?? 0}ms probe`, stateToStatus(deps.s3.state), rxTotal * SHARE.s3, txTotal * SHARE.s3),
  ];
  const guests: Array<[string, string, string]> = [
    ["tasks", "mongo", "tasks"],
    ["orders", "mongo", "orders"],
    ["users", "mongo", "users"],
    ["sessions", "redis", "web"],
    ["jobs", "redis", "jobs"],
    ["images", "s3", "media"],
    ["exports", "s3", "exports"],
  ];
  guests.forEach(([id, host, cat]) => {
    nodes.push(mkNode(id, "guest", host, id, "", "up", 0, 0, cat));
  });
  const links: TopoLink[] = [
    { source: "wan", target: "gateway", measured: true, bps: rxTotal + txTotal },
    { source: "gateway", target: "mongo", measured: true, bps: (rxTotal + txTotal) * SHARE.mongo },
    { source: "gateway", target: "redis", measured: true, bps: (rxTotal + txTotal) * SHARE.redis },
    { source: "gateway", target: "s3", measured: true, bps: (rxTotal + txTotal) * SHARE.s3 },
  ];
  guests.forEach(([id, host]) => { links.push({ source: host, target: id, measured: false, bps: 0 }); });
  return { nodes, links };
}

function buildGraph(sim: Sim, topo: TopoTopo, setTourText: (t: string) => void) {
  const graph = new THREE.Group();
  sim.graph = graph;
  sim.scene.add(graph);

  const bb = computeLayout(topo, sim);
  sim.center.copy(bb.getCenter(new THREE.Vector3()));
  const size = bb.getSize(new THREE.Vector3());

  sim.nodes = topo.nodes;
  topo.nodes.forEach(n => { sim.byId[n.id] = n; n._cx = n._x; n._cy = n._y; n._cz = n._z; });

  const infraList: SceneNode[] = [];
  const guestsByParent: Record<string, SceneNode[]> = {};
  topo.nodes.forEach(n => {
    if (n.kind === "guest" || n.kind === "client") {
      (guestsByParent[n.parent || ""] = guestsByParent[n.parent || ""] || []).push(n);
    } else {
      infraList.push(n);
    }
  });

  infraList.forEach(n => {
    const grp = makeInfraNode(sim, n);
    graph.add(grp);
  });

  Object.values(guestsByParent).forEach(list => {
    const im = makeInstanced(sim, geos().guest, list);
    if (im) { sim.guestIM = im; sim.guestIMs.push(im); }
  });

  buildLinks(sim, topo);

  sim.layoutCaps.forEach(cp => {
    const s = textSprite([{ text: cp.txt, size: 40, bold: true, color: cp.col }], 150, { depthTest: false }, sim.labels);
    s.position.set(cp.x, cp.y, cp.z);
    s.userData.focList = cp.list;
    graph.add(s);
  });

  const span = Math.max(size.x, size.z);
  const vf = sim.cam.fov * Math.PI / 360;
  sim.fitDist = Math.max(420, (span / 2) / Math.tan(vf) / 0.62);

  allocParticles(sim, mulberry32(9001));
  buildTour(sim, setTourText);

  forceFocus(sim, null, null);
  syncNodeTransforms(sim, 1);
  restyleLinks(sim);
}

function applyLive(sim: Sim, topo: TopoTopo) {
  const linkByKey: Record<string, LinkSim> = {};
  sim.links.forEach(L => { linkByKey[`${L.data.source}>${L.data.target}`] = L; });
  topo.links.forEach(l => {
    const L = linkByKey[`${l.source}>${l.target}`];
    if (L) L.data = l;
  });
  sim.nodes.forEach(n => {
    if (n._inst) {
      n._inst.im.setColorAt(n._inst.i, guestColor(n));
    } else if (n._edge) {
      n._edge.material.color.setHex(accentFor(n));
    }
    if (n._lbl && n.status === "down") n._lbl.material.color = new THREE.Color(1, 0.55, 0.6);
  });
  if (sim.guestIMs.length) sim.guestIMs.forEach(im => { if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  sim.nodes.forEach(n => { if (n._inst) n._scl = guestScale(n); });
  syncNodeTransforms(sim, 0);
  updateHotLabels(sim);
  restyleLinks(sim);
  updateLinkGeometry(sim, true);
  allocParticles(sim, mulberry32(9001));
}

/* ============================ component ============================ */
export default function GalaxyTopology({
  dependencies,
  bytesIn,
  bytesOut,
  sampleInterval,
  cpuPercent = 0,
  requestsPerMinute = 0,
  p95LatencyMs = 0,
  memoryBytes = 0,
  eventLoopLagMs = 0,
  uptimeSeconds = 0,
}: {
  dependencies: Dependencies;
  bytesIn: number;
  bytesOut: number;
  sampleInterval: number;
  cpuPercent?: number;
  requestsPerMinute?: number;
  p95LatencyMs?: number;
  memoryBytes?: number;
  eventLoopLagMs?: number;
  uptimeSeconds?: number;
}) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<HTMLParagraphElement>(null);
  const simRef = useRef<Sim | null>(null);
  const [tourText, setTourText] = useState("");
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const tourTextRef = useRef("");
  const setTourTextSafe = (t: string) => {
    if (tourRef.current && tourTextRef.current !== t) {
      tourTextRef.current = t;
      tourRef.current.textContent = t;
    }
  };

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PAL.bg);
    scene.fog = new THREE.FogExp2(PAL.bg, 0.0006);
    const camera = new THREE.PerspectiveCamera(42, 1, 8, 40000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(PAL.bg, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.45, 0.72);
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.setPixelRatio(renderer.getPixelRatio());

    const texs = makeTexts();
    const rnd = mulberry32(20260823);

    const skyData = buildSky(rnd, texs);
    scene.add(skyData.sky);

    /* lights + grid (netscene backdrop) */
    scene.add(new THREE.HemisphereLight(0x35577a, 0x070b12, 1.0));
    const dl = new THREE.DirectionalLight(0xcfe4ff, 1.05);
    dl.position.set(-420, 540, 320);
    scene.add(dl);
    scene.add(new THREE.AmbientLight(0x223448, 0.6));
    const grid = new THREE.GridHelper(2600, 52, 0x11273f, 0x081525);
    grid.position.y = -64;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.LineBasicMaterial).opacity = 0.2;
    (grid.material as THREE.Material).depthWrite = false;
    scene.add(grid);

    /* particle pool */
    const pPos = new Float32Array(P_CAP * 3);
    const pCol = new Float32Array(P_CAP * 3);
    const pBase = new Float32Array(P_CAP * 3);
    const pLink = new Int16Array(P_CAP);
    const pDir = new Int8Array(P_CAP);
    const pProg = new Float32Array(P_CAP);
    const pRate = new Float32Array(P_CAP);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setDrawRange(0, 0);
    pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50000);
    const pPts = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 7.5, map: texs.dot, vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    pPts.frustumCulled = false;
    scene.add(pPts);

    const sim: Sim = {
      scene, cam: camera, background: skyData.sky, graph: null,
      byId: {}, nodes: [], links: [], infra: [],
      guestIM: null, guestIMs: [], guestIdx: [],
      labels: [], rateLabels: [], hotLabels: [], hotLeaders: [], alertRings: [],
      pick: [], sig: "", lastTs: 0,
      tweenUntil: 0, center: new THREE.Vector3(), fitDist: 900,
      layoutCaps: [],
      manualAt: -1e9, mouse: new THREE.Vector2(-9, -9), ray: new THREE.Raycaster(),
      tip: tooltipRef.current,
      pGeo, pPts, pPos, pCol, pBase, pLink, pDir, pProg, pRate, pActive: 0,
      lineSet: null, dashSet: null,
      tmpV: new THREE.Vector3(), tmpQ: new THREE.Quaternion(), tmpM: new THREE.Matrix4(),
      up: new THREE.Vector3(0, 1, 0), t: 0, pt: undefined as unknown as number,
      focusAll: true, focusAnim: false, needSettle: false,
      tour: null, tourEl: tourRef.current, tourTxt: "",
      man: { az: 0, el: 0.6, dist: 900 }, manTarget: new THREE.Vector3(),
      dragging: false, lastPointer: { x: 0, y: 0 },
    };
    sim.ray.params.Points = { threshold: 0 };
    scene.add(sim.background);
    simRef.current = sim;

    const initialTopo = buildTopology(dependencies, bytesIn, bytesOut, sampleInterval, { cpu: cpuPercent });
    buildGraph(sim, initialTopo, setTourTextSafe);

    /* camera initial pose at overview */
    tourPose(sim, sim.tour!.stops[0], 0, sim.cam.position, sim.manTarget);
    sim.cam.lookAt(sim.manTarget);
    tourPose(sim, sim.tour!.stops[0], 0, TP.pos, TP.tgt);
    sim.tour!.P0.copy(sim.cam.position);
    sim.tour!.T0.copy(sim.manTarget);

    /* ---- interaction: drag-orbit, wheel dolly, hover ---- */
    const syncMan = () => {
      const dx = sim.cam.position.x - sim.manTarget.x;
      const dy = sim.cam.position.y - sim.manTarget.y;
      const dz = sim.cam.position.z - sim.manTarget.z;
      sim.man.dist = Math.max(120, Math.sqrt(dx * dx + dy * dy + dz * dz));
      sim.man.az = Math.atan2(dx, dz);
      sim.man.el = Math.max(0.1, Math.min(1.35, Math.asin(dy / sim.man.dist)));
    };
    const applyMan = () => {
      const el = Math.max(0.1, Math.min(1.35, sim.man.el));
      const dist = Math.max(120, Math.min(6000, sim.man.dist));
      sim.cam.position.set(
        sim.manTarget.x + dist * Math.cos(el) * Math.sin(sim.man.az),
        sim.manTarget.y + dist * Math.sin(el),
        sim.manTarget.z + dist * Math.cos(el) * Math.cos(sim.man.az),
      );
      sim.cam.lookAt(sim.manTarget);
    };
    const onPointerDown = (e: PointerEvent) => {
      sim.dragging = true;
      sim.lastPointer = { x: e.clientX, y: e.clientY };
      sim.manualAt = sim.t;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      sim.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      sim.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (sim.dragging) {
        sim.manualAt = sim.t;
        syncMan();
        sim.man.az -= (e.clientX - sim.lastPointer.x) * 0.0045;
        sim.man.el += (e.clientY - sim.lastPointer.y) * 0.004;
        sim.lastPointer = { x: e.clientX, y: e.clientY };
        applyMan();
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      sim.dragging = false;
      renderer.domElement.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sim.manualAt = sim.t;
      syncMan();
      sim.man.dist *= 1 + e.deltaY * 0.0012;
      applyMan();
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let frame = 0;
    let last = performance.now();
    const started = performance.now();
    sim.pt = 0;
    let hoverFrame = 0;
    const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      sim.t = (now - started) / 1000;
      const rdt = Math.min(1, Math.max(0.001, sim.t - sim.pt));
      sim.pt = sim.t;
      last = now;

      /* sky motion (galaxy.js tick) */
      skyData.shells.rotation.y = sim.t * 0.0021;
      skyData.shells.rotation.x = Math.sin(sim.t * 0.0009) * 0.03;
      skyData.gal.rotation.set(0, 0, 0);
      skyData.gal.quaternion.setFromUnitVectors(AX, skyData.galNormal);
      skyData.gal.rotateZ(0.9 + sim.t * 0.0038);
      skyData.nebs.forEach((neb, i) => {
        const s = 1 + 0.07 * Math.sin((sim.t * 0.1256) / 10 + i * 2.1);
        neb.scale.set(s, s, s);
      });
      skyData.dust.rotation.y = sim.t * 0.004;

      /* camera: manual control or auto-tour */
      if (sim.t - sim.manualAt <= MANUAL_HOLD) {
        if (!sim.tour!.manual) {
          sim.tour!.manual = true;
          setFocus(sim, null, null);
          setTourTextSafe("◆ MANUAL · tour resumes after idle");
        }
        if (sim.dragging || true) applyMan();
      } else {
        tourTick(sim, sim.t, rdt, setTourTextSafe);
      }

      tickParticles(sim, dt);

      for (let i = 0; i < sim.alertRings.length; i++) {
        sim.alertRings[i].material.opacity = 0.4 + 0.3 * Math.sin(sim.t * 2.2);
      }

      const cp = sim.cam.position;
      for (let li = 0; li < sim.labels.length; li++) {
        const L = sim.labels[li];
        const ud = L.userData;
        let op = spriteFocus(sim, ud);
        op = op < 0.5 ? 0 : (op - 0.5) * 2;
        if (ud.fade) {
          const dx = L.position.x - cp.x, dy = L.position.y - cp.y, dz = L.position.z - cp.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          op *= Math.max(0, Math.min(1, (ud.fade.far - d) / (ud.fade.far - ud.fade.near)));
        }
        L.material.opacity = op;
        L.visible = op > 0.02;
      }
      for (let ri = 0; ri < sim.rateLabels.length; ri++) {
        const R = sim.rateLabels[ri];
        let rop = R.userData.focL === undefined ? 1 : linkFocus(sim, R.userData.focL as LinkSim);
        rop = rop < 0.5 ? 0 : (rop - 0.5) * 2;
        R.material.opacity = rop;
        R.visible = rop > 0.02;
      }

      focusTick(sim, rdt);
      if (!motionReduced && hoverFrame++ % 2 === 0) hover(sim);
      composer.render();
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    simRef.current.applyLive = (deps: Dependencies, bi: number, bo: number, si: number, ex: { cpu?: number }) => {
      const topo = buildTopology(deps, bi, bo, si, ex);
      topo.nodes.forEach(nn => {
        const o = sim.byId[nn.id];
        if (!o) return;
        const statusChanged = o.status !== nn.status;
        o.rx = nn.rx; o.tx = nn.tx; o.measured = nn.measured;
        o.meta = nn.meta || o.meta; o.status = nn.status;
        if (nn.meta && nn.meta.cpu != null) o.meta = { ...(o.meta || {}), cpu: nn.meta.cpu };
        if (statusChanged && o._grp) {
          if (nn.status === "down" || nn.status === "warn") {
            if (o._hasRing) { o._ring!.visible = true; o._ring!.material.color.setHex(nn.status === "down" ? PAL.alert : PAL.warn); }
            else addAlertRing(sim, o, o._grp, nn.status === "down" ? PAL.alert : PAL.warn);
          } else if (o._hasRing) o._ring!.visible = false;
        }
      });
      applyLive(sim, topo);
    };

    const dispose = () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      scene.traverse(obj => {
        const m = obj as THREE.Mesh & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
        m.geometry?.dispose?.();
        if (Array.isArray(m.material)) m.material.forEach(item => item.dispose?.());
        else m.material?.dispose?.();
      });
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      simRef.current = null;
    };
    simRef.current.dispose = dispose;

    return dispose;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    simRef.current?.applyLive?.(dependencies, bytesIn, bytesOut, sampleInterval, { cpu: cpuPercent });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies, bytesIn, bytesOut, sampleInterval, cpuPercent]);

  const trafficIn = formatBytes(bytesIn);
  const trafficOut = formatBytes(bytesOut);
  const sharedBy = `${Math.round((SHARE.mongo + SHARE.redis + SHARE.s3) * 100)}%`;
  const coreStatus = dependencies.railway.state;
  const coreLabel = coreStatus === "healthy" ? "operational" : coreStatus === "not_configured" ? "not configured" : coreStatus;

  return (
    <div className="relative h-[420px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#02050b] shadow-[inset_0_0_72px_rgba(14,116,144,.13)] sm:h-[540px]">
      <div
        ref={canvasHostRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        role="img"
        aria-label={`Live network map. Railway API core is ${coreLabel}; Vercel is ${dependencies.vercel.state}, MongoDB ${dependencies.mongo.state}, Redis ${dependencies.redis.state}, AWS S3 ${dependencies.s3.state}.`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,.5)_100%)]" />
      <div className="absolute left-3 top-3 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 py-2 font-mono shadow-lg backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-[.22em] text-cyan-200">Shop Co · network bound</p>
        <p className="mt-1 text-[10px] text-slate-400">drag to orbit · scroll to zoom</p>
      </div>
      <div className="absolute right-3 top-3 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 py-2 text-right font-mono shadow-lg backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-[.18em] text-slate-500">Measured traffic · last {sampleInterval}s</p>
        <p className="mt-1 text-xs"><span className="text-cyan-300">↑ {trafficOut}</span><span className="mx-1.5 text-slate-600">/</span><span className="text-emerald-300">↓ {trafficIn}</span></p>
        <p className="mt-1 text-[9px] text-slate-500">
          {requestsPerMinute.toFixed(1)} req/min · p95 {Math.round(p95LatencyMs)}ms · cpu {cpuPercent}% · lag {Math.round(eventLoopLagMs)}ms
        </p>
        <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-600">link rates show {sharedBy} of the measured aggregate</p>
      </div>
      <p ref={tourRef} className="absolute bottom-3 left-3 rounded-md border border-white/10 bg-slate-950/85 px-3 py-2 font-mono text-[10px] text-slate-300 shadow-lg backdrop-blur-sm">{tourText || "◆ AUTO-TOUR · OVERVIEW"}</p>
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 z-20 hidden max-w-[260px] rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2 font-mono text-[11px] leading-5 text-slate-200 shadow-xl backdrop-blur-sm"
      />
      {webglUnavailable && (
        <div className="absolute inset-0 grid place-items-center bg-[#02050b] p-6 text-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.2em] text-cyan-200">3D view unavailable</p>
            <p className="mt-2 text-sm text-slate-400">Your browser does not support WebGL. The service status cards above remain live.</p>
          </div>
        </div>
      )}
    </div>
  );
}