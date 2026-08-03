type FileLike = {
  _id?: unknown;
  id?: string;
  mimetype?: string;
  originalName?: string;
};

const publicBackendUrl = (
  process.env.PUBLIC_BACKEND_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "") ||
  "https://shop-co-production.up.railway.app"
).replace(/\/$/, "");
const previewJobs = new Map<string, Promise<void>>();

const isPdfFile = (file: FileLike) =>
  /^application\/pdf(?:$|;)/i.test(file.mimetype || "") || /\.pdf$/i.test(file.originalName || "");

const buildPdfSharePreviewUrl = (fileId: string) => {
  const sourceUrl = `${publicBackendUrl}/api/files/${encodeURIComponent(fileId)}/preview`;
  const previewUrl = new URL("https://wsrv.nl/");

  previewUrl.searchParams.set("url", sourceUrl);
  previewUrl.searchParams.set("page", "0");
  previewUrl.searchParams.set("n", "1");
  previewUrl.searchParams.set("w", "1200");
  previewUrl.searchParams.set("h", "630");
  previewUrl.searchParams.set("fit", "contain");
  previewUrl.searchParams.set("cbg", "white");
  previewUrl.searchParams.set("output", "jpg");
  previewUrl.searchParams.set("q", "80");
  previewUrl.searchParams.set("maxage", "1y");

  return previewUrl.toString();
};

export const warmPdfSharePreview = (file: FileLike) => {
  const fileId = file._id?.toString() || file.id;
  if (!fileId || !isPdfFile(file) || previewJobs.has(fileId)) return;

  const job = fetch(buildPdfSharePreviewUrl(fileId))
    .then(async (response) => {
      if (!response.ok || response.headers.get("content-type")?.startsWith("image/") !== true) {
        throw new Error(`PDF preview returned ${response.status}`);
      }
      await response.arrayBuffer();
    })
    .catch((error) => {
      console.warn(`[PDF Preview] Could not warm preview for ${fileId}:`, error);
    })
    .finally(() => previewJobs.delete(fileId));

  previewJobs.set(fileId, job);
};
