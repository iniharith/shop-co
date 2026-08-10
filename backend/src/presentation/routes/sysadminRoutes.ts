/**
 * Sysadmin Routes
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import os from 'os';
import mongoose from 'mongoose';
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';
import fs from 'fs/promises';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import { bandwidthHistory } from '../../shared/utils/bandwidthTracker';
import path from 'path';
import OrderModel from '../../infrastructure/db/models/order.model';
import { parcelRepository } from '../../infrastructure/repositories/ParcelRepository';
import { fileUploadRepository } from '../../infrastructure/repositories/FileUploadRepository';
import { virtualFolderRepository } from '../../infrastructure/repositories/VirtualFolderRepository';
import { taskRepository } from '../../infrastructure/repositories/TaskRepository';
import User from '../../infrastructure/db/models/user.model';
import { aggregateCompletionAnalytics, COMPLETION_STATUSES } from '../../shared/utils/queueAnalytics';

import { getOnlineUsersCount } from '../../infrastructure/socket/socketHandler';

const router = Router();

router.get('/online-users', (req: Request, res: Response) => {
    try {
        const count = getOnlineUsersCount();
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch online users count' });
    }
});

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

    // External Integrations
    let vercelStatus: any = { readyState: 'UNKNOWN', url: '', createdAt: null };
    try {
      if (process.env.VERCEL_ACCESS_TOKEN && process.env.VERCEL_PROJECT_ID) {
        const vRes = await axios.get(`https://api.vercel.com/v6/deployments?projectId=${process.env.VERCEL_PROJECT_ID}&limit=1`, {
          headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` },
          timeout: 5000,
        });
        const latest = vRes.data.deployments?.[0];
        if (latest) {
          vercelStatus = { readyState: latest.readyState, url: latest.url, createdAt: latest.createdAt };
        }
      }
    } catch(e: any) { console.error('Vercel API error', e.message); }

    let railwayStatus: any = { status: 'UNKNOWN', environment: process.env.RAILWAY_ENVIRONMENT_NAME || 'Production' };
    try {
      if (process.env.RAILWAY_API_TOKEN) {
        const query = `query { me { name } }`;
        const rRes = await axios.post('https://backboard.railway.app/graphql/v2', { query }, {
           headers: { Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}` },
           timeout: 5000,
        });
        if (rRes.data && !rRes.data.errors) railwayStatus.status = 'ACTIVE';
        else railwayStatus.status = 'ERROR';
      }
    } catch (e: any) { console.error('Railway API error', e.message); }

    let awsStatus = 'UNKNOWN';
    try {
       await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET_NAME }));
       awsStatus = 'ONLINE';
    } catch(e: any) {
       awsStatus = 'OFFLINE';
       console.error('AWS S3 Health error', e.message);
    }
    
    let mongoDetailed: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
       try {
         const serverStatus = await mongoose.connection.db.admin().serverStatus();
         mongoDetailed = {
           connections: serverStatus.connections,
           opcounters: serverStatus.opcounters,
           network: serverStatus.network
         };
       } catch(e: any) { console.error('Mongo admin error', e.message); }
    }

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
          detailed: mongoDetailed
        },
        application: {
          taskTotal,
          artworkTotal,
          storageUsed,
        },
        external: {
          vercel: vercelStatus,
          railway: railwayStatus,
          aws: awsStatus
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
// ─── GET /api/sysadmin/dashboard-summary ─────────────────────────
// Collapses the parcel/file/folder/task/order/online-user stats the admin
// dashboard needs — previously 5 separate client round trips fired on every
// page open — into a single request. The underlying queries still run in
// parallel (via Promise.all), just on the server instead of over the wire,
// each reusing the same already-windowed (30/60-day) repository calls the
// individual endpoints use, so the numbers stay identical to before.
router.get(
  '/dashboard-summary',
  asyncHandler(async (req: Request, res: Response) => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [parcelStats, fileStats, folders, totalTasks, totalOrders] = await Promise.all([
      parcelRepository.getStats(),
      fileUploadRepository.getStorageStats(),
      virtualFolderRepository.findAll(),
      taskRepository.countRecent(),
      // Count-only query instead of the fully-populated getOrders() list,
      // since the dashboard only ever needed the total.
      OrderModel.countDocuments({ createdAt: { $gte: sixtyDaysAgo } }),
    ]);

    res.json({
      success: true,
      data: {
        orders: { total: totalOrders },
        parcels: parcelStats,
        files: fileStats,
        tasks: { total: totalTasks },
        folders: { total: folders.length },
        onlineUsers: { count: getOnlineUsersCount() },
      },
    });
  })
);

// ─── GET /api/sysadmin/queue-analytics ─────────────────────────
router.get(
  '/queue-analytics',
  asyncHandler(async (req: Request, res: Response) => {
    const timezone = 'Asia/Kuala_Lumpur';
    const parsedDays = Number(req.query.days);
    const days = Number.isFinite(parsedDays) ? Math.min(Math.max(Math.trunc(parsedDays), 7), 90) : 30;
    const now = new Date();
    const klNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const firstKlDay = Date.UTC(
      klNow.getUTCFullYear(),
      klNow.getUTCMonth(),
      klNow.getUTCDate() - days + 1,
    );
    const from = new Date(firstKlDay - (8 * 60 * 60 * 1000));
    const inactiveStatuses = ['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURN', 'DONE'];
    const completionStatuses = [...COMPLETION_STATUSES];
    const activeMatch = {
      isDeleted: { $ne: true },
      isDone: { $ne: true },
      status: { $nin: inactiveStatuses },
    };
    const stageStartedAt = { $ifNull: ['$statusUpdatedAt', '$createdAt'] };
    const ageHours = { $divide: [{ $subtract: [now, stageStartedAt] }, 60 * 60 * 1000] };
    const isOverdue = {
      $and: [
        { $ne: [{ $ifNull: ['$dueDate', null] }, null] },
        { $lt: ['$dueDate', now] },
      ],
    };
    const [activeResults, rangeResults, completionTasks] = await Promise.all([
      Task.aggregate<any>([
        { $match: activeMatch },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  currentWip: { $sum: 1 },
                  overdueTasks: { $sum: { $cond: [isOverdue, 1, 0] } },
                  unassignedTasks: {
                    $sum: { $cond: [{ $eq: [{ $ifNull: ['$assignee', ''] }, ''] }, 1, 0] },
                  },
                },
              },
            ],
            statusBreakdown: [
              {
                $group: {
                  _id: { $ifNull: ['$status', 'UNKNOWN'] },
                  count: { $sum: 1 },
                  avgAgeHours: { $avg: ageHours },
                  overdue: { $sum: { $cond: [isOverdue, 1, 0] } },
                },
              },
              { $sort: { count: -1, _id: 1 } },
            ],
            staffWorkload: [
              {
                $group: {
                  _id: {
                    $cond: [
                      { $eq: [{ $ifNull: ['$assignee', ''] }, ''] },
                      null,
                      { $toString: '$assignee' },
                    ],
                  },
                  count: { $sum: 1 },
                  overdue: { $sum: { $cond: [isOverdue, 1, 0] } },
                  oldestStartedAt: { $min: stageStartedAt },
                },
              },
              { $sort: { count: -1, _id: 1 } },
            ],
            oldestTasks: [
              { $addFields: { stageStartedAt } },
              { $sort: { stageStartedAt: 1, _id: 1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  status: 1,
                  assignee: 1,
                  orderId: 1,
                  dueDate: 1,
                  stageStartedAt: 1,
                },
              },
            ],
          },
        },
      ]).option({ maxTimeMS: 10_000 }),
      Task.aggregate<any>([
        {
          $match: {
            isDeleted: { $ne: true },
            createdAt: { $gte: from, $lte: now },
          },
        },
        {
          $facet: {
            created: [
              { $match: { createdAt: { $gte: from, $lte: now } } },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]).option({ maxTimeMS: 10_000 }),
      Task.find({
        isDeleted: { $ne: true },
        $or: [
          {
            statusHistory: {
              $elemMatch: {
                changedAt: { $gte: from, $lte: now },
                $or: [
                  { toIsDone: true },
                  { toStatus: { $in: completionStatuses } },
                ],
              },
            },
          },
          {
            'statusHistory.0': { $exists: false },
            statusUpdatedAt: { $gte: from, $lte: now },
            $or: [{ isDone: true }, { status: { $in: completionStatuses } }],
          },
        ],
      })
        .select('createdAt status isDone statusUpdatedAt statusHistory')
        .lean()
        .maxTimeMS(10_000),
    ]);

    const active = activeResults[0] || {};
    const range = rangeResults[0] || {};
    const assigneeIds = new Set<string>();
    for (const item of active.staffWorkload || []) {
      if (item._id) assigneeIds.add(String(item._id));
    }
    for (const item of active.oldestTasks || []) {
      if (item.assignee) assigneeIds.add(String(item.assignee));
    }
    const validAssigneeIds = Array.from(assigneeIds).filter(id => mongoose.isValidObjectId(id));
    const users = validAssigneeIds.length
      ? await User.find({ _id: { $in: validAssigneeIds } }).select('_id name').lean().maxTimeMS(5_000)
      : [];
    const assigneeNames = new Map(users.map(user => [String(user._id), user.name || 'Unknown staff']));
    const round = (value: number, precision = 1) => {
      const factor = 10 ** precision;
      return Math.round(value * factor) / factor;
    };
    const summaryRaw = active.summary?.[0] || {};
    const currentWip = summaryRaw.currentWip || 0;
    const overdueTasks = summaryRaw.overdueTasks || 0;
    const completionSummary = aggregateCompletionAnalytics(completionTasks, from, now);
    const statusBreakdown = (active.statusBreakdown || []).map((item: any) => ({
      status: String(item._id),
      count: item.count,
      avgAgeHours: round(Math.max(0, item.avgAgeHours || 0)),
      overdue: item.overdue,
    }));
    const staffWorkload = (active.staffWorkload || []).map((item: any) => {
      const assigneeId = item._id ? String(item._id) : null;
      return {
        assigneeId,
        assigneeName: assigneeId ? (assigneeNames.get(assigneeId) || 'Unknown staff') : 'Unassigned',
        count: item.count,
        overdue: item.overdue,
        oldestAgeHours: round(Math.max(0, (now.getTime() - new Date(item.oldestStartedAt).getTime()) / (60 * 60 * 1000))),
      };
    });
    const bottlenecks = statusBreakdown
      .map((item: any) => ({
        ...item,
        score: round(item.count * (1 + item.avgAgeHours / 24) * (1 + item.overdue / item.count), 2),
      }))
      .sort((a: any, b: any) => b.score - a.score || a.status.localeCompare(b.status));
    const createdByDate = new Map((range.created || []).map((item: any) => [item._id, item.count]));
    const completedByDate = completionSummary.completedByDate;
    const dailyThroughput = [];
    for (let index = 0; index < days; index++) {
      const date = new Date(firstKlDay + (index * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
      dailyThroughput.push({
        date,
        created: Number(createdByDate.get(date) || 0),
        completed: Number(completedByDate.get(date) || 0),
      });
    }
    const oldestTasks = (active.oldestTasks || []).map((item: any) => {
      const assigneeId = item.assignee ? String(item.assignee) : undefined;
      return {
        id: String(item._id),
        title: String(item.title || ''),
        status: String(item.status || 'UNKNOWN'),
        ...(assigneeId ? { assigneeId, assigneeName: assigneeNames.get(assigneeId) || 'Unknown staff' } : {}),
        ...(item.orderId ? { orderId: String(item.orderId) } : {}),
        ...(item.dueDate ? { dueDate: new Date(item.dueDate).toISOString() } : {}),
        ageHours: round(Math.max(0, (now.getTime() - new Date(item.stageStartedAt).getTime()) / (60 * 60 * 1000))),
      };
    });

    res.json({
      success: true,
      data: {
        range: { days, from: from.toISOString(), to: now.toISOString(), timezone },
        dataQuality: {
          mode: completionSummary.legacyEstimatedCompletedInRange
            ? (completionSummary.historicalCompletedInRange ? 'mixed' : 'legacy_estimated')
            : 'historical',
          historicalCompletedInRange: completionSummary.historicalCompletedInRange,
          legacyEstimatedCompletedInRange: completionSummary.legacyEstimatedCompletedInRange,
          note: completionSummary.legacyEstimatedCompletedInRange
            ? 'Completion metrics use durable transition history where available; legacy tasks without history fall back to their current completed state and statusUpdatedAt.'
            : 'Completion metrics use durable task transition history. Current stage-age metrics still use statusUpdatedAt.',
        },
        summary: {
          currentWip,
          overdueTasks,
          overdueRate: currentWip ? round((overdueTasks / currentWip) * 100) : 0,
          unassignedTasks: summaryRaw.unassignedTasks || 0,
          completedInRange: completionSummary.completedInRange,
          avgCompletionHours: completionSummary.avgCompletionHours == null
            ? null
            : round(Math.max(0, completionSummary.avgCompletionHours)),
        },
        statusBreakdown,
        staffWorkload,
        bottlenecks,
        dailyThroughput,
        oldestTasks,
      },
    });
  })
);

// ─── GET /api/sysadmin/deployments ─────────────────────────
router.get(
  '/deployments',
  asyncHandler(async (req: Request, res: Response) => {
    let vercelDeployments: any[] = [];
    let railwayDeployments: any[] = [];

    // Fetch Vercel Deployments
    if (process.env.VERCEL_ACCESS_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        const vRes = await axios.get(`https://api.vercel.com/v6/deployments?projectId=${process.env.VERCEL_PROJECT_ID}&limit=10`, {
          headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` }
        });
        vercelDeployments = (vRes.data.deployments || []).map((d: any) => ({
          id: d.id,
          service: 'Vercel (Frontend)',
          status: d.readyState,
          commitMessage: d.meta?.githubCommitMessage?.split('\n')[0] || 'Manual Deployment',
          branch: d.meta?.githubCommitRef || 'main',
          environment: 'Production',
          createdAt: d.createdAt,
          url: `https://${d.url}`
        }));
      } catch (e: any) {
        console.error('Vercel deployments error', e.message);
      }
    }

    // Fetch Railway Deployments
    if (process.env.RAILWAY_API_TOKEN) {
      try {
        const query = `
          query {
            projects {
              edges {
                node {
                  id
                  name
                  environments {
                    edges {
                      node {
                        name
                        deployments(first: 10) {
                          edges {
                            node {
                              id
                              status
                              createdAt
                              meta
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        const rRes = await axios.post('https://backboard.railway.app/graphql/v2', { query }, {
          headers: { Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}` }
        });
        
        // Parse GraphQL response
        const projects = rRes.data?.data?.projects?.edges || [];
        projects.forEach((p: any) => {
          const envs = p.node?.environments?.edges || [];
          envs.forEach((env: any) => {
            const deps = env.node?.deployments?.edges || [];
            deps.forEach((d: any) => {
              railwayDeployments.push({
                id: d.node.id,
                service: 'Railway (Backend)',
                status: d.node.status,
                commitMessage: 'Backend Deployment',
                branch: 'main',
                environment: env.node.name,
                createdAt: new Date(d.node.createdAt).getTime(),
                url: null
              });
            });
          });
        });
        
        // Sort by newest
        railwayDeployments.sort((a, b) => b.createdAt - a.createdAt);
        railwayDeployments = railwayDeployments.slice(0, 10);
      } catch (e: any) {
        console.error('Railway deployments error', e.message);
      }
    }

    const allDeployments = [...vercelDeployments, ...railwayDeployments]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);

    res.json({
      success: true,
      data: allDeployments
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
      MaxKeys: Math.min(Math.max(Number(req.query.limit) || 100, 1), 250),
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
          prefix: data.Prefix,
          bucket: S3_BUCKET_NAME,
          keyCount: data.KeyCount || 0,
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

    const formatMsToDuration = (ms: number | undefined | null) => {
      if (!ms || isNaN(ms)) return "00 DAYS 00HRS 00MIN";
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      
      const d = String(days).padStart(2, '0');
      const h = String(hours).padStart(2, '0');
      const m = String(minutes).padStart(2, '0');
      
      return `${d} DAYS ${h}HRS ${m}MIN`;
    };

    const terminalStatuses = ['DONE_DESIGN', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];
    const activeFilter = { assignee: userId, isDeleted: { $ne: true } };
    const completedFilter = { ...activeFilter, $or: [{ isDone: true }, { status: { $in: terminalStatuses } }] };

    // Current tasks assigned to this staff member.
    const tasksAssigned = await Task.countDocuments(activeFilter);

    // 2. Tasks Completed
    const tasksCompleted = await Task.countDocuments(completedFilter);

    // 3. Average Task Time
    // Computed below using activities array

    // 4. File Quantity (attached to their assigned tasks)
    const filesAgg = await Task.aggregate([
      { $match: activeFilter },
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
      { $match: { ...completedFilter, statusUpdatedAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$statusUpdatedAt" } },
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

    // 7. Detailed Tasks for Report Printing
    const detailedTasksRaw = await Task.find(activeFilter)
      .select('title status isDone files createdAt updatedAt statusUpdatedAt activities')
      .sort({ createdAt: -1 })
      .lean();

    let totalDurationMs = 0;
    let completedCountForAvg = 0;

    const detailedTasks = detailedTasksRaw.map(t => {
      const fileCount = t.files ? t.files.length : 0;
      let timeTookFormatted = "-";
      let timeTookMs = null;

      // START TIME
      let startTime = new Date(t.createdAt).getTime();
      
      // Get the LAST IN DESIGN or IN_DESIGN activity
      const inDesignActivities = t.activities?.filter((a: any) => a.action.includes('to IN DESIGN') || a.action.includes('to IN_DESIGN'));
      if (inDesignActivities && inDesignActivities.length > 0) {
        startTime = new Date(inDesignActivities[inDesignActivities.length - 1].createdAt).getTime();
      } else {
        // Fallback 1: Try IN PROGRESS or PENDING ARTWORK
        const progressActivities = t.activities?.filter((a: any) => a.action.includes('to IN PROGRESS') || a.action.includes('to IN_PROGRESS') || a.action.includes('to PENDING'));
        if (progressActivities && progressActivities.length > 0) {
          startTime = new Date(progressActivities[progressActivities.length - 1].createdAt).getTime();
        } else {
          // Fallback 2: Assignment
          const assignActivities = t.activities?.filter((a: any) => a.action.toLowerCase().includes('assign'));
          if (assignActivities && assignActivities.length > 0) {
            startTime = new Date(assignActivities[assignActivities.length - 1].createdAt).getTime();
          } else {
            // Fallback 3: Use the VERY LAST activity logged before DONE DESIGN
            // This ensures if they took any action 10 mins ago, we use it!
            const doneDesignIndex = t.activities?.findIndex((a: any) => a.action.includes('to DONE DESIGN') || a.action.includes('to DONE_DESIGN'));
            if (doneDesignIndex > 0) {
               startTime = new Date(t.activities[doneDesignIndex - 1].createdAt).getTime();
            }
          }
        }
      }

      // END TIME
      const doneDesignActivity = t.activities?.find((a: any) => 
        a.action.includes('to DONE DESIGN') && new Date(a.createdAt).getTime() >= startTime
      );
      
      if (doneDesignActivity) {
         timeTookMs = new Date(doneDesignActivity.createdAt).getTime() - startTime;
       } else if (terminalStatuses.includes(t.status)) {
          timeTookMs = new Date(t.statusUpdatedAt || t.updatedAt).getTime() - startTime;
      }

      if (timeTookMs !== null && timeTookMs >= 0) {
        timeTookFormatted = formatMsToDuration(timeTookMs);
        totalDurationMs += timeTookMs;
        completedCountForAvg++;
      }

      return {
        _id: t._id,
        title: t.title,
        status: t.status,
        isDone: t.isDone,
        fileCount,
        timeTookFormatted
      };
    });

    const avgDurationMs = completedCountForAvg > 0 ? totalDurationMs / completedCountForAvg : 0;
    const avgTimeFormatted = formatMsToDuration(avgDurationMs);

    res.json({
      success: true,
      data: {
        tasksAssigned,
        tasksCompleted,
        avgTimeFormatted,
        fileQuantity,
        efficiency,
        metricNotes: {
          tasksAssigned: 'Current tasks assigned to this staff member',
          tasksCompleted: 'Current assigned tasks in a completed or downstream status',
          efficiency: 'Completion ratio of current assigned tasks',
          averageTime: 'Estimated design cycle based on recorded task activity',
          files: 'Files currently retained on assigned tasks',
        },
        chartData,
        detailedTasks
      }
    });
  })
);

// Get server logs
router.get(
    '/logs',
    authMiddilware,
    authorizeRoles('admin', 'sysadmin', 'boss'),
    asyncHandler(async (req, res) => {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(process.cwd(), 'error.log');
        let logs = "No logs available yet.";
        if (fs.existsSync(logPath)) {
            // Read last 500 lines or so (simplistic approach: read all if small, or use a proper log reader)
            const content = fs.readFileSync(logPath, 'utf8');
            // Splitting and getting last 1000 lines
            const lines = content.split('\n');
            logs = lines.slice(Math.max(lines.length - 1000, 0)).join('\n');
        }
        res.json({ success: true, data: logs });
    })
);

router.post('/aws-media/open', asyncHandler(async (req: Request, res: Response) => {
  const key = typeof req.body.key === 'string' ? req.body.key : '';
  if (!key) return void res.status(400).json({ success: false, message: 'Object key is required' });
  const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn: 300 });
  res.json({ success: true, data: { url, expiresIn: 300 } });
}));

router.delete('/aws-media', asyncHandler(async (req: Request, res: Response) => {
  const key = typeof req.body.key === 'string' ? req.body.key : '';
  if (!key) return void res.status(400).json({ success: false, message: 'Object key is required' });
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const [fileRefs, taskRefs] = await Promise.all([
    FileUpload.countDocuments({ $or: [{ filename: key }, { path: { $regex: escaped } }] }),
    Task.countDocuments({ 'files.url': { $regex: escaped } }),
  ]);
  if ((fileRefs || taskRefs) && req.query.force !== 'true') {
    res.status(409).json({ success: false, message: 'This object is referenced by website records', references: { files: fileRefs, tasks: taskRefs } });
    return;
  }
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
  if (req.query.force === 'true') {
    await Promise.all([
      FileUpload.deleteMany({ $or: [{ filename: key }, { path: { $regex: escaped } }] }),
      Task.updateMany({}, { $pull: { files: { url: { $regex: escaped } } } }),
    ]);
  }
  res.json({ success: true });
}));

// Proxy the HTTP-only Telegram bot through the authenticated HTTPS backend.
router.get(
    '/bot-logs',
    authorizeRoles('sysadmin'),
    asyncHandler(async (_req, res) => {
        const logsUrl = process.env.BOT_LOGS_URL
            || process.env.WHATSAPP_AI_LOGS_URL
            || 'http://56.68.8.52:5002/api/logs';
        const response = await axios.get(logsUrl, { timeout: 8000 });
        res.json(response.data);
    })
);

// Legacy alias kept for old bookmarks.
router.get(
    '/whatsapp-ai-logs',
    authorizeRoles('sysadmin'),
    asyncHandler(async (_req, res) => {
        const logsUrl = process.env.BOT_LOGS_URL
            || process.env.WHATSAPP_AI_LOGS_URL
            || 'http://56.68.8.52:5002/api/logs';
        const response = await axios.get(logsUrl, { timeout: 8000 });
        res.json(response.data);
    })
);

export default router;
