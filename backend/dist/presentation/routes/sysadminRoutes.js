"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Sysadmin Routes
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const os_1 = __importDefault(require("os"));
const mongoose_1 = __importDefault(require("mongoose"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const axios_1 = __importDefault(require("axios"));
const s3_1 = require("../../infrastructure/config/s3");
const promises_1 = __importDefault(require("fs/promises"));
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const bandwidthTracker_1 = require("../../shared/utils/bandwidthTracker");
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const ParcelRepository_1 = require("../../infrastructure/repositories/ParcelRepository");
const FileUploadRepository_1 = require("../../infrastructure/repositories/FileUploadRepository");
const VirtualFolderRepository_1 = require("../../infrastructure/repositories/VirtualFolderRepository");
const TaskRepository_1 = require("../../infrastructure/repositories/TaskRepository");
const user_model_1 = __importDefault(require("../../infrastructure/db/models/user.model"));
const queueAnalytics_1 = require("../../shared/utils/queueAnalytics");
const socketHandler_1 = require("../../infrastructure/socket/socketHandler");
const router = (0, express_1.Router)();
router.get('/online-users', (req, res) => {
    try {
        const count = (0, socketHandler_1.getOnlineUsersCount)();
        res.status(200).json({ count });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch online users count' });
    }
});
// Middleware to restrict to sysadmin, admin, boss role
const requireSysadmin = (req, res, next) => {
    if (req.user && ['sysadmin', 'admin', 'boss'].includes(req.user.role)) {
        next();
    }
    else {
        res.status(403).json({ success: false, message: 'Access denied. Requires elevated permissions.' });
    }
};
router.use(auth_middileware_1.default);
router.use(requireSysadmin);
// ─── GET /api/sysadmin/health ─────────────────────────
router.get('/health', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // OS metrics
    const totalMem = os_1.default.totalmem();
    const freeMem = os_1.default.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os_1.default.loadavg();
    const uptime = os_1.default.uptime();
    // Disk usage (Node 18.15+ supports fs.statfs)
    let diskTotal = 0;
    let diskFree = 0;
    try {
        const stat = yield promises_1.default.statfs(process.platform === 'win32' ? 'C:\\\\' : '/');
        diskTotal = stat.blocks * stat.bsize;
        diskFree = stat.bfree * stat.bsize;
    }
    catch (err) {
        console.error('Failed to get disk stats', err);
    }
    // Database connection status
    const dbStateCode = mongoose_1.default.connection.readyState;
    let dbStatus = 'Unknown';
    if (dbStateCode === 0)
        dbStatus = 'Disconnected';
    if (dbStateCode === 1)
        dbStatus = 'Connected';
    if (dbStateCode === 2)
        dbStatus = 'Connecting';
    if (dbStateCode === 3)
        dbStatus = 'Disconnecting';
    // Application data metrics
    const taskTotal = yield Task_1.Task.countDocuments();
    const artworkTotal = yield FileUpload_1.FileUpload.countDocuments();
    // Storage used
    const storageAgg = yield FileUpload_1.FileUpload.aggregate([{ $group: { _id: null, totalSize: { $sum: '$size' } } }]);
    const storageUsed = ((_a = storageAgg[0]) === null || _a === void 0 ? void 0 : _a.totalSize) || 0;
    // Progression chart (last 7 days of tasks created)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const progressionRaw = yield Task_1.Task.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            } },
        { $sort: { _id: 1 } }
    ]);
    // External Integrations
    let vercelStatus = { readyState: 'UNKNOWN', url: '', createdAt: null };
    try {
        if (process.env.VERCEL_ACCESS_TOKEN && process.env.VERCEL_PROJECT_ID) {
            const vRes = yield axios_1.default.get(`https://api.vercel.com/v6/deployments?projectId=${process.env.VERCEL_PROJECT_ID}&limit=1`, {
                headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` },
                timeout: 5000,
            });
            const latest = (_b = vRes.data.deployments) === null || _b === void 0 ? void 0 : _b[0];
            if (latest) {
                vercelStatus = { readyState: latest.readyState, url: latest.url, createdAt: latest.createdAt };
            }
        }
    }
    catch (e) {
        console.error('Vercel API error', e.message);
    }
    let railwayStatus = { status: 'UNKNOWN', environment: process.env.RAILWAY_ENVIRONMENT_NAME || 'Production' };
    try {
        if (process.env.RAILWAY_API_TOKEN) {
            const query = `query { me { name } }`;
            const rRes = yield axios_1.default.post('https://backboard.railway.app/graphql/v2', { query }, {
                headers: { Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}` },
                timeout: 5000,
            });
            if (rRes.data && !rRes.data.errors)
                railwayStatus.status = 'ACTIVE';
            else
                railwayStatus.status = 'ERROR';
        }
    }
    catch (e) {
        console.error('Railway API error', e.message);
    }
    let awsStatus = 'UNKNOWN';
    try {
        yield s3_1.s3Client.send(new client_s3_1.HeadBucketCommand({ Bucket: s3_1.S3_BUCKET_NAME }));
        awsStatus = 'ONLINE';
    }
    catch (e) {
        awsStatus = 'OFFLINE';
        console.error('AWS S3 Health error', e.message);
    }
    let mongoDetailed = null;
    if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
        try {
            const serverStatus = yield mongoose_1.default.connection.db.admin().serverStatus();
            mongoDetailed = {
                connections: serverStatus.connections,
                opcounters: serverStatus.opcounters,
                network: serverStatus.network
            };
        }
        catch (e) {
            console.error('Mongo admin error', e.message);
        }
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
                bandwidth: bandwidthTracker_1.bandwidthHistory,
                progression: progressionRaw
            },
            timestamp: new Date()
        }
    });
})));
// ─── GET /api/sysadmin/dashboard-summary ─────────────────────────
// Collapses the parcel/file/folder/task/order/online-user stats the admin
// dashboard needs — previously 5 separate client round trips fired on every
// page open — into a single request. The underlying queries still run in
// parallel (via Promise.all), just on the server instead of over the wire,
// each reusing the same already-windowed (30/60-day) repository calls the
// individual endpoints use, so the numbers stay identical to before.
router.get('/dashboard-summary', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const [parcelStats, fileStats, folders, totalTasks, totalOrders] = yield Promise.all([
        ParcelRepository_1.parcelRepository.getStats(),
        FileUploadRepository_1.fileUploadRepository.getStorageStats(),
        VirtualFolderRepository_1.virtualFolderRepository.findAll(),
        TaskRepository_1.taskRepository.countRecent(),
        // Count-only query instead of the fully-populated getOrders() list,
        // since the dashboard only ever needed the total.
        order_model_1.default.countDocuments({ createdAt: { $gte: sixtyDaysAgo } }),
    ]);
    res.json({
        success: true,
        data: {
            orders: { total: totalOrders },
            parcels: parcelStats,
            files: fileStats,
            tasks: { total: totalTasks },
            folders: { total: folders.length },
            onlineUsers: { count: (0, socketHandler_1.getOnlineUsersCount)() },
        },
    });
})));
// ─── GET /api/sysadmin/queue-analytics ─────────────────────────
router.get('/queue-analytics', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const timezone = 'Asia/Kuala_Lumpur';
    const parsedDays = Number(req.query.days);
    const days = Number.isFinite(parsedDays) ? Math.min(Math.max(Math.trunc(parsedDays), 7), 90) : 30;
    const now = new Date();
    const klNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const firstKlDay = Date.UTC(klNow.getUTCFullYear(), klNow.getUTCMonth(), klNow.getUTCDate() - days + 1);
    const from = new Date(firstKlDay - (8 * 60 * 60 * 1000));
    const inactiveStatuses = ['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURN', 'DONE'];
    const completionStatuses = [...queueAnalytics_1.COMPLETION_STATUSES];
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
    const [activeResults, rangeResults, completionTasks] = yield Promise.all([
        Task_1.Task.aggregate([
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
        ]).option({ maxTimeMS: 10000 }),
        Task_1.Task.aggregate([
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
        ]).option({ maxTimeMS: 10000 }),
        Task_1.Task.find({
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
            .maxTimeMS(10000),
    ]);
    const active = activeResults[0] || {};
    const range = rangeResults[0] || {};
    const assigneeIds = new Set();
    for (const item of active.staffWorkload || []) {
        if (item._id)
            assigneeIds.add(String(item._id));
    }
    for (const item of active.oldestTasks || []) {
        if (item.assignee)
            assigneeIds.add(String(item.assignee));
    }
    const validAssigneeIds = Array.from(assigneeIds).filter(id => mongoose_1.default.isValidObjectId(id));
    const users = validAssigneeIds.length
        ? yield user_model_1.default.find({ _id: { $in: validAssigneeIds } }).select('_id name').lean().maxTimeMS(5000)
        : [];
    const assigneeNames = new Map(users.map(user => [String(user._id), user.name || 'Unknown staff']));
    const round = (value, precision = 1) => {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    };
    const summaryRaw = ((_a = active.summary) === null || _a === void 0 ? void 0 : _a[0]) || {};
    const currentWip = summaryRaw.currentWip || 0;
    const overdueTasks = summaryRaw.overdueTasks || 0;
    const completionSummary = (0, queueAnalytics_1.aggregateCompletionAnalytics)(completionTasks, from, now);
    const statusBreakdown = (active.statusBreakdown || []).map((item) => ({
        status: String(item._id),
        count: item.count,
        avgAgeHours: round(Math.max(0, item.avgAgeHours || 0)),
        overdue: item.overdue,
    }));
    const staffWorkload = (active.staffWorkload || []).map((item) => {
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
        .map((item) => (Object.assign(Object.assign({}, item), { score: round(item.count * (1 + item.avgAgeHours / 24) * (1 + item.overdue / item.count), 2) })))
        .sort((a, b) => b.score - a.score || a.status.localeCompare(b.status));
    const createdByDate = new Map((range.created || []).map((item) => [item._id, item.count]));
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
    const oldestTasks = (active.oldestTasks || []).map((item) => {
        const assigneeId = item.assignee ? String(item.assignee) : undefined;
        return Object.assign(Object.assign(Object.assign(Object.assign({ id: String(item._id), title: String(item.title || ''), status: String(item.status || 'UNKNOWN') }, (assigneeId ? { assigneeId, assigneeName: assigneeNames.get(assigneeId) || 'Unknown staff' } : {})), (item.orderId ? { orderId: String(item.orderId) } : {})), (item.dueDate ? { dueDate: new Date(item.dueDate).toISOString() } : {})), { ageHours: round(Math.max(0, (now.getTime() - new Date(item.stageStartedAt).getTime()) / (60 * 60 * 1000))) });
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
})));
// ─── GET /api/sysadmin/deployments ─────────────────────────
router.get('/deployments', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    let vercelDeployments = [];
    let railwayDeployments = [];
    // Fetch Vercel Deployments
    if (process.env.VERCEL_ACCESS_TOKEN && process.env.VERCEL_PROJECT_ID) {
        try {
            const vRes = yield axios_1.default.get(`https://api.vercel.com/v6/deployments?projectId=${process.env.VERCEL_PROJECT_ID}&limit=10`, {
                headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` }
            });
            vercelDeployments = (vRes.data.deployments || []).map((d) => {
                var _a, _b, _c;
                return ({
                    id: d.id,
                    service: 'Vercel (Frontend)',
                    status: d.readyState,
                    commitMessage: ((_b = (_a = d.meta) === null || _a === void 0 ? void 0 : _a.githubCommitMessage) === null || _b === void 0 ? void 0 : _b.split('\n')[0]) || 'Manual Deployment',
                    branch: ((_c = d.meta) === null || _c === void 0 ? void 0 : _c.githubCommitRef) || 'main',
                    environment: 'Production',
                    createdAt: d.createdAt,
                    url: `https://${d.url}`
                });
            });
        }
        catch (e) {
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
            const rRes = yield axios_1.default.post('https://backboard.railway.app/graphql/v2', { query }, {
                headers: { Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}` }
            });
            // Parse GraphQL response
            const projects = ((_c = (_b = (_a = rRes.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.projects) === null || _c === void 0 ? void 0 : _c.edges) || [];
            projects.forEach((p) => {
                var _a, _b;
                const envs = ((_b = (_a = p.node) === null || _a === void 0 ? void 0 : _a.environments) === null || _b === void 0 ? void 0 : _b.edges) || [];
                envs.forEach((env) => {
                    var _a, _b;
                    const deps = ((_b = (_a = env.node) === null || _a === void 0 ? void 0 : _a.deployments) === null || _b === void 0 ? void 0 : _b.edges) || [];
                    deps.forEach((d) => {
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
        }
        catch (e) {
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
})));
// ─── GET /api/sysadmin/aws-media ─────────────────────────
router.get('/aws-media', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prefix, continuationToken } = req.query;
    const params = {
        Bucket: s3_1.S3_BUCKET_NAME,
        MaxKeys: Math.min(Math.max(Number(req.query.limit) || 100, 1), 250),
    };
    if (prefix)
        params.Prefix = String(prefix);
    if (continuationToken)
        params.ContinuationToken = String(continuationToken);
    try {
        const command = new client_s3_1.ListObjectsV2Command(params);
        const data = yield s3_1.s3Client.send(command);
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
                bucket: s3_1.S3_BUCKET_NAME,
                keyCount: data.KeyCount || 0,
            }
        });
    }
    catch (error) {
        console.error('S3 List Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch S3 data', error: error.message });
    }
})));
// ─── GET /api/sysadmin/reports ─────────────────────────
router.get('/reports', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId } = req.query;
    if (!userId) {
        res.status(400).json({ success: false, message: 'userId is required' });
        return;
    }
    const formatMsToDuration = (ms) => {
        if (!ms || isNaN(ms))
            return "00 DAYS 00HRS 00MIN";
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
    const completedFilter = Object.assign(Object.assign({}, activeFilter), { $or: [{ isDone: true }, { status: { $in: terminalStatuses } }] });
    // Current tasks assigned to this staff member.
    const tasksAssigned = yield Task_1.Task.countDocuments(activeFilter);
    // 2. Tasks Completed
    const tasksCompleted = yield Task_1.Task.countDocuments(completedFilter);
    // 3. Average Task Time
    // Computed below using activities array
    // 4. File Quantity (attached to their assigned tasks)
    const filesAgg = yield Task_1.Task.aggregate([
        { $match: activeFilter },
        { $project: { fileCount: { $size: { $ifNull: ["$files", []] } } } },
        { $group: { _id: null, totalFiles: { $sum: "$fileCount" } } }
    ]);
    const fileQuantity = ((_a = filesAgg[0]) === null || _a === void 0 ? void 0 : _a.totalFiles) || 0;
    // 5. Efficiency
    const efficiency = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;
    // 6. Chart Data (Last 30 Days completion)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const chartDataRaw = yield Task_1.Task.aggregate([
        { $match: Object.assign(Object.assign({}, completedFilter), { statusUpdatedAt: { $gte: thirtyDaysAgo } }) },
        { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$statusUpdatedAt" } },
                completed: { $sum: 1 }
            } },
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
    const detailedTasksRaw = yield Task_1.Task.find(activeFilter)
        .select('title status isDone files createdAt updatedAt statusUpdatedAt activities')
        .sort({ createdAt: -1 })
        .lean();
    let totalDurationMs = 0;
    let completedCountForAvg = 0;
    const detailedTasks = detailedTasksRaw.map(t => {
        var _a, _b, _c, _d, _e;
        const fileCount = t.files ? t.files.length : 0;
        let timeTookFormatted = "-";
        let timeTookMs = null;
        // START TIME
        let startTime = new Date(t.createdAt).getTime();
        // Get the LAST IN DESIGN or IN_DESIGN activity
        const inDesignActivities = (_a = t.activities) === null || _a === void 0 ? void 0 : _a.filter((a) => a.action.includes('to IN DESIGN') || a.action.includes('to IN_DESIGN'));
        if (inDesignActivities && inDesignActivities.length > 0) {
            startTime = new Date(inDesignActivities[inDesignActivities.length - 1].createdAt).getTime();
        }
        else {
            // Fallback 1: Try IN PROGRESS or PENDING ARTWORK
            const progressActivities = (_b = t.activities) === null || _b === void 0 ? void 0 : _b.filter((a) => a.action.includes('to IN PROGRESS') || a.action.includes('to IN_PROGRESS') || a.action.includes('to PENDING'));
            if (progressActivities && progressActivities.length > 0) {
                startTime = new Date(progressActivities[progressActivities.length - 1].createdAt).getTime();
            }
            else {
                // Fallback 2: Assignment
                const assignActivities = (_c = t.activities) === null || _c === void 0 ? void 0 : _c.filter((a) => a.action.toLowerCase().includes('assign'));
                if (assignActivities && assignActivities.length > 0) {
                    startTime = new Date(assignActivities[assignActivities.length - 1].createdAt).getTime();
                }
                else {
                    // Fallback 3: Use the VERY LAST activity logged before DONE DESIGN
                    // This ensures if they took any action 10 mins ago, we use it!
                    const doneDesignIndex = (_d = t.activities) === null || _d === void 0 ? void 0 : _d.findIndex((a) => a.action.includes('to DONE DESIGN') || a.action.includes('to DONE_DESIGN'));
                    if (doneDesignIndex > 0) {
                        startTime = new Date(t.activities[doneDesignIndex - 1].createdAt).getTime();
                    }
                }
            }
        }
        // END TIME
        const doneDesignActivity = (_e = t.activities) === null || _e === void 0 ? void 0 : _e.find((a) => a.action.includes('to DONE DESIGN') && new Date(a.createdAt).getTime() >= startTime);
        if (doneDesignActivity) {
            timeTookMs = new Date(doneDesignActivity.createdAt).getTime() - startTime;
        }
        else if (terminalStatuses.includes(t.status)) {
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
})));
// Get server logs
router.get('/logs', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
})));
router.post('/aws-media/open', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const key = typeof req.body.key === 'string' ? req.body.key : '';
    if (!key)
        return void res.status(400).json({ success: false, message: 'Object key is required' });
    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key }), { expiresIn: 300 });
    res.json({ success: true, data: { url, expiresIn: 300 } });
})));
router.delete('/aws-media', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const key = typeof req.body.key === 'string' ? req.body.key : '';
    if (!key)
        return void res.status(400).json({ success: false, message: 'Object key is required' });
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const [fileRefs, taskRefs] = yield Promise.all([
        FileUpload_1.FileUpload.countDocuments({ $or: [{ filename: key }, { path: { $regex: escaped } }] }),
        Task_1.Task.countDocuments({ 'files.url': { $regex: escaped } }),
    ]);
    if ((fileRefs || taskRefs) && req.query.force !== 'true') {
        res.status(409).json({ success: false, message: 'This object is referenced by website records', references: { files: fileRefs, tasks: taskRefs } });
        return;
    }
    yield s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key }));
    if (req.query.force === 'true') {
        yield Promise.all([
            FileUpload_1.FileUpload.deleteMany({ $or: [{ filename: key }, { path: { $regex: escaped } }] }),
            Task_1.Task.updateMany({}, { $pull: { files: { url: { $regex: escaped } } } }),
        ]);
    }
    res.json({ success: true });
})));
// ─── POST /api/sysadmin/files/scan ─────────────────────────
// Detect phantom DB records: FileUpload documents / Task.files entries whose
// S3 object no longer exists (the browser shows these as "corrupted" files).
// With ?cleanup=true (or body cleanup:true), deletes those DB records.
router.post('/files/scan', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const cleanup = req.query.cleanup === 'true' || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.cleanup) === true;
    const mapWithConcurrency = (items, limit, fn) => __awaiter(void 0, void 0, void 0, function* () {
        const results = new Array(items.length);
        let next = 0;
        const workers = Array.from({ length: Math.min(limit, items.length) }, () => __awaiter(void 0, void 0, void 0, function* () {
            while (next < items.length) {
                const idx = next++;
                results[idx] = yield fn(items[idx]);
            }
        }));
        yield Promise.all(workers);
        return results;
    });
    const toKey = (url) => {
        if (!url || !url.includes('amazonaws.com'))
            return null;
        try {
            const u = new URL(url);
            const raw = u.pathname.startsWith('/') ? u.pathname.substring(1) : u.pathname;
            return decodeURIComponent(raw);
        }
        catch (_a) {
            return null;
        }
    };
    const [uploads, tasks] = yield Promise.all([
        FileUpload_1.FileUpload.find({}).select('path filename originalName taskId orderId userId uploadedAt').lean(),
        Task_1.Task.find({}).select('title files').lean(),
    ]);
    const refs = [];
    const keySet = new Set();
    for (const f of uploads) {
        const url = String(f.path || '');
        const key = toKey(url);
        refs.push({
            kind: 'fileupload',
            id: String(f._id),
            taskId: f.taskId ? String(f.taskId) : undefined,
            originalName: f.originalName,
            filename: f.filename,
            uploadedAt: f.uploadedAt,
            url,
            key,
        });
        if (key)
            keySet.add(key);
    }
    for (const t of tasks) {
        const taskId = String(t._id);
        for (const file of t.files || []) {
            const url = String(file.url || '');
            const key = toKey(url);
            refs.push({
                kind: 'taskfile',
                id: taskId,
                taskId,
                taskTitle: t.title,
                originalName: file.name,
                url,
                key,
            });
            if (key)
                keySet.add(key);
        }
    }
    const keys = [...keySet];
    const exists = yield mapWithConcurrency(keys, 20, (key) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield s3_1.s3Client.send(new client_s3_1.HeadObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key }));
            return true;
        }
        catch (_a) {
            return false;
        }
    }));
    const existsMap = new Map();
    keys.forEach((key, index) => existsMap.set(key, exists[index]));
    const missingRefs = refs.filter((r) => r.key && existsMap.get(r.key) === false);
    const skippedRefs = refs.filter((r) => !r.key);
    const existingKeys = keys.filter((key) => existsMap.get(key)).length;
    let removedFileUploads = 0;
    let removedTaskFiles = 0;
    if (cleanup) {
        const fileUploadIds = missingRefs.filter((r) => r.kind === 'fileupload').map((r) => r.id);
        const taskUrls = [...new Set(missingRefs.filter((r) => r.kind === 'taskfile').map((r) => r.url))];
        if (fileUploadIds.length) {
            const result = yield FileUpload_1.FileUpload.deleteMany({ _id: { $in: fileUploadIds } });
            removedFileUploads = result.deletedCount || 0;
        }
        for (const url of taskUrls) {
            const result = yield Task_1.Task.updateMany({ 'files.url': url }, { $pull: { files: { url } } });
            removedTaskFiles += result.modifiedCount || 0;
        }
    }
    res.json({
        success: true,
        data: {
            scannedAt: new Date().toISOString(),
            cleanup,
            summary: {
                refsScanned: refs.length,
                fileUploadRefs: uploads.length,
                taskFileRefs: refs.filter((r) => r.kind === 'taskfile').length,
                uniqueKeys: keys.length,
                existingKeys,
                missingKeys: keys.length - existingKeys,
                missingRefs: missingRefs.length,
                skippedRefs: skippedRefs.length,
            },
            missing: missingRefs.map((r) => ({
                kind: r.kind,
                id: r.id,
                taskId: r.taskId,
                taskTitle: r.taskTitle,
                originalName: r.originalName,
                filename: r.filename,
                uploadedAt: r.uploadedAt,
                url: r.url,
                key: r.key,
            })),
            cleanupResult: cleanup ? { removedFileUploads, removedTaskFiles } : undefined,
        },
    });
})));
// Proxy the HTTP-only Telegram bot through the authenticated HTTPS backend.
router.get('/bot-logs', (0, auth_middileware_1.authorizeRoles)('sysadmin'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const logsUrl = process.env.BOT_LOGS_URL
        || process.env.WHATSAPP_AI_LOGS_URL
        || 'http://56.68.8.52:5002/api/logs';
    const response = yield axios_1.default.get(logsUrl, { timeout: 8000 });
    res.json(response.data);
})));
// Legacy alias kept for old bookmarks.
router.get('/whatsapp-ai-logs', (0, auth_middileware_1.authorizeRoles)('sysadmin'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const logsUrl = process.env.BOT_LOGS_URL
        || process.env.WHATSAPP_AI_LOGS_URL
        || 'http://56.68.8.52:5002/api/logs';
    const response = yield axios_1.default.get(logsUrl, { timeout: 8000 });
    res.json(response.data);
})));
exports.default = router;
