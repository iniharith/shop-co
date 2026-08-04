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
const crypto_1 = require("crypto");
const Project_1 = require("../../domain/entities/Project");
const ProjectShare_1 = require("../../domain/entities/ProjectShare");
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
const hashShareToken = (token) => (0, crypto_1.createHash)('sha256').update(token).digest('hex');
router.get('/shared/:token/meta', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = yield ProjectShare_1.ProjectShare.findOne({
        tokenHash: hashShareToken(req.params.token),
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    }).select('projectId').lean();
    if (!share) {
        res.status(404).json({ success: false, message: 'Project share link not found or expired' });
        return;
    }
    const project = yield Project_1.Project.findById(share.projectId).select('title').lean();
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    res.json({ success: true, data: { title: project.title } });
})));
router.get('/shared/:token', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader('Cache-Control', 'no-store');
    const share = yield ProjectShare_1.ProjectShare.findOne({
        tokenHash: hashShareToken(req.params.token),
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    });
    if (!share) {
        res.status(404).json({ success: false, message: 'Project share link not found or expired' });
        return;
    }
    const project = yield Project_1.Project.findById(share.projectId);
    if (!project) {
        yield share.deleteOne();
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    share.lastAccessedAt = new Date();
    yield share.save();
    const data = yield withSignedFileUrls(project);
    res.json({
        success: true,
        data: {
            title: data.title,
            description: data.description,
            updatedAt: data.updatedAt,
            files: data.files.map((file) => ({
                _id: file._id,
                originalName: file.originalName,
                mimetype: file.mimetype,
                size: file.size,
                uploadedAt: file.uploadedAt,
                previewUrl: file.previewUrl,
            })),
        },
    });
})));
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
    if (Array.isArray(req.body.assigneeIds))
        update.assigneeIds = req.body.assigneeIds.filter((id) => typeof id === 'string');
    if (req.body.coverFileId === null || typeof req.body.coverFileId === 'string')
        update.coverFileId = req.body.coverFileId;
    if ('title' in update && !update.title) {
        res.status(400).json({ success: false, message: 'Project title is required' });
        return;
    }
    const existing = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    if (existing && update.coverFileId && !existing.files.some(file => { var _a; return ((_a = file._id) === null || _a === void 0 ? void 0 : _a.toString()) === update.coverFileId && file.mimetype.startsWith('image/'); })) {
        res.status(400).json({ success: false, message: 'Project cover must be an image file in this project' });
        return;
    }
    const project = yield Project_1.Project.findOneAndUpdate({ _id: req.params.id, deletingAt: null }, { $set: update }, { new: true, runValidators: true });
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.delete('/:id', (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!mongoose_1.default.isValidObjectId(req.params.id)) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    const project = yield Project_1.Project.findOneAndUpdate({ _id: req.params.id }, { $set: { deletingAt: new Date() } }, { new: true });
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    let failedFileDeletes = 0;
    const keys = project.files.map(file => file.key).filter(Boolean);
    for (let index = 0; index < keys.length; index += 1000) {
        const batch = keys.slice(index, index + 1000);
        try {
            const result = yield s3_1.s3Client.send(new client_s3_1.DeleteObjectsCommand({
                Bucket: s3_1.S3_BUCKET_NAME,
                Delete: { Objects: batch.map(Key => ({ Key })), Quiet: true },
            }));
            failedFileDeletes += ((_a = result.Errors) === null || _a === void 0 ? void 0 : _a.length) || 0;
        }
        catch (error) {
            failedFileDeletes += batch.length;
            console.warn('[ProjectDelete] S3 cleanup failed:', error);
        }
    }
    if (failedFileDeletes > 0) {
        res.status(502).json({
            success: false,
            message: `Could not remove ${failedFileDeletes} project file${failedFileDeletes === 1 ? '' : 's'} from storage. The project was not deleted; please retry.`,
        });
        return;
    }
    yield Project_1.Project.findOneAndDelete({ _id: project._id, deletingAt: { $ne: null } });
    let shareCleanupFailed = false;
    yield ProjectShare_1.ProjectShare.deleteMany({ projectId: project._id }).catch(error => {
        shareCleanupFailed = true;
        console.warn('[ProjectDelete] Share-link cleanup failed:', error);
    });
    res.json({
        success: true,
        data: { deletedFiles: keys.length, shareCleanupFailed },
    });
})));
router.post('/:id/folders', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const parentFolderId = req.body.parentFolderId || null;
    if (!name) {
        res.status(400).json({ success: false, message: 'Folder name is required' });
        return;
    }
    const project = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    // Validate parentFolderId exists if provided
    if (parentFolderId && !project.folders.some(folder => { var _a; return ((_a = folder._id) === null || _a === void 0 ? void 0 : _a.toString()) === parentFolderId; })) {
        res.status(400).json({ success: false, message: 'Parent folder not found in this project' });
        return;
    }
    // Check nesting level (max 2 levels: root -> level 1 -> level 2)
    if (parentFolderId) {
        const parentFolder = project.folders.find(f => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === parentFolderId; });
        if (parentFolder === null || parentFolder === void 0 ? void 0 : parentFolder.parentFolderId) {
            res.status(400).json({ success: false, message: 'Maximum folder nesting depth (2 levels) reached' });
            return;
        }
    }
    project.folders.push({ name, parentFolderId });
    yield project.save();
    res.status(201).json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.patch('/:id/folders/:folderId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const project = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    const folder = project === null || project === void 0 ? void 0 : project.folders.find(item => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.folderId; });
    if (!project || !folder) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
    }
    if (!name) {
        res.status(400).json({ success: false, message: 'Folder name is required' });
        return;
    }
    folder.name = name;
    // Handle parentFolderId update if provided
    if ('parentFolderId' in req.body) {
        const newParentId = req.body.parentFolderId || null;
        // Validate new parent exists
        if (newParentId && !project.folders.some(f => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === newParentId; })) {
            res.status(400).json({ success: false, message: 'Parent folder not found in this project' });
            return;
        }
        // Prevent moving folder into itself
        if (newParentId === req.params.folderId) {
            res.status(400).json({ success: false, message: 'Cannot move folder into itself' });
            return;
        }
        // Prevent moving folder into its own child (would create circular reference)
        const childFolders = project.folders.filter(f => f.parentFolderId === req.params.folderId);
        if (childFolders.some(child => { var _a; return ((_a = child._id) === null || _a === void 0 ? void 0 : _a.toString()) === newParentId; })) {
            res.status(400).json({ success: false, message: 'Cannot move folder into its own subfolder' });
            return;
        }
        // Check nesting level (max 2 levels)
        if (newParentId) {
            const newParent = project.folders.find(f => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === newParentId; });
            if (newParent === null || newParent === void 0 ? void 0 : newParent.parentFolderId) {
                res.status(400).json({ success: false, message: 'Maximum folder nesting depth (2 levels) reached' });
                return;
            }
            // If this folder has children, it cannot be moved to level 1
            if (childFolders.length > 0) {
                res.status(400).json({ success: false, message: 'Cannot move folder with subfolders to level 2' });
                return;
            }
        }
        folder.parentFolderId = newParentId;
    }
    yield project.save();
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.post('/:id/folders/move', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const folderIds = Array.isArray(req.body.folderIds) ? req.body.folderIds.map(String) : [];
    const targetParentId = req.body.parentFolderId || null;
    if (folderIds.length === 0) {
        res.status(400).json({ success: false, message: 'No folders to move' });
        return;
    }
    const project = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    // Validate each folder exists and cannot be moved into itself
    for (const folderId of folderIds) {
        if (!project.folders.some(f => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === folderId; })) {
            res.status(400).json({ success: false, message: 'Folder not found in this project' });
            return;
        }
        if (targetParentId === folderId) {
            res.status(400).json({ success: false, message: 'Cannot move folder into itself' });
            return;
        }
    }
    // Validate new parent exists
    if (targetParentId && !project.folders.some(f => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === targetParentId; })) {
        res.status(400).json({ success: false, message: 'Parent folder not found in this project' });
        return;
    }
    // Prevent moving folders into their own subfolders (circular reference)
    const childIds = project.folders
        .filter(f => folderIds.includes(f.parentFolderId || ''))
        .map(f => { var _a; return (_a = f._id) === null || _a === void 0 ? void 0 : _a.toString(); });
    if (targetParentId && childIds.includes(targetParentId)) {
        res.status(400).json({ success: false, message: 'Cannot move folder into its own subfolder' });
        return;
    }
    // Check nesting level (max 2 levels)
    if (targetParentId) {
        const newParent = project.folders.find(f => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === targetParentId; });
        if (newParent === null || newParent === void 0 ? void 0 : newParent.parentFolderId) {
            res.status(400).json({ success: false, message: 'Maximum folder nesting depth (2 levels) reached' });
            return;
        }
        // Folders that have subfolders cannot be moved to level 2
        const hasChildren = project.folders.some(f => folderIds.includes(f.parentFolderId || ''));
        if (hasChildren) {
            res.status(400).json({ success: false, message: 'Cannot move folder with subfolders to level 2' });
            return;
        }
    }
    for (const folderId of folderIds) {
        const folder = project.folders.find(f => { var _a; return ((_a = f._id) === null || _a === void 0 ? void 0 : _a.toString()) === folderId; });
        if (folder)
            folder.parentFolderId = targetParentId;
    }
    yield project.save();
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.delete('/:id/folders/:folderId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project || !project.folders.some(item => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.folderId; })) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
    }
    // Find all child folders (subfolders of this folder)
    const childFolderIds = project.folders
        .filter(f => f.parentFolderId === req.params.folderId)
        .map(f => { var _a; return (_a = f._id) === null || _a === void 0 ? void 0 : _a.toString(); });
    // Remove the folder and all its subfolders
    project.folders = project.folders.filter(item => {
        var _a;
        const folderId = (_a = item._id) === null || _a === void 0 ? void 0 : _a.toString();
        return folderId !== req.params.folderId && !childFolderIds.includes(folderId);
    });
    // Move files from deleted folders to project root
    project.files.forEach(file => {
        if (file.folderId === req.params.folderId || childFolderIds.includes(file.folderId)) {
            file.folderId = undefined;
        }
    });
    yield project.save();
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
router.post('/:id/share', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield Project_1.Project.exists({ _id: req.params.id, deletingAt: null }))) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    const token = (0, crypto_1.randomBytes)(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const share = yield ProjectShare_1.ProjectShare.create({
        projectId: req.params.id,
        tokenHash: hashShareToken(token),
        createdBy: req.userId,
        expiresAt,
    });
    if (!(yield Project_1.Project.exists({ _id: req.params.id, deletingAt: null }))) {
        yield share.deleteOne();
        res.status(409).json({ success: false, message: 'Project is being deleted' });
        return;
    }
    res.status(201).json({ success: true, data: { token, expiresAt } });
})));
router.post('/:id/upload-url', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename, contentType, size } = req.body;
    if (!filename || !Number.isFinite(size) || size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
        res.status(400).json({ success: false, message: 'A valid file up to 200MB is required' });
        return;
    }
    if (!(yield Project_1.Project.exists({ _id: req.params.id, deletingAt: null }))) {
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
    const { key, originalName, folderId } = req.body;
    const expectedPrefix = `kampungcetak/projects/${req.params.id}/`;
    if (!key || !key.startsWith(expectedPrefix) || !originalName) {
        res.status(400).json({ success: false, message: 'Invalid project file metadata' });
        return;
    }
    const project = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
        yield s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key })).catch(error => {
            console.warn('[ProjectFileRegister] Orphan cleanup failed:', error);
        });
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    if (project.files.some(file => file.key === key)) {
        res.json({ success: true, data: yield withSignedFileUrls(project) });
        return;
    }
    if (folderId && !project.folders.some(folder => { var _a; return ((_a = folder._id) === null || _a === void 0 ? void 0 : _a.toString()) === folderId; })) {
        res.status(400).json({ success: false, message: 'Folder not found in this project' });
        return;
    }
    const object = yield s3_1.s3Client.send(new client_s3_1.HeadObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key }));
    const size = object.ContentLength || 0;
    if (size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
        res.status(400).json({ success: false, message: 'Uploaded file is empty or exceeds 200MB' });
        return;
    }
    const newFile = {
        key,
        url: `https://${s3_1.S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
        originalName: originalName.toString().slice(0, 255),
        mimetype: object.ContentType || 'application/octet-stream',
        size,
        uploadedBy: req.userId,
        uploadedAt: new Date(),
        folderId: folderId || undefined,
    };
    const updateFilter = {
        _id: req.params.id,
        deletingAt: null,
        'files.key': { $ne: key },
    };
    if (folderId)
        updateFilter['folders._id'] = folderId;
    const updatedProject = yield Project_1.Project.findOneAndUpdate(updateFilter, { $push: { files: newFile } }, { new: true, runValidators: true });
    if (!updatedProject) {
        const currentProject = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
        if (currentProject === null || currentProject === void 0 ? void 0 : currentProject.files.some(file => file.key === key)) {
            res.json({ success: true, data: yield withSignedFileUrls(currentProject) });
            return;
        }
        yield s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key })).catch(error => {
            console.warn('[ProjectFileRegister] Rejected-upload cleanup failed:', error);
        });
        res.status(409).json({ success: false, message: 'Project is being deleted or the selected folder no longer exists' });
        return;
    }
    res.status(201).json({ success: true, data: yield withSignedFileUrls(updatedProject) });
})));
router.delete('/:id/files/:fileId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
    }
    const file = project.files.find(item => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.fileId; });
    if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    try {
        yield s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: file.key }));
    }
    catch (error) {
        console.warn('[ProjectFileDelete] S3 cleanup failed:', error);
        res.status(502).json({ success: false, message: 'File could not be removed from storage; please retry' });
        return;
    }
    const update = { $pull: { files: { _id: req.params.fileId } } };
    if (project.coverFileId === req.params.fileId)
        update.$unset = { coverFileId: 1 };
    const updatedProject = yield Project_1.Project.findOneAndUpdate({ _id: req.params.id, deletingAt: null, 'files._id': req.params.fileId }, update, { new: true });
    if (!updatedProject) {
        res.status(409).json({ success: false, message: 'Project is being deleted' });
        return;
    }
    res.json({ success: true, data: yield withSignedFileUrls(updatedProject) });
})));
router.patch('/:id/files/:fileId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield Project_1.Project.findOne({ _id: req.params.id, deletingAt: null });
    const file = project === null || project === void 0 ? void 0 : project.files.find(item => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.params.fileId; });
    if (!project || !file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
    }
    if (typeof req.body.originalName === 'string') {
        const name = req.body.originalName.trim();
        if (!name) {
            res.status(400).json({ success: false, message: 'File name is required' });
            return;
        }
        file.originalName = name.slice(0, 255);
    }
    if (typeof req.body.notes === 'string')
        file.notes = req.body.notes.slice(0, 2000);
    if (req.body.folderId === null || typeof req.body.folderId === 'string') {
        if (req.body.folderId && !project.folders.some(folder => { var _a; return ((_a = folder._id) === null || _a === void 0 ? void 0 : _a.toString()) === req.body.folderId; })) {
            res.status(400).json({ success: false, message: 'Folder not found in this project' });
            return;
        }
        file.folderId = req.body.folderId || undefined;
    }
    yield project.save();
    res.json({ success: true, data: yield withSignedFileUrls(project) });
})));
exports.default = router;
