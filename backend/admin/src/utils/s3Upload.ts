/**
 * Coded by Harith
 * Kampungcetak ®
 */
import AxiosInstance from "./axios";

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
  return new Promise<{ fileUrl: string, key: string, name: string, type: string, size: number }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Without a timeout, a stalled connection (dropped packet, S3 hiccup,
    // backgrounded tab) leaves the promise pending forever — the UI shows
    // "Uploading... 100%" indefinitely with no way to know it failed.
    // 2 minutes is generous for large artwork files while still giving up
    // eventually instead of hanging silently.
    xhr.timeout = 120000;

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
