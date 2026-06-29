import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { taskRepository } from '../../infrastructure/repositories/TaskRepository';
import { OrderUsecase } from '../../application/usecases/orders/order.usecase';
import authMiddilware from '../middlewares/auth.middileware';
import { s3Client, S3_BUCKET_NAME, deleteFromS3 } from "../../infrastructure/config/s3";
import multerS3 from "multer-s3";
import multer from "multer";
import UserRepository from '../../infrastructure/db/repositories/user.repository';
import { NotificationRepository } from '../../infrastructure/db/repositories/notification.repository';
import { FileUpload } from '../../domain/entities/FileUpload';
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_CHANNELS } from '../../shared/constants/redis.constant';

const redisService = new RedisService();

const taskStorage = multerS3({
  s3: s3Client,
  bucket: S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req: any, file: any, cb: any) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req: any, file: any, cb: any) {
    const taskId = req.params.id || req.body.taskId || 'unknown_task';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `kampungcetak/tasks/${taskId}/${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  }
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
    
    if (req.query.deleted === 'true') {
      filters.isDeleted = true;
    }
    
    // If not admin, only show tasks linked to their username or orders (for simplicity, we'll just match their username)
    if (!['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(role)) {
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
        // Delete from S3
        if (file.url) {
          await deleteFromS3(file.url);
        }
        
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

    // If someone is being newly assigned to a task that's still "In Progress",
    // automatically advance it to "In Design" — being assigned implies design work
    // is starting. Only triggers when assignee actually changes, and only nudges
    // the status if the caller didn't already explicitly request a different one.
    const isNewAssignment = req.body.assignee && oldTask?.assignee?.toString() !== req.body.assignee;
    const currentStatus = oldTask?.status || 'PLACED';
    if (isNewAssignment && currentStatus === 'IN_PROGRESS' && !req.body.status) {
      req.body.status = 'IN_DESIGN';
    }

    if (req.body.status && req.body.status !== oldTask?.status) {
      req.body.statusUpdatedAt = new Date();
    }
    const task = await taskRepository.update(req.params.id, req.body);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    
    if (req.body.assignee && oldTask?.assignee?.toString() !== req.body.assignee) {
        const { NotificationRepository } = await import('../../infrastructure/db/repositories/notification.repository');
        const notifRepo = new NotificationRepository();
        const newNotif = await notifRepo.createNotification({
            userId: req.body.assignee,
            title: 'Tugasan Baru',
            message: `You have been assigned a new task: ${task.title}`,
            type: 'SYSTEM',
            read: false
        } as any);
        
        await redisService.publish(REDIS_CHANNELS.NOTIFICATION, JSON.stringify(newNotif));
    }
    
    // Log activities
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?._id || authReq.user?.id || 'system';
    const userName = authReq.user?.name || authReq.user?.email || 'System';

    if (req.body.status && req.body.status !== oldTask?.status) {
      const oldStatus = (oldTask?.status || 'PLACED').replace(/_/g, ' ');
      const newStatus = req.body.status.replace(/_/g, ' ');
      await taskRepository.addActivity(req.params.id, userId, userName, `changed status from ${oldStatus} to ${newStatus}`);
    }
    if (req.body.assignee && oldTask?.assignee?.toString() !== req.body.assignee) {
      await taskRepository.addActivity(req.params.id, userId, userName, `assigned this task`);
    }
    if (req.body.description !== undefined && req.body.description !== oldTask?.description) {
      // Do not log description changes as activity
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
      if (req.query.permanent === 'true') {
        await deleteAllTaskFiles(task);
        await taskRepository.permanentDelete(req.params.id);
      } else {
        await taskRepository.delete(req.params.id);
      }
    }
    res.json({ success: true, message: req.query.permanent === 'true' ? 'Task permanently deleted' : 'Task deleted' });
  })
);

// POST /api/tasks/:id/comments
router.post(
  '/:id/comments',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    
    let userName = authReq.user?.name || authReq.user?.email;
    if (!userName && userId) {
      try {
        const user = await UserRepository.findById(userId);
        userName = user?.name || user?.email;
      } catch (error) {
        console.error("Error fetching user for comment:", error);
      }
    }
    userName = userName || 'User';

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

    // Send notification to assignee if they are not the one commenting
    if (task.assignee && task.assignee.toString() !== userId.toString()) {
      try {
        const notifRepo = new NotificationRepository();
        await notifRepo.createNotification({
          userId: task.assignee.toString(),
          title: 'New Task Comment',
          message: `${userName} commented on task: ${task.title}`,
          type: 'SYSTEM',
          taskId: task._id.toString(),
          link: `/admin/tasks?taskId=${task._id.toString()}`,
          read: false
        } as any);
      } catch (err) {
        console.error("Failed to send comment notification:", err);
      }
    }

    res.json({ success: true, task });
  })
);

// DELETE /api/tasks/:id/comments/:commentId
router.delete(
  '/:id/comments/:commentId',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskRepository.deleteComment(req.params.id, req.params.commentId);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  })
);

// PUT /api/tasks/:id/files/notes
router.put(
  '/:id/files/notes',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fileUrl, notes } = req.body;
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id;
    
    let userName = authReq.user?.name || authReq.user?.email;
    if (!userName && userId) {
      try {
        const user = await UserRepository.findById(userId);
        userName = user?.name || user?.email;
      } catch (error) {}
    }
    userName = userName || 'Admin';

    if (!fileUrl) {
      res.status(400).json({ success: false, message: 'fileUrl is required' });
      return;
    }

    // Update the note in the Task
    const task = await taskRepository.updateFileNotes(id, fileUrl, notes || '');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task or file not found' });
      return;
    }

    // Extract filename for comment
    const fileName = fileUrl.split('/').pop() || 'file';

    // Sync the note to the FileUpload collection
    try {
      await FileUpload.findOneAndUpdate(
        { path: fileUrl, taskId: id },
        { $set: { adminNotes: notes || '' } }
      );
    } catch (err) {
      console.error("Failed to sync file upload notes:", err);
    }

    // Add an activity to the task to notify stakeholders
    await taskRepository.addActivity(
      id, 
      userId, 
      userName, 
      `updated note for attached file (${fileName}): ${notes || '(cleared)'}`
    );

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
    const fileUrl = (req.file as any).location;
    const fileName = req.file.originalname || 'Attached File';
    const tag = req.body.tag || 'attachment';

    const task = await taskRepository.addFile(req.params.id, fileUrl, fileName, tag);
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
        tag: tag,
        filename: (req.file as any).key || req.file.filename || req.file.originalname,
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

    // Delete from S3
    try {
      if (fileUrl) {
        await deleteFromS3(fileUrl);
      }
    } catch (e) {
      console.error('Failed to delete file from S3:', e);
    }

    // Delete from task document
    task.files.splice(fileIndex, 1);
    await task.save();

    // Delete from FileUpload collection
    try {
      const { FileUpload } = await import('../../domain/entities/FileUpload');
      await FileUpload.findOneAndDelete({ path: fileUrl });
    } catch (e) {
      console.error('Failed to delete task file from FileUpload:', e);
    }

    res.json({ success: true, message: 'File deleted from task', task });
  })
);

export default router;
