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
 * Coded by Harith
 * Kampungcetak ®
 *
 * Standalone tools that aren't part of the order/task pipeline — staff
 * upload something, get a result back, done. Nothing here creates
 * FileUpload/Order/Task records; it's a pure utility.
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const multer_1 = __importDefault(require("multer"));
const promises_1 = require("stream/promises");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const LocalUpscaleService_1 = require("../../infrastructure/services/LocalUpscaleService");
const DatabaseBackupService_1 = require("../../infrastructure/services/DatabaseBackupService");
const router = (0, express_1.Router)();
// In-memory only — this file never touches S3 or the database. It's
// processed and handed straight back to the browser as a data URL.
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
// ─── POST /api/tools/database-backup ───────────────────────
// Streams a restorable gzip-compressed MongoDB archive. The archive never
// touches Railway's filesystem; only the temporary credentials file does.
router.post('/database-backup', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let backup;
    try {
        backup = yield (0, DatabaseBackupService_1.startDatabaseBackup)(process.env.MONGO_URI || '');
    }
    catch (error) {
        if (error instanceof DatabaseBackupService_1.DatabaseBackupBusyError) {
            res.status(429).json({ success: false, message: error.message });
            return;
        }
        if (error instanceof DatabaseBackupService_1.DatabaseBackupUnavailableError) {
            console.error('[Tools/DatabaseBackup] mongodump executable was not found');
            res.status(503).json({ success: false, message: error.message });
            return;
        }
        console.error('[Tools/DatabaseBackup] Could not start:', error instanceof Error ? error.message : error);
        res.status(500).json({ success: false, message: 'Database backup could not be started.' });
        return;
    }
    const cancelOnDisconnect = () => {
        if (!res.writableEnded)
            backup.cancel();
    };
    req.once('aborted', cancelOnDisconnect);
    res.once('close', cancelOnDisconnect);
    res.set({
        'Cache-Control': 'private, no-store',
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${(0, DatabaseBackupService_1.createDatabaseBackupFilename)()}"`,
        'X-Content-Type-Options': 'nosniff',
    });
    // Do not end the HTTP response until mongodump has exited successfully.
    backup.stream.pipe(res, { end: false });
    try {
        yield Promise.all([(0, promises_1.finished)(backup.stream), backup.completion]);
        req.off('aborted', cancelOnDisconnect);
        res.off('close', cancelOnDisconnect);
        res.end();
    }
    catch (error) {
        backup.cancel();
        console.error('[Tools/DatabaseBackup] Failed:', error instanceof Error ? error.message : error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Database backup failed.' });
        }
        else {
            res.destroy();
        }
    }
    finally {
        req.off('aborted', cancelOnDisconnect);
        res.off('close', cancelOnDisconnect);
    }
})));
// ─── GET /api/tools/server-ip ──────────────────────────────
// Detects the backend's current public egress IP. Railway can change this
// value, so the Tools page polls this endpoint instead of storing it in code.
router.get('/server-ip', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch('https://api.ipify.org?format=json', {
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok)
            throw new Error(`IP detection returned ${response.status}`);
        const payload = yield response.json();
        if (!payload.ip || !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(payload.ip)) {
            throw new Error('IP detection returned an invalid address');
        }
        res.set('Cache-Control', 'private, no-store');
        res.json({ success: true, data: { ip: payload.ip, checkedAt: new Date().toISOString(), source: 'ipify' } });
    }
    catch (error) {
        console.error('[Tools/ServerIP] Detection failed:', error instanceof Error ? error.message : error);
        res.status(503).json({ success: false, message: 'Could not detect the server IP right now.' });
    }
})));
// ─── POST /api/tools/upscale ────────────────────────────────
// Local high-quality image upscaler (Sharp/Lanczos, no API cost).
// Accepts a single image file + desired scale, returns the upscaled
// image as a base64 data URL for instant preview/download.
router.post('/upscale', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss'), upload.single('image'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const file = req.file;
    const scale = Number(req.body.scale) || 2;
    if (!file) {
        res.status(400).json({ success: false, message: 'No image file provided' });
        return;
    }
    if (!((_a = file.mimetype) === null || _a === void 0 ? void 0 : _a.startsWith('image/'))) {
        res.status(400).json({ success: false, message: 'Only image files can be upscaled' });
        return;
    }
    if (/heic|heif/i.test(file.mimetype)) {
        res.status(400).json({
            success: false,
            message: 'HEIC/HEIF photos aren\'t supported yet — please use a JPEG or PNG.',
        });
        return;
    }
    if (![2, 4].includes(scale)) {
        res.status(400).json({ success: false, message: 'scale must be 2 or 4' });
        return;
    }
    try {
        const passes = scale === 4 ? 2 : 1;
        const outputBuffer = yield (0, LocalUpscaleService_1.upscaleImageLocally)({ inputBuffer: file.buffer, passes });
        res.json({
            success: true,
            image: `data:image/png;base64,${outputBuffer.toString('base64')}`,
            originalName: file.originalname,
            scale,
            sizeBytes: outputBuffer.length,
        });
    }
    catch (err) {
        console.error('[Tools/Upscale] Failed:', err.message);
        if (err instanceof LocalUpscaleService_1.UpscaleBusyError) {
            res.status(429).json({ success: false, message: 'The upscaler is busy. Please try again shortly.' });
            return;
        }
        res.status(500).json({ success: false, message: 'Image upscale failed. Please try a different image.' });
    }
})));
exports.default = router;
