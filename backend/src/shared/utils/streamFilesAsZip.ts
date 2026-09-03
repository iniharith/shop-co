/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Streams a set of files into a ZIP response one file at a time, instead
 * of buffering every file's bytes in memory before writing the archive.
 * Each file's GET is only issued once the previous file has finished
 * being written into the archive, so at most one file's data is ever
 * held in memory — this is what fixes the "array buffer allocation
 * failed" crash that used to happen on large/many-file downloads.
 */
import { Response } from 'express';
import { setDownloadProgress } from './downloadProgress';

interface StreamableFile {
  originalName: string;
  path: string;
  zipPath?: string;
}

const safeZipPath = (value: string) => value
  .split(/[\\/]+/)
  .map(part => part.replace(/[^a-zA-Z0-9 _.-]/g, '_').trim())
  .filter(part => part && part !== '.' && part !== '..')
  .join('/');

const resolveDownloadUrl = async (filePath: string): Promise<string> => {
  if (!filePath.includes('amazonaws.com')) return filePath;
  try {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
    const urlObj = new URL(filePath);
    const rawKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    const key = decodeURIComponent(rawKey);
    return await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn: 600 });
  } catch (e) {
    console.warn(`Could not sign URL for ${filePath}:`, e);
    return filePath;
  }
};

// Fetch with timeout + one retry on transient failure
const fetchWithRetry = async (url: string, attempt = 0): Promise<globalThis.Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000); // 30s timeout per file
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok && attempt === 0) {
      // Single retry on first failure
      return fetchWithRetry(url, 1);
    }
    return res;
  } catch (e: any) {
    clearTimeout(timer);
    if (attempt === 0 && e.name !== 'AbortError') {
      return fetchWithRetry(url, 1);
    }
    throw e;
  }
};

/**
 * Streams `files` into a ZIP and writes it directly to `res`.
 * Returns { success: false } (without touching `res`) if zero files were
 * reachable, so the caller can send its own error response instead.
 */
export async function streamFilesAsZip(
  res: Response,
  files: StreamableFile[],
  zipName: string,
  downloadId?: string
): Promise<{ success: boolean }> {
  // archiver v8 removed the old callable factory pattern (archiver('zip', opts))
  // and now exports classes directly — ZipArchive replaces it.
  const { ZipArchive } = require('archiver');
  const { Readable } = require('stream');
  const safeZipName = zipName.replace(/[^a-zA-Z0-9 _-]/g, '_');

  if (files.length === 0) {
    return { success: false };
  }

  // Resolve all presigned URLs concurrently (network I/O, safe to parallelise)
  // Limit concurrency to avoid S3 rate limiting when many folders are downloaded at once
  const SIGN_CONCURRENCY = 5;
  const resolved: { name: string; url: string }[] = [];
  for (let i = 0; i < files.length; i += SIGN_CONCURRENCY) {
    const batch = files.slice(i, i + SIGN_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(f => resolveDownloadUrl(f.path).then(url => ({ name: safeZipPath(f.zipPath || f.originalName), url })))
    );
    for (const r of results) {
      if (r.status === 'fulfilled') resolved.push(r.value);
    }
  }

  if (resolved.length === 0) {
    return { success: false };
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeZipName}.zip"`);

  const skippedCount = files.length - resolved.length;
  if (skippedCount > 0) {
    res.setHeader('X-Skipped-Files', String(skippedCount));
  }

  const archive = new ZipArchive({ zlib: { level: 1 } }); // level 1 = fastest, least CPU
  archive.on('error', (err: any) => {
    console.error('[streamFilesAsZip] Archive error:', err);
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  archive.pipe(res);

  // ── Streaming phase: fetch + append ONE file at a time ──────────────
  const appendAndWait = (name: string, stream: any) =>
    new Promise<void>((resolve, reject) => {
      const onEntry = (entry: any) => {
        if (entry.name === name) {
          archive.removeListener('entry', onEntry);
          archive.removeListener('error', onError);
          resolve();
        }
      };
      const onError = (err: any) => {
        archive.removeListener('entry', onEntry);
        reject(err);
      };
      archive.once('error', onError);
      archive.on('entry', onEntry);
      archive.append(stream, { name });
    });

  const total = resolved.length;
  let completed = 0;
  setDownloadProgress(downloadId, 0, total);

  for (const { name, url } of resolved) {
    try {
      const fileRes = await fetchWithRetry(url);
      if (!fileRes.ok || !fileRes.body) {
        console.warn(`[streamFilesAsZip] Skipping ${name}: HTTP ${fileRes.status}`);
        continue;
      }
      await appendAndWait(name, Readable.fromWeb(fileRes.body as any));
    } catch (e) {
      console.warn(`[streamFilesAsZip] Failed streaming ${name} into archive:`, e);
    } finally {
      completed++;
      setDownloadProgress(downloadId, completed, total);
    }
  }

  await archive.finalize();
  setDownloadProgress(downloadId, total, total, true);
  return { success: true };
}
