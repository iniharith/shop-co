import { BlobReader, BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';
import { CanvasDesign, DEFAULT_PHOTO_ADJUSTMENT, photoPlacement } from './photoCanvasDesign';
import { PhotoCanvasTemplate } from './photoCanvasTemplates';
import { SavedCanvasPhoto } from './photoCanvasDraft';

export type CustomerPhoto = SavedCanvasPhoto & { url: string };
export function fillTemplate(svg: SVGSVGElement, template: PhotoCanvasTemplate, design: CanvasDesign, photos: CustomerPhoto[]) {
  for (const slot of template.slots) {
    const image = svg.querySelector(`#kc-${slot.id}`);
    if (!image) continue;
    const item = design[slot.id];
    const photo = photos.find(p => p.id === item?.photoId);
    if (!photo) { image.removeAttribute('href'); image.removeAttributeNS('http://www.w3.org/1999/xlink', 'href'); continue; }
    const slotX = slot.x / 100 * template.width;
    const slotY = slot.y / 100 * template.height;
    const slotWidth = slot.width / 100 * template.width;
    const slotHeight = slot.height / 100 * template.height;
    const position = photoPlacement(photo.width, photo.height, slotWidth, slotHeight, item.adjustment || DEFAULT_PHOTO_ADJUSTMENT);

    // Export against the exact green website slot. Source Illustrator files can
    // contain an older mask whose bounds no longer match the customer editor.
    const clipId = `kc-web-clip-${slot.id}`;
    let defs = svg.querySelector('defs');
    if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svg.insertBefore(defs, svg.firstChild); }
    let clip = defs.querySelector(`#${CSS.escape(clipId)}`);
    if (!clip) { clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath'); clip.setAttribute('id', clipId); defs.appendChild(clip); }
    clip.innerHTML = `<rect x="${slotX}" y="${slotY}" width="${slotWidth}" height="${slotHeight}" />`;
    const photoGroup = image.parentElement;
    if (photoGroup && photoGroup.tagName.toLowerCase() !== 'svg') {
      photoGroup.removeAttribute('mask');
      photoGroup.setAttribute('clip-path', `url(#${clipId})`);
    } else image.setAttribute('clip-path', `url(#${clipId})`);
    image.setAttribute('href', photo.url);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', photo.url);
    image.setAttribute('preserveAspectRatio', 'none');
    image.setAttribute('x', String(slotX + position.x));
    image.setAttribute('y', String(slotY + position.y));
    image.setAttribute('width', String(position.width));
    image.setAttribute('height', String(position.height));
  }
}
function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}

async function renderCroppedSlot(photo: CustomerPhoto, width: number, height: number, adjustment = DEFAULT_PHOTO_ADJUSTMENT) {
  const outputWidth = Math.max(1, Math.round(Math.min(2400, width * 3)));
  const outputHeight = Math.max(1, Math.round(outputWidth * height / width));
  const sourceUrl = await dataUrl(photo.blob);
  const sourceImage = new Image();
  await new Promise<void>((resolve, reject) => { sourceImage.onload = () => resolve(); sourceImage.onerror = () => reject(new Error(`Could not prepare ${photo.name} for export.`)); sourceImage.src = sourceUrl; });
  const canvas = document.createElement('canvas'); canvas.width = outputWidth; canvas.height = outputHeight;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image export is unavailable in this browser.');
  const position = photoPlacement(photo.width, photo.height, outputWidth, outputHeight, adjustment);
  ctx.drawImage(sourceImage, position.x, position.y, position.width, position.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not crop the photo for export.')), 'image/png'));
  return { blob, url: await dataUrl(blob), width: outputWidth, height: outputHeight };
}

export async function exportCanvasPackage(source: string, template: PhotoCanvasTemplate, design: CanvasDesign, photos: CustomerPhoto[]) {
  if (template.slots.some(slot => !photos.some(photo => photo.id === design[slot.id]?.photoId))) throw new Error('Please fill every photo area first.');
  // Bake each website crop into a slot-sized PNG. Illustrator then receives an
  // exact, already-cropped rectangle instead of recalculating image fitting.
  const embedded: CustomerPhoto[] = [];
  const exportDesign: CanvasDesign = {};
  for (const slot of template.slots) {
    const item = design[slot.id];
    const photo = photos.find(value => value.id === item?.photoId)!;
    const rendered = await renderCroppedSlot(photo, slot.width / 100 * template.width, slot.height / 100 * template.height, item.adjustment);
    const id = `export-${slot.id}`;
    embedded.push({ id, name: `${slot.id}.png`, ...rendered });
    exportDesign[slot.id] = { photoId: id, adjustment: { ...DEFAULT_PHOTO_ADJUSTMENT } };
  }
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = doc.documentElement as unknown as SVGSVGElement;
  fillTemplate(svg, template, exportDesign, embedded);
  // PDF artboards use points. Explicit inches preserve their actual physical size.
  svg.setAttribute('width', `${template.width / 72}in`);
  svg.setAttribute('height', `${template.height / 72}in`);
  const text = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  let preview: Blob;
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not render this design.')); image.src = url; });
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 2400 / Math.max(template.width, template.height));
    canvas.width = Math.round(template.width * scale); canvas.height = Math.round(template.height * scale);
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image export is unavailable in this browser.');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    preview = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Preview export failed.')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
  const writer = new ZipWriter(new BlobWriter('application/zip'));
  // Keep the customer download production-ready and simple: one protected SVG
  // with all photos embedded and clipped by the original template masks.
  await writer.add('kampungcetak-design.svg', new TextReader(text), { password: 'kampungcetak' });
  return { archive: await writer.close(), preview };
}
