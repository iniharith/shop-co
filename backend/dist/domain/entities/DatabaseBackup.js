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
exports.DatabaseBackupLock = exports.DatabaseBackup = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const schema = new mongoose_1.Schema({
    slot: { type: String },
    owner: { type: String, required: true },
    status: { type: String, enum: ['running', 'completed', 'failed'], required: true },
    startedAt: { type: Date, required: true },
    completedAt: Date,
    leaseUntil: Date,
    filename: String,
    objectKey: String,
    bucket: String,
    iv: String,
    authTag: String,
    sha256: String,
    bytes: Number,
    error: String,
}, { timestamps: true });
schema.index({ slot: 1 }, { unique: true, sparse: true });
schema.index({ startedAt: -1 });
exports.DatabaseBackup = mongoose_1.default.models.DatabaseBackup || mongoose_1.default.model('DatabaseBackup', schema);
const lockSchema = new mongoose_1.Schema({ _id: String, owner: String, leaseUntil: Date }, { versionKey: false });
exports.DatabaseBackupLock = mongoose_1.default.models.DatabaseBackupLock || mongoose_1.default.model('DatabaseBackupLock', lockSchema);
