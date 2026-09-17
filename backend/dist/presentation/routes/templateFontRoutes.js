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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("../../infrastructure/config/s3");
const TemplateFont_1 = require("../../domain/entities/TemplateFont");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
const allowedExtensions = new Set(['woff', 'woff2', 'ttf', 'otf']);
const mimeTypes = {
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        var _a;
        const extension = ((_a = file.originalname.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        cb(null, allowedExtensions.has(extension));
    },
});
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss'));
router.get('/', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fonts = yield TemplateFont_1.TemplateFont.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: fonts });
})));
router.post('/', upload.single('font'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Please upload a .woff, .woff2, .ttf, or .otf font file.' });
        return;
    }
    const extension = ((_a = req.file.originalname.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
    if (!allowedExtensions.has(extension)) {
        res.status(400).json({ success: false, message: 'Unsupported font format.' });
        return;
    }
    const suppliedFamily = String(req.body.family || '').trim();
    const fallbackFamily = req.file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    const family = (suppliedFamily || fallbackFamily).slice(0, 80);
    if (!family) {
        res.status(400).json({ success: false, message: 'A font family name is required.' });
        return;
    }
    if (yield TemplateFont_1.TemplateFont.exists({ family })) {
        res.status(409).json({ success: false, message: 'A font with this family name already exists.' });
        return;
    }
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `kampungcetak/template-fonts/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    const mimeType = mimeTypes[extension] || req.file.mimetype || 'application/octet-stream';
    yield s3_1.s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: s3_1.S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
    }));
    const region = process.env.AWS_REGION || 'ap-southeast-5';
    const font = yield TemplateFont_1.TemplateFont.create({
        name: family,
        family,
        key,
        mimeType,
        url: `https://${s3_1.S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`,
        createdBy: req.userId,
    });
    res.status(201).json({ success: true, data: font });
})));
router.delete('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const font = yield TemplateFont_1.TemplateFont.findById(req.params.id);
    if (!font) {
        res.status(404).json({ success: false, message: 'Font not found.' });
        return;
    }
    yield s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: font.key }));
    yield font.deleteOne();
    res.json({ success: true });
})));
exports.default = router;
