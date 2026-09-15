import type { CanvasDesigns } from "./photoCanvasDesign";

export type SavedCanvasPhoto = { id: string; name: string; blob: Blob; width: number; height: number };
export type SavedCanvasDraft = { templateId: string; designs: CanvasDesigns; notes?: string; savedAt: string };
const DATABASE = "kampungcetak-photo-canvas";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("photos", { keyPath: "id" });
      request.result.createObjectStore("drafts");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Draft storage is busy in another tab."));
  });
}

export async function loadCanvasDraft(): Promise<{ draft?: SavedCanvasDraft; photos: SavedCanvasPhoto[] }> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(["photos", "drafts"], "readonly");
      const draftRequest = transaction.objectStore("drafts").get("current");
      const photosRequest = transaction.objectStore("photos").getAll();
      transaction.oncomplete = () => resolve({ draft: draftRequest.result, photos: photosRequest.result });
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

// Write photo blobs once on upload. Moving/zooming only writes the small draft.
export async function saveCanvasPhotos(photos: SavedCanvasPhoto[]): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("photos", "readwrite");
      photos.forEach((photo) => transaction.objectStore("photos").put(photo));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

export async function saveCanvasDraft(draft: SavedCanvasDraft): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("drafts", "readwrite");
      transaction.objectStore("drafts").put(draft, "current");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}
