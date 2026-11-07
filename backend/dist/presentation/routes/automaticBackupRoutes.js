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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const promises_1 = require("stream/promises");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const DatabaseBackup_1 = require("../../domain/entities/DatabaseBackup");
const AutomaticDatabaseBackupService_1 = require("../../infrastructure/services/AutomaticDatabaseBackupService");
const router = (0, express_1.Router)();
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss'));
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
router.get('/', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield DatabaseBackup_1.DatabaseBackup.updateMany({ status: 'running', leaseUntil: { $lte: new Date() } }, { $set: { status: 'failed', error: 'The server stopped before this backup finished. Start another backup.' }, $unset: { leaseUntil: '' } });
    const records = yield DatabaseBackup_1.DatabaseBackup.find({}).sort({ startedAt: -1 }).limit(60).lean();
    res.json({ configured: (0, AutomaticDatabaseBackupService_1.automaticBackupsConfigured)(), enabled: process.env.AUTO_DATABASE_BACKUPS_ENABLED === 'true', schedule: 'Daily at 03:00 Malaysia time; missed runs catch up after restart', retention: 'Backups are retained; no automatic deletion is enabled.', backups: records.map(AutomaticDatabaseBackupService_1.backupSummary) });
})));
router.post('/', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(202).json({ backup: (0, AutomaticDatabaseBackupService_1.backupSummary)(yield (0, AutomaticDatabaseBackupService_1.queueDatabaseBackup)()) });
    }
    catch (error) {
        const busy = (error === null || error === void 0 ? void 0 : error.message) === 'A database backup is already running';
        res.status(busy ? 409 : 503).json({ message: busy ? error.message : 'Backup could not start. Check server backup configuration.' });
    }
})));
router.get('/:id/download', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        res.status(400).json({ message: 'Invalid backup ID' });
        return;
    }
    const backup = yield (0, AutomaticDatabaseBackupService_1.openBackupDownload)(req.params.id);
    if (!backup) {
        res.status(404).json({ message: 'Completed backup not found' });
        return;
    }
    res.attachment(backup.filename).type('application/gzip');
    res.setHeader('X-Backup-SHA256', backup.sha256);
    try {
        yield (0, promises_1.pipeline)(backup.encrypted, backup.decipher, res);
    }
    catch (_a) {
        if (!res.headersSent)
            res.status(500).json({ message: 'Backup download failed integrity verification' });
        else
            res.destroy();
    }
})));
exports.default = router;
