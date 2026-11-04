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
exports.productionToken = productionToken;
exports.productionManifest = productionManifest;
const crypto_1 = require("crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const Parcel_1 = require("../../domain/entities/Parcel");
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const s3_1 = require("../../infrastructure/config/s3");
function productionToken(value) {
    var _a;
    if (typeof value !== 'string')
        return null;
    const input = value.trim();
    if (/^[a-f0-9]{48}$/i.test(input))
        return input.toLowerCase();
    try {
        const url = new URL(input);
        if (url.protocol !== 'https:' || url.hostname !== 'admin.kampungcetak.com')
            return null;
        const token = (_a = /^\/task-access\/([a-f0-9]{48})\/?$/i.exec(url.pathname)) === null || _a === void 0 ? void 0 : _a[1];
        return (token === null || token === void 0 ? void 0 : token.toLowerCase()) || null;
    }
    catch (_b) {
        return null;
    }
}
function productionManifest(token) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const task = yield Task_1.Task.findOne({ qrToken: token, isDeleted: { $ne: true } }).read('primary').lean();
        if (!task)
            return null;
        const taskId = String(task._id);
        const files = yield FileUpload_1.FileUpload.find({ taskId }).read('primary').lean();
        const byPath = new Map(files.map(file => [file.path, file]));
        const merged = new Map();
        for (const embedded of task.files || []) {
            const record = byPath.get(embedded.url);
            const value = record || { path: embedded.url, originalName: embedded.name, tag: embedded.tag, updatedAt: task.updatedAt };
            if (['for_print', 'draft', 'awb'].includes(value.tag))
                merged.set(value.path, value);
        }
        for (const file of files) {
            if (['for_print', 'draft', 'awb'].includes(file.tag))
                merged.set(file.path, file);
        }
        const result = yield Promise.all([...merged.values()].map((file) => __awaiter(this, void 0, void 0, function* () {
            const identity = String(file._id || (0, crypto_1.createHash)('sha256').update(file.path).digest('hex'));
            const version = `${file.updatedAt ? new Date(file.updatedAt).toISOString() : ''}:${file.size || 0}`;
            return {
                id: identity, version, name: file.originalName || file.filename || 'file', tag: file.tag,
                size: file.size || 0, mimetype: file.mimetype || '', url: yield downloadUrl(file.path),
            };
        })));
        // Platform order numbers are strings, not necessarily Mongo ObjectIds.
        const parcels = task.orderId ? yield Parcel_1.Parcel.find({ orderId: task.orderId, status: { $nin: ['cancelled', 'failed', 'returned', 'delivered'] } }).read('primary').lean() : [];
        const order = task.orderId && mongoose_1.default.isValidObjectId(task.orderId) ? yield order_model_1.default.findById(task.orderId).read('primary').lean() : null;
        const labels = [];
        for (const parcel of parcels) {
            const url = ((_a = parcel.awbUrlsByFormat) === null || _a === void 0 ? void 0 : _a.A6) || ((_b = parcel.awbUrlsByFormat) === null || _b === void 0 ? void 0 : _b.A4) || parcel.awbUrl;
            if (url)
                labels.push({ id: `parcel:${parcel._id}`, version: parcel.trackingNumber || url, name: `${parcel.trackingNumber || parcel._id}.pdf`, url: yield downloadUrl(url), format: ((_c = parcel.awbUrlsByFormat) === null || _c === void 0 ? void 0 : _c.A6) ? 'A6' : 'A4' });
        }
        if (!labels.length && order) {
            const url = ((_d = order.awbUrlsByFormat) === null || _d === void 0 ? void 0 : _d.A6) || ((_e = order.awbUrlsByFormat) === null || _e === void 0 ? void 0 : _e.A4) || order.awbUrl;
            if (url)
                labels.push({ id: `order:${order._id}`, version: order.easyparcelAwb || url, name: `${order.easyparcelAwb || order._id}.pdf`, url: yield downloadUrl(url), format: ((_f = order.awbUrlsByFormat) === null || _f === void 0 ? void 0 : _f.A6) ? 'A6' : 'A4' });
        }
        if (!labels.length) {
            for (const file of result.filter(file => file.tag === 'awb')) {
                labels.push(Object.assign(Object.assign({}, file), { id: `uploaded:${file.id}`, format: null }));
            }
        }
        return {
            task: { id: taskId, title: task.title, orderId: task.orderId || null, customer: task.customerUsername || '', product: task.productName || '', category: task.category || '', status: task.status, lineItems: task.lineItems || [] },
            files: result.filter(file => file.tag !== 'awb'), labels,
            warnings: [!result.some(file => file.tag === 'for_print') ? 'No TO PRINT files' : '', !result.some(file => file.tag === 'draft') ? 'No DRAFT files' : '', !labels.length ? 'AWB unavailable — upload or create the label in Shop-Co' : ''].filter(Boolean),
        };
    });
}
function downloadUrl(value) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = new URL(value);
        const host = url.hostname;
        if (host === `${s3_1.S3_BUCKET_NAME}.s3.ap-southeast-5.amazonaws.com` || host === `${s3_1.S3_BUCKET_NAME}.s3.amazonaws.com`) {
            return (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: decodeURIComponent(url.pathname.slice(1)) }), { expiresIn: 3600 });
        }
        if (url.protocol !== 'https:')
            throw new Error('Production downloads require HTTPS file URLs');
        return value;
    });
}
