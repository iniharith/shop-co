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
exports.FileAnnotation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const annotationSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    kind: { type: String, enum: ['stroke', 'pin', 'note'], required: true },
    color: { type: String, required: true },
    width: { type: Number, required: true },
    points: { type: [new mongoose_1.Schema({ x: Number, y: Number }, { _id: false })], default: undefined },
    x: Number,
    y: Number,
    text: String,
}, { _id: false });
const schema = new mongoose_1.Schema({
    fileId: { type: String, required: true },
    editorId: { type: String, required: true },
    editorName: { type: String, required: true },
    items: { type: [annotationSchema], default: [] },
    revision: { type: Number, required: true, default: 1 },
}, { timestamps: true });
schema.index({ fileId: 1, editorId: 1 }, { unique: true });
exports.FileAnnotation = mongoose_1.default.model('FileAnnotation', schema);
