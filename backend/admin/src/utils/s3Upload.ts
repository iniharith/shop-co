/**
 * Coded by Harith
 * Kampungcetak ®
 */
import AxiosInstance from "./axios";

export type S3UploadResult = { fileUrl: string, key: string, name: string, type: string, size: number };

export const uploadToS3Directly = async (token: string, file: File, folderPath?: string, onProgress?: (percent: number) => void, abortController?: AbortController) => {
  // 1. Get presigned URL from backend
  const presignRes = await AxiosInstance(token).post("/api/files/presigned-url", {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    folderPath
  });
  
  if (!presignRes.data.success) {
    throw new Error(presignRes.data.message || "Failed to get presigned URL");
  }
  
  const { signedUrl, fileUrl, key } = presignRes.data;

  // 2. Upload file directly to S3 using XHR to track progress
  return new Promise<S3UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Allow roughly 128 KB/s for large artwork, bounded to 5-30 minutes.
    xhr.timeout = Math.min(30 * 60 * 1000, Math.max(5 * 60 * 1000, Math.ceil(file.size / (128 * 1024) * 1000)));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          fileUrl,
          key,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size
        });
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => reject(new Error("Network error during upload. Please check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Please check your connection and try again."));
    
    if (abortController) {
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error("Upload cancelled"));
      });
    }

    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
};

export const uploadFilesToS3Directly = async (
  token: string,
  files: FileList | File[],
  folderPath?: string,
  concurrency = 3,
) => {
  const items = Array.from(files);
  const uploaded = new Array<S3UploadResult | undefined>(items.length);
  const failed: Array<{ file: File; error: Error }> = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      const file = items[index];

      try {
        uploaded[index] = await uploadToS3Directly(token, file, folderPath);
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error : new Error("Upload failed"),
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, () => worker())
  );

  return {
    uploaded: uploaded.filter((file): file is S3UploadResult => Boolean(file)),
    failed,
  };
};
