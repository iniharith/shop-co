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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupDay = void 0;
exports.backupEncryptionKey = backupEncryptionKey;
exports.automaticBackupsConfigured = automaticBackupsConfigured;
exports.backupSummary = backupSummary;
exports.captureDescriptionBaselines = captureDescriptionBaselines;
exports.queueDatabaseBackup = queueDatabaseBackup;
exports.openBackupDownload = openBackupDownload;
exports.startAutomaticDatabaseBackups = startAutomaticDatabaseBackups;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const client_s3_1 = require("@aws-sdk/client-s3");
const Task_1 = require("../../domain/entities/Task");
const TaskDescriptionRevision_1 = require("../../domain/entities/TaskDescriptionRevision");
const DatabaseBackup_1 = require("../../domain/entities/DatabaseBackup");
const s3_1 = require("../config/s3");
const DatabaseBackupService_1 = require("./DatabaseBackupService");
const LOCK_ID = 'full-database-backup';
const LEASE_MS = 45 * 60000;
function backupEncryptionKey() {
    const key = Buffer.from(process.env.DATABASE_BACKUP_ENCRYPTION_KEY || '', 'base64');
    if (key.length !== 32)
        throw new Error('Automatic backup encryption is not configured');
    return key;
}
function automaticBackupsConfigured() {
    try {
        backupEncryptionKey();
        return !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
    }
    catch (_a) {
        return false;
    }
}
const backupDay = (now = new Date()) => new Date(now.getTime() + 5 * 3600000).toISOString().slice(0, 10); // 03:00 Malaysia cutover
exports.backupDay = backupDay;
function backupSummary(record) {
    return { id: String(record._id), status: record.status, startedAt: record.startedAt, completedAt: record.completedAt, filename: record.filename, bytes: record.bytes, sha256: record.sha256, error: record.error, automatic: !!record.slot };
}
// Capture the descriptions already present when this feature is enabled, including
// soft-deleted tasks. These are snapshots, never invented historical versions.
function captureDescriptionBaselines() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        let operations = [];
        try {
            for (var _d = true, _e = __asyncValues(Task_1.Task.find({}).select('_id title description updatedAt').lean().cursor()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const task = _c;
                operations.push({ updateOne: { filter: { taskId: String(task._id), kind: 'baseline' }, update: { $setOnInsert: {
                                taskId: String(task._id), taskTitle: task.title || '(untitled)', kind: 'baseline', beforeHtml: task.description || '', afterHtml: task.description || '', actorId: 'system', actorName: 'System snapshot', capturedAt: new Date(), sourceUpdatedAt: task.updatedAt,
                            } }, upsert: true } });
                if (operations.length === 100) {
                    yield TaskDescriptionRevision_1.TaskDescriptionRevision.bulkWrite(operations);
                    operations = [];
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (operations.length)
            yield TaskDescriptionRevision_1.TaskDescriptionRevision.bulkWrite(operations);
    });
}
function performBackup(record) {
    return __awaiter(this, void 0, void 0, function* () {
        let temporary = '', dump;
        try {
            yield captureDescriptionBaselines();
            const key = backupEncryptionKey(), iv = (0, crypto_1.randomBytes)(12), cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv), hash = (0, crypto_1.createHash)('sha256');
            temporary = yield fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'shop-co-encrypted-backup-'));
            const encryptedPath = (0, path_1.join)(temporary, 'archive.enc');
            dump = yield (0, DatabaseBackupService_1.startDatabaseBackup)(process.env.MONGO_URI || '');
            const hashing = new stream_1.Transform({ transform(chunk, _encoding, done) { hash.update(chunk); done(null, chunk); } });
            yield Promise.all([(0, promises_1.pipeline)(dump.stream, hashing, cipher, (0, fs_1.createWriteStream)(encryptedPath, { mode: 0o600 })), dump.completion]);
            const size = (yield fs_1.promises.stat(encryptedPath)).size;
            if (!size || size >= 5 * Math.pow(1024, 3))
                throw new Error('Backup archive is empty or exceeds the supported upload size');
            const objectKey = `shop-co/private-backups/v1/${record._id}-${record.owner}.archive.gz.enc`;
            const bucket = process.env.DATABASE_BACKUP_BUCKET || s3_1.S3_BUCKET_NAME;
            yield s3_1.s3Client.send(new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: (0, fs_1.createReadStream)(encryptedPath), ContentLength: size,
                ContentType: 'application/octet-stream', ServerSideEncryption: 'AES256', CacheControl: 'private, no-store',
            }), { abortSignal: AbortSignal.timeout(10 * 60000) });
            // Keep recovery metadata outside MongoDB too: a database loss must not make its archive unreadable.
            const manifest = { schemaVersion: 1, backupId: String(record._id), filename: record.filename, bucket, objectKey, algorithm: 'aes-256-gcm', iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), sha256: hash.digest('hex'), bytes: size, createdAt: new Date().toISOString() };
            yield s3_1.s3Client.send(new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: objectKey + '.json', Body: JSON.stringify(manifest), ContentType: 'application/json', ServerSideEncryption: 'AES256', CacheControl: 'private, no-store' }), { abortSignal: AbortSignal.timeout(60000) });
            yield DatabaseBackup_1.DatabaseBackup.updateOne({ _id: record._id, owner: record.owner, status: 'running' }, { $set: {
                    status: 'completed', completedAt: new Date(), objectKey, bucket, iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), sha256: manifest.sha256, bytes: size,
                }, $unset: { error: '', leaseUntil: '' } });
            console.log('[AutomaticBackup] Completed', String(record._id));
        }
        catch (_a) {
            dump === null || dump === void 0 ? void 0 : dump.cancel();
            yield DatabaseBackup_1.DatabaseBackup.updateOne({ _id: record._id, owner: record.owner }, { $set: { status: 'failed', error: 'Backup did not complete. Check storage access and the server backup tool.' }, $unset: { leaseUntil: '' } });
            console.error('[AutomaticBackup] Failed', String(record._id)); // Never log URI or encryption credentials.
        }
        finally {
            yield DatabaseBackup_1.DatabaseBackupLock.deleteOne({ _id: LOCK_ID, owner: record.owner });
            if (temporary)
                yield fs_1.promises.rm(temporary, { recursive: true, force: true }).catch(() => { });
        }
    });
}
function queueDatabaseBackup(slot) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!automaticBackupsConfigured())
            throw new Error('Automatic backup storage/encryption is not configured');
        const owner = (0, crypto_1.randomUUID)(), startedAt = new Date(), leaseUntil = new Date(Date.now() + LEASE_MS);
        try {
            yield DatabaseBackup_1.DatabaseBackupLock.findOneAndUpdate({ _id: LOCK_ID, leaseUntil: { $lte: startedAt } }, { $set: { owner, leaseUntil } }, { upsert: true, new: true });
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) === 11000)
                throw new Error('A database backup is already running');
            throw error;
        }
        try {
            let record = slot ? yield DatabaseBackup_1.DatabaseBackup.findOne({ slot }) : null;
            if ((record === null || record === void 0 ? void 0 : record.status) === 'completed') {
                yield DatabaseBackup_1.DatabaseBackupLock.deleteOne({ _id: LOCK_ID, owner });
                return record;
            }
            if (record)
                record = yield DatabaseBackup_1.DatabaseBackup.findByIdAndUpdate(record._id, { $set: { owner, status: 'running', startedAt, leaseUntil }, $unset: { error: '' } }, { new: true });
            else
                record = yield DatabaseBackup_1.DatabaseBackup.create(Object.assign(Object.assign({}, (slot ? { slot } : {})), { owner, status: 'running', startedAt, leaseUntil, filename: (0, DatabaseBackupService_1.createDatabaseBackupFilename)(startedAt) }));
            void performBackup(record).catch(() => console.error('[AutomaticBackup] Worker failed; lease will expire safely'));
            return record;
        }
        catch (error) {
            yield DatabaseBackup_1.DatabaseBackupLock.deleteOne({ _id: LOCK_ID, owner });
            throw error;
        }
    });
}
function openBackupDownload(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const record = yield DatabaseBackup_1.DatabaseBackup.findOne({ _id: id, status: 'completed' }).lean();
        if (!record)
            return null;
        const object = yield s3_1.s3Client.send(new client_s3_1.GetObjectCommand({ Bucket: record.bucket, Key: record.objectKey }));
        if (!object.Body)
            throw new Error('Backup object is unavailable');
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', backupEncryptionKey(), Buffer.from(record.iv, 'base64'));
        decipher.setAuthTag(Buffer.from(record.authTag, 'base64'));
        return { filename: record.filename, sha256: record.sha256, encrypted: object.Body, decipher };
    });
}
function startAutomaticDatabaseBackups() {
    if (process.env.AUTO_DATABASE_BACKUPS_ENABLED !== 'true')
        return;
    const check = () => __awaiter(this, void 0, void 0, function* () {
        if (!automaticBackupsConfigured()) {
            console.error('[AutomaticBackup] Storage/encryption configuration is missing');
            return;
        }
        const slot = `daily:${(0, exports.backupDay)()}`;
        const previous = yield DatabaseBackup_1.DatabaseBackup.findOne({ slot }).lean();
        if ((previous === null || previous === void 0 ? void 0 : previous.status) === 'completed' || ((previous === null || previous === void 0 ? void 0 : previous.status) === 'failed' && Date.now() - new Date(previous.updatedAt).getTime() < 15 * 60000))
            return;
        try {
            yield queueDatabaseBackup(slot);
        }
        catch ( /* Another instance/job owns the lease; retry on the next tick. */_a) { /* Another instance/job owns the lease; retry on the next tick. */ }
    });
    void check().catch(() => console.error('[AutomaticBackup] Scheduler check failed'));
    setInterval(() => void check().catch(() => console.error('[AutomaticBackup] Scheduler check failed')), 60000).unref();
}
