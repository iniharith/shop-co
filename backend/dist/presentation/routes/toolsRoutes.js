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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Standalone tools that aren't part of the order/task pipeline — staff
 * upload something, get a result back, done. Nothing here creates
 * FileUpload/Order/Task records; it's a pure utility.
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const multer_1 = __importDefault(require("multer"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const LocalUpscaleService_1 = require("../../infrastructure/services/LocalUpscaleService");
const router = (0, express_1.Router)();
// In-memory only — this file never touches S3 or the database. It's
// processed and handed straight back to the browser as a data URL.
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});
// ─── POST /api/tools/upscale ────────────────────────────────
// FREE AI image upscaler (UpscalerJS, runs locally — no API cost).
// Accepts a single image file + desired scale, returns the upscaled
// image as a base64 data URL for instant preview/download.
router.post('/upscale', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss'), upload.single('image'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const file = req.file;
    const scale = Number(req.body.scale) || 2;
    if (!file) {
        res.status(400).json({ success: false, message: 'No image file provided' });
        return;
    }
    if (!((_a = file.mimetype) === null || _a === void 0 ? void 0 : _a.startsWith('image/'))) {
        res.status(400).json({ success: false, message: 'Only image files can be upscaled' });
        return;
    }
    if (/heic|heif/i.test(file.mimetype)) {
        res.status(400).json({
            success: false,
            message: 'HEIC/HEIF photos aren\'t supported yet — please use a JPEG or PNG.',
        });
        return;
    }
    if (![2, 4].includes(scale)) {
        res.status(400).json({ success: false, message: 'scale must be 2 or 4' });
        return;
    }
    try {
        const passes = scale === 4 ? 2 : 1;
        const outputBuffer = yield (0, LocalUpscaleService_1.upscaleImageLocally)({ inputBuffer: file.buffer, passes });
        res.json({
            success: true,
            image: `data:image/png;base64,${outputBuffer.toString('base64')}`,
            originalName: file.originalname,
            scale,
            sizeBytes: outputBuffer.length,
        });
    }
    catch (err) {
        console.error('[Tools/Upscale] Failed:', err.message);
        res.status(500).json({ success: false, message: 'AI upscale failed. Please try a different image.' });
    }
})));
exports.default = router;
