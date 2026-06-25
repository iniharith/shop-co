import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { s3Client, S3_BUCKET_NAME, deleteFromS3 } from '../../infrastructure/config/s3';
import multerS3 from 'multer-s3';
import { fileUploadRepository } from '../../infrastructure/repositories/FileUploadRepository';
import { FileUpload } from '../../domain/entities/FileUpload';
import { whatsAppService } from '../../infrastructure/services/WhatsAppService';
import authMiddilware from '../middlewares/auth.middileware';
import { taskRepository } from '../../infrastructure/repositories/TaskRepository';
import UserRepository from '../../infrastructure/db/repositories/user.repository';

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

// ─── Multer + S3 Storage ─────────────────────────
const storage = multerS3({
  s3: s3Client,
  bucket: S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req: any, file: any, cb: any) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req: any, file: any, cb: any) {
    const userId = req.userId || req.user?.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `kampungcetak/uploads/${userId}/${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  }
});

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
// Files are uploaded directly to AWS S3 — not stored locally.
router.post(
  '/upload',
  authMiddilware,
  upload.array('files', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as (Express.Multer.File & { path: string; filename: string })[];
    const { orderId, taskId, notes, userId: bodyUserId, category } = req.body;
    const authReq = req as any;
    
    // If admin provides a userId in the body, upload on their behalf
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production'].includes(authReq.role);
    const userId = (isAdmin && bodyUserId) ? bodyUserId : authReq.userId || authReq.user?.id;

    if (!userId && !taskId) {
      res.status(401).json({ success: false, message: 'Log masuk atau Task diperlukan' });
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
          userId: userId || 'admin',
          orderId: orderId || undefined,
          taskId: taskId || undefined,
          category: category || undefined,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          // file.location is provided by multer-s3
          path: (file as any).location || file.path,
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

// 🌐 Public: Get files for a specific folder using robust token
router.get(
  '/folder/:token',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const decoded = JSON.parse(Buffer.from(req.params.token, 'base64').toString('utf-8'));
      let query: any = {};
      if (decoded.t) {
        query = { taskId: decoded.t };
      } else if (decoded.o) {
        query = { orderId: decoded.o };
      } else if (decoded.u) {
        query = { userId: decoded.u };
      } else {
        res.json({ success: true, data: [] });
        return;
      }
      const files = await FileUpload.find(query).sort({ uploadedAt: -1 });
      res.json({ success: true, data: files, folderName: decoded.n });
    } catch (e) {
      res.json({ success: true, data: [] });
    }
  })
);

// 🔹🔹🔹 GET /api/files/stats 🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
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
// Redirects to S3 URL for download
router.get(
  '/:id/download',
  asyncHandler(async (req: Request, res: Response) => {
    const file = await fileUploadRepository.findById(req.params.id);
    if (!file) {
      res.status(404).json({ success: false, message: 'Fail tidak dijumpai' });
      return;
    }
    // file.path is the S3 URL — redirect directly
    res.redirect(file.path);
  })
);

// ─── GET /api/files/:id/preview ──────────────────────────
// Redirects to S3 URL for inline preview
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

// 📝 PUT /api/files/:id/review 
// Admin marks a file as reviewed (optionally with notes)
router.put(
  '/:id/review',
  authMiddilware,
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

    // Sync with task if this file is attached to a task
    if (file.taskId) {
      try {
        const authReq = req as any;
        const userId = authReq.userId || authReq.user?.id;
        let userName = authReq.user?.name || authReq.user?.email;
        if (!userName && userId) {
          try {
            const user = await UserRepository.findById(userId);
            userName = user?.name || user?.email;
          } catch (e) {}
        }
        userName = userName || 'Admin';

        // Update task file notes
        await taskRepository.updateFileNotes(file.taskId, file.path, notes || '');
        
        // Add comment to task
        await taskRepository.addComment(
          file.taskId,
          userId,
          userName,
          `Note updated for artwork (${file.originalName}): ${notes || '(cleared)'}`,
          authReq.role || 'admin'
        );
      } catch (syncErr) {
        console.error("Failed to sync file note to task:", syncErr);
      }
    }

    res.json({ success: true, data: file });
    })
);

// 🟨🟨🟨 POST /api/files/bulk-delete 🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨
// Admin or owner bulk deletes files
router.post(
  '/bulk-delete',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production'].includes(authReq.role);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Log masuk diperlukan' });
      return;
    }

    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds)) {
      res.status(400).json({ success: false, message: 'Senarai ID fail diperlukan' });
      return;
    }

    let deletedCount = 0;
    const errors = [];

    for (const id of fileIds) {
      try {
        const file = await fileUploadRepository.findById(id);
        if (!file) continue;

        if (!isAdmin && file.userId?.toString() !== userId.toString()) {
          continue; // skip if unauthorized
        }

        await fileUploadRepository.delete(id);
        if (file.path) {
          await deleteFromS3(file.path);
        }
        deletedCount++;
      } catch (err: any) {
        errors.push({ id, error: err.message });
      }
    }

    res.json({ success: true, deletedCount, errors });
  })
);

// 🟨🟨🟨 DELETE /api/files/:id 🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨
// Admin or file owner deletes file from DB and Cloudinary
router.delete(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    const isAdmin = ['admin', 'sysadmin', 'boss', 'designer', 'production'].includes(authReq.role);

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

    // Delete from S3 using the helper
    try {
      if (file.path) {
        await deleteFromS3(file.path);
      }
    } catch (err: any) {
      console.warn('[FileUpload] Could not delete from S3:', err.message);
    }

    await fileUploadRepository.delete(req.params.id);
    res.json({ success: true, message: 'Fail berjaya dipadam' });
  })
);

export default router;
