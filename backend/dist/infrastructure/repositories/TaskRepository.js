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
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRepository = exports.TaskRepository = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const Task_1 = require("../../domain/entities/Task");
class TaskRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.create(data);
        });
    }
    findAll(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {};
            if (filters === null || filters === void 0 ? void 0 : filters.status)
                query.status = filters.status;
            if ((filters === null || filters === void 0 ? void 0 : filters.statuses) && filters.statuses.length > 0)
                query.status = { $in: filters.statuses };
            if (filters === null || filters === void 0 ? void 0 : filters.assignee)
                query.assignee = filters.assignee;
            if (filters === null || filters === void 0 ? void 0 : filters.orderId)
                query.orderId = filters.orderId;
            if (filters === null || filters === void 0 ? void 0 : filters.customerUsername)
                query.customerUsername = filters.customerUsername;
            if ((filters === null || filters === void 0 ? void 0 : filters.isDeleted) === true) {
                query.isDeleted = true;
            }
            else {
                query.isDeleted = { $ne: true };
            }
            if ((filters === null || filters === void 0 ? void 0 : filters.days) !== undefined) {
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - filters.days);
                query.createdAt = { $gte: daysAgo };
            }
            return Task_1.Task.find(query)
                .select('-comments -activities -files')
                .sort({ createdAt: -1 })
                .maxTimeMS(10000)
                .lean();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findById(id);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findByIdAndUpdate(id, { $set: data }, { new: true });
        });
    }
    updateByOrderId(orderId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Task_1.Task.updateMany({ orderId }, { $set: data });
        });
    }
    findByOrderId(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.find({ orderId });
        });
    }
    countRecent() {
        return __awaiter(this, arguments, void 0, function* (days = 30) {
            const createdAfter = new Date();
            createdAfter.setDate(createdAfter.getDate() - days);
            return Task_1.Task.countDocuments({
                isDeleted: { $ne: true },
                createdAt: { $gte: createdAfter },
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Task_1.Task.findByIdAndUpdate(id, { $set: { isDeleted: true } });
        });
    }
    permanentDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Task_1.Task.findByIdAndDelete(id);
        });
    }
    addComment(taskId, userId, userName, text, role) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findByIdAndUpdate(taskId, { $push: { comments: { userId, userName, text, role: role || 'admin', createdAt: new Date() } } }, { new: true });
        });
    }
    addActivity(taskId, userId, userName, action, details) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findByIdAndUpdate(taskId, { $push: { activities: { userId, userName, action, details: details || '', createdAt: new Date() } } }, { new: true });
        });
    }
    deleteComment(taskId, commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findByIdAndUpdate(taskId, { $pull: { comments: { _id: commentId } } }, { new: true });
        });
    }
    pinComment(taskId, commentId, pinned) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findOneAndUpdate({ _id: taskId, 'comments._id': commentId }, { $set: { 'comments.$.pinned': pinned } }, { new: true });
        });
    }
    addFile(taskId, url, name, tag) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findByIdAndUpdate(taskId, { $push: { files: { url, name, notes: '', tag: tag || 'attachment' } } }, { new: true });
        });
    }
    deleteFile(taskId, fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const task = yield Task_1.Task.findById(taskId);
            if (!task)
                return null;
            const file = (_a = task.files) === null || _a === void 0 ? void 0 : _a.find((f) => { var _a, _b; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === fileId || ((_b = f.url) === null || _b === void 0 ? void 0 : _b.includes(fileId)); });
            if (!file)
                return task;
            return Task_1.Task.findByIdAndUpdate(taskId, { $pull: { files: { _id: file._id } } }, { new: true });
        });
    }
    updateFileNotes(taskId, fileUrl, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findOneAndUpdate({ _id: taskId, 'files.url': fileUrl }, { $set: { 'files.$.notes': notes } }, { new: true });
        });
    }
}
exports.TaskRepository = TaskRepository;
exports.taskRepository = new TaskRepository();
