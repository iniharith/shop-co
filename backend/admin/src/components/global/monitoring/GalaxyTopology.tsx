"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { OpsStatus } from "@/api/ops";

type DependencyKey = "mongo" | "redis" | "s3" | "vercel" | "railway";
type Dependencies = Record<DependencyKey, OpsStatus>;

interface ServiceDef {
  key: Exclude<DependencyKey, "railway">;
  name: string;
  role: string;
  position: [number, number, number];
  orbit: number;
}

const serviceLayout: ServiceDef[] = [
  { key: "vercel", name: "VERCEL", role: "CUSTOMER APP", position: [-12, 4, -2], orbit: 12.8 },
  { key: "mongo", name: "MONGODB", role: "PRIMARY DATA", position: [-8, -6, 2], orbit: 10.4 },
  { key: "s3", name: "AWS S3", role: "FILE STORAGE", position: [10, -5, -1], orbit: 11.6 },
  { key: "redis", name: "REDIS", role: "REALTIME CACHE", position: [12, 4, 1], orbit: 13.6 },
];

const colorFor = (state: OpsStatus["state"]): number =>
  ({
    healthy: 0x34d399,
    degraded: 0xfbbf24,
    stale: 0xfbbf24,
    down: 0xfb7185,
    not_configured: 0x64748b,
  })[state];

const labelFor = (state: OpsStatus["state"]) =>
  state === "not_configured" ? "NOT CONFIGURED" : state.replace("_", " ").toUpperCase();

const formatBytes = (value = 0) => {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const PAL = { bg: 0x02050b, cyan: 0x5ad7ff, green: 0x37f5a0, linkDim: 0x12293e, linkHot: 0x2f9dd4 };

const flowU = (rateBytesPerSec: number) => {
  const bits = Math.max(0, rateBytesPerSec) * 8;
  if (bits < 100) return 0;
  return Math.min(1, (Math.log(bits) / Math.LN10 - 2) / 7);
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

function makeTextures() {
  const canvasTex = (size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    draw(canvas.getContext("2d")!, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  };

  const soft = canvasTex(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.35, "rgba(255,255,255,.45)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });

  const flare = canvasTex(128, (g, s) => {
    const c = s / 2;
    const r = g.createRadialGradient(c, c, 0, c, c, c * 0.32);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.5, "rgba(255,255,255,.35)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = "lighter";
    [[1, 0], [0, 1]].forEach(ax => {
      const lg = g.createLinearGradient(c - ax[0] * c, c - ax[1] * c, c + ax[0] * c, c + ax[1] * c);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(0.5, "rgba(255,255,255,.85)");
      lg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = lg;
      if (ax[0]) g.fillRect(0, c - 1.6, s, 3.2);
      else g.fillRect(c - 1.6, 0, 3.2, s);
    });
  });

  const lumpy = (seed: number) => {
    const rnd = mulberry32(seed);
    return canvasTex(128, (g, s) => {
      g.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const px = s * (0.3 + rnd() * 0.4);
        const py = s * (0.3 + rnd() * 0.4);
        const rr = s * (0.14 + rnd() * 0.22);
        const grad = g.createRadialGradient(px, py, 0, px, py, rr);
        grad.addColorStop(0, `rgba(255,255,255,${(0.28 + rnd() * 0.25).toFixed(2)})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, s, s);
      }
      g.globalCompositeOperation = "destination-in";
      const e = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      e.addColorStop(0, "rgba(255,255,255,1)");
      e.addColorStop(0.75, "rgba(255,255,255,.75)");
      e.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = e;
      g.fillRect(0, 0, s, s);
    });
  };

  const core = canvasTex(256, (g, s) => {
    const c = s / 2;
    const grad = g.createRadialGradient(c, c, 0, c, c, c * 0.96);
    grad.addColorStop(0, "rgba(255,224,178,0.95)");
    grad.addColorStop(0.1, "rgba(255,205,150,0.55)");
    grad.addColorStop(0.3, "rgba(200,170,160,0.15)");
    grad.addColorStop(0.6, "rgba(120,130,190,0.055)");
    grad.addColorStop(1, "rgba(80,100,180,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = "destination-out";
    g.lineCap = "round";
    for (let arm = 0; arm < 2; arm++) {
      g.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const th = t * 3.6 + arm * Math.PI + 0.5;
        const rr = c * (0.14 + t * 0.62);
        const px = c + rr * Math.cos(th);
        const py = c + rr * Math.sin(th);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.lineWidth = 10;
      g.strokeStyle = "rgba(0,0,0,0.5)";
      g.filter = "blur(6px)";
      g.stroke();
      g.filter = "none";
    }
  });

  const dgal = canvasTex(64, (g, s) => {
    g.translate(s / 2, s / 2);
    g.scale(1, 0.38);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, s / 2);
    grad.addColorStop(0, "rgba(255,255,255,.9)");
    grad.addColorStop(0.3, "rgba(255,255,255,.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(-s / 2, -s / 2, s, s);
  });

  return { soft, flare, lump1: lumpy(11), lump2: lumpy(47), core, dgal };
}

function mkPoints(
  positions: Float32Array,
  colors: Float32Array,
  size: number,
  opacity: number,
  tex: THREE.Texture,
  attenuate = false,
) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size,
      sizeAttenuation: attenuate,
      vertexColors: true,
      map: tex,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  pts.frustumCulled = false;
  return pts;
}

function sprite(tex: THREE.Texture, color: number, opacity: number, sx: number, sy: number, position: THREE.Vector3) {
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  mat.color = new THREE.Color(color);
  const sp = new THREE.Sprite(mat);
  sp.scale.set(sx, sy, 1);
  sp.position.copy(position);
  return sp;
}

function shellPoints(
  count: number,
  rMin: number,
  rMax: number,
  size: number,
  opacity: number,
  rnd: () => number,
  tex: THREE.Texture,
) {
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = rMin + rnd() * (rMax - rMin);
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    pos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
    const u = rnd();
    if (u > 0.95) c.setHSL(0.07 + rnd() * 0.04, 0.55, 0.66);
    else if (u > 0.78) c.setHSL(0.58 + rnd() * 0.04, 0.45, 0.74);
    else c.setHSL(0.55, 0.08, 0.72 + rnd() * 0.18);
    const b = 0.42 + rnd() * 0.52;
    col.push(c.r * b, c.g * b, c.b * b);
  }
  return mkPoints(new Float32Array(pos), new Float32Array(col), size, opacity, tex, false);
}

function buildGalaxy(rnd: () => number, texs: ReturnType<typeof makeTextures>) {
  const group = new THREE.Group();
  const Rd = 10.5;
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 0.66;

  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  const N = 11500;
  for (let i = 0; i < N; i++) {
    const arm = (rnd() * 4) | 0;
    const major = arm < 2;
    const t = Math.pow(rnd(), 1.55);
    const r = 0.08 * Rd + t * 0.92 * Rd;
    const wind = (r / Rd) * 5.2;
    const jit = gauss() * (0.08 + 0.16 * (r / Rd));
    const th = wind + arm * Math.PI * 0.5 + jit + (major ? 0 : 0.35);
    const thick = gauss() * (0.1 + 0.35 * Math.exp(-r / (0.3 * Rd)));
    pos.push(r * Math.cos(th), thick, r * Math.sin(th));
    const fall = Math.exp(-r / (0.36 * Rd)) * (major ? 1 : 0.62);
    const u = rnd();
    if (r < 0.3 * Rd) c.setHSL(0.075 + rnd() * 0.035, 0.42, 0.62);
    else if (u > 0.965) c.setHSL(0.93, 0.42, 0.6);
    else if (u > 0.6) c.setHSL(0.585 + rnd() * 0.03, 0.45, 0.68);
    else c.setHSL(0.56, 0.12, 0.7);
    const rq = Math.min(1, Math.max(0, (r / Rd - 0.24) / 0.14));
    const damp = 1 - 0.36 * rq * rq * (3 - 2 * rq);
    const b = (0.13 + 0.87 * fall) * (0.55 + rnd() * 0.45) * damp;
    col.push(c.r * b, c.g * b, c.b * b);
  }
  group.add(mkPoints(new Float32Array(pos), new Float32Array(col), 1.6, 0.62, texs.soft, false));

  const bp: number[] = [];
  const bc: number[] = [];
  for (let i = 0; i < 2200; i++) {
    const rr = Math.pow(rnd(), 2) * 0.22 * Rd;
    const th2 = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    bp.push(rr * Math.sin(ph) * Math.cos(th2), rr * Math.sin(ph) * Math.sin(th2) * 0.55, rr * Math.cos(ph));
    c.setHSL(0.08 + rnd() * 0.03, 0.45, 0.6 + rnd() * 0.1);
    const b2 = 0.45 + rnd() * 0.45;
    bc.push(c.r * b2, c.g * b2, c.b * b2);
  }
  group.add(mkPoints(new Float32Array(bp), new Float32Array(bc), 1.5, 0.58, texs.soft, false));

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6 * Rd, 2.6 * Rd).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: texs.core,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  glow.renderOrder = -20;
  group.add(glow);

  const nuc = sprite(texs.soft, 0xffe7c2, 0.82, 0.9, 0.9, new THREE.Vector3());
  nuc.renderOrder = -14;
  group.add(nuc);
  group.add(sprite(texs.soft, 0xffd9a0, 0.32, 2.6, 1.9, new THREE.Vector3()));

  return group;
}

function buildNebula(
  rnd: () => number,
  texs: ReturnType<typeof makeTextures>,
  o: { x: number; y: number; z: number; ex: number; ey: number; ez: number; hues: [number, number]; size: number; opacity: number; puffs: number; stars: number },
) {
  const group = new THREE.Group();
  group.position.set(o.x, o.y, o.z);
  const c = new THREE.Color();
  const np: number[] = [];
  const nc: number[] = [];
  for (let i = 0; i < o.puffs; i++) {
    const px = (rnd() * 2 - 1) * o.ex;
    const py = (rnd() * 2 - 1) * o.ey;
    const pz = (rnd() * 2 - 1) * o.ez;
    const core = Math.sqrt(px * px + py * py + pz * pz) < Math.max(o.ex, o.ez) * 0.45;
    c.setHSL(core ? o.hues[0] : o.hues[1], 0.55 + rnd() * 0.2, 0.52 + rnd() * 0.12);
    const s = o.size * (0.5 + rnd() * 0.9) * (core ? 1 : 1.35);
    const t = rnd() > 0.5 ? texs.lump1 : texs.lump2;
    group.add(sprite(t, c.getHex(), o.opacity * (core ? 1.25 : 0.7), s, s * (0.7 + rnd() * 0.5), new THREE.Vector3(px, py, pz)));
  }
  for (let i = 0; i < o.stars; i++) {
    np.push((rnd() * 2 - 1) * o.ex, (rnd() * 2 - 1) * o.ey, (rnd() * 2 - 1) * o.ez);
    c.setHSL(o.hues[0] + (rnd() - 0.5) * 0.06, 0.35, 0.78);
    const b = 0.5 + rnd() * 0.5;
    nc.push(c.r * b, c.g * b, c.b * b);
  }
  if (o.stars) group.add(mkPoints(new Float32Array(np), new Float32Array(nc), 1.9, 0.8, texs.soft, false));
  return group;
}

function buildFlares(rnd: () => number, tex: THREE.Texture) {
  const batches: Record<"s" | "m" | "l", number[][]> = { s: [[], []], m: [[], []], l: [[], []] };
  const c = new THREE.Color();
  let placed = 0;
  let guard = 0;
  while (placed < 12 && guard++ < 240) {
    const pitch = 6 + rnd() * 46;
    const yaw = (rnd() * 2 - 1) * 55;
    const R = 48 + rnd() * 26;
    const p = (pitch * Math.PI) / 180;
    const a = (yaw * Math.PI) / 180;
    const x = Math.sin(a) * Math.cos(p) * R;
    const y = Math.sin(p) * R;
    const z = -Math.cos(a) * Math.cos(p) * R;
    const distToAxis = Math.sqrt(x * x + y * y) / R;
    if (distToAxis < 0.28) continue;
    const u = rnd();
    if (u > 0.7) c.setHSL(0.08, 0.5, 0.68);
    else if (u > 0.35) c.setHSL(0.59, 0.42, 0.74);
    else c.setHSL(0.55, 0.06, 0.78);
    const b = 0.48 + rnd() * 0.22;
    const k: "s" | "m" | "l" = u > 0.8 ? "l" : u > 0.4 ? "m" : "s";
    batches[k][0].push(x, y, z);
    batches[k][1].push(c.r * b, c.g * b, c.b * b);
    placed++;
  }
  const group = new THREE.Group();
  const sizes: Array<[keyof typeof batches, number, number]> = [["s", 22, 0.55], ["m", 30, 0.5], ["l", 38, 0.45]];
  sizes.forEach(([k, size, opacity]) => {
    if (batches[k][0].length) group.add(mkPoints(new Float32Array(batches[k][0]), new Float32Array(batches[k][1]), size, opacity, tex, false));
  });
  return group;
}

function buildDust(rnd: () => number, tex: THREE.Texture) {
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < 200; i++) {
    const r = 14 + rnd() * 18;
    const th = rnd() * Math.PI * 2;
    pos.push(r * Math.cos(th), -4 - rnd() * 7, r * Math.sin(th));
    c.setHSL(0.56 + rnd() * 0.05, 0.3, 0.55);
    const b = 0.25 + rnd() * 0.45;
    col.push(c.r * b, c.g * b, c.b * b);
  }
  return mkPoints(new Float32Array(pos), new Float32Array(col), 40, 0.2, tex, true);
}

function portFace(portCount: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#0b1522";
  g.fillRect(0, 0, 128, 32);
  const perRow = Math.ceil(portCount / 2);
  for (let i = 0; i < portCount; i++) {
    const row = i < perRow ? 0 : 1;
    const col = i % perRow;
    g.fillStyle = "rgba(90,215,255,0.28)";
    g.fillRect(8 + col * (112 / perRow), 8 + row * 12, Math.max(2, 112 / perRow - 3), 7);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

interface Particle {
  active: boolean;
  sx: number;
  sy: number;
  sz: number;
  tx: number;
  ty: number;
  tz: number;
  progress: number;
  speed: number;
  r: number;
  g: number;
  b: number;
}

const PARTICLE_CAP = 1024;

export default function GalaxyTopology({
  dependencies,
  bytesIn,
  bytesOut,
  sampleInterval,
}: {
  dependencies: Dependencies;
  bytesIn: number;
  bytesOut: number;
  sampleInterval: number;
}) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [selected, setSelected] = useState<DependencyKey>("railway");
  const traffic = bytesIn + bytesOut;

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PAL.bg);
    scene.fog = new THREE.FogExp2(PAL.bg, 0.012);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
    camera.position.set(0, 11, 31);
    camera.lookAt(0, 0, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(PAL.bg, 1);
    host.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.68);
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.setPixelRatio(renderer.getPixelRatio());

    const texs = makeTextures();
    const rnd = mulberry32(20260914);

    const backdrop = new THREE.Group();
    backdrop.add(shellPoints(1200, 16, 30, 2.2, 0.6, rnd, texs.soft));
    backdrop.add(shellPoints(2000, 30, 55, 1.7, 0.55, rnd, texs.soft));
    backdrop.add(shellPoints(2600, 55, 85, 1.3, 0.42, rnd, texs.soft));
    backdrop.add(
      buildNebula(rnd, texs, { x: -24, y: 8, z: -32, ex: 7, ey: 3.6, ez: 4.4, hues: [0.5, 0.58], size: 3.1, opacity: 0.14, puffs: 14, stars: 40 }),
      buildNebula(rnd, texs, { x: -27, y: 13, z: -22, ex: 5.5, ey: 3.6, ez: 4, hues: [0.72, 0.62], size: 2.9, opacity: 0.125, puffs: 12, stars: 30 }),
      buildNebula(rnd, texs, { x: 22, y: 6, z: -30, ex: 6, ey: 3.4, ez: 4, hues: [0.02, 0.9], size: 3, opacity: 0.115, puffs: 12, stars: 30 }),
      buildNebula(rnd, texs, { x: 10, y: -16, z: -18, ex: 6.5, ey: 3.2, ez: 4.2, hues: [0.55, 0.6], size: 3.1, opacity: 0.115, puffs: 12, stars: 30 }),
    );
    backdrop.add(buildFlares(rnd, texs.flare));
    backdrop.add(buildDust(rnd, texs.soft));
    const distantGalaxies: Array<[number, number, number, number]> = [
      [-20, 26, -65, 3.2],
      [30, 11, -58, 2.6],
      [-4, 34, -70, 4.4],
      [15, -12, -66, 2.2],
    ];
    distantGalaxies.forEach(dg => {
      backdrop.add(sprite(texs.dgal, 0xc4d2ee, 0.3, dg[3], dg[3], new THREE.Vector3(dg[0], dg[1], dg[2])));
    });
    scene.add(backdrop);

    const galaxyTilt = new THREE.Group();
    galaxyTilt.rotation.x = 0.56;
    galaxyTilt.rotation.z = -0.3;
    const galaxySpin = buildGalaxy(rnd, texs);
    galaxyTilt.add(galaxySpin);
    scene.add(galaxyTilt);

    const ambient = new THREE.AmbientLight(0x8ac5ff, 0.75);
    const coreLight = new THREE.PointLight(colorFor(dependencies.railway.state), 42, 36, 2);
    const rimLight = new THREE.PointLight(0x2563eb, 18, 46, 2);
    rimLight.position.set(-10, 8, 5);
    scene.add(ambient, coreLight, rimLight);

    const orbitGroup = new THREE.Group();

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b2b5a,
      emissive: colorFor(dependencies.railway.state),
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.6,
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.05, 4), coreMaterial);
    core.name = "railway";
    orbitGroup.add(core);
    const coreHalo = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 32, 32),
      new THREE.MeshBasicMaterial({
        color: colorFor(dependencies.railway.state),
        transparent: true,
        opacity: 0.095,
        side: THREE.BackSide,
      }),
    );
    orbitGroup.add(coreHalo);

    const nodeGeo: Record<Exclude<DependencyKey, "railway">, THREE.BufferGeometry> = {
      vercel: new THREE.BoxGeometry(2.7, 1.5, 1.6),
      mongo: new THREE.CylinderGeometry(1.5, 1.5, 2.4, 14),
      s3: new THREE.BoxGeometry(2.3, 1.3, 1.8),
      redis: new THREE.BoxGeometry(1.9, 1.2, 1.4),
    };
    const portTex = nodeGeo ? portFace(16) : null;

    const serviceObjects: THREE.Object3D[] = [core];
    const alertRings: THREE.Mesh[] = [];
    serviceLayout.forEach(service => {
      const state = dependencies[service.key].state;
      const geo = nodeGeo[service.key];
      let material: THREE.Material | THREE.Material[];
      if (service.key === "s3" && portTex) {
        const body = new THREE.MeshStandardMaterial({ color: 0x0e1a29, roughness: 0.5, metalness: 0.5, emissive: colorFor(state), emissiveIntensity: state === "healthy" ? 0.5 : 0.35 });
        const front = new THREE.MeshStandardMaterial({ map: portTex, roughness: 0.5, metalness: 0.35, emissive: colorFor(state), emissiveIntensity: state === "healthy" ? 0.5 : 0.35 });
        material = [body, body, body, body, front, body];
      } else {
        material = new THREE.MeshStandardMaterial({ color: 0x0e1a29, roughness: 0.5, metalness: 0.5, emissive: colorFor(state), emissiveIntensity: state === "healthy" ? 0.5 : 0.35 });
      }
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(...service.position);
      mesh.name = service.key;
      serviceObjects.push(mesh);
      orbitGroup.add(mesh);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: colorFor(state), transparent: true, opacity: 0.85 }),
      );
      mesh.add(edges);

      const ringPoints: THREE.Vector3[] = [];
      for (let step = 0; step <= 100; step += 1) {
        const theta = (step / 100) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta) * service.orbit, Math.sin(theta) * service.orbit * 0.33, 0));
      }
      const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ringPoints),
        new THREE.LineBasicMaterial({ color: colorFor(state), transparent: true, opacity: 0.19 }),
      );
      ring.rotation.x = 0.53;
      ring.rotation.z = service.orbit % 2 ? 0.38 : -0.42;
      orbitGroup.add(ring);

      if (state === "down" || state === "degraded" || state === "stale") {
        const ringGeo = new THREE.RingGeometry(0.9, 1.28, 40).rotateX(-Math.PI / 2);
        const ringMesh = new THREE.Mesh(
          ringGeo,
          new THREE.MeshBasicMaterial({
            color: colorFor(state),
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        ringMesh.position.set(...service.position);
        ringMesh.position.y -= 0.85;
        orbitGroup.add(ringMesh);
        alertRings.push(ringMesh);
      }
    });
    scene.add(orbitGroup);

    const linkPosition = new Float32Array(serviceLayout.length * 6);
    const linkColor = new Float32Array(serviceLayout.length * 6);
    serviceLayout.forEach((service, index) => {
      linkPosition[index * 6] = 0;
      linkPosition[index * 6 + 1] = 0;
      linkPosition[index * 6 + 2] = 0;
      linkPosition[index * 6 + 3] = service.position[0];
      linkPosition[index * 6 + 4] = service.position[1];
      linkPosition[index * 6 + 5] = service.position[2];
    });
    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute("position", new THREE.BufferAttribute(linkPosition, 3));
    linkGeometry.setAttribute("color", new THREE.BufferAttribute(linkColor, 3));
    const linkLines = new THREE.LineSegments(linkGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }));
    orbitGroup.add(linkLines);

    const pool: Particle[] = Array.from({ length: PARTICLE_CAP }, () => ({
      active: false,
      sx: 0, sy: 0, sz: 0,
      tx: 0, ty: 0, tz: 0,
      progress: 0,
      speed: 0.3,
      r: 1, g: 1, b: 1,
    }));
    const pPos = new Float32Array(PARTICLE_CAP * 3);
    const pCol = new Float32Array(PARTICLE_CAP * 3);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setDrawRange(0, 0);
    const pPoints = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: 0.26,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: texs.soft,
      }),
    );
    pPoints.frustumCulled = false;
    orbitGroup.add(pPoints);

    const trafficRate = Math.max(bytesIn, bytesOut) / Math.max(sampleInterval, 1);
    const linkColorTmp = new THREE.Color();
    const updateLinkColors = () => {
      const u = flowU(trafficRate);
      linkColorTmp.setHex(PAL.linkDim).lerp(new THREE.Color(PAL.linkHot), u);
      for (let index = 0; index < serviceLayout.length; index += 1) {
        linkColor[index * 6] = linkColorTmp.r;
        linkColor[index * 6 + 1] = linkColorTmp.g;
        linkColor[index * 6 + 2] = linkColorTmp.b;
        linkColor[index * 6 + 3] = linkColorTmp.r;
        linkColor[index * 6 + 4] = linkColorTmp.g;
        linkColor[index * 6 + 5] = linkColorTmp.b;
      }
      linkGeometry.attributes.color.needsUpdate = true;
    };
    updateLinkColors();

    const outColor = { r: ((PAL.cyan >> 16) & 255) / 255, g: ((PAL.cyan >> 8) & 255) / 255, b: (PAL.cyan & 255) / 255 };
    const inColor = { r: ((PAL.green >> 16) & 255) / 255, g: ((PAL.green >> 8) & 255) / 255, b: (PAL.green & 255) / 255 };
    const seedParticles = () => {
      pool.forEach(particle => { particle.active = false; });
      const u = flowU(trafficRate);
      const count = Math.round(u * 7);
      let slot = 0;
      serviceLayout.forEach(service => {
        for (let k = 0; k < count; k += 1) {
          const outP = pool[slot++ % PARTICLE_CAP];
          outP.active = true;
          outP.sx = 0; outP.sy = 0; outP.sz = 0;
          outP.tx = service.position[0]; outP.ty = service.position[1]; outP.tz = service.position[2];
          outP.progress = Math.random();
          outP.speed = 0.16 + u * 0.5;
          outP.r = outColor.r; outP.g = outColor.g; outP.b = outColor.b;
          const inP = pool[slot++ % PARTICLE_CAP];
          inP.active = true;
          inP.sx = service.position[0]; inP.sy = service.position[1]; inP.sz = service.position[2];
          inP.tx = 0; inP.ty = 0; inP.tz = 0;
          inP.progress = Math.random();
          inP.speed = 0.16 + u * 0.5;
          inP.r = inColor.r; inP.g = inColor.g; inP.b = inColor.b;
        }
      });
      writeParticles();
    };
    const writeParticles = () => {
      let active = 0;
      for (let index = 0; index < PARTICLE_CAP; index += 1) {
        const particle = pool[index];
        if (!particle.active) continue;
        const k = 1 - particle.progress;
        pPos[index * 3] = particle.sx * k + particle.tx * particle.progress;
        pPos[index * 3 + 1] = particle.sy * k + particle.ty * particle.progress;
        pPos[index * 3 + 2] = particle.sz * k + particle.tz * particle.progress;
        pCol[index * 3] = particle.r;
        pCol[index * 3 + 1] = particle.g;
        pCol[index * 3 + 2] = particle.b;
        active += 1;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.setDrawRange(0, active);
    };
    const advanceParticles = (dt: number) => {
      for (let index = 0; index < PARTICLE_CAP; index += 1) {
        const particle = pool[index];
        if (!particle.active) continue;
        particle.progress += dt * particle.speed;
        if (particle.progress > 1) particle.active = false;
      }
      writeParticles();
    };
    seedParticles();

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let targetRotation = { x: -0.08, y: -0.26 };
    let rotation = { ...targetRotation };
    let dragging = false;
    let lastPointer = { x: 0, y: 0 };
    const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const handlePointerDown = (event: PointerEvent) => {
      dragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      if (dragging) {
        targetRotation.y += (event.clientX - lastPointer.x) * 0.008;
        targetRotation.x = Math.max(-0.55, Math.min(0.48, targetRotation.x + (event.clientY - lastPointer.y) * 0.006));
        lastPointer = { x: event.clientX, y: event.clientY };
      }
    };
    const handlePointerUp = (event: PointerEvent) => {
      dragging = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const handleClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(serviceObjects, false)[0];
      if (hit?.object.name) setSelected(hit.object.name as DependencyKey);
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("click", handleClick);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const nebulae: THREE.Group[] = [];
    backdrop.children.forEach(child => {
      if ((child as THREE.Group).isGroup && child.name === "") {
        const asGroup = child as THREE.Group;
        if (asGroup.children.some(mesh => (mesh as THREE.Sprite).isSprite)) nebulae.push(asGroup);
      }
    });

    let frame = 0;
    let last = performance.now();
    const started = performance.now();
    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      const elapsed = (now - started) / 1000;
      last = now;
      if (!dragging && !motionReduced) targetRotation.y += 0.0006;
      rotation.x += (targetRotation.x - rotation.x) * 0.05;
      rotation.y += (targetRotation.y - rotation.y) * 0.05;
      orbitGroup.rotation.x = rotation.x;
      orbitGroup.rotation.y = rotation.y;
      galaxySpin.rotation.y = elapsed * 0.02;
      backdrop.rotation.y = elapsed * 0.003;
      nebulae.forEach((nebula, index) => {
        nebula.scale.setScalar(1 + 0.07 * Math.sin(elapsed * 0.012 + index * 2.1));
      });
      core.rotation.y = elapsed * 0.38;
      core.rotation.x = elapsed * 0.17;
      coreHalo.scale.setScalar(1 + Math.sin(elapsed * 2.1) * 0.045);
      alertRings.forEach((ringMesh, index) => {
        ringMesh.scale.setScalar(1 + Math.sin(elapsed * 2.4 + index) * 0.12);
      });
      advanceParticles(dt);
      composer.render();
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("click", handleClick);
      scene.traverse(object => {
        const mesh = object as THREE.Mesh & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
        mesh.geometry?.dispose?.();
        if (Array.isArray(mesh.material)) mesh.material.forEach(item => item.dispose?.());
        else mesh.material?.dispose?.();
      });
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [dependencies, traffic]);

  const selectedStatus = dependencies[selected];
  const selectedService = selected === "railway"
    ? { name: "RAILWAY", role: "API CORE" }
    : serviceLayout.find(service => service.key === selected)!;
  const stateHex = `#${colorFor(selectedStatus.state).toString(16).padStart(6, "0")}`;

  return <div className="relative h-[390px] overflow-hidden rounded-xl border border-cyan-300/20 bg-[#02050b] shadow-[inset_0_0_72px_rgba(14,116,144,.13)] sm:h-[460px]">
    <div ref={canvasHost} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label={`Galaxy map of the live application. Railway is ${labelFor(dependencies.railway.state)}; ${serviceLayout.map(service => `${service.name} is ${labelFor(dependencies[service.key].state)}`).join(", ")}.`} />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.46)_100%)]" />
    <div className="absolute left-3 top-3 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 py-2 font-mono shadow-lg backdrop-blur-sm"><p className="text-[9px] uppercase tracking-[.22em] text-cyan-200">Shop Co galaxy</p><p className="mt-1 text-[10px] text-slate-400">Drag to explore · select a planet</p></div>
    <div className="absolute right-3 top-3 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 py-2 text-right font-mono shadow-lg backdrop-blur-sm"><p className="text-[9px] uppercase tracking-[.18em] text-slate-500">Measured traffic</p><p className="mt-1 text-xs"><span className="text-cyan-300">↑ {formatBytes(bytesOut)}</span><span className="mx-1.5 text-slate-600">/</span><span className="text-emerald-300">↓ {formatBytes(bytesIn)}</span></p><p className="mt-1 text-[9px] text-slate-500">sample interval {sampleInterval}s</p></div>
    <div className="absolute bottom-3 left-3 max-w-[190px] rounded-md border border-white/10 bg-slate-950/85 px-3 py-2.5 shadow-lg backdrop-blur-sm"><p className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[.16em] text-slate-100"><span className="size-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: stateHex, color: stateHex }} />{selectedService.name}</p><p className="mt-1 font-mono text-[9px] tracking-[.12em] text-slate-400">{selectedService.role}</p><p className="mt-2 text-xs font-semibold" style={{ color: stateHex }}>{labelFor(selectedStatus.state)}<span className="ml-2 text-[10px] font-normal text-slate-400">{selectedStatus.latencyMs == null ? "awaiting probe" : `${selectedStatus.latencyMs}ms`}</span></p></div>
    {webglUnavailable && <div className="absolute inset-0 grid place-items-center bg-[#02050b] p-6 text-center"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-cyan-200">3D view unavailable</p><p className="mt-2 text-sm text-slate-400">Your browser does not support WebGL. The service status cards above remain live.</p></div></div>}
  </div>;
}