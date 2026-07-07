/**
 * Coded by Harith
 * Kampungcetak ®
 */
import AxiosInstance from "./axios";

export const uploadToS3Directly = async (token: string, file: File, onProgress?: (percent: number) => void) => {
  // 1. Get presigned URL from backend
  const presignRes = await AxiosInstance(token).post("/api/files/presigned-url", {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
  });
  
  if (!presignRes.data.success) {
    throw new Error(presignRes.data.message || "Failed to get presigned URL");
  }
  
  const { signedUrl, fileUrl, key } = presignRes.data;

  // 2. Upload file directly to S3 using XHR to track progress
  return new Promise<{ fileUrl: string, key: string, name: string, type: string, size: number }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
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
    
    xhr.onerror = () => reject(new Error("XHR network error during S3 upload"));
    
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
};
