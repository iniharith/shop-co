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
            // Speed optimization: Only load tasks from the last 30 days by default to prevent massive payloads.
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.createdAt = { $gte: thirtyDaysAgo };
            return Task_1.Task.find(query).sort({ createdAt: -1 }).lean();
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
    updateFileNotes(taskId, fileUrl, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findOneAndUpdate({ _id: taskId, 'files.url': fileUrl }, { $set: { 'files.$.notes': notes } }, { new: true });
        });
    }
}
exports.TaskRepository = TaskRepository;
exports.taskRepository = new TaskRepository();
