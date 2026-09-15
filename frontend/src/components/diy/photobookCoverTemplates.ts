export type PhotobookSize = "A5" | "A6";

export type PhotobookCoverSlot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  radius?: number;
};

export type PhotobookCoverTemplate = {
  id: string;
  name: string;
  sourceFile: string;
  preview: string;
  slots: PhotobookCoverSlot[];
};

const slot = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
  radius = 1.5,
): PhotobookCoverSlot => ({
  id,
  label: `Cover photo ${Number(id.replace("photo-", ""))}`,
  x,
  y,
  width,
  height,
  rotation,
  radius,
});

// Positions are measured from the supplied production PDFs, including their
// white proof margin. Keeping one normalized map makes the website preview and
// the finished SVG use the exact same clipping boxes.
const DESIGN_SLOTS: Record<string, PhotobookCoverSlot[]> = {
  D1: [slot("photo-1", 5.82, 11.85, 44.95, 84.12)],
  D2: [
    slot("photo-1", 19.07, 22.48, 7.5, 8.34),
    slot("photo-2", 28.93, 19.25, 9.0, 11.5),
    slot("photo-3", 15.02, 32.4, 11.96, 12.73),
    slot("photo-4", 29.8, 32.33, 9.6, 12.73),
    slot("photo-5", 14.0, 46.99, 11.79, 12.61),
    slot("photo-6", 28.88, 46.99, 9.0, 12.61),
    slot("photo-7", 18.51, 61.45, 9.2, 11.47),
  ],
  D3: [
    slot("photo-1", 12.9, 14.5, 19.0, 22.5, -15),
    slot("photo-2", 13.8, 31.0, 15.5, 23.5, 10),
    slot("photo-3", 25.8, 26.0, 18.0, 22.5, 13),
    slot("photo-4", 23.2, 47.0, 20.0, 31.5, -12),
  ],
  D4: [
    slot("photo-1", 15.54, 35.24, 14.02, 19.82, 0),
    slot("photo-2", 26.58, 50.08, 14.02, 19.82, 0),
  ],
  D5: [
    slot("photo-1", 15.7, 27.4, 15.0, 23.0, -5),
    slot("photo-2", 30.0, 24.8, 13.8, 23.8, 7),
    slot("photo-3", 18.9, 51.5, 27.5, 27.0, -5),
  ],
  D6: [slot("photo-1", 16.0, 51.0, 20.0, 28.0, 9)],
  D7: [slot("photo-1", 16.98, 29.22, 20.16, 26.54, 0)],
  D8: [slot("photo-1", 5.8, 43.5, 44.8, 35.5, 0)],
  D9: [
    slot("photo-1", 15.55, 15.36, 12.16, 22.95, -1),
    slot("photo-2", 26.62, 33.42, 12.39, 23.25, 2),
    slot("photo-3", 14.79, 54.6, 13.87, 20.1, -1),
  ],
  D10: [
    slot("photo-1", 8.34, 23.12, 13.28, 16.86, -10, 18),
    slot("photo-2", 18.26, 12.62, 9.82, 13.9, 0, 50),
    slot("photo-3", 32.83, 19.29, 11.14, 15.56, 9, 18),
    slot("photo-4", 9.67, 59.98, 16.55, 23.7, -8, 18),
    slot("photo-5", 23.88, 52.79, 19.6, 21.8, 9, 3),
  ],
};

const makeTemplate = (
  size: PhotobookSize,
  id: string,
): PhotobookCoverTemplate => ({
  id,
  name: `${id} · ${DESIGN_SLOTS[id].length} editable photo${DESIGN_SLOTS[id].length === 1 ? "" : "s"}`,
  sourceFile: `TEMPLATE COVER PHOTOBINDER ${id}.pdf`,
  preview: `/templates/photobook/covers/${size.toLowerCase()}/${id.toLowerCase()}.png`,
  slots: DESIGN_SLOTS[id],
});

export const photobookCoverTemplates: Record<
  PhotobookSize,
  PhotobookCoverTemplate[]
> = {
  A5: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"].map((id) =>
    makeTemplate("A5", id),
  ),
  A6: ["D1", "D2", "D5", "D7", "D8", "D10"].map((id) => makeTemplate("A6", id)),
};

export const getPhotobookCoverTemplate = (
  size: PhotobookSize,
  design: string,
) =>
  photobookCoverTemplates[size].find((template) => template.id === design) ||
  photobookCoverTemplates[size][0];
