export type PhotoAdjustment = { scale: number; x: number; y: number };
export type PhotoSlotDesign = { photoId?: string; adjustment: PhotoAdjustment };
export type CanvasDesign = Record<string, PhotoSlotDesign>;
export type CanvasDesigns = Record<string, CanvasDesign>;

export const DEFAULT_PHOTO_ADJUSTMENT: PhotoAdjustment = { scale: 1, x: 0, y: 0 };

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
}

// Offsets describe movement within the available crop. Even at the extremes,
// the photo covers every pixel of its slot. Shared by the editor and PNG export.
export function photoPlacement(photoWidth: number, photoHeight: number, slotWidth: number, slotHeight: number, adjustment: PhotoAdjustment) {
  const scale = Math.max(slotWidth / photoWidth, slotHeight / photoHeight) * clamp(adjustment.scale, 1, 4);
  const width = photoWidth * scale;
  const height = photoHeight * scale;
  const overflowX = Math.max(0, width - slotWidth);
  const overflowY = Math.max(0, height - slotHeight);
  return { width, height,
    x: -overflowX / 2 + clamp(adjustment.x, -1, 1) * overflowX / 2,
    y: -overflowY / 2 + clamp(adjustment.y, -1, 1) * overflowY / 2,
    overflowX, overflowY,
  };
}

export function assignUploadedPhotos(design: CanvasDesign, slotIds: string[], selectedSlotId: string, photoIds: string[]): CanvasDesign {
  const targets = [selectedSlotId, ...slotIds.filter((id) => id !== selectedSlotId && !design[id]?.photoId)];
  const next = { ...design };
  targets.forEach((slotId, index) => {
    if (photoIds[index]) next[slotId] = { photoId: photoIds[index], adjustment: { ...DEFAULT_PHOTO_ADJUSTMENT } };
  });
  return next;
}
