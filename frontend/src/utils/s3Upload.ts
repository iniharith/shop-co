/**
 * Coded by Harith
 * Kampungcetak ®
 */
export const uploadToS3Directly = async (token: string, file: File, backendUrl: string, onProgress?: (percent: number) => void) => {
  // 1. Get presigned URL from backend
  const controller = new AbortController();
  const presignTimeout = setTimeout(() => controller.abort(), 30_000);
  let presignRes: Response;

  try {
    presignRes = await fetch(`${backendUrl}/api/files/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream"
      }),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Backend mengambil masa terlalu lama untuk memulakan muat naik.");
    }
    throw error;
  } finally {
    clearTimeout(presignTimeout);
  }
  
  const presignData = await presignRes.json().catch(() => null);
  if (!presignRes.ok || !presignData?.success) {
    throw new Error(presignData?.message || "Failed to get presigned URL");
  }
  
  const { signedUrl, fileUrl, key } = presignData;

  // 2. Upload file directly to S3 using XHR to track progress
  return new Promise<{ fileUrl: string, key: string, name: string, type: string, size: number }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Allow roughly 128 KB/s for artwork, bounded to 5-30 minutes.
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
    
    xhr.onerror = () => reject(new Error("Ralat rangkaian semasa muat naik. Sila cuba lagi."));
    xhr.ontimeout = () => reject(new Error("Muat naik tamat masa. Semak sambungan internet dan cuba lagi."));
    xhr.onabort = () => reject(new Error("Muat naik dibatalkan."));
    
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
};
