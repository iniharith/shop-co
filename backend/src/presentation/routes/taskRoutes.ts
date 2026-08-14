/**
 * Coded by Harith
 * Kampungcetak ®
 */
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
import { sendPushNotification } from '../../services/pushNotification.service';
import { emitTaskUpdated } from '../../shared/utils/taskBroadcast';
import { fileUploadRepository, notifyFileClients } from '../../infrastructure/repositories/FileUploadRepository';
import { clearFolderGroupCache } from './fileUploadRoutes';
import { decodeCursor } from '../../shared/utils/cursorPagination';
import { indexTask, indexFile } from '../../application/ai/aiIndexService';
import { pgVectorStore } from '../../infrastructure/vector/pgVectorStore';
import { aiConfigured } from '../../infrastructure/ai/openaiClient';

const reindexTaskInBg = (task: any) => {
  if (!task || !aiConfigured()) return;
  void indexTask(task).catch((err) => console.error('[ai] task index failed:', err.message));
};
const reindexFileInBg = (file: any) => {
  if (!file || !aiConfigured()) return;
  void indexFile(file).catch((err) => console.error('[ai] file index failed:', err.message));
};
const removeTaskIndex = (taskId: string) => {
  if (!aiConfigured()) return;
  void pgVectorStore.deleteEntity('tasks', taskId).catch(() => {});
};
const removeFileIndex = (fileId: string) => {
  if (!aiConfigured()) return;
  void pgVectorStore.deleteEntity('files', fileId).catch(() => {});
};

const redisService = new RedisService();
type TaskFileTag = 'attachment' | 'draft' | 'for_print' | 'awb';
const TASK_FILE_TAGS = new Set<TaskFileTag>(['attachment', 'draft', 'for_print', 'awb']);
const normalizeTaskFileTag = (tag: unknown): TaskFileTag => {
  const value = String(tag) as TaskFileTag;
  return TASK_FILE_TAGS.has(value) ? value : 'attachment';
};

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
      search: req.query.search as string,
    };

    if (req.query.cursor !== undefined) {
      if (typeof req.query.cursor !== 'string') {
        res.status(400).json({ success: false, message: 'Invalid cursor' });
        return;
      }
      try {
        filters.cursor = decodeCursor(req.query.cursor);
      } catch {
        res.status(400).json({ success: false, message: 'Invalid cursor' });
        return;
      }
    }

    // 'statuses' (plural, comma-separated) was being silently dropped here —
    // the admin manager pages (Production/Packaging) rely on it to scope
    // their queries, and without it they were falling back to the default
    // 30-day window with no status filter at all.
    if (req.query.statuses) {
      filters.statuses = (req.query.statuses as string).split(',').map(s => s.trim()).filter(Boolean);
      // Jobs can sit in production/packaging well past 30 days; widen the
      // window whenever a specific status set is requested so those aren't
      // silently excluded.
      filters.days = 180;
    }
    
    if (req.query.deleted === 'true') {
      filters.isDeleted = true;
    }
    
    // If not admin, only show tasks linked to their username or orders (for simplicity, we'll just match their username)
    if (!['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(role)) {
      filters.customerUsername = authReq.user?.name || authReq.user?.email; // or however user is identified
    }
    
    if (req.query.limit) {
      const parsed = parseInt(req.query.limit as string, 10);
      if (!Number.isNaN(parsed)) filters.limit = parsed;
    }

    const { tasks, pageInfo } = await taskRepository.findPage(filters);
    res.json({ success: true, tasks, pageInfo });
  })
);

// GET /api/tasks/:id
router.get(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskRepository.findDetailById(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  })
);

// POST /api/tasks
router.post(
  '/',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskRepository.create(req.body);

    // Log the initial state as activity — otherwise a task created with an
    // assignee/status already filled in shows an empty feed, since those
    // values were never "changed" via a later update.
    const authReq = req as any;
    const userId = authReq.userId || authReq.user?.id || 'system';
    let userName = authReq.user?.name || authReq.user?.email;
    if (!userName && userId && userId !== 'system') {
      try {
        const user = await UserRepository.findById(userId);
        userName = user?.name || user?.email;
      } catch (error) {}
    }
    userName = userName || 'System';

    if (task.assignee) {
      try {
        const assignedUser = await UserRepository.findById(task.assignee as any);
        const assigneeName = assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User';
        await taskRepository.addActivity(task._id.toString(), userId, userName, `assigned to ${assigneeName}`);
      } catch (e) {}
    }
    if (task.status && task.status !== 'PLACED') {
      await taskRepository.addActivity(task._id.toString(), userId, userName, `set status to ${task.status.replace(/_/g, ' ')}`);
    }

    const freshTask = await taskRepository.findById(task._id.toString());
    res.json({ success: true, task: freshTask });
    void emitTaskUpdated('task_created', { task: freshTask });
    reindexTaskInBg(freshTask);
  })
);

// Helper function to delete all files for a task
const deleteAllTaskFiles = async (task: any) => {
  try {
    const { FileUpload } = await import('../../domain/entities/FileUpload');
    const taskId = task._id.toString();

    // Delete all FileUpload records referencing this task (share link uploads + direct uploads)
    await FileUpload.deleteMany({ taskId });
    void notifyFileClients();

    // Delete files from S3 and clear task.files array
    if (task.files && task.files.length > 0) {
      for (const file of task.files) {
        if (file.url) {
          await deleteFromS3(file.url);
        }
      }
      task.files = [];
      await task.save();
    }
  } catch (e) {
    console.error('Failed to delete task files:', e);
  }
};

// PUT /api/tasks/:id
router.put(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const oldTask = await taskRepository.findById(req.params.id);
    const isDoneChanged = typeof req.body.isDone === 'boolean' && req.body.isDone !== Boolean(oldTask?.isDone);

    // If someone is being newly assigned to a task that's still "In Progress",
    // automatically advance it to "In Design" — being assigned implies design work
    // is starting. Only triggers when assignee actually changes, and only nudges
    // the status if the caller didn't already explicitly request a different one.
    const isNewAssignment = req.body.assignee && oldTask?.assignee?.toString() !== req.body.assignee;
    const currentStatus = oldTask?.status || 'PLACED';
    const preDesignStatuses = ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED'];
    if (isNewAssignment && preDesignStatuses.includes(currentStatus) && (!req.body.status || req.body.status === currentStatus)) {
      req.body.status = 'IN_DESIGN';
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
    if (req.body.assignee !== undefined && oldTask?.assignee?.toString() !== (req.body.assignee || undefined)?.toString()) {
      if (req.body.assignee) {
        const assignedUser = await UserRepository.findById(req.body.assignee);
        const assigneeName = assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User';
        await taskRepository.addActivity(req.params.id, userId, userName, `assigned to ${assigneeName}`);
      } else {
        await taskRepository.addActivity(req.params.id, userId, userName, `unassigned this task`);
      }
    }
    if (req.body.description !== undefined && req.body.description !== oldTask?.description) {
      const trunc = (s: string | undefined | null, max: number) => { const t = s || ''; return t.length > max ? t.substring(0, max) + '...' : (t || '(empty)'); };
      await taskRepository.addActivity(req.params.id, userId, userName, `changed description`, `from "${trunc(oldTask?.description, 80)}" to "${trunc(req.body.description, 80)}"`);
    }
    if (req.body.title !== undefined && req.body.title !== oldTask?.title) {
      await taskRepository.addActivity(req.params.id, userId, userName, `changed title`, `from "${oldTask?.title || '(empty)'}" to "${req.body.title}"`);
    }
    if (isDoneChanged) {
      await taskRepository.addActivity(
        req.params.id,
        userId,
        userName,
        req.body.isDone ? 'marked task as done' : 'marked task as not done'
      );
    }
    
    // Sync status to the linked order only when status itself changed. Linking
    // an order must not silently change its status or notify its customer.
    if (req.body.status && req.body.status !== oldTask?.status) {
        if (task.orderId) {
            try {
                const orderUsecase = new OrderUsecase();
                await orderUsecase.updateOrderStatus(task.orderId, task.status === 'RETURN' ? 'RETURNED' : task.status as any, false, req.params.id);
            } catch (e) {
                console.error('Failed to sync status to order:', e);
            }
        }
    }

    // Clear the folder-group cache so Production/Packaging pages see the updated status
    if (req.body.status && req.body.status !== oldTask?.status) {
      await clearFolderGroupCache().catch(() => {});
    }

    // Refetch to include newly added activities in the response and broadcast
    const freshTask = await taskRepository.findById(req.params.id);
    res.json({ success: true, task: freshTask });
    void emitTaskUpdated('task_updated', { task: freshTask });
    reindexTaskInBg(freshTask);
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
        removeTaskIndex(req.params.id);
      } else {
        await taskRepository.delete(req.params.id);
      }
      await clearFolderGroupCache().catch(() => {});
    }
    res.json({ success: true, message: req.query.permanent === 'true' ? 'Task permanently deleted' : 'Task deleted' });
    emitTaskUpdated('task_deleted', { taskId: req.params.id });
  })
);

// POST /api/tasks/:id/restore
router.post(
  '/:id/restore',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskRepository.restore(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Deleted task not found' });
      return;
    }

    const authReq = req as any;
    const userId = authReq.userId || authReq.user?._id || authReq.user?.id || 'system';
    const userName = authReq.user?.name || authReq.user?.email || 'System';
    await taskRepository.addActivity(req.params.id, userId, userName, 'restored this task');
    await clearFolderGroupCache().catch(() => {});

    const freshTask = await taskRepository.findById(req.params.id);
    res.json({ success: true, message: 'Task restored', task: freshTask });
    void emitTaskUpdated('task_updated', { task: freshTask });
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
    void emitTaskUpdated('task_updated', { task });
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
    void emitTaskUpdated('task_updated', { task });
  })
);

// PUT /api/tasks/:id/comments/:commentId/pin
router.put(
  '/:id/comments/:commentId/pin',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const { pinned } = req.body;
    const task = await taskRepository.pinComment(req.params.id, req.params.commentId, pinned);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task or comment not found' });
      return;
    }
    res.json({ success: true, task });
    void emitTaskUpdated('task_updated', { task });
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
      void notifyFileClients();
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

    const freshTask = await taskRepository.findById(id);
    res.json({ success: true, task: freshTask });
    void emitTaskUpdated('task_updated', { task: freshTask });
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
    const tag = normalizeTaskFileTag(req.body.tag);
    const folderId = req.body.folderId || undefined;

    const task = await taskRepository.addFile(req.params.id, fileUrl, fileName, tag);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    {
      const authReq = req as any;
      const userId = authReq.userId || authReq.user?.id || 'admin';
      let userName = authReq.user?.name || authReq.user?.email;
      if (!userName && userId) {
        try {
          const user = await UserRepository.findById(userId);
          userName = user?.name || user?.email;
        } catch (error) {}
      }
      await taskRepository.addActivity(req.params.id, userId, userName || 'Admin', `uploaded file "${fileName}"`);
    }

    // Also sync the file to the general FileUpload collection
    try {
      const authReq = req as any;
      const userId = authReq.userId || authReq.user?.id || 'admin';

       const createdUpload = await fileUploadRepository.create({
        userId: userId,
        taskId: task._id.toString(),
        orderId: task.orderId || undefined,
        category: 'TASK',
        tag: tag,
        folderId: folderId,
        filename: (req.file as any).key || req.file.filename || req.file.originalname,
        originalName: fileName,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: fileUrl,
      });
      reindexFileInBg(createdUpload);
    } catch (e) {
      console.error('Failed to sync task file to FileUpload:', e);
    }

    const freshTask = await taskRepository.findById(req.params.id);
    res.json({ success: true, task: freshTask });
    void emitTaskUpdated('task_updated', { task: freshTask });
    reindexTaskInBg(freshTask);
  })
);

// POST /api/tasks/:id/files/save-metadata
router.post(
  '/:id/files/save-metadata',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const { fileUrl, fileName, fileKey, mimetype, size } = req.body;
    const tag = normalizeTaskFileTag(req.body.tag);
    const folderId = req.body.folderId || undefined;
    
    if (!fileUrl || !fileName) {
      res.status(400).json({ success: false, message: 'fileUrl and fileName are required' });
      return;
    }

    const task = await taskRepository.addFile(req.params.id, fileUrl, fileName, tag);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    {
      const authReq = req as any;
      const userId = authReq.userId || authReq.user?.id || 'admin';
      let userName = authReq.user?.name || authReq.user?.email;
      if (!userName && userId) {
        try {
          const user = await UserRepository.findById(userId);
          userName = user?.name || user?.email;
        } catch (error) {}
      }
      await taskRepository.addActivity(req.params.id, userId, userName || 'Admin', `uploaded file "${fileName}"`);
    }

    try {
      const authReq = req as any;
      const userId = authReq.userId || authReq.user?.id || 'admin';

      const createdUpload = await fileUploadRepository.create({
        userId: userId,
        taskId: task._id.toString(),
        orderId: task.orderId || undefined,
        category: 'TASK',
        tag,
        folderId,
        filename: fileKey || fileName,
        originalName: fileName,
        mimetype: mimetype || 'application/octet-stream',
        size: size || 0,
        path: fileUrl,
      });
      reindexFileInBg(createdUpload);
    } catch (e) {
      console.error('Failed to sync task file to FileUpload:', e);
    }

    const freshTask = await taskRepository.findById(req.params.id);
    res.json({ success: true, task: freshTask });
    void emitTaskUpdated('task_updated', { task: freshTask });
    reindexTaskInBg(freshTask);
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

    const authReq = req as any;
    const actorId = authReq.userId || authReq.user?.id || 'admin';
    let actorName = authReq.user?.name || authReq.user?.email;
    if (!actorName && actorId) {
      try {
        const user = await UserRepository.findById(actorId);
        actorName = user?.name || user?.email;
      } catch (error) {}
    }
    actorName = actorName || 'Admin';

    // Find the file in the task's array
    const fileIndex = task.files.findIndex((f: any) => f._id?.toString() === fileId || f.url.includes(fileId));
    if (fileIndex === -1) {
      // It might be a FileUpload document (customer file attached virtually)
      try {
        const { FileUpload } = await import('../../domain/entities/FileUpload');
        const fileDoc = await FileUpload.findById(fileId);
        if (fileDoc) {
          if (fileDoc.path) await deleteFromS3(fileDoc.path).catch(console.error);
          await FileUpload.findByIdAndDelete(fileId);
          removeFileIndex(fileId);

          // Remove the matching entry from the task's files array too, so the
          // file does not resurrect on the next refetch / socket update.
          if (fileDoc.path) {
            const tfIndex = task.files.findIndex((f: any) => f.url === fileDoc.path);
            if (tfIndex !== -1) {
              task.files.splice(tfIndex, 1);
              await task.save();
            }
          }

          void notifyFileClients();
          await taskRepository.addActivity(id, actorId, actorName, `deleted file "${fileDoc.originalName || fileDoc.filename || 'attachment'}"`);
          const freshTask = await taskRepository.findById(id);
          res.json({ success: true, message: 'File deleted from task', task: freshTask });
          void emitTaskUpdated('task_updated', { task: freshTask });
          return;
        }
      } catch(e) {}
      
      res.status(404).json({ success: false, message: 'File not found in task' });
      return;
    }

    const fileUrl = task.files[fileIndex].url;
    const fileName = task.files[fileIndex].name || fileUrl.split('/').pop() || 'attachment';

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
      void notifyFileClients();
    } catch (e) {
      console.error('Failed to delete task file from FileUpload:', e);
    }

    await taskRepository.addActivity(id, actorId, actorName, `deleted file "${fileName}"`);

    const freshTask = await taskRepository.findById(id);
    res.json({ success: true, message: 'File deleted from task', task: freshTask });
    void emitTaskUpdated('task_updated', { task: freshTask });
  })
);

export default router;
