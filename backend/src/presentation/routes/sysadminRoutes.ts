/**
 * Sysadmin Routes
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import authMiddilware from '../middlewares/auth.middileware';
import os from 'os';
import mongoose from 'mongoose';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';
import fs from 'fs/promises';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import { bandwidthHistory } from '../../shared/utils/bandwidthTracker';
import path from 'path';

const router = Router();

// Middleware to restrict to sysadmin, admin, boss role
const requireSysadmin = (req: any, res: Response, next: any) => {
  if (req.user && ['sysadmin', 'admin', 'boss'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Requires elevated permissions.' });
  }
};

router.use(authMiddilware);
router.use(requireSysadmin);

// ─── GET /api/sysadmin/health ─────────────────────────
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    // OS metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg();
    const uptime = os.uptime();

    // Disk usage (Node 18.15+ supports fs.statfs)
    let diskTotal = 0;
    let diskFree = 0;
    try {
      const stat = await fs.statfs(process.platform === 'win32' ? 'C:\\\\' : '/');
      diskTotal = stat.blocks * stat.bsize;
      diskFree = stat.bfree * stat.bsize;
    } catch (err) {
      console.error('Failed to get disk stats', err);
    }

    // Database connection status
    const dbStateCode = mongoose.connection.readyState;
    let dbStatus = 'Unknown';
    if (dbStateCode === 0) dbStatus = 'Disconnected';
    if (dbStateCode === 1) dbStatus = 'Connected';
    if (dbStateCode === 2) dbStatus = 'Connecting';
    if (dbStateCode === 3) dbStatus = 'Disconnecting';

    // Application data metrics
    const taskTotal = await Task.countDocuments();
    const artworkTotal = await FileUpload.countDocuments();
    
    // Storage used
    const storageAgg = await FileUpload.aggregate([{ $group: { _id: null, totalSize: { $sum: '$size' } } }]);
    const storageUsed = storageAgg[0]?.totalSize || 0;

    // Progression chart (last 7 days of tasks created)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const progressionRaw = await Task.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        server: {
          uptime,
          cpuLoad,
          totalMem,
          freeMem,
          usedMem,
          diskTotal,
          diskFree
        },
        database: {
          status: dbStatus,
        },
        application: {
          taskTotal,
          artworkTotal,
          storageUsed,
        },
        charts: {
          bandwidth: bandwidthHistory,
          progression: progressionRaw
        },
        timestamp: new Date()
      }
    });
  })
);

// ─── GET /api/sysadmin/aws-media ─────────────────────────
router.get(
  '/aws-media',
  asyncHandler(async (req: Request, res: Response) => {
    const { prefix, continuationToken } = req.query;

    const params: any = {
      Bucket: S3_BUCKET_NAME,
      MaxKeys: 1000,
    };

    if (prefix) params.Prefix = String(prefix);
    if (continuationToken) params.ContinuationToken = String(continuationToken);

    try {
      const command = new ListObjectsV2Command(params);
      const data = await s3Client.send(command);

      const items = (data.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        storageClass: item.StorageClass,
      }));

      res.json({
        success: true,
        data: {
          items,
          isTruncated: data.IsTruncated,
          nextContinuationToken: data.NextContinuationToken,
          prefix: data.Prefix
        }
      });
    } catch (error: any) {
      console.error('S3 List Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch S3 data', error: error.message });
    }
  })
);

// ─── GET /api/sysadmin/reports ─────────────────────────
router.get(
  '/reports',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;
    if (!userId) {
      res.status(400).json({ success: false, message: 'userId is required' });
      return;
    }

    // 1. Total Assigned Tasks
    const tasksAssigned = await Task.countDocuments({ assignee: userId, isDeleted: false });

    // 2. Tasks Completed
    const tasksCompleted = await Task.countDocuments({ assignee: userId, isDeleted: false, isDone: true });

    // 3. Average Task Time (in hours)
    const timeAgg = await Task.aggregate([
      { $match: { assignee: userId, isDeleted: false, isDone: true } },
      { $project: { durationMs: { $subtract: ["$updatedAt", "$createdAt"] } } },
      { $group: { _id: null, avgDurationMs: { $avg: "$durationMs" } } }
    ]);
    const avgTimeHours = timeAgg[0]?.avgDurationMs ? (timeAgg[0].avgDurationMs / (1000 * 60 * 60)).toFixed(1) : 0;

    // 4. File Quantity (attached to their assigned tasks)
    const filesAgg = await Task.aggregate([
      { $match: { assignee: userId, isDeleted: false } },
      { $project: { fileCount: { $size: { $ifNull: ["$files", []] } } } },
      { $group: { _id: null, totalFiles: { $sum: "$fileCount" } } }
    ]);
    const fileQuantity = filesAgg[0]?.totalFiles || 0;

    // 5. Efficiency
    const efficiency = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;

    // 6. Chart Data (Last 30 Days completion)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const chartDataRaw = await Task.aggregate([
      { $match: { assignee: userId, isDeleted: false, isDone: true, updatedAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          completed: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = chartDataRaw.find(c => c._id === dateStr);
      chartData.push({
        date: dateStr,
        completed: found ? found.completed : 0
      });
    }

    res.json({
      success: true,
      data: {
        tasksAssigned,
        tasksCompleted,
        avgTimeHours,
        fileQuantity,
        efficiency,
        chartData
      }
    });
  })
);

export default router;
