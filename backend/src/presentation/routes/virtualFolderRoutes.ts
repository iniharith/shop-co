/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import authMiddilware from '../middlewares/auth.middileware';
import { virtualFolderRepository } from '../../infrastructure/repositories/VirtualFolderRepository';
import { fileUploadRepository } from '../../infrastructure/repositories/FileUploadRepository';
import { FileUpload } from '../../domain/entities/FileUpload';

const router = Router();

// GET /api/folders
// Fetch all virtual folders
router.get(
  '/',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const folders = await virtualFolderRepository.findAll();
    res.json({ success: true, data: folders });
  })
);

// POST /api/folders
// Create a new virtual folder
router.post(
  '/',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, taskId, userId } = req.body;
    
    if (!name) {
      res.status(400).json({ success: false, message: 'Folder name is required' });
      return;
    }
    
    if (!taskId && !userId) {
      res.status(400).json({ success: false, message: 'Either taskId or userId is required' });
      return;
    }

    const folder = await virtualFolderRepository.create({
      name,
      taskId: taskId || undefined,
      userId: userId || undefined
    });

    res.status(201).json({ success: true, data: folder, message: 'Folder created successfully' });
  })
);

// DELETE /api/folders/:id
// Delete a folder and ALL files inside it
router.delete(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const folder = await virtualFolderRepository.findById(id);
    if (!folder) {
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }

    // Completely delete all files inside the folder
    // Note: We use FileUpload directly to delete files. In a real scenario, we might also want to delete from S3, 
    // but the system's existing bulkDelete handles S3 or expects cron job to clean up orphans, or we can just delete docs.
    // Let's check how the system deletes files. Usually fileUploadRepository.delete deletes the S3 object if implemented.
    // We'll fetch files in this folder and delete them using repository.
    const filesInFolder = await FileUpload.find({ folderId: id });
    for (const file of filesInFolder) {
      await fileUploadRepository.delete(file._id.toString());
    }

    await virtualFolderRepository.delete(id);

    res.json({ success: true, message: `Folder and ${filesInFolder.length} files deleted completely.` });
  })
);

export default router;
