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
exports.TaskDescriptionRevision = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const schema = new mongoose_1.Schema({
    taskId: { type: String, required: true, index: true, immutable: true },
    taskTitle: { type: String, required: true, immutable: true },
    kind: { type: String, enum: ['created', 'edit', 'baseline', 'trash'], required: true, immutable: true },
    beforeHtml: { type: String, default: '', immutable: true },
    afterHtml: { type: String, default: '', immutable: true },
    actorId: { type: String, required: true, immutable: true },
    actorName: { type: String, required: true, immutable: true },
    capturedAt: { type: Date, default: Date.now, required: true, immutable: true },
    sourceUpdatedAt: { type: Date, immutable: true },
}, { versionKey: false });
schema.index({ taskId: 1, capturedAt: -1, _id: -1 });
schema.index({ taskId: 1, kind: 1 }, { unique: true, partialFilterExpression: { kind: 'baseline' } });
// No TTL and no task-delete cascade: descriptions must survive task deletion.
exports.TaskDescriptionRevision = mongoose_1.default.models.TaskDescriptionRevision || mongoose_1.default.model('TaskDescriptionRevision', schema);
