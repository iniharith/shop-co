/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextFunction, Response, Request } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import FileStoreModel from '../../infrastructure/db/models/filestore.model';
import { AuthRequest } from '../../domain/types/api';
import { statusCodes } from '../../shared/constants/api.constant';
import { Task } from '../../domain/entities/Task';
import { VirtualFolder } from '../../domain/entities/VirtualFolder';
import { virtualFolderRepository } from '../../infrastructure/repositories/VirtualFolderRepository';
import { fileUploadRepository } from '../../infrastructure/repositories/FileUploadRepository';

/** @Controller */
export class FileStoreController {

  /**
   * @description PUBLIC - Validate upload token and return order info for customer upload page
   * @Method GET
   * @Access PUBLIC (no auth)
   * @Route /api/uploads/:token
   */
  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const fileStore = await FileStoreModel.findOne({ uploadToken: token })
        .populate('orderId', 'orderStatus totalAmount');

      if (!fileStore) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Upload link not found or invalid' });
        return;
      }

      if (!fileStore.isActive) {
        res.status(403).json({ message: 'This upload link has been deactivated' });
        return;
      }

      if (fileStore.tokenExpiresAt && new Date() > fileStore.tokenExpiresAt) {
        res.status(403).json({ message: 'This upload link has expired' });
        return;
      }

      res.status(statusCodes.OK).json({
        message: 'Token valid',
        orderId: fileStore.orderId,
        customerName: fileStore.customerName,
        files: fileStore.files,
        isActive: fileStore.isActive,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description PUBLIC - Upload files for an order (customer artwork/photos)
   * @Method POST
   * @Access PUBLIC (no auth)
   * @Route /api/uploads/:token
   */
  async uploadFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const fileStore = await FileStoreModel.findOne({ uploadToken: token });

      if (!fileStore) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Upload link not found or invalid' });
        return;
      }

      if (!fileStore.isActive) {
        res.status(403).json({ message: 'This upload link has been deactivated' });
        return;
      }

      const uploadedFiles = req.files as Express.Multer.File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        res.status(statusCodes.BAD_REQUEST).json({ message: 'No files uploaded' });
        return;
      }

      const newEntries = uploadedFiles.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${token}/${file.filename}`,
        uploadedAt: new Date(),
      }));

      fileStore.files.push(...newEntries);
      await fileStore.save();

      // Automatically create artwork folder in sync with task
      try {
        if (fileStore.orderId) {
          const tasks = await Task.find({ orderId: fileStore.orderId.toString(), isDeleted: { $ne: true } });
          if (tasks && tasks.length > 0) {
            const task = tasks[0];
            const customerName = fileStore.customerName || 'Customer';
            
            // Check if folder exists for this task
            let folder = await VirtualFolder.findOne({ taskId: task._id.toString() });
            if (!folder) {
              folder = await virtualFolderRepository.create({
                name: `${customerName} - Artwork`,
                taskId: task._id.toString()
              });
            }

            // Sync uploaded files with FileUpload to show in Artwork Manager
            const fileUploadPromises = newEntries.map(file => {
              return fileUploadRepository.create({
                userId: `CUSTOMER_${fileStore.uploadToken}`,
                orderId: fileStore.orderId.toString(),
                taskId: task._id.toString(),
                folderId: folder!._id.toString(),
                filename: file.filename,
                originalName: file.originalName,
                mimetype: file.mimeType,
                size: file.size,
                path: file.url,
                category: 'ARTWORK',
                tag: 'attachment',
                adminReviewed: false
              });
            });
            await Promise.all(fileUploadPromises);

            // Sync with Task directly
            newEntries.forEach(file => {
              task.files.push({
                url: file.url,
                name: file.originalName,
                tag: 'attachment'
              });
            });
            await task.save();
          }
        }
      } catch (syncError) {
        console.error('[FileStoreController] Error syncing uploaded files to task/folder:', syncError);
      }

      res.status(statusCodes.CREATED).json({
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: newEntries,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Get all file stores (admin)
   * @Method GET
   * @Access PRIVATE (Admin)
   * @Route /api/filestore
   */
  async getAllFileStores(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fileStores = await FileStoreModel.find()
        .populate('orderId', 'orderStatus totalAmount paymentStatus')
        .sort({ createdAt: -1 });
      res.status(statusCodes.OK).json({ message: 'File stores fetched successfully', fileStores });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Get file store for a specific order (admin)
   * @Method GET
   * @Access PRIVATE (Admin)
   * @Route /api/filestore/:orderId
   */
  async getFileStoreByOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fileStore = await FileStoreModel.findOne({ orderId: req.params.orderId })
        .populate('orderId', 'orderStatus totalAmount paymentStatus address');
      if (!fileStore) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'File store not found for this order' });
        return;
      }
      res.status(statusCodes.OK).json({ message: 'File store fetched successfully', fileStore });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Delete a specific file from a file store (admin)
   * @Method DELETE
   * @Access PRIVATE (Admin)
   * @Route /api/filestore/:orderId/file/:filename
   */
  async deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId, filename } = req.params;
      const fileStore = await FileStoreModel.findOne({ orderId });

      if (!fileStore) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'File store not found' });
        return;
      }

      const fileIndex = fileStore.files.findIndex((f) => f.filename === filename);
      if (fileIndex === -1) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'File not found in store' });
        return;
      }

      // Delete from disk
      const filePath = path.join(
        process.cwd(),
        'public',
        'uploads',
        fileStore.uploadToken,
        filename
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      fileStore.files.splice(fileIndex, 1);
      await fileStore.save();

      res.status(statusCodes.OK).json({ message: 'File deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Download all files for an order as a ZIP archive (admin)
   * @Method GET
   * @Access PRIVATE (Admin)
   * @Route /api/filestore/:orderId/download
   */
  async downloadAllFiles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fileStore = await FileStoreModel.findOne({ orderId: req.params.orderId });
      if (!fileStore) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'File store not found' });
        return;
      }

      if (fileStore.files.length === 0) {
        res.status(statusCodes.BAD_REQUEST).json({ message: 'No files to download' });
        return;
      }

      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        fileStore.uploadToken
      );

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="order-${req.params.orderId}-files.zip"`
      );

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => next(err));
      archive.pipe(res);

      for (const file of fileStore.files) {
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file.originalName });
        }
      }

      await archive.finalize();
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Toggle upload link active/inactive (admin)
   * @Method PATCH
   * @Access PRIVATE (Admin)
   * @Route /api/filestore/:orderId/toggle
   */
  async toggleToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fileStore = await FileStoreModel.findOne({ orderId: req.params.orderId });
      if (!fileStore) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'File store not found' });
        return;
      }

      fileStore.isActive = !fileStore.isActive;
      await fileStore.save();

      res.status(statusCodes.OK).json({
        message: `Upload link ${fileStore.isActive ? 'activated' : 'deactivated'} successfully`,
        isActive: fileStore.isActive,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
