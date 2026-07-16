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
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import { upscaleImageLocally } from '../../infrastructure/services/LocalUpscaleService';

const router = Router();

// In-memory only — this file never touches S3 or the database. It's
// processed and handed straight back to the browser as a data URL.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// ─── POST /api/tools/upscale ────────────────────────────────
// FREE AI image upscaler (UpscalerJS, runs locally — no API cost).
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
      res.status(500).json({ success: false, message: 'AI upscale failed. Please try a different image.' });
    }
  })
);

export default router;
