/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Standalone tools that aren't part of the order/task pipeline — staff
 * upload something, get a result back, done. Nothing here creates
 * FileUpload/Order/Task records; it's a pure utility.
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { finished } from 'stream/promises';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import { upscaleImageLocally, UpscaleBusyError } from '../../infrastructure/services/LocalUpscaleService';
import {
  createDatabaseBackupFilename,
  DatabaseBackupBusyError,
  startDatabaseBackup,
} from '../../infrastructure/services/DatabaseBackupService';

const router = Router();

// In-memory only — this file never touches S3 or the database. It's
// processed and handed straight back to the browser as a data URL.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── POST /api/tools/database-backup ───────────────────────
// Streams a restorable gzip-compressed MongoDB archive. The archive never
// touches Railway's filesystem; only the temporary credentials file does.
router.post(
  '/database-backup',
  authMiddilware,
  authorizeRoles('sysadmin', 'admin', 'boss'),
  asyncHandler(async (req: Request, res: Response) => {
    let backup;
    try {
      backup = await startDatabaseBackup(process.env.MONGO_URI || '');
    } catch (error) {
      if (error instanceof DatabaseBackupBusyError) {
        res.status(429).json({ success: false, message: error.message });
        return;
      }
      console.error('[Tools/DatabaseBackup] Could not start:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, message: 'Database backup could not be started.' });
      return;
    }

    const cancelOnDisconnect = () => {
      if (!res.writableEnded) backup.cancel();
    };
    req.once('aborted', cancelOnDisconnect);
    res.once('close', cancelOnDisconnect);

    res.set({
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${createDatabaseBackupFilename()}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    // Do not end the HTTP response until mongodump has exited successfully.
    backup.stream.pipe(res, { end: false });

    try {
      await Promise.all([finished(backup.stream), backup.completion]);
      req.off('aborted', cancelOnDisconnect);
      res.off('close', cancelOnDisconnect);
      res.end();
    } catch (error) {
      backup.cancel();
      console.error('[Tools/DatabaseBackup] Failed:', error instanceof Error ? error.message : error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Database backup failed.' });
      } else {
        res.destroy();
      }
    } finally {
      req.off('aborted', cancelOnDisconnect);
      res.off('close', cancelOnDisconnect);
    }
  })
);

// ─── POST /api/tools/upscale ────────────────────────────────
// Local high-quality image upscaler (Sharp/Lanczos, no API cost).
// Accepts a single image file + desired scale, returns the upscaled
// image as a base64 data URL for instant preview/download.
router.post(
  '/upscale',
  authMiddilware,
  authorizeRoles('sysadmin', 'admin', 'boss'),
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const scale = Number(req.body.scale) || 2;

    if (!file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }
    if (!file.mimetype?.startsWith('image/')) {
      res.status(400).json({ success: false, message: 'Only image files can be upscaled' });
      return;
    }
    if (/heic|heif/i.test(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'HEIC/HEIF photos aren\'t supported yet — please use a JPEG or PNG.',
      });
      return;
    }
    if (![2, 4].includes(scale)) {
      res.status(400).json({ success: false, message: 'scale must be 2 or 4' });
      return;
    }

    try {
      const passes = scale === 4 ? 2 : 1;
      const outputBuffer = await upscaleImageLocally({ inputBuffer: file.buffer, passes });

      res.json({
        success: true,
        image: `data:image/png;base64,${outputBuffer.toString('base64')}`,
        originalName: file.originalname,
        scale,
        sizeBytes: outputBuffer.length,
      });
    } catch (err: any) {
      console.error('[Tools/Upscale] Failed:', err.message);
      if (err instanceof UpscaleBusyError) {
        res.status(429).json({ success: false, message: 'The upscaler is busy. Please try again shortly.' });
        return;
      }
      res.status(500).json({ success: false, message: 'Image upscale failed. Please try a different image.' });
    }
  })
);

export default router;
