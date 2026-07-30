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
            var _a, _b, _c;
            const query = {};
            if (filters === null || filters === void 0 ? void 0 : filters.status)
                query.status = filters.status;
            if ((filters === null || filters === void 0 ? void 0 : filters.statuses) && filters.statuses.length > 0)
                query.status = { $in: filters.statuses };
            if ((filters === null || filters === void 0 ? void 0 : filters.assignee) === 'unassigned') {
                query.assignee = { $in: [null, ''] };
            }
            else if (filters === null || filters === void 0 ? void 0 : filters.assignee) {
                query.assignee = filters.assignee;
            }
            if (filters === null || filters === void 0 ? void 0 : filters.orderId)
                query.orderId = filters.orderId;
            if (filters === null || filters === void 0 ? void 0 : filters.customerUsername)
                query.customerUsername = filters.customerUsername;
            const search = (_a = filters === null || filters === void 0 ? void 0 : filters.search) === null || _a === void 0 ? void 0 : _a.trim();
            if (search) {
                const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const searchRegex = new RegExp(escapedSearch, 'i');
                query.$or = [
                    { title: searchRegex },
                    { description: searchRegex },
                    { orderId: searchRegex },
                    { customerUsername: searchRegex },
                    { category: searchRegex },
                ];
                if (/^[a-f\d]{24}$/i.test(search))
                    query.$or.push({ _id: search });
            }
            if ((filters === null || filters === void 0 ? void 0 : filters.isDeleted) === true) {
                query.isDeleted = true;
            }
            else {
                query.isDeleted = { $ne: true };
            }
            // Fully unfiltered requests (no status/statuses/assignee/orderId/deleted
            // at all — e.g. the main Tasks board, print-drafts) previously had NO
            // date bound and NO limit, so they fetched every task ever created.
            // Restore a sane default window here, same 180-day precedent already
            // used for the `statuses` filter case below.
            const isFullyUnfiltered = !(filters === null || filters === void 0 ? void 0 : filters.status) && !((_b = filters === null || filters === void 0 ? void 0 : filters.statuses) === null || _b === void 0 ? void 0 : _b.length) && !(filters === null || filters === void 0 ? void 0 : filters.assignee) &&
                !(filters === null || filters === void 0 ? void 0 : filters.orderId) && !(filters === null || filters === void 0 ? void 0 : filters.customerUsername) && !search && (filters === null || filters === void 0 ? void 0 : filters.isDeleted) !== true;
            if ((filters === null || filters === void 0 ? void 0 : filters.days) !== undefined) {
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - filters.days);
                query.createdAt = { $gte: daysAgo };
            }
            else if (isFullyUnfiltered) {
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - 180);
                query.createdAt = { $gte: daysAgo };
            }
            const requestedLimit = (_c = filters === null || filters === void 0 ? void 0 : filters.limit) !== null && _c !== void 0 ? _c : TaskRepository.DEFAULT_LIMIT;
            const limit = Math.min(Math.max(requestedLimit, 1), TaskRepository.MAX_LIMIT);
            return Task_1.Task.find(query)
                .select('-comments -activities -files')
                .sort({ updatedAt: -1 })
                .limit(limit)
                .maxTimeMS(10000)
                .lean();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findById(id);
        });
    }
    // Task history lives in embedded arrays and can grow without bound. Limit
    // detail responses so opening one task cannot send an oversized document to
    // a browser, especially on mobile devices.
    findDetailById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findById(id)
                .slice('files', -50)
                .slice('comments', -100)
                .slice('activities', -100)
                .maxTimeMS(10000);
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
// Hard ceiling — no caller, present or future, can ever pull more than
// this many tasks in one request. This is what actually stops the
// Tasks board / print-drafts pages from silently growing an unbounded
// payload as the DB grows, which was causing very slow loads that led
// to memory pressure and crashes on iPad (July 2026).
TaskRepository.MAX_LIMIT = 1000;
TaskRepository.DEFAULT_LIMIT = 500;
exports.taskRepository = new TaskRepository();
