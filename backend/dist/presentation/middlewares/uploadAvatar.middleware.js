"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const s3_1 = require("../../infrastructure/config/s3");
const multer_s3_1 = __importDefault(require("multer-s3"));
const storage = (0, multer_s3_1.default)({
    s3: s3_1.s3Client,
    bucket: s3_1.S3_BUCKET_NAME,
    contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.body.id || 'avatar';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `kampungcetak/avatars/${userId}/${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});
exports.uploadAvatar = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
