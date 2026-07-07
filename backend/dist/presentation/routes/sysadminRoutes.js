"use strict";
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
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const os_1 = __importDefault(require("os"));
const mongoose_1 = __importDefault(require("mongoose"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("../../infrastructure/config/s3");
const promises_1 = __importDefault(require("fs/promises"));
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const bandwidthTracker_1 = require("../../shared/utils/bandwidthTracker");
const router = (0, express_1.Router)();
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
    var _a;
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
                bandwidth: bandwidthTracker_1.bandwidthHistory,
                progression: progressionRaw
            },
            timestamp: new Date()
        }
    });
})));
// ─── GET /api/sysadmin/aws-media ─────────────────────────
router.get('/aws-media', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prefix, continuationToken } = req.query;
    const params = {
        Bucket: s3_1.S3_BUCKET_NAME,
        MaxKeys: 1000,
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
                prefix: data.Prefix
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
    // 1. Total Assigned Tasks
    const tasksAssigned = yield Task_1.Task.countDocuments({ assignee: userId, isDeleted: false });
    // 2. Tasks Completed
    const tasksCompleted = yield Task_1.Task.countDocuments({ assignee: userId, isDeleted: false, isDone: true });
    // 3. Average Task Time
    // Computed below using activities array
    // 4. File Quantity (attached to their assigned tasks)
    const filesAgg = yield Task_1.Task.aggregate([
        { $match: { assignee: userId, isDeleted: false } },
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
        { $match: { assignee: userId, isDeleted: false, isDone: true, updatedAt: { $gte: thirtyDaysAgo } } },
        { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
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
    const detailedTasksRaw = yield Task_1.Task.find({ assignee: userId, isDeleted: false })
        .select('title status isDone files createdAt updatedAt activities')
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
        else if (['DONE_DESIGN', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(t.status)) {
            timeTookMs = new Date(t.updatedAt).getTime() - startTime;
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
            chartData,
            detailedTasks
        }
    });
})));
exports.default = router;
