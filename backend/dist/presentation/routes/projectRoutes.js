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
 * Kampungcetak (R)
 */
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = require("../../domain/entities/Project");
const s3_1 = require("../../infrastructure/config/s3");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
const MAX_PROJECT_FILE_SIZE = 200 * 1024 * 1024;
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-5';
const withSignedFileUrls = (project) => __awaiter(void 0, void 0, void 0, function* () {
    const data = typeof project.toObject === 'function' ? project.toObject() : project;
    data.files = yield Promise.all((data.files || []).map((file) => __awaiter(void 0, void 0, void 0, function* () {
        return (Object.assign(Object.assign({}, file), { previewUrl: yield (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: file.key }), { expiresIn: 900 }) }));
    })));
    return data;
});
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss', 'designer'));
router.get('/', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const filter = query
        ? { $or: [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }] }
        : {};
    const projects = yield Project_1.Project.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data: yield Promise.all(projects.map(withSignedFileUrls)) });
})));
router.post('/', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!title) {
        res.status(400).json({ success: false, message: 'Project title is required' });
        return;
    }
    const authReq = req;
    const project = yield Project_1.Project.create({
        title,
        description,
        createdBy: authReq.userId,
        createdByName: ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.email) || '',
    });
    res.status(201).json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.get('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.isValidObjectId(req.params.id)) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    const project = yield Project_1.Project.findById(req.params.id);
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.patch('/:id', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const update = {};
    if (typeof req.body.title === 'string')
        update.title = req.body.title.trim();
    if (typeof req.body.description === 'string')
        update.description = req.body.description.trim();
    if ('title' in update && !update.title) {
        res.status(400).json({ success: false, message: 'Project title is required' });
        return;
    }
    const project = yield Project_1.Project.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.post('/:id/upload-url', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename, contentType, size } = req.body;
    if (!filename || !Number.isFinite(size) || size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
        res.status(400).json({ success: false, message: 'A valid file up to 200MB is required' });
        return;
    }
    if (!(yield Project_1.Project.exists({ _id: req.params.id }))) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    const safeFilename = filename.toString().replace(/[^a-zA-Z0-9.-]/g, '_').slice(-180) || 'file';
    const key = `kampungcetak/projects/${req.params.id}/${Date.now()}-${Math.round(Math.random() * 1E9)}-${safeFilename}`;
    const mimetype = contentType || 'application/octet-stream';
    const command = new client_s3_1.PutObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key, ContentType: mimetype });
    const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, command, { expiresIn: 900 });
    res.json({
        success: true,
        signedUrl,
        key,
        fileUrl: `https://${s3_1.S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
    });
})));
router.post('/:id/files', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key, originalName } = req.body;
    const expectedPrefix = `kampungcetak/projects/${req.params.id}/`;
    if (!key || !key.startsWith(expectedPrefix) || !originalName) {
        res.status(400).json({ success: false, message: 'Invalid project file metadata' });
        return;
    }
    const project = yield Project_1.Project.findById(req.params.id);
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    if (project.files.some(file => file.key === key)) {
        res.json({ success: true, data: yield withSignedFileUrls(project) });
        return;
    }
    const object = yield s3_1.s3Client.send(new client_s3_1.HeadObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key }));
    const size = object.ContentLength || 0;
    if (size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
        res.status(400).json({ success: false, message: 'Uploaded file is empty or exceeds 200MB' });
        return;
    }
    project.files.push({
        key,
        url: `https://${s3_1.S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
        originalName: originalName.toString().slice(0, 255),
        mimetype: object.ContentType || 'application/octet-stream',
        size,
        uploadedBy: req.userId,
        uploadedAt: new Date(),
    });
    yield project.save();
    res.status(201).json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.delete('/:id/files/:fileId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield Project_1.Project.findById(req.params.id);
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    const file = project.files.find(item => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.fileId; });
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    project.files = project.files.filter(item => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) !== req.params.fileId; });
    yield project.save();
    try {
        yield s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: file.key }));
    }
    catch (error) {
        console.warn('[ProjectFileDelete] S3 cleanup failed:', error);
    }
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
exports.default = router;
