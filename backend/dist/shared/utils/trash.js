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
exports.isTrashRecoverable = exports.trashDeadline = exports.TRASH_RECOVERY_MS = exports.TrashError = void 0;
exports.storedPaths = storedPaths;
exports.trashFile = trashFile;
exports.trashTaskAttachment = trashTaskAttachment;
exports.trashTask = trashTask;
exports.restoreTrash = restoreTrash;
exports.restoreTrashedTask = restoreTrashedTask;
exports.purgeTrash = purgeTrash;
exports.cleanupTrash = cleanupTrash;
exports.startTrashCleanup = startTrashCleanup;
const mongoose_1 = __importDefault(require("mongoose"));
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const TrashItem_1 = require("../../domain/entities/TrashItem");
const s3_1 = require("../../infrastructure/config/s3");
const FileUploadRepository_1 = require("../../infrastructure/repositories/FileUploadRepository");
const taskBroadcast_1 = require("./taskBroadcast");
class TrashError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.TrashError = TrashError;
exports.TRASH_RECOVERY_MS = 15 * 60000;
const trashDeadline = (now = new Date()) => new Date(now.getTime() + exports.TRASH_RECOVERY_MS);
exports.trashDeadline = trashDeadline;
function storedPaths(file) {
    return [...new Set([file === null || file === void 0 ? void 0 : file.path, file === null || file === void 0 ? void 0 : file.sourcePath, file === null || file === void 0 ? void 0 : file.draftQrPath, file === null || file === void 0 ? void 0 : file.thumbnailPath].filter(value => typeof value === 'string' && value.length))];
}
const isTrashRecoverable = (entry, now = new Date()) => (entry === null || entry === void 0 ? void 0 : entry.state) === 'deleted' && (!entry.purgeAt || new Date(entry.purgeAt).getTime() > now.getTime());
exports.isTrashRecoverable = isTrashRecoverable;
function transaction(work) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield mongoose_1.default.startSession();
        try {
            return yield session.withTransaction(() => work(session), { readPreference: 'primary' });
        }
        finally {
            yield session.endSession();
        }
    });
}
const refresh = () => { (0, FileUploadRepository_1.notifyFileClients)(); };
function trashFile(file, actorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileId = String(file._id), now = new Date();
        const result = yield transaction((session) => __awaiter(this, void 0, void 0, function* () {
            const current = yield FileUpload_1.FileUpload.findById(fileId).session(session).lean();
            if (!current)
                throw new TrashError(404, 'File not found');
            if (current.userId !== file.userId || current.taskId !== file.taskId)
                throw new TrashError(409, 'File changed. Refresh before deleting.');
            const paths = storedPaths(current);
            const tasks = yield Task_1.Task.find({ 'files.url': { $in: paths } }).select('_id files').session(session).lean();
            const links = tasks.flatMap(task => task.files.filter((f) => paths.includes(f.url)).map((attachment) => ({ taskId: String(task._id), attachment })));
            const [entry] = yield TrashItem_1.TrashItem.create([{
                    kind: 'file', itemId: fileId, name: current.originalName || current.filename, taskId: current.taskId,
                    ownerId: current.userId, deletedBy: actorId, deletedAt: now, purgeAt: (0, exports.trashDeadline)(now),
                    payload: { file: current, links },
                }], { session });
            yield Task_1.Task.updateMany({ 'files.url': { $in: paths } }, { $pull: { files: { url: { $in: paths } } } }, { session });
            yield FileUpload_1.FileUpload.findOneAndDelete({ _id: fileId }, { session });
            return { trashId: String(entry._id), purgeAt: entry.purgeAt };
        }));
        refresh();
        return result;
    });
}
function trashTaskAttachment(taskId, fileId, actorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = yield Task_1.Task.findOne({ _id: taskId, isDeleted: { $ne: true } }).read('primary').lean();
        if (!task)
            throw new TrashError(404, 'Task not found');
        const embedded = task.files.find((f) => { var _a; return String(f._id) === fileId || ((_a = f.url) === null || _a === void 0 ? void 0 : _a.includes(fileId)); });
        const found = /^[a-f\d]{24}$/i.test(fileId) ? yield FileUpload_1.FileUpload.findOne({ _id: fileId, taskId }).lean() : null;
        const file = found || (embedded ? yield FileUpload_1.FileUpload.findOne({ path: embedded.url, $or: [{ taskId }, { taskId: { $exists: false } }, { taskId: null }, { taskId: '' }] }).lean() : null);
        if (file)
            return trashFile(file, actorId);
        if (!embedded)
            throw new TrashError(404, 'File not found in this task');
        const now = new Date();
        const result = yield transaction((session) => __awaiter(this, void 0, void 0, function* () {
            const [entry] = yield TrashItem_1.TrashItem.create([{
                    kind: 'file', itemId: `${taskId}:${String(embedded._id || embedded.url)}`, name: embedded.name || 'Attachment', taskId,
                    deletedBy: actorId, deletedAt: now, purgeAt: (0, exports.trashDeadline)(now),
                    payload: { links: [{ taskId, attachment: embedded }], embeddedOnly: true },
                }], { session });
            const removed = yield Task_1.Task.updateOne({ _id: taskId, 'files.url': embedded.url }, { $pull: { files: { url: embedded.url } } }, { session });
            if (!removed.modifiedCount)
                throw new TrashError(409, 'File changed. Refresh the task before deleting it.');
            return { trashId: String(entry._id), purgeAt: entry.purgeAt };
        }));
        refresh();
        return result;
    });
}
function trashTask(taskId, actorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const result = yield transaction((session) => __awaiter(this, void 0, void 0, function* () {
            const task = yield Task_1.Task.findOne({ _id: taskId, isDeleted: { $ne: true } }).session(session).lean();
            if (!task) {
                const existing = yield TrashItem_1.TrashItem.findOne({ kind: 'task', itemId: taskId, state: 'deleted' }).session(session).lean();
                if (existing)
                    return { trashId: String(existing._id), purgeAt: existing.purgeAt };
                throw new TrashError(404, 'Task not found');
            }
            const [entry] = yield TrashItem_1.TrashItem.create([{
                    kind: 'task', itemId: taskId, name: task.title, taskId, deletedBy: actorId, deletedAt: now, purgeAt: (0, exports.trashDeadline)(now), payload: {},
                }], { session });
            yield Task_1.Task.updateOne({ _id: taskId, isDeleted: { $ne: true } }, { $set: { isDeleted: true, deletedAt: now, purgeAt: entry.purgeAt }, $push: { activities: {
                        userId: actorId, userName: 'Staff', action: 'moved task to Trash', createdAt: now,
                    } } }, { session });
            return { trashId: String(entry._id), purgeAt: entry.purgeAt };
        }));
        refresh();
        void (0, taskBroadcast_1.emitTaskUpdated)('task_deleted', { taskId });
        return result;
    });
}
function restoreTrash(trashId, actorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield transaction((session) => __awaiter(this, void 0, void 0, function* () {
            const entry = yield TrashItem_1.TrashItem.findOne({ _id: trashId, state: 'deleted', $or: [{ purgeAt: { $exists: false } }, { purgeAt: { $gt: new Date() } }] }).session(session).lean();
            if (!entry)
                throw new TrashError(409, 'This item is no longer recoverable or permanent deletion has started.');
            // Touch the entry to serialize restore against the purge claim.
            yield TrashItem_1.TrashItem.updateOne({ _id: entry._id, state: 'deleted' }, { $set: { updatedAt: new Date() } }, { session });
            if (entry.kind === 'task') {
                const restored = yield Task_1.Task.updateOne({ _id: entry.itemId, isDeleted: true }, { $set: { isDeleted: false }, $unset: { deletedAt: '', purgeAt: '' }, $push: { activities: {
                            userId: actorId, userName: 'Staff', action: 'restored task from Trash', createdAt: new Date(),
                        } } }, { session });
                if (!restored.matchedCount)
                    throw new TrashError(409, 'Task is no longer in Trash.');
            }
            else {
                if (entry.taskId) {
                    const task = yield Task_1.Task.findById(entry.taskId).session(session).lean();
                    if (!task || task.isDeleted)
                        throw new TrashError(409, 'Restore the parent task before restoring this file.');
                }
                const file = entry.payload.file;
                if (file) {
                    const scope = file.taskId ? { taskId: file.taskId } : file.orderId ? { orderId: file.orderId } : { userId: file.userId };
                    const collision = yield FileUpload_1.FileUpload.findOne(Object.assign(Object.assign({}, scope), { originalName: file.originalName })).session(session).lean();
                    if (collision)
                        throw new TrashError(409, 'A file with this name already exists. Rename it before restoring this file.');
                    yield FileUpload_1.FileUpload.create([file], { session });
                }
                for (const link of entry.payload.links || []) {
                    yield Task_1.Task.updateOne({ _id: link.taskId, 'files.url': { $ne: link.attachment.url } }, { $push: { files: link.attachment } }, { session });
                }
            }
            yield TrashItem_1.TrashItem.deleteOne({ _id: entry._id }, { session });
            return { kind: entry.kind, taskId: entry.taskId, itemId: entry.itemId };
        }));
        refresh();
        if (result.taskId) {
            const task = yield Task_1.Task.findById(result.taskId).read('primary').lean();
            if (task)
                void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task });
        }
        return result;
    });
}
function restoreTrashedTask(taskId, actorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const entry = yield TrashItem_1.TrashItem.findOne({ kind: 'task', itemId: taskId }).lean();
        if (entry) {
            yield restoreTrash(String(entry._id), actorId);
            return Task_1.Task.findById(taskId).read('primary');
        }
        // Legacy deleted tasks have no automatic deadline; preserve existing recovery.
        return Task_1.Task.findOneAndUpdate({ _id: taskId, isDeleted: true, purgeAt: { $exists: false } }, { $set: { isDeleted: false } }, { new: true });
    });
}
function purgeTrash(trashId_1) {
    return __awaiter(this, arguments, void 0, function* (trashId, force = false) {
        const now = new Date(), stale = new Date(now.getTime() - 15 * 60000);
        const entry = yield TrashItem_1.TrashItem.findOneAndUpdate(Object.assign(Object.assign({ _id: trashId }, (force ? {} : { purgeAt: { $lte: now } })), { $or: [{ state: 'deleted' }, { state: 'purging', purgeLeaseAt: { $lt: stale } }] }), { $set: { state: 'purging', purgeLeaseAt: now } }, { new: true }).lean();
        if (!entry)
            return false;
        try {
            let files = [], task = null;
            const children = entry.kind === 'task' ? yield TrashItem_1.TrashItem.find({ kind: 'file', taskId: entry.itemId }).lean() : [];
            if (entry.kind === 'task') {
                task = yield Task_1.Task.findOne({ _id: entry.itemId, isDeleted: true }).read('primary').lean();
                if (!task)
                    throw new Error('Task is not deleted; permanent deletion stopped.');
                files = yield FileUpload_1.FileUpload.find({ taskId: entry.itemId }).read('primary').lean();
            }
            else if (entry.payload.file)
                files = [entry.payload.file];
            const paths = [...new Set([
                    ...(entry.purgePaths || []), ...files.flatMap(storedPaths),
                    ...((task === null || task === void 0 ? void 0 : task.files) || []).map((f) => f.url),
                    ...(entry.payload.links || []).map((link) => link.attachment.url),
                    ...children.flatMap(child => [...storedPaths(child.payload.file), ...(child.payload.links || []).map((link) => link.attachment.url)]),
                ].filter(Boolean))];
            yield TrashItem_1.TrashItem.updateOne({ _id: entry._id, state: 'purging' }, { $set: { purgePaths: paths } });
            for (const value of paths) {
                const url = new URL(value);
                const owned = url.hostname === `${s3_1.S3_BUCKET_NAME}.s3.amazonaws.com` || (url.hostname.startsWith(`${s3_1.S3_BUCKET_NAME}.s3.`) && url.hostname.endsWith('.amazonaws.com'));
                if (!owned)
                    continue; // External courier URLs are not Shop-Co objects.
                const fileReferences = { $or: ['path', 'sourcePath', 'draftQrPath', 'thumbnailPath'].map(key => ({ [key]: value })) };
                if (entry.kind === 'task')
                    fileReferences.taskId = { $ne: entry.itemId };
                if (yield FileUpload_1.FileUpload.exists(fileReferences).read('primary'))
                    continue;
                const taskReferences = Object.assign({ 'files.url': value }, (entry.kind === 'task' ? { _id: { $ne: entry.itemId } } : {}));
                if (yield Task_1.Task.exists(taskReferences).read('primary'))
                    continue;
                const protectedTrash = yield TrashItem_1.TrashItem.exists({ _id: { $nin: [entry._id, ...children.map(child => child._id)] }, $or: [
                        ...['path', 'sourcePath', 'draftQrPath', 'thumbnailPath'].map(key => ({ [`payload.file.${key}`]: value })),
                        { 'payload.links.attachment.url': value },
                    ] }).read('primary');
                if (protectedTrash)
                    continue;
                if (!(yield (0, s3_1.deleteFromS3)(value)))
                    throw new Error('Stored file removal failed; metadata retained for retry.');
            }
            yield transaction((session) => __awaiter(this, void 0, void 0, function* () {
                if (entry.kind === 'task') {
                    yield FileUpload_1.FileUpload.deleteMany({ taskId: entry.itemId }, { session });
                    yield Task_1.Task.deleteOne({ _id: entry.itemId, isDeleted: true }, { session });
                    yield TrashItem_1.TrashItem.deleteMany({ kind: 'file', taskId: entry.itemId }, { session });
                }
                yield TrashItem_1.TrashItem.deleteOne({ _id: entry._id, state: 'purging' }, { session });
            }));
            refresh();
            return true;
        }
        catch (error) {
            yield TrashItem_1.TrashItem.updateOne({ _id: entry._id }, { $set: { lastPurgeError: error instanceof Error ? error.message : String(error) } });
            throw error;
        }
    });
}
let cleanupRunning = false;
function cleanupTrash() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cleanupRunning)
            return;
        cleanupRunning = true;
        try {
            const entries = yield TrashItem_1.TrashItem.find({ purgeAt: { $lte: new Date() } }).select('_id').limit(100).lean();
            for (const entry of entries) {
                try {
                    yield purgeTrash(String(entry._id));
                }
                catch (error) {
                    console.error('[Trash] Permanent deletion retry pending:', String(entry._id), error instanceof Error ? error.message : String(error));
                }
            }
        }
        finally {
            cleanupRunning = false;
        }
    });
}
function startTrashCleanup() {
    const run = () => { void cleanupTrash().catch(error => console.error('[Trash] Cleanup failed:', error.message)); };
    run();
    const timer = setInterval(run, 60000);
    timer.unref();
}
