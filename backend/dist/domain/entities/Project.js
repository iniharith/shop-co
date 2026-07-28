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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
/**
 * Coded by Harith
 * Kampungcetak (R)
 */
const mongoose_1 = __importStar(require("mongoose"));
const ProjectFileSchema = new mongoose_1.Schema({
    key: { type: String, required: true },
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    folderId: { type: String, default: null },
    notes: { type: String, default: '', maxlength: 2000 },
});
const ProjectFolderSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
});
const ProjectSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 10000 },
    files: { type: [ProjectFileSchema], default: [] },
    folders: { type: [ProjectFolderSchema], default: [] },
    assigneeIds: { type: [String], default: [] },
    coverFileId: { type: String, default: null },
    createdBy: { type: String, required: true, index: true, immutable: true },
    createdByName: { type: String, default: '' },
}, { timestamps: true });
ProjectSchema.index({ updatedAt: -1 });
ProjectSchema.index({ title: 'text', description: 'text' });
exports.Project = mongoose_1.default.model('Project', ProjectSchema);
