import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { fileUploadRepository } from '../../infrastructure/repositories/FileUploadRepository';
import { whatsAppService } from '../../infrastructure/services/WhatsAppService';
import authMiddilware from '../middlewares/auth.middileware';

const router = Router();

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
  'application/pdf',
];

// ─── Cloudinary Configuration ─────────────────────────────
// Railway filesystem is ephemeral — files are wiped on each redeploy.
// Cloudinary provides persistent, cloud-hosted storage for all uploads.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
  api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});

// ─── Multer + Cloudinary Storage ─────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: Express.Multer.File) => ({
    folder: `kampungcetak/uploads/${req.userId || req.user?.id || 'unknown'}`,
    // PDFs must be stored as 'raw', images as 'image'
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'gif', 'pdf'],
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
} as any);

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Jenis fail "${file.mimetype}" tidak dibenarkan. Hanya JPG, PNG, PDF, TIFF, WEBP dibenarkan.`
        )
      );
    }
  },
});

// ─── POST /api/files/upload ───────────────────────────────
// Customer uploads one or more files (requires auth middleware upstream)
// Files are uploaded directly to Cloudinary — not stored locally.
router.post(
  '/upload',
  authMiddilware,
  upload.array('files', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as (Express.Multer.File & { path: string; filename: string })[];
    const { orderId, notes, userId: bodyUserId, category } = req.body;
    const authReq = req as any;
    
    // If admin provides a userId in the body, upload on their behalf
    const isAdmin = ['admin', 'system_admin', 'boss'].includes(authReq.role);
    const userId = (isAdmin && bodyUserId) ? bodyUserId : authReq.userId || authReq.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
      return;
    }

    // Cloudinary multer-storage-cloudinary puts the secure URL in file.path
    const savedFiles = await Promise.all(
      files.map((file) =>
        fileUploadRepository.create({
          userId,
          orderId: orderId || undefined,
          category: category || undefined,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          // file.path = Cloudinary secure URL (e.g. https://res.cloudinary.com/...)
          path: file.path,
          notes: notes || undefined,
          adminReviewed: false,
        })
      )
    );

    // Optionally notify customer via WhatsApp
    const customerPhone = authReq.user?.phone;
    const customerName = authReq.user?.name || 'Pelanggan';
    if (customerPhone) {
      whatsAppService
        .sendFileUploadConfirmation({
          phone: customerPhone,
          customerName,
          orderId: orderId || undefined,
          fileCount: savedFiles.length,
        })
        .catch((e: Error) =>
          console.error('[FileUpload] WhatsApp confirmation failed:', e.message)
        );
    }

    res.status(201).json({
      success: true,
      message: `${savedFiles.length} fail berjaya dimuat naik`,
      data: savedFiles,
      count: savedFiles.length,
    });
  })
);

// ─── GET /api/files/my ────────────────────────────────────
// Customer views their own uploaded files
router.get(
  '/my',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
      return;
    }
    const files = await fileUploadRepository.findByUserId(userId);
    res.json({ success: true, data: files, count: files.length });
  })
);

// ─── GET /api/files ───────────────────────────────────────
// Admin: list all uploaded files with optional filter
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { reviewed, search } = req.query as { reviewed?: string; search?: string };
    const filters: any = {};
    if (reviewed !== undefined) filters.adminReviewed = reviewed === 'true';
    if (search) filters.search = search;

    const files = await fileUploadRepository.findAll(filters);
    const stats = await fileUploadRepository.getStorageStats();
    res.json({ success: true, data: files, stats, count: files.length });
  })
);

// ─── GET /api/files/grouped ───────────────────────────────
// Admin: files grouped by customer (Nextcloud folder view)
router.get(
  '/grouped',
  asyncHandler(async (_req: Request, res: Response) => {
    const grouped = await fileUploadRepository.getFilesGroupedByUser();
    const stats = await fileUploadRepository.getStorageStats();
    res.json({ success: true, data: grouped, stats });
  })
);

// ─── GET /api/files/stats ─────────────────────────────────
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await fileUploadRepository.getStorageStats();
    res.json({ success: true, data: stats });
  })
);

// ─── GET /api/files/:id ───────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const file = await fileUploadRepository.findById(req.params.id);
    if (!file) {
      res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
      return;
    }
    res.json({ success: true, data: file });
  })
);

// ─── GET /api/files/:id/download ─────────────────────────
// Redirects to Cloudinary URL for download
router.get(
  '/:id/download',
  asyncHandler(async (req: Request, res: Response) => {
    const file = await fileUploadRepository.findById(req.params.id);
    if (!file) {
      res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
      return;
    }
    // file.path is the Cloudinary URL — redirect directly
    res.redirect(file.path);
  })
);

// ─── GET /api/files/:id/preview ──────────────────────────
// Redirects to Cloudinary URL for inline preview
router.get(
  '/:id/preview',
  asyncHandler(async (req: Request, res: Response) => {
    const file = await fileUploadRepository.findById(req.params.id);
    if (!file) {
      res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
      return;
    }
    res.redirect(file.path);
  })
);

// ─── PUT /api/files/:id/review ────────────────────────────
// Admin marks a file as reviewed (optionally with notes)
router.put(
  '/:id/review',
  asyncHandler(async (req: Request, res: Response) => {
    const { reviewed, notes } = req.body;
    const file = await fileUploadRepository.updateAdminReview(
      req.params.id,
      reviewed !== false,
      notes
    );
    if (!file) {
      res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
      return;
    }
    res.json({ success: true, data: file });
  })
);

// ─── DELETE /api/files/:id ────────────────────────────────
// Admin or file owner deletes file from DB and Cloudinary
router.delete(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    const isAdmin = ['admin', 'system_admin', 'boss'].includes(authReq.role);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
      return;
    }

    const file = await fileUploadRepository.findById(req.params.id);
    if (!file) {
      res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
      return;
    }

    // Only allow deletion if admin OR if the user owns the file
    if (!isAdmin && file.userId?.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Tiada kebenaran untuk memadam fail ini' });
      return;
    }

    // Delete from Cloudinary using the public_id extracted from the URL
    try {
      // Extract public_id from Cloudinary URL
      // e.g. https://res.cloudinary.com/{cloud}/image/upload/v123/kampungcetak/uploads/{userId}/{public_id}
      const urlParts = file.path.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        // Join everything after 'upload/v{version}/' as the public_id path
        const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithVersion.replace(/\.[^/.]+$/, ''); // remove extension
        const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`[FileUpload] Deleted from Cloudinary: ${publicId}`);
      }
    } catch (err: any) {
      console.warn('[FileUpload] Could not delete from Cloudinary:', err.message);
    }

    await fileUploadRepository.delete(req.params.id);
    res.json({ success: true, message: 'Fail berjaya dipadam' });
  })
);

export default router;
