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

interface StreamableFile {
  originalName: string;
  path: string;
}

const resolveDownloadUrl = async (filePath: string): Promise<string> => {
  if (!filePath.includes('amazonaws.com')) return filePath;
  try {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
    const urlObj = new URL(filePath);
    const rawKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    const key = decodeURIComponent(rawKey);
    return await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn: 300 });
  } catch (e) {
    console.warn(`Could not sign URL for ${filePath}:`, e);
    return filePath;
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
  zipName: string
): Promise<{ success: boolean }> {
  // archiver v8 removed the old callable factory pattern (archiver('zip', opts))
  // and now exports classes directly — ZipArchive replaces it. append/pipe/
  // finalize and all events (including 'entry', used below) work identically.
  const { ZipArchive } = require('archiver');
  const { Readable } = require('stream');
  const safeZipName = zipName.replace(/[^a-zA-Z0-9 _-]/g, '_');

  // ── Pre-check phase: confirm each file is reachable via a cheap ranged
  // GET (first byte only) before committing to a response. ──────────────
  const candidates: { name: string; url: string }[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    try {
      const downloadUrl = await resolveDownloadUrl(file.path);
      // NOTE: presigned S3 URLs are cryptographically bound to the HTTP
      // method they were signed for (GetObjectCommand => GET). Issuing a
      // HEAD request against a GET-signed URL fails signature validation
      // and returns 403 for every file, every time. Use a ranged GET
      // (first byte only) instead — same signed method, minimal transfer.
      const headRes = await fetch(downloadUrl, { headers: { Range: 'bytes=0-0' } });
      if (!headRes.ok) {
        skipped.push(file.originalName);
        console.warn(`[streamFilesAsZip] Skipping ${file.originalName}: HTTP ${headRes.status}`);
        continue;
      }
      candidates.push({ name: file.originalName, url: downloadUrl });
    } catch (e) {
      skipped.push(file.originalName);
      console.warn(`[streamFilesAsZip] Skipping ${file.originalName}:`, e);
    }
  }

  if (candidates.length === 0) {
    return { success: false };
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeZipName}.zip"`);
  if (skipped.length) {
    res.setHeader('X-Skipped-Files', String(skipped.length));
  }

  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.on('error', (err: any) => { console.error('Archive error:', err); res.end(); });
  archive.pipe(res);

  // ── Streaming phase: fetch + append ONE file at a time. ──────────────
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

  for (const { name, url } of candidates) {
    try {
      const fileRes = await fetch(url);
      if (!fileRes.ok || !fileRes.body) continue;
      await appendAndWait(name, Readable.fromWeb(fileRes.body as any));
    } catch (e) {
      console.warn(`[streamFilesAsZip] Failed streaming ${name} into archive:`, e);
    }
  }

  await archive.finalize();
  return { success: true };
}
