type FileLike = {
  mimetype?: string;
  originalName?: string;
  name?: string;
};

const publicBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://shop-co-production.up.railway.app"
).replace(/\/$/, "");
const previewJobs = new Map<string, Promise<void>>();

export const isPdfFile = (file?: FileLike | null) => {
  const name = file?.originalName || file?.name || "";
  return /^application\/pdf(?:$|;)/i.test(file?.mimetype || "") || /\.pdf$/i.test(name);
};

export const buildPdfSharePreviewUrl = (fileId: string) => {
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

export const preparePdfSharePreview = (fileId: string) => {
  const existingJob = previewJobs.get(fileId);
  if (existingJob) return existingJob;

  const job = fetch(buildPdfSharePreviewUrl(fileId), { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok || response.headers.get("content-type")?.startsWith("image/") !== true) {
        throw new Error(`PDF preview returned ${response.status}`);
      }
      await response.arrayBuffer();
    })
    .finally(() => previewJobs.delete(fileId));

  previewJobs.set(fileId, job);
  return job;
};

export const buildFileShareUrl = (origin: string, fileId: string, isPdf: boolean) => {
  const shareUrl = new URL(`/share/file/${encodeURIComponent(fileId)}`, origin);
  if (isPdf) shareUrl.searchParams.set("preview", "pdf-v2");
  return shareUrl.toString();
};
