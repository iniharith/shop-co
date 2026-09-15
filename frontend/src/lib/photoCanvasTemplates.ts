export type PhotoSlot = {
  id: string; label: string; x: number; y: number; width: number; height: number;
  polygon: number[][];
};
export type PhotoCanvasTemplate = {
  id: string; name: string; category: "Single photo" | "Collage" | "Photo clock";
  size: string; sourceFile: string; artboard: number;
  width: number; height: number; aspectRatio: string;
  svg: string; preview: string; slots: PhotoSlot[];
};
let library: Promise<PhotoCanvasTemplate[]> | undefined;
const artwork = new Map<string, Promise<string>>();
export function loadPhotoCanvasTemplates() {
  return library ||= fetch('/templates/photo-canvas/library/manifest.json').then(async response => {
    if (!response.ok) throw new Error('Could not load templates. Please try again.');
    return response.json() as Promise<PhotoCanvasTemplate[]>;
  }).catch(error => { library = undefined; throw error; });
}
export function loadTemplateArtwork(template: PhotoCanvasTemplate) {
  if (!artwork.has(template.svg)) artwork.set(template.svg, fetch(template.svg).then(async response => {
    if (!response.ok) throw new Error('Could not load this template. Please try again.');
    return response.text();
  }).catch(error => { artwork.delete(template.svg); throw error; }));
  return artwork.get(template.svg)!;
}
