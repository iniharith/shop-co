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
exports.Task = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const mongoose_1 = __importStar(require("mongoose"));
const TaskCommentSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    role: { type: String, default: 'admin' },
    pinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
const TaskActivitySchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});
const TaskSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    assignee: { type: String, default: null }, // Mongoose ObjectId string
    dueDate: { type: Date, default: null },
    orderId: { type: String, default: null },
    customerUsername: { type: String, default: '' },
    category: { type: String, default: 'UNASSIGNED' },
    status: { type: String, enum: ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURN'], default: 'PLACED' },
    isDone: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    statusUpdatedAt: { type: Date, default: Date.now },
    files: [{
            url: { type: String, required: true },
            name: { type: String, required: true },
            notes: { type: String, default: '' },
            tag: { type: String, enum: ['attachment', 'draft', 'for_print'], default: 'attachment' }
        }],
    comments: [TaskCommentSchema],
    activities: [TaskActivitySchema],
}, { timestamps: true });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ updatedAt: -1 });
TaskSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
TaskSchema.index({ assignee: 1, status: 1, createdAt: -1 });
TaskSchema.index({ orderId: 1 });
exports.Task = mongoose_1.default.model('Task', TaskSchema);
