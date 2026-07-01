"use strict";
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
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const VirtualFolderRepository_1 = require("../../infrastructure/repositories/VirtualFolderRepository");
const FileUploadRepository_1 = require("../../infrastructure/repositories/FileUploadRepository");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const router = (0, express_1.Router)();
// GET /api/folders
// Fetch all virtual folders
router.get('/', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const folders = yield VirtualFolderRepository_1.virtualFolderRepository.findAll();
    res.json({ success: true, data: folders });
})));
// POST /api/folders
// Create a new virtual folder
router.post('/', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, taskId, userId } = req.body;
    if (!name) {
        res.status(400).json({ success: false, message: 'Folder name is required' });
        return;
    }
    if (!taskId && !userId) {
        res.status(400).json({ success: false, message: 'Either taskId or userId is required' });
        return;
    }
    const folder = yield VirtualFolderRepository_1.virtualFolderRepository.create({
        name,
        taskId: taskId || undefined,
        userId: userId || undefined
    });
    res.status(201).json({ success: true, data: folder, message: 'Folder created successfully' });
})));
// DELETE /api/folders/:id
// Delete a folder and ALL files inside it
router.delete('/:id', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const folder = yield VirtualFolderRepository_1.virtualFolderRepository.findById(id);
    if (!folder) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
    }
    // Completely delete all files inside the folder
    // Note: We use FileUpload directly to delete files. In a real scenario, we might also want to delete from S3, 
    // but the system's existing bulkDelete handles S3 or expects cron job to clean up orphans, or we can just delete docs.
    // Let's check how the system deletes files. Usually fileUploadRepository.delete deletes the S3 object if implemented.
    // We'll fetch files in this folder and delete them using repository.
    const filesInFolder = yield FileUpload_1.FileUpload.find({ folderId: id });
    for (const file of filesInFolder) {
        yield FileUploadRepository_1.fileUploadRepository.delete(file._id.toString());
    }
    yield VirtualFolderRepository_1.virtualFolderRepository.delete(id);
    res.json({ success: true, message: `Folder and ${filesInFolder.length} files deleted completely.` });
})));
exports.default = router;
