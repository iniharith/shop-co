import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src", "constants", "dummy-products.ts");
const outputDir = path.join(root, "public", "images", "catalog");
const source = await readFile(sourcePath, "utf8");
const productPattern = /"_id":\s*"([^"]+)"[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"category":\s*"([^"]+)"/g;
const products = [...source.matchAll(productPattern)].map((match) => ({
  id: match[1],
  name: match[2],
  category: match[3],
}));

if (products.length < 100) {
  throw new Error(`Expected the full catalog, found only ${products.length} products.`);
}

const slugify = (value) => value
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const escapeXml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const hash = (value) => [...value].reduce((result, character) => ((result * 31) + character.charCodeAt(0)) >>> 0, 2166136261);

function productShape(category, seed) {
  const key = category.toLowerCase();
  const angle = (seed % 9) - 4;

  if (key.includes("apparel") || key.includes("shirt") || key.includes("jersey")) {
    return `<g transform="translate(600 575) rotate(${angle})"><path d="M-245-185l125-70c28 38 67 58 120 58s92-20 120-58l125 70-78 143-67-36v310h-200v-310l-67 36z" fill="url(#product)" stroke="rgba(255,255,255,.45)" stroke-width="8"/><circle cx="0" cy="20" r="50" fill="none" stroke="#f0b90b" stroke-width="14"/><path d="M-28 20h56M0-8v56" stroke="#f0b90b" stroke-width="10" stroke-linecap="round"/></g>`;
  }

  if (key.includes("display") || key.includes("flag") || key.includes("banner") || key.includes("bunting")) {
    return `<g transform="translate(600 580) rotate(${angle})"><rect x="-275" y="-210" width="550" height="330" rx="24" fill="url(#product)" stroke="rgba(255,255,255,.5)" stroke-width="8"/><path d="M-190-115h250M-190-45h375M-190 25h310" stroke="rgba(255,255,255,.78)" stroke-width="24" stroke-linecap="round"/><path d="M-200 120v165M200 120v165M-250 285h500" stroke="#f0b90b" stroke-width="18" stroke-linecap="round"/></g>`;
  }

  if (key.includes("food") || key.includes("box") || key.includes("pack") || key.includes("bag")) {
    return `<g transform="translate(600 590) rotate(${angle})"><path d="M0-260l245 115v300L0 280l-245-125v-300z" fill="url(#product)" stroke="rgba(255,255,255,.45)" stroke-width="8"/><path d="M0-260v540M-245-145L0-25l245-120" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="8"/><rect x="-72" y="40" width="144" height="105" rx="22" fill="#f0b90b"/><path d="M-34 92h68" stroke="#111" stroke-width="13" stroke-linecap="round"/></g>`;
  }

  if (key.includes("wedding") || key.includes("card") || key.includes("invitation")) {
    return `<g transform="translate(600 575) rotate(${angle})"><rect x="-240" y="-270" width="480" height="540" rx="30" fill="url(#product)" stroke="rgba(255,255,255,.5)" stroke-width="8"/><path d="M-135-105h270M-170-25h340M-130 55h260" stroke="rgba(255,255,255,.78)" stroke-width="19" stroke-linecap="round"/><circle cx="0" cy="160" r="64" fill="#f0b90b"/><path d="M-27 160l20 20 39-47" fill="none" stroke="#111" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }

  if (key.includes("frame") || key.includes("canvas") || key.includes("photo")) {
    return `<g transform="translate(600 575) rotate(${angle})"><rect x="-270" y="-260" width="540" height="520" rx="22" fill="#f0b90b"/><rect x="-225" y="-215" width="450" height="430" rx="10" fill="url(#product)"/><circle cx="92" cy="-78" r="52" fill="rgba(255,255,255,.75)"/><path d="M-210 190L-62 15l102 110 65-72 105 137z" fill="rgba(255,255,255,.64)"/></g>`;
  }

  if (key.includes("gift") || key.includes("premium")) {
    return `<g transform="translate(600 585) rotate(${angle})"><rect x="-245" y="-120" width="490" height="350" rx="34" fill="url(#product)" stroke="rgba(255,255,255,.45)" stroke-width="8"/><rect x="-280" y="-190" width="560" height="105" rx="28" fill="#f0b90b"/><rect x="-42" y="-190" width="84" height="420" fill="rgba(255,255,255,.7)"/><path d="M0-190c-165-25-140-155-48-118 50 20 48 118 48 118zm0 0c165-25 140-155 48-118-50 20-48 118-48 118z" fill="none" stroke="#f0b90b" stroke-width="24"/></g>`;
  }

  return `<g transform="translate(600 575) rotate(${angle})"><rect x="-260" y="-245" width="520" height="490" rx="30" fill="url(#product)" stroke="rgba(255,255,255,.45)" stroke-width="8"/><path d="M-170-125h340M-170-42h280M-170 41h340M-170 124h230" stroke="rgba(255,255,255,.72)" stroke-width="23" stroke-linecap="round"/><circle cx="175" cy="150" r="85" fill="#f0b90b"/><path d="M139 150l25 25 48-60" fill="none" stroke="#111" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function createArtwork(product) {
  const seed = hash(`${product.id}-${product.name}`);
  const hue = 205 + (seed % 115);
  const hue2 = (hue + 38 + (seed % 30)) % 360;
  const category = escapeXml(product.category.replaceAll("-", " ").toUpperCase());
  const name = escapeXml(product.name);
  const serial = String((seed % 9999) + 1).padStart(4, "0");
  const dots = Array.from({ length: 7 }, (_, index) => {
    const x = 80 + ((seed >>> (index % 16)) + index * 173) % 1040;
    const y = 120 + ((seed >>> ((index + 5) % 16)) + index * 131) % 840;
    const radius = 3 + ((seed + index * 7) % 7);
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="rgba(255,255,255,.2)"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-labelledby="title desc">
  <title id="title">${name}</title>
  <desc id="desc">Kampung Cetak product artwork for ${name}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 48% 15%)"/><stop offset="1" stop-color="hsl(${hue2} 55% 7%)"/></linearGradient>
    <linearGradient id="product" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 64% 58%)"/><stop offset="1" stop-color="hsl(${hue2} 62% 34%)"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="28" stdDeviation="30" flood-color="#000" flood-opacity=".42"/></filter>
    <radialGradient id="glow"><stop stop-color="#f0b90b" stop-opacity=".24"/><stop offset="1" stop-color="#f0b90b" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="1200" rx="72" fill="url(#bg)"/>
  <circle cx="1020" cy="110" r="390" fill="url(#glow)"/>
  <circle cx="100" cy="1060" r="310" fill="url(#glow)" opacity=".45"/>
  ${dots}
  <g filter="url(#shadow)">${productShape(product.category, seed)}</g>
  <rect x="64" y="62" width="310" height="54" rx="27" fill="rgba(255,255,255,.09)" stroke="rgba(255,255,255,.16)"/>
  <circle cx="95" cy="89" r="9" fill="#f0b90b"/>
  <text x="119" y="96" fill="white" opacity=".8" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="2">${category}</text>
  <text x="64" y="1010" fill="white" font-family="Arial, sans-serif" font-size="${product.name.length > 34 ? 34 : product.name.length > 24 ? 44 : 62}" font-weight="800">${name}</text>
  <text x="66" y="1062" fill="white" opacity=".58" font-family="Arial, sans-serif" font-size="23" font-weight="600" letter-spacing="4">KAMPUNG CETAK / ${serial}</text>
  <rect x="64" y="1100" width="1072" height="2" fill="rgba(255,255,255,.16)"/>
  <text x="64" y="1145" fill="#f0b90b" font-family="Arial, sans-serif" font-size="21" font-weight="800" letter-spacing="3">PRINTED WITH PURPOSE</text>
</svg>`;
}

await mkdir(outputDir, { recursive: true });
await Promise.all(products.map((product) => {
  const filename = `${product.id}-${slugify(product.name)}.svg`;
  return writeFile(path.join(outputDir, filename), createArtwork(product), "utf8");
}));

console.log(`Generated ${products.length} product artworks in ${outputDir}`);
