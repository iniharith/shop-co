export type PhotoSlot = {
  id: string; label: string; x: number; y: number; width: number; height: number;
  polygon: number[][];
};
export type PhotoCanvasTemplate = {
  id: string; name: string; category: "Single photo" | "Collage" | "Photo clock";
  size: string; sourceFile: string; artboard: number;
  width: number; height: number; aspectRatio: string;
  svg: string; preview: string; slots: PhotoSlot[];
  artboards?: Array<Pick<PhotoCanvasTemplate, 'artboard' | 'width' | 'height' | 'svg' | 'slots'>>;
};
let library: Promise<PhotoCanvasTemplate[]> | undefined;
const artwork = new Map<string, Promise<string>>();
export function loadPhotoCanvasTemplates() {
  return library ||= fetch('/templates/photo-canvas/library/manifest.json').then(async response => {
    if (!response.ok) throw new Error('Could not load templates. Please try again.');
    const entries = await response.json() as PhotoCanvasTemplate[];
    const grouped = new Map<string, PhotoCanvasTemplate[]>();
    for (const entry of entries) { const key = entry.sourceFile; const list = grouped.get(key) || []; list.push(entry); grouped.set(key, list); }
    const result: PhotoCanvasTemplate[] = [];
    for (const list of grouped.values()) {
      if (list.length === 1) { result.push(list[0]); continue; }
      const first = list[0];
      const totalHeight = list.reduce((sum, page) => sum + page.height, 0);
      const totalWidth = Math.max(...list.map(page => page.width));
      result.push({ ...first, id: `${first.id}-set`, name: first.name.replace(/\s*·\s*Artboard\s*\d+$/i, '') + ` · ${list.length} pieces`, artboard: 1, artboards: list.map(({ artboard, width, height, svg, slots }) => ({ artboard, width, height, svg, slots })), slots: list.flatMap((page, index) => { const offset = list.slice(0, index).reduce((sum, p) => sum + p.height, 0); const xOffset = (totalWidth - page.width) / 2; return page.slots.map(slot => ({ ...slot, id: `artboard-${index + 1}-${slot.id}`, label: `Piece ${index + 1} · ${slot.label}`, x: ((xOffset + slot.x * page.width / 100) / totalWidth) * 100, width: slot.width * page.width / totalWidth, y: ((offset + slot.y * page.height / 100) / totalHeight) * 100, height: slot.height * page.height / totalHeight })); }), width: totalWidth, height: totalHeight, aspectRatio: `${totalWidth} / ${totalHeight}` });
    }
    return result;
  }).catch(error => { library = undefined; throw error; });
}
export function loadTemplateArtwork(template: PhotoCanvasTemplate) {
  if (template.artboards?.length) {
    const key = `set:${template.id}`;
    if (!artwork.has(key)) artwork.set(key, Promise.all(template.artboards.map(page => fetch(page.svg).then(r => r.text()))).then((pages) => {
      const totalHeight = template.artboards!.reduce((sum, page) => sum + page.height, 0);
      const body = pages.map((source, index) => { const doc = new DOMParser().parseFromString(source, 'image/svg+xml'); const root = doc.documentElement; const page = template.artboards![index]; const offset = template.artboards!.slice(0, index).reduce((sum, item) => sum + item.height, 0); const xOffset = (template.width - page.width) / 2; const ids = page.slots.map(slot => slot.id); let inner = root.innerHTML; ids.forEach(id => { inner = inner.replaceAll(`kc-${id}`, `kc-artboard-${index + 1}-${id}`); }); return `<g transform="translate(${xOffset} ${offset})">${inner}</g>`; }).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${template.width} ${totalHeight}" width="${template.width}" height="${totalHeight}">${body}</svg>`;
    }).catch(error => { artwork.delete(key); throw error; }));
    return artwork.get(key)!;
  }
  if (!artwork.has(template.svg)) artwork.set(template.svg, fetch(template.svg).then(async response => {
    if (!response.ok) throw new Error('Could not load this template. Please try again.');
    return response.text();
  }).catch(error => { artwork.delete(template.svg); throw error; }));
  return artwork.get(template.svg)!;
}
