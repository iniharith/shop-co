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
        return yield getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn: 600 });
    }
    catch (e) {
        console.warn(`Could not sign URL for ${filePath}:`, e);
        return filePath;
    }
});
// Fetch with timeout + one retry on transient failure
const fetchWithRetry = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, attempt = 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000); // 30s timeout per file
    try {
        const res = yield fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok && attempt === 0) {
            // Single retry on first failure
            return fetchWithRetry(url, 1);
        }
        return res;
    }
    catch (e) {
        clearTimeout(timer);
        if (attempt === 0 && e.name !== 'AbortError') {
            return fetchWithRetry(url, 1);
        }
        throw e;
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
        const resolved = [];
        for (let i = 0; i < files.length; i += SIGN_CONCURRENCY) {
            const batch = files.slice(i, i + SIGN_CONCURRENCY);
            const results = yield Promise.allSettled(batch.map(f => resolveDownloadUrl(f.path).then(url => ({ name: f.originalName, url }))));
            for (const r of results) {
                if (r.status === 'fulfilled')
                    resolved.push(r.value);
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
        archive.on('error', (err) => {
            console.error('[streamFilesAsZip] Archive error:', err);
            if (!res.headersSent)
                res.status(500).end();
            else
                res.end();
        });
        archive.pipe(res);
        // ── Streaming phase: fetch + append ONE file at a time ──────────────
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
        const total = resolved.length;
        let completed = 0;
        (0, downloadProgress_1.setDownloadProgress)(downloadId, 0, total);
        for (const { name, url } of resolved) {
            try {
                const fileRes = yield fetchWithRetry(url);
                if (!fileRes.ok || !fileRes.body) {
                    console.warn(`[streamFilesAsZip] Skipping ${name}: HTTP ${fileRes.status}`);
                    continue;
                }
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
