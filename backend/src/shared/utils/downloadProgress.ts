/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Tracks bulk-ZIP-download progress in memory, keyed by a client-generated
 * downloadId, so the frontend can poll GET /api/files/download-progress/:id
 * while the actual ZIP streams in a separate request. Entries expire after
 * a few minutes so this never grows unbounded.
 */

interface ProgressEntry {
  current: number;
  total: number;
  done: boolean;
  updatedAt: number;
}

const progressMap = new Map<string, ProgressEntry>();

const ENTRY_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setDownloadProgress(
  downloadId: string | undefined,
  current: number,
  total: number,
  done = false
) {
  if (!downloadId) return;
  progressMap.set(downloadId, { current, total, done, updatedAt: Date.now() });
}

export function getDownloadProgress(downloadId: string) {
  const entry = progressMap.get(downloadId);
  if (!entry) return null;
  return { current: entry.current, total: entry.total, done: entry.done };
}

// Periodic cleanup so completed/abandoned downloads don't leak memory.
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of progressMap.entries()) {
    if (now - entry.updatedAt > ENTRY_TTL_MS) {
      progressMap.delete(id);
    }
  }
}, 60 * 1000).unref();
