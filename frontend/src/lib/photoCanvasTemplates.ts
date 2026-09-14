export type PhotoSlot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: "rectangle" | "circle";
};

export type PhotoCanvasTemplate = {
  id: string;
  name: string;
  category: "Single photo" | "Collage" | "Photo clock";
  size: string;
  price: number;
  aspectRatio: string;
  sourceFile: string;
  preview?: string;
  // Exported from the original Illustrator template with transparency. This
  // contains only the template's own frame, logo and decorations, and is
  // rendered above customer photos without recreating any artwork in code.
  overlay?: string;
  surface: "linen" | "gallery" | "midnight" | "clock";
  slots: PhotoSlot[];
};

// Coordinates are percentages of the print area. This is the reusable web
// manifest: every future Illustrator template only needs a preview/overlay
// asset and its photo-slot coordinates added here.
export const photoCanvasTemplates: PhotoCanvasTemplate[] = [
  {
    id: "canvas-12x18-duo",
    name: "Modern double border",
    category: "Collage",
    size: "12 × 18 in",
    price: 59,
    aspectRatio: "12 / 18",
    sourceFile: "12x18 inch DOUBLE BORDER.ai",
    surface: "gallery",
    slots: [
      { id: "photo-1", label: "Top photo", x: 12, y: 10, width: 76, height: 35 },
      { id: "photo-2", label: "Bottom photo", x: 12, y: 55, width: 76, height: 35 },
    ],
  },
  {
    id: "canvas-18x24-three",
    name: "Three memories collage",
    category: "Collage",
    size: "18 × 24 in",
    price: 89,
    aspectRatio: "18 / 24",
    sourceFile: "18x24 double border.ai",
    surface: "midnight",
    slots: [
      { id: "photo-1", label: "Top photo", x: 12, y: 9, width: 76, height: 25 },
      { id: "photo-2", label: "Middle photo", x: 12, y: 38, width: 76, height: 25 },
      { id: "photo-3", label: "Bottom photo", x: 12, y: 67, width: 76, height: 25 },
    ],
  },
  {
    id: "clock-12x24-five",
    name: "Photo clock · 5 pieces",
    category: "Photo clock",
    size: "12 × 24 in · 5 pcs",
    price: 129,
    aspectRatio: "18 / 10",
    sourceFile: "JAM BERGAMBAR 12x24 - 5 PCS.ai",
    preview: "/templates/photo-canvas/photo-clock-12x24.jpg",
    surface: "clock",
    slots: [
      { id: "photo-1", label: "Clock photo", x: 5, y: 12, width: 41, height: 76, shape: "circle" },
      { id: "photo-2", label: "Top middle", x: 49, y: 12, width: 21, height: 36 },
      { id: "photo-3", label: "Top right", x: 73, y: 12, width: 21, height: 36 },
      { id: "photo-4", label: "Bottom middle", x: 49, y: 52, width: 21, height: 36 },
      { id: "photo-5", label: "Bottom right", x: 73, y: 52, width: 21, height: 36 },
    ],
  },
];
