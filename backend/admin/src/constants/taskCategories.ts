/**
 * Coded by Harith
 * Kampungcetak ®
 */
export const TASK_CATEGORIES = [
  "UNASSIGNED",
  "FRAME",
  "ACRYLIC",
  "DIGITAL PRINTING",
  "DISPLAY ITEM",
  "DIGITAL OFFSET",
  "PREMIUM GIFT",
  "APPAREL/SUBLIMATION",
  "WEDDING PRODUCT",
  "FOOD PACKAGING",
  "BUNTING & BANNER",
  "PHOTOBOOK",
  "MAGNET",
  "MENU BOOK",
  "ALAMAT RUMAH",
  "NO PLAT",
  "E-PRINT",
  "STICKER",
  "WEDDING CARD",
  "NOTEBOOK",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

// Maps a product's `category` value to the admin task category it belongs to,
// so typing/selecting a product name in Create Task can suggest the right
// task category automatically.
export const PRODUCT_TO_TASK_CATEGORY: Record<string, string> = {
  "digital-printing": "DIGITAL PRINTING",
  banner: "BUNTING & BANNER",
  bunting: "BUNTING & BANNER",
  "car-sticker": "STICKER",
  "board-printing": "DIGITAL PRINTING",
  "wall-sticker": "STICKER",
  "glass-sticker": "STICKER",
  "display-item": "DISPLAY ITEM",
  "roll-up-stand": "DISPLAY ITEM",
  "wind-flag": "DISPLAY ITEM",
  "human-standee": "DISPLAY ITEM",
  "tripod-stand": "DISPLAY ITEM",
  "water-bag": "DISPLAY ITEM",
  "mini-x-stand": "DISPLAY ITEM",
  "pop-up": "DISPLAY ITEM",
  flyers: "DIGITAL OFFSET",
  booklet: "DIGITAL OFFSET",
  "business-card": "DIGITAL OFFSET",
  "corporate-folder": "DIGITAL OFFSET",
  "paper-bag": "DIGITAL OFFSET",
  certificate: "DIGITAL OFFSET",
  stamp: "DIGITAL OFFSET",
  notebook: "NOTEBOOK",
  "crystal-plaque-trophy": "PREMIUM GIFT",
  "acrylic-trophy": "ACRYLIC",
  "acrylic-keychain": "ACRYLIC",
  "fridge-magnet": "MAGNET",
  magnet: "MAGNET",
  lanyard: "PREMIUM GIFT",
  mug: "PREMIUM GIFT",
  pen: "PREMIUM GIFT",
  calendar: "PREMIUM GIFT",
  "money-packet": "PREMIUM GIFT",
  "premium-gift": "PREMIUM GIFT",
  "corporate-gift": "PREMIUM GIFT",
  apparel: "APPAREL/SUBLIMATION",
  "non-woven-bag": "APPAREL/SUBLIMATION",
  "canvas-bag": "APPAREL/SUBLIMATION",
  "sublimation-tshirt": "APPAREL/SUBLIMATION",
  "cotton-t-shirt": "APPAREL/SUBLIMATION",
  "islamic-khat": "FRAME",
  "Islamic Khat": "FRAME",
  portrait: "FRAME",
  clock: "FRAME",
  "wedding-bunting": "BUNTING & BANNER",
  "wedding-banner": "BUNTING & BANNER",
  "arrow-bunting": "BUNTING & BANNER",
  "button-badge": "WEDDING PRODUCT",
  "cek-hantaran": "WEDDING PRODUCT",
  "door-gift": "WEDDING PRODUCT",
  "kad-kahwin": "WEDDING CARD",
  "welcome-board": "WEDDING PRODUCT",
  photobook: "PHOTOBOOK",
  "menu-book": "MENU BOOK",
  "table-tent": "FOOD PACKAGING",
  "table-display-stand": "FOOD PACKAGING",
  "stand-pouch": "FOOD PACKAGING",
  sticker: "STICKER",
  "food-sticker": "STICKER",
  "alamat-rumah": "ALAMAT RUMAH",
  "no-plat": "NO PLAT",
  "e-print": "E-PRINT",
  "wedding-product": "WEDDING PRODUCT",
  "food-packaging": "FOOD PACKAGING",
  frame: "FRAME",
};

export const taskCategoryToProduct = (productCategory: string): string =>
  PRODUCT_TO_TASK_CATEGORY[productCategory?.toLowerCase().trim()] || "UNASSIGNED";

export const productToTaskCategory = (product: { category?: string; sections?: string[] }): string =>
  PRODUCT_TO_TASK_CATEGORY[product.category?.toLowerCase().trim() || '']
  || product.sections?.find(section => TASK_CATEGORIES.includes(section as TaskCategory))
  || "UNASSIGNED";
