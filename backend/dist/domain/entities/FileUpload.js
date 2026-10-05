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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpload = void 0;
const UploadNameReservation_1 = require("./UploadNameReservation");
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const mongoose_1 = __importStar(require("mongoose"));
const FileUploadSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    orderId: { type: String, index: true },
    taskId: { type: String, index: true },
    category: { type: String },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    sourcePath: { type: String },
    sourceSize: { type: Number },
    draftQrPath: { type: String },
    thumbnailPath: { type: String },
    uploadedAt: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    adminReviewed: { type: Boolean, default: false },
    adminNotes: { type: String },
    botNotified: { type: Boolean, default: false },
    // Tag to classify files uploaded from task board
    tag: { type: String, enum: ['attachment', 'draft', 'for_print', 'awb'] },
    // The exact share-link slug this file was uploaded through, if any.
    // This is the single source of truth linking an upload back to its
    // folder — independent of userId/orderId/taskId matching.
    shareSlug: { type: String, index: true },
    folderId: { type: String, index: true },
}, { timestamps: true });
FileUploadSchema.index({ createdAt: -1 });
FileUploadSchema.index({ taskId: 1, uploadedAt: -1 });
FileUploadSchema.index({ orderId: 1, uploadedAt: -1 });
FileUploadSchema.index({ userId: 1, uploadedAt: -1 });
FileUploadSchema.index({ userId: 1, filename: 1 });
FileUploadSchema.index({ shareSlug: 1, uploadedAt: -1 });
function releaseUploadReservations(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const matches = files.flatMap(file => {
            if (!file.originalName)
                return [];
            const key = file.taskId ? 'taskId' : file.orderId ? 'orderId' : 'userId';
            if (!file[key])
                return [];
            return [{ scope: JSON.stringify({ [key]: String(file[key]) }), name: file.originalName.toLowerCase() }];
        });
        if (matches.length)
            yield UploadNameReservation_1.UploadNameReservation.deleteMany({ $or: matches });
    });
}
FileUploadSchema.post('save', function (doc) {
    return __awaiter(this, void 0, void 0, function* () { yield releaseUploadReservations([doc]); });
});
FileUploadSchema.post('insertMany', function (docs) {
    return __awaiter(this, void 0, void 0, function* () { yield releaseUploadReservations(docs); });
});
// Also clears locks created before metadata-completion cleanup was introduced.
FileUploadSchema.pre('findOneAndDelete', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield this.model.findOne(this.getFilter()).lean();
        if (doc)
            yield releaseUploadReservations([doc]);
    });
});
FileUploadSchema.pre('deleteMany', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const docs = yield this.model.find(this.getFilter()).lean();
        yield releaseUploadReservations(docs);
    });
});
exports.FileUpload = mongoose_1.default.model('FileUpload', FileUploadSchema);
