import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { taskRepository } from '../../infrastructure/repositories/TaskRepository';
import { OrderUsecase } from '../../application/usecases/orders/order.usecase';
import authMiddilware from '../middlewares/auth.middileware';
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
  api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});

const taskStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kampungcetak/tasks",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf", "docx", "zip"]
  } as any,
});
const taskUpload = multer({ storage: taskStorage });

const router = Router();

// GET /api/tasks
router.get(
  '/',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const role = authReq.role;
    const filters: any = {
      status: req.query.status as string,
      assignee: req.query.assignee as string,
      orderId: req.query.orderId as string,
    };
    
    // If not admin, only show tasks linked to their username or orders (for simplicity, we'll just match their username)
    if (!['admin', 'sysadmin', 'boss'].includes(role)) {
      filters.customerUsername = authReq.user?.name || authReq.user?.email; // or however user is identified
    }
    
    const tasks = await taskRepository.findAll(filters);
    res.json({ success: true, tasks });
  })
);

// POST /api/tasks
router.post(
  '/',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskRepository.create(req.body);
    res.json({ success: true, task });
  })
);

// Helper function to delete all files for a task
const deleteAllTaskFiles = async (task: any) => {
  if (task.files && task.files.length > 0) {
    try {
      const { FileUpload } = await import('../../domain/entities/FileUpload');
      
      for (const file of task.files) {
        // Delete from Cloudinary
        const parts = file.url.split('/');
        const filenameWithExtension = parts[parts.length - 1];
        const publicId = `kampungcetak/tasks/${filenameWithExtension.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
        
        // Delete from FileUpload collection
        await FileUpload.findOneAndDelete({ path: file.url, taskId: task._id });
      }
      
      // Clear files array in task document
      task.files = [];
      await task.save();
    } catch (e) {
      console.error('Failed to delete task files:', e);
    }
  }
};

// PUT /api/tasks/:id
router.put(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const oldTask = await taskRepository.findById(req.params.id);
    const task = await taskRepository.update(req.params.id, req.body);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    
    if (req.body.assignee && oldTask?.assignee?.toString() !== req.body.assignee) {
        const { NotificationRepository } = await import('../../infrastructure/db/repositories/notification.repository');
        const notifRepo = new NotificationRepository();
        await notifRepo.createNotification({
            userId: req.body.assignee,
            message: `You have been assigned a new task: ${task.title}`,
            type: 'system',
            read: false
        } as any);
    }
    
    // Sync status to Order if it changed
    if (req.body.status && req.body.status !== oldTask?.status) {
        if (task.orderId) {
            try {
                const orderUsecase = new OrderUsecase();
                await orderUsecase.updateOrderStatus(task.orderId, req.body.status as any);
            } catch (e) {
                console.error('Failed to sync status to order:', e);
            }
        }
        
        // Delete all files if status changes to DONE DESIGN
        if (req.body.status === 'DONE DESIGN') {
            await deleteAllTaskFiles(task);
        }
    }
    
    res.json({ success: true, task });
  })
);

// DELETE /api/tasks/:id
router.delete(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskRepository.findById(req.params.id);
    if (task) {
      await deleteAllTaskFiles(task);
      await taskRepository.delete(req.params.id);
    }
    res.json({ success: true, message: 'Task deleted' });
  })
);

// POST /api/tasks/:id/comments
router.post(
  '/:id/comments',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    const userName = authReq.user?.name || authReq.user?.email || 'Admin';
    const role = authReq.role;
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ success: false, message: 'Comment text is required' });
      return;
    }

    const task = await taskRepository.addComment(req.params.id, userId, userName, text, role);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  })
);

// POST /api/tasks/:id/files
router.post(
  '/:id/files',
  authMiddilware,
  taskUpload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }
    const fileUrl = req.file.path;
    const fileName = req.file.originalname || 'Attached File';

    const task = await taskRepository.addFile(req.params.id, fileUrl, fileName);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Also sync the file to the general FileUpload collection
    try {
      const { FileUpload } = await import('../../domain/entities/FileUpload');
      const authReq = req as any;
      const userId = authReq.userId || authReq.user?.id || 'admin';

      await FileUpload.create({
        userId: userId,
        taskId: task._id,
        orderId: task.orderId || undefined,
        category: 'TASK',
        filename: req.file.filename,
        originalName: fileName,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: fileUrl,
      });
    } catch (e) {
      console.error('Failed to sync task file to FileUpload:', e);
    }

    res.json({ success: true, task });
  })
);

// DELETE /api/tasks/:id/files/:fileId
router.delete(
  '/:id/files/:fileId',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, fileId } = req.params;
    const task = await taskRepository.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Find the file in the task's array
    const fileIndex = task.files.findIndex((f: any) => f._id?.toString() === fileId || f.url.includes(fileId));
    if (fileIndex === -1) {
      res.status(404).json({ success: false, message: 'File not found in task' });
      return;
    }

    const fileUrl = task.files[fileIndex].url;

    // Delete from Cloudinary
    try {
      const parts = fileUrl.split('/');
      const filenameWithExtension = parts[parts.length - 1];
      const publicId = `kampungcetak/tasks/${filenameWithExtension.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.error('Failed to delete file from Cloudinary:', e);
    }

    // Delete from task document
    task.files.splice(fileIndex, 1);
    await task.save();

    // Delete from FileUpload collection
    try {
      const { FileUpload } = await import('../../domain/entities/FileUpload');
      await FileUpload.findOneAndDelete({ path: fileUrl, taskId: id });
    } catch (e) {
      console.error('Failed to delete task file from FileUpload:', e);
    }

    res.json({ success: true, message: 'File deleted from task', task });
  })
);

export default router;
