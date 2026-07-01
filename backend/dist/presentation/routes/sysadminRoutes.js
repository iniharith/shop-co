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
const router = (0, express_1.Router)();
// Middleware to restrict to sysadmin role only
const requireSysadmin = (req, res, next) => {
    if (req.user && req.user.role === 'sysadmin') {
        next();
    }
    else {
        res.status(403).json({ success: false, message: 'Access denied. Sysadmin only.' });
    }
};
router.use(auth_middileware_1.default);
router.use(requireSysadmin);
// ─── GET /api/sysadmin/health ─────────────────────────
router.get('/health', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // OS metrics
    const totalMem = os_1.default.totalmem();
    const freeMem = os_1.default.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os_1.default.loadavg();
    const uptime = os_1.default.uptime();
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
    res.json({
        success: true,
        data: {
            server: {
                uptime,
                cpuLoad,
                totalMem,
                freeMem,
                usedMem,
            },
            database: {
                status: dbStatus,
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
