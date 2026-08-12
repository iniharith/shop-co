import { dummyProducts } from "@/constants/dummy-products";

const palettes = [
  ["#102a2a", "#d6a84b", "#f6edd8"],
  ["#241c35", "#c8a96b", "#eee5d3"],
  ["#17243b", "#7cb7ad", "#f4efe4"],
  ["#3a191d", "#d99a68", "#f5e6d2"],
  ["#1e2d24", "#9dbb84", "#f2ead9"],
  ["#292520", "#c9a35c", "#ede5d5"],
] as const;

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (character) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
}[character] || character));

const titleLines = (name: string) => {
  const lines: string[] = [];
  let current = "";

  name.replace(/\s+/g, " ").trim().split(" ").forEach((word) => {
    if (`${current} ${word}`.trim().length > 22 && current) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 3);
};

const getMotif = (name: string, accent: string) => {
  const normalized = name.toLowerCase();

  if (/kaabah|kabah|kiswah/.test(normalized)) {
    return `<g transform="translate(400 315)"><path d="M-112-28 0-92l112 64v142H-112z" fill="#0b0b0b" stroke="${accent}" stroke-width="8"/><path d="M-112-28 0 36l112-64M0 36v78" fill="none" stroke="${accent}" stroke-width="5"/><rect x="-112" y="-4" width="224" height="22" fill="${accent}"/></g>`;
  }
  if (/masjid|iktikaf/.test(normalized)) {
    return `<g fill="none" stroke="${accent}" stroke-width="9"><path d="M235 418v-96c0-83 74-137 165-177 91 40 165 94 165 177v96"/><path d="M292 418v-67a108 108 0 0 1 216 0v67M198 418h404M214 322V210m372 112V210"/><path d="M195 210h38l-19-42zm372 0h38l-19-42z"/></g>`;
  }
  if (/peta|map/.test(normalized)) {
    return `<g fill="${accent}" opacity=".92"><path d="M218 276l42-51 65-12 32 27 42-14 24 37-29 33-70-5-33 37-49-12z"/><path d="M433 239l58-24 79 34 25 51-29 52-52-7-20-48-58-21z"/><path d="M362 330l37 18 22 57-27 50-30-44z"/></g>`;
  }
  if (/jam|clock/.test(normalized)) {
    return `<g transform="translate(400 315)" fill="none" stroke="${accent}" stroke-width="9"><circle r="126"/><circle r="9" fill="${accent}"/><path d="M0-98v18m0 160v18M-98 0h18m160 0h18M0 0l-52-43M0 0l42-69"/></g>`;
  }
  if (/apparel|shirt|jersey|uniform|apron/.test(normalized)) {
    return `<path d="M298 213l61-31h82l61 31 72 74-62 60-39-38v159H327V309l-39 38-62-60z" fill="${accent}" opacity=".92"/>`;
  }
  if (/bag|packaging|box|packet/.test(normalized)) {
    return `<g fill="none" stroke="${accent}" stroke-width="10"><path d="M278 261h244l-19 207H297z"/><path d="M337 276v-45a63 63 0 0 1 126 0v45"/><path d="M326 345h148"/></g>`;
  }
  if (/frame|photo|canvas/.test(normalized)) {
    return `<g fill="none" stroke="${accent}"><rect x="249" y="174" width="302" height="286" rx="5" stroke-width="14"/><rect x="276" y="201" width="248" height="232" stroke-width="4"/><path d="m302 389 72-75 48 45 46-58 40 88z" fill="${accent}" opacity=".8"/></g>`;
  }
  if (/card|flyer|book|certificate|menu|sticker|printing/.test(normalized)) {
    return `<g transform="rotate(-8 400 315)"><rect x="274" y="178" width="252" height="294" rx="8" fill="${accent}" opacity=".22"/><rect x="300" y="153" width="252" height="294" rx="8" fill="none" stroke="${accent}" stroke-width="8"/><path d="M340 236h172M340 278h132M340 320h151M340 362h105" stroke="${accent}" stroke-width="9"/></g>`;
  }
  return `<g transform="translate(400 315)" fill="none" stroke="${accent}"><path d="M0-135 37-37 135 0 37 37 0 135-37 37-135 0-37-37z" stroke-width="8"/><circle r="75" stroke-width="4"/><path d="M-45 18c25-69 65-84 104-46-31-8-53 10-55 47-20-24-34-20-49-1z" fill="${accent}" stroke="none"/></g>`;
};

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = dummyProducts.find((item) => item._id === id);

  if (!product) return new Response("Product not found", { status: 404 });

  const numericId = Number(id.replace(/\D/g, "")) || 0;
  const [background, accent, paper] = palettes[numericId % palettes.length];
  const dimension = product.name.match(/\d+\s*[xX]\s*\d+(?:\s*inch)?/i)?.[0] || product.category;
  const multiPanel = /panel|\+|\d\s*pcs/i.test(product.name);
  const panelDecoration = multiPanel
    ? `<rect x="62" y="84" width="178" height="464" rx="8" fill="none" stroke="${accent}" stroke-width="3" opacity=".38"/><rect x="560" y="84" width="178" height="464" rx="8" fill="none" stroke="${accent}" stroke-width="3" opacity=".38"/>`
    : `<rect x="72" y="72" width="656" height="488" rx="8" fill="none" stroke="${accent}" stroke-width="3" opacity=".38"/>`;
  const title = titleLines(product.name).map((line, index) => `<tspan x="400" dy="${index ? 30 : 0}">${escapeXml(line)}</tspan>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><radialGradient id="glow"><stop stop-color="${accent}" stop-opacity=".18"/><stop offset="1" stop-color="${background}" stop-opacity="0"/></radialGradient><pattern id="grain" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M14 2 26 14 14 26 2 14z" fill="none" stroke="${accent}" stroke-opacity=".07"/></pattern></defs><rect width="800" height="800" fill="${background}"/><rect width="800" height="800" fill="url(#grain)"/><circle cx="400" cy="316" r="285" fill="url(#glow)"/>${panelDecoration}${getMotif(product.name, accent)}<rect x="100" y="584" width="600" height="146" rx="6" fill="${paper}"/><text x="400" y="624" text-anchor="middle" fill="${background}" font-family="Georgia, serif" font-size="24" font-weight="700" letter-spacing="1">${title}</text><path d="M316 690h168" stroke="${accent}" stroke-width="3"/><text x="400" y="714" text-anchor="middle" fill="${background}" font-family="Arial, sans-serif" font-size="14" letter-spacing="3">${escapeXml(String(dimension).toUpperCase())}</text></svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
