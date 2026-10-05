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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const FileUpload_1 = require("../../domain/entities/FileUpload");
const FileAnnotation_1 = require("../../domain/entities/FileAnnotation");
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const fileAnnotations_1 = require("../../shared/utils/fileAnnotations");
const router = (0, express_1.Router)();
router.use(auth_middileware_1.default);
const actor = (req) => ({ userId: req.userId, role: req.role });
function accessibleFile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!mongoose_1.default.isValidObjectId(req.params.fileId)) {
            res.status(400).json({ success: false, message: 'Invalid file ID' });
            return null;
        }
        const file = yield FileUpload_1.FileUpload.findById(req.params.fileId).lean();
        if (!file) {
            res.status(404).json({ success: false, message: 'File not found' });
            return null;
        }
        let ownerId = null;
        if (!(0, fileAnnotations_1.isAnnotationStaff)(actor(req).role) && file.userId !== actor(req).userId && mongoose_1.default.isValidObjectId(file.orderId)) {
            const order = yield order_model_1.default.findById(file.orderId).select('userId').lean();
            ownerId = ((_a = order === null || order === void 0 ? void 0 : order.userId) === null || _a === void 0 ? void 0 : _a.toString()) || null;
        }
        if (!(0, fileAnnotations_1.canAccessFileAnnotations)(actor(req), file, ownerId)) {
            res.status(403).json({ success: false, message: 'You do not have access to this file' });
            return null;
        }
        if (!((_b = file.mimetype) === null || _b === void 0 ? void 0 : _b.startsWith('image/')) && !/\.(jpe?g|png|gif|webp|heic|heif|tiff?|bmp|avif)$/i.test(file.originalName)) {
            res.status(400).json({ success: false, message: 'Annotations are available for image files' });
            return null;
        }
        return file;
    });
}
// One lightweight request for the editor badges of every file in a task.
router.post('/summaries', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fileIds } = req.body;
    if (!Array.isArray(fileIds) || fileIds.length > 200 || fileIds.some(id => typeof id !== 'string' || !mongoose_1.default.isValidObjectId(id))) {
        res.status(400).json({ success: false, message: 'Invalid file IDs' });
        return;
    }
    const identity = actor(req);
    let ids = fileIds;
    if (!(0, fileAnnotations_1.isAnnotationStaff)(identity.role)) {
        const orders = yield order_model_1.default.find({ userId: identity.userId }).select('_id').lean();
        const owned = yield FileUpload_1.FileUpload.find({ _id: { $in: fileIds }, $or: [{ userId: identity.userId }, { orderId: { $in: orders.map(order => order._id.toString()) } }] }).select('_id').lean();
        ids = owned.map(file => file._id.toString());
    }
    const layers = yield FileAnnotation_1.FileAnnotation.find({ fileId: { $in: ids }, 'items.0': { $exists: true } }).select('fileId editorId editorName updatedAt revision').sort({ updatedAt: -1 }).lean();
    const data = {};
    layers.forEach(layer => { var _a; (data[_a = layer.fileId] || (data[_a] = [])).push(layer); });
    res.json({ success: true, data });
})));
router.get('/:fileId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield accessibleFile(req, res)))
        return;
    const layers = yield FileAnnotation_1.FileAnnotation.find({ fileId: req.params.fileId }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: layers });
})));
router.put('/:fileId', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!(yield accessibleFile(req, res)))
        return;
    let items;
    try {
        items = (0, fileAnnotations_1.validateImageAnnotations)(req.body.items);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
        return;
    }
    const revision = req.body.revision;
    if (!Number.isSafeInteger(revision) || revision < 0) {
        res.status(400).json({ success: false, message: 'Invalid annotation revision' });
        return;
    }
    const identity = actor(req);
    // Identity always comes from the authenticated account, never the payload.
    const editorName = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.name) || 'User';
    yield FileAnnotation_1.FileAnnotation.init();
    let saved;
    if (revision === 0) {
        try {
            saved = yield FileAnnotation_1.FileAnnotation.create({ fileId: req.params.fileId, editorId: identity.userId, editorName, items, revision: 1 });
        }
        catch (error) {
            if (error.code !== 11000)
                throw error;
        }
    }
    else {
        saved = yield FileAnnotation_1.FileAnnotation.findOneAndUpdate({ fileId: req.params.fileId, editorId: identity.userId, revision }, { $set: { items, editorName }, $inc: { revision: 1 } }, { new: true });
    }
    if (!saved) {
        res.status(409).json({ success: false, message: 'Your annotations changed in another tab. Reload the layer before saving again.' });
        return;
    }
    res.json({ success: true, data: saved });
})));
exports.default = router;
