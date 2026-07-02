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
exports.default = router;
