"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamFilesAsZip = streamFilesAsZip;
const downloadProgress_1 = require("./downloadProgress");
const resolveDownloadUrl = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!filePath.includes('amazonaws.com'))
        return filePath;
    try {
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const { s3Client, S3_BUCKET_NAME } = require('../../infrastructure/config/s3');
        const urlObj = new URL(filePath);
        const rawKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        const key = decodeURIComponent(rawKey);
        return yield getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn: 300 });
    }
    catch (e) {
        console.warn(`Could not sign URL for ${filePath}:`, e);
        return filePath;
    }
});
/**
 * Streams `files` into a ZIP and writes it directly to `res`.
 * Returns { success: false } (without touching `res`) if zero files were
 * reachable, so the caller can send its own error response instead.
 */
function streamFilesAsZip(res, files, zipName, downloadId) {
    return __awaiter(this, void 0, void 0, function* () {
        // archiver v8 removed the old callable factory pattern (archiver('zip', opts))
        // and now exports classes directly — ZipArchive replaces it. append/pipe/
        // finalize and all events (including 'entry', used below) work identically.
        const { ZipArchive } = require('archiver');
        const { Readable } = require('stream');
        const safeZipName = zipName.replace(/[^a-zA-Z0-9 _-]/g, '_');
        // ── Pre-check phase: confirm each file is reachable via a cheap ranged
        // GET (first byte only) before committing to a response. ──────────────
        const candidates = [];
        const skipped = [];
        for (const file of files) {
            try {
                const downloadUrl = yield resolveDownloadUrl(file.path);
                // NOTE: presigned S3 URLs are cryptographically bound to the HTTP
                // method they were signed for (GetObjectCommand => GET). Issuing a
                // HEAD request against a GET-signed URL fails signature validation
                // and returns 403 for every file, every time. Use a ranged GET
                // (first byte only) instead — same signed method, minimal transfer.
                const headRes = yield fetch(downloadUrl, { headers: { Range: 'bytes=0-0' } });
                if (!headRes.ok) {
                    skipped.push(file.originalName);
                    console.warn(`[streamFilesAsZip] Skipping ${file.originalName}: HTTP ${headRes.status}`);
                    continue;
                }
                candidates.push({ name: file.originalName, url: downloadUrl });
            }
            catch (e) {
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
        archive.on('error', (err) => { console.error('Archive error:', err); res.end(); });
        archive.pipe(res);
        // ── Streaming phase: fetch + append ONE file at a time. ──────────────
        const appendAndWait = (name, stream) => new Promise((resolve, reject) => {
            const onEntry = (entry) => {
                if (entry.name === name) {
                    archive.removeListener('entry', onEntry);
                    archive.removeListener('error', onError);
                    resolve();
                }
            };
            const onError = (err) => {
                archive.removeListener('entry', onEntry);
                reject(err);
            };
            archive.once('error', onError);
            archive.on('entry', onEntry);
            archive.append(stream, { name });
        });
        const total = candidates.length;
        let completed = 0;
        (0, downloadProgress_1.setDownloadProgress)(downloadId, 0, total);
        for (const { name, url } of candidates) {
            try {
                const fileRes = yield fetch(url);
                if (!fileRes.ok || !fileRes.body)
                    continue;
                yield appendAndWait(name, Readable.fromWeb(fileRes.body));
            }
            catch (e) {
                console.warn(`[streamFilesAsZip] Failed streaming ${name} into archive:`, e);
            }
            finally {
                completed++;
                (0, downloadProgress_1.setDownloadProgress)(downloadId, completed, total);
            }
        }
        yield archive.finalize();
        (0, downloadProgress_1.setDownloadProgress)(downloadId, total, total, true);
        return { success: true };
    });
}
