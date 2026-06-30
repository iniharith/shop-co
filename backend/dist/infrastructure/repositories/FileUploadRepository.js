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
exports.fileUploadRepository = exports.FileUploadRepository = void 0;
const FileUpload_1 = require("../../domain/entities/FileUpload");
class FileUploadRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.create(data);
        });
    }
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.find({ userId }).sort({ uploadedAt: -1 });
        });
    }
    findByOrderId(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.find({ orderId }).sort({ uploadedAt: -1 });
        });
    }
    findAll(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {};
            if ((filters === null || filters === void 0 ? void 0 : filters.adminReviewed) !== undefined)
                query.adminReviewed = filters.adminReviewed;
            if (filters === null || filters === void 0 ? void 0 : filters.search) {
                query.$or = [
                    { originalName: { $regex: filters.search, $options: 'i' } },
                    { userId: { $regex: filters.search, $options: 'i' } },
                    { orderId: { $regex: filters.search, $options: 'i' } },
                ];
            }
            // Speed optimization: Only load files from the last 30 days by default to prevent massive payloads.
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.uploadedAt = { $gte: thirtyDaysAgo };
            return FileUpload_1.FileUpload.find(query).sort({ uploadedAt: -1 });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.findById(id);
        });
    }
    updateFilename(id, originalName) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.findByIdAndUpdate(id, { $set: { originalName } }, { new: true });
        });
    }
    // Re-points a file at the correct customer/order/task — used to fix files
    // uploaded through a share link before its userId was resolved correctly.
    reassign(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = {};
            if (data.userId)
                update.userId = data.userId;
            if (data.orderId)
                update.orderId = data.orderId;
            if (data.taskId)
                update.taskId = data.taskId;
            if (data.category)
                update.category = data.category;
            return FileUpload_1.FileUpload.findByIdAndUpdate(id, { $set: update }, { new: true });
        });
    }
    updateAdminReview(id, reviewed, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            return FileUpload_1.FileUpload.findByIdAndUpdate(id, { $set: { adminReviewed: reviewed, adminNotes: notes } }, { new: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield FileUpload_1.FileUpload.findByIdAndDelete(id);
        });
    }
    getStorageStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield FileUpload_1.FileUpload.aggregate([
                {
                    $group: {
                        _id: null,
                        totalFiles: { $sum: 1 },
                        totalSize: { $sum: '$size' },
                        pendingReview: {
                            $sum: { $cond: [{ $eq: ['$adminReviewed', false] }, 1, 0] },
                        },
                    },
                },
            ]);
            const result = stats[0] || { totalFiles: 0, totalSize: 0, pendingReview: 0 };
            return Object.assign(Object.assign({}, result), { totalSizeMB: (result.totalSize / (1024 * 1024)).toFixed(2) });
        });
    }
    getFilesGroupedByUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return FileUpload_1.FileUpload.aggregate([
                {
                    $match: { uploadedAt: { $gte: thirtyDaysAgo } }
                },
                {
                    $group: {
                        _id: '$userId',
                        files: { $push: '$$ROOT' },
                        totalFiles: { $sum: 1 },
                        totalSize: { $sum: '$size' },
                        pendingReview: {
                            $sum: { $cond: [{ $eq: ['$adminReviewed', false] }, 1, 0] },
                        },
                        lastUpload: { $max: '$uploadedAt' },
                    },
                },
                { $sort: { lastUpload: -1 } },
            ]);
        });
    }
}
exports.FileUploadRepository = FileUploadRepository;
exports.fileUploadRepository = new FileUploadRepository();
