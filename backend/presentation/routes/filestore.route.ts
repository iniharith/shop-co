/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router } from 'express';
import { FileStoreController } from '../controllers/filestore.controller';
import { authMiddilware } from '../middlewares/auth.middileware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();
const fileStoreController = new FileStoreController();

// ─── PUBLIC routes (no auth — for customers using upload link) ───────────────
router.get('/uploads/:token', fileStoreController.validateToken.bind(fileStoreController));
router.post('/uploads/:token', uploadMiddleware, fileStoreController.uploadFiles.bind(fileStoreController));

// ─── ADMIN routes ─────────────────────────────────────────────────────────────
router.get('/filestore', authMiddilware, fileStoreController.getAllFileStores.bind(fileStoreController));
router.get('/filestore/:orderId', authMiddilware, fileStoreController.getFileStoreByOrder.bind(fileStoreController));
router.delete('/filestore/:orderId/file/:filename', authMiddilware, fileStoreController.deleteFile.bind(fileStoreController));
router.get('/filestore/:orderId/download', authMiddilware, fileStoreController.downloadAllFiles.bind(fileStoreController));
router.patch('/filestore/:orderId/toggle', authMiddilware, fileStoreController.toggleToken.bind(fileStoreController));

export default router;
