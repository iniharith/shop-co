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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRepository = exports.TaskRepository = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const Task_1 = require("../../domain/entities/Task");
const mongoose_1 = __importDefault(require("mongoose"));
const cursorPagination_1 = require("../../shared/utils/cursorPagination");
class TaskRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = data.status || 'PLACED';
            const isDone = Boolean(data.isDone);
            const changedAt = new Date();
            return Task_1.Task.create(Object.assign(Object.assign({}, data), { status,
                isDone, statusUpdatedAt: changedAt, statusHistory: [{
                        fromStatus: null,
                        toStatus: status,
                        fromIsDone: false,
                        toIsDone: isDone,
                        changedAt,
                    }] }));
        });
    }
    buildQuery(filters) {
        var _a, _b;
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
        if (filters === null || filters === void 0 ? void 0 : filters.cursor) {
            const cursorBoundary = {
                $or: [
                    { updatedAt: { $lt: new Date(filters.cursor.updatedAt) } },
                    {
                        updatedAt: new Date(filters.cursor.updatedAt),
                        _id: { $lt: new mongoose_1.default.Types.ObjectId(filters.cursor.id) },
                    },
                ],
            };
            query.$and = [...(query.$and || []), cursorBoundary];
        }
        return query;
    }
    getLimit(filters) {
        var _a;
        const requestedLimit = (_a = filters === null || filters === void 0 ? void 0 : filters.limit) !== null && _a !== void 0 ? _a : TaskRepository.DEFAULT_LIMIT;
        return Math.min(Math.max(requestedLimit, 1), TaskRepository.MAX_LIMIT);
    }
    findAll(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.buildQuery(filters);
            const limit = this.getLimit(filters);
            return Task_1.Task.find(query)
                .select('-comments -activities -files -statusHistory')
                .sort({ updatedAt: -1, _id: -1 })
                .limit(limit)
                .maxTimeMS(10000)
                .lean();
        });
    }
    findPage(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.buildQuery(filters);
            const limit = this.getLimit(filters);
            const results = yield Task_1.Task.find(query)
                .select('-comments -activities -files -statusHistory')
                .sort({ updatedAt: -1, _id: -1 })
                .limit(limit + 1)
                .maxTimeMS(10000)
                .lean();
            const hasNextPage = results.length > limit;
            const tasks = results.slice(0, limit);
            const lastTask = tasks[tasks.length - 1];
            const nextCursor = hasNextPage && lastTask
                ? (0, cursorPagination_1.encodeCursor)({
                    version: 1,
                    updatedAt: lastTask.updatedAt.toISOString(),
                    id: lastTask._id.toString(),
                })
                : null;
            return { tasks, pageInfo: { limit, hasNextPage, nextCursor } };
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
            const updateData = Object.assign({}, data);
            delete updateData.statusHistory;
            for (let attempt = 0; attempt < 3; attempt++) {
                const current = yield Task_1.Task.findById(id).select('status isDone').lean();
                if (!current)
                    return null;
                const currentIsDone = Boolean(current.isDone);
                const toStatus = data.status || current.status;
                const toIsDone = typeof data.isDone === 'boolean' ? data.isDone : currentIsDone;
                const workflowChanged = toStatus !== current.status || toIsDone !== currentIsDone;
                if (!workflowChanged)
                    return Task_1.Task.findByIdAndUpdate(id, { $set: updateData }, { new: true });
                const changedAt = new Date();
                const updated = yield Task_1.Task.findOneAndUpdate(Object.assign({ _id: id, status: current.status }, (currentIsDone
                    ? { isDone: true }
                    : { $or: [{ isDone: false }, { isDone: null }, { isDone: { $exists: false } }] })), {
                    $set: Object.assign(Object.assign({}, updateData), (toStatus !== current.status ? { statusUpdatedAt: changedAt } : {})),
                    $push: {
                        statusHistory: {
                            fromStatus: current.status,
                            toStatus,
                            fromIsDone: currentIsDone,
                            toIsDone,
                            changedAt,
                        },
                    },
                }, { new: true });
                if (updated)
                    return updated;
            }
            throw new Error('Task changed concurrently; retry the update');
        });
    }
    updateByOrderId(orderId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.status) {
                yield Task_1.Task.updateMany({ orderId }, { $set: data });
                return;
            }
            const changedAt = new Date();
            const { statusUpdatedAt: _ignoredStatusUpdatedAt, statusHistory: _ignoredHistory } = data, setData = __rest(data, ["statusUpdatedAt", "statusHistory"]);
            yield Task_1.Task.updateMany({ orderId, status: { $ne: data.status } }, [{
                    $set: Object.assign(Object.assign({}, setData), { statusUpdatedAt: changedAt, statusHistory: {
                            $concatArrays: [
                                { $ifNull: ['$statusHistory', []] },
                                [{
                                        fromStatus: '$status',
                                        toStatus: data.status,
                                        fromIsDone: { $ifNull: ['$isDone', false] },
                                        toIsDone: { $ifNull: ['$isDone', false] },
                                        changedAt,
                                    }],
                            ],
                        } }),
                }]);
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
    restore(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findOneAndUpdate({ _id: id, isDeleted: true }, { $set: { isDeleted: false } }, { new: true });
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
    updateFileTag(taskId, fileUrl, tag) {
        return __awaiter(this, void 0, void 0, function* () {
            return Task_1.Task.findOneAndUpdate({ _id: taskId, 'files.url': fileUrl }, { $set: { 'files.$.tag': tag } }, { new: true });
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
