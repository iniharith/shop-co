import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { taskRepository } from '../../infrastructure/repositories/TaskRepository';
import authMiddilware from '../middlewares/auth.middileware';

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

// PUT /api/tasks/:id
router.put(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskRepository.update(req.params.id, req.body);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  })
);

// DELETE /api/tasks/:id
router.delete(
  '/:id',
  authMiddilware,
  asyncHandler(async (req: Request, res: Response) => {
    await taskRepository.delete(req.params.id);
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
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ success: false, message: 'Comment text is required' });
      return;
    }

    const task = await taskRepository.addComment(req.params.id, userId, userName, text);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  })
);

export default router;
