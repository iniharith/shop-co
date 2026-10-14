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
exports.TASK_AWB_URL_TTL_SECONDS = void 0;
exports.isTaskAwbToken = isTaskAwbToken;
exports.taskAwbDownloadUrl = taskAwbDownloadUrl;
exports.taskAwbManifest = taskAwbManifest;
const crypto_1 = require("crypto");
const net_1 = require("net");
const mongoose_1 = __importDefault(require("mongoose"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const Parcel_1 = require("../../domain/entities/Parcel");
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const s3_1 = require("../../infrastructure/config/s3");
exports.TASK_AWB_URL_TTL_SECONDS = 300;
const INACTIVE_SHIPMENTS = new Set(['cancelled', 'failed', 'returned', 'delivered']);
const defaults = {
    bucket: s3_1.S3_BUCKET_NAME,
    findTask: token => Task_1.Task.findOne({ qrToken: token, isDeleted: { $ne: true } })
        .select('_id title status orderId files isDeleted updatedAt').read('primary').lean().exec(),
    findFiles: taskId => FileUpload_1.FileUpload.find({ taskId })
        .select('path originalName filename tag mimetype size updatedAt').read('primary').lean().exec(),
    findParcels: orderId => Parcel_1.Parcel.find({
        orderId, status: { $nin: [...INACTIVE_SHIPMENTS] }, bookingStatus: { $ne: 'failed' },
    }).select('status bookingStatus awbUrl awbUrlsByFormat trackingNumber updatedAt').read('primary').lean().exec(),
    findOrder: orderId => /^[a-f\d]{24}$/i.test(orderId) && mongoose_1.default.isValidObjectId(orderId)
        ? order_model_1.default.findOne({ _id: orderId, isDeleted: { $ne: true } })
            .select('isDeleted orderStatus awbUrl awbUrlsByFormat easyparcelAwb updatedAt').read('primary').lean().exec()
        : Promise.resolve(null),
    signS3: (key, expiresIn) => (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: key }), { expiresIn }),
};
function isTaskAwbToken(value) {
    return typeof value === 'string' && /^[a-f\d]{48}$/i.test(value);
}
// The app fetches these URLs without any staff Authorization header. Only the
// configured bucket can be signed; courier URLs must use public HTTPS hosts.
function taskAwbDownloadUrl(value_1, deps_1) {
    return __awaiter(this, arguments, void 0, function* (value, deps, allowCourier = false) {
        if (typeof value !== 'string')
            return null;
        let url;
        try {
            url = new URL(value);
        }
        catch (_a) {
            return null;
        }
        if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443'))
            return null;
        const host = url.hostname.toLowerCase();
        const bucketHosts = new Set([
            `${deps.bucket}.s3.ap-southeast-5.amazonaws.com`, `${deps.bucket}.s3.amazonaws.com`,
        ]);
        if (bucketHosts.has(host)) {
            let key;
            try {
                key = decodeURIComponent(url.pathname.slice(1));
            }
            catch (_b) {
                return null;
            }
            if (!key || /[\x00-\x1f\x7f]/.test(key))
                return null;
            return deps.signS3(key, exports.TASK_AWB_URL_TTL_SECONDS);
        }
        // Uploaded task files must belong to Shop-Co storage. Existing courier label
        // URLs may live on provider CDNs, so preserve those without signing/fetching.
        if (!allowCourier || !host.includes('.') || (0, net_1.isIP)(host.replace(/^\[|\]$/g, ''))
            || /(^|\.)(localhost|local|internal|lan|home|test|invalid|example)$/.test(host)
            || host.endsWith('.'))
            return null;
        return url.toString();
    });
}
function activeShipment(value) {
    const status = String(value.status || value.orderStatus || '').toLowerCase();
    return !value.isDeleted && !INACTIVE_SHIPMENTS.has(status) && value.bookingStatus !== 'failed';
}
function labelSource(value) {
    var _a, _b, _c;
    if ((_a = value.awbUrlsByFormat) === null || _a === void 0 ? void 0 : _a.A6)
        return { url: value.awbUrlsByFormat.A6, format: 'A6' };
    if ((_b = value.awbUrlsByFormat) === null || _b === void 0 ? void 0 : _b.A4)
        return { url: value.awbUrlsByFormat.A4, format: 'A4' };
    if ((_c = value.awbUrlsByFormat) === null || _c === void 0 ? void 0 : _c.A5)
        return { url: value.awbUrlsByFormat.A5, format: 'A5' };
    return { url: value.awbUrl, format: null };
}
function taskAwbManifest(token_1) {
    return __awaiter(this, arguments, void 0, function* (token, deps = defaults) {
        if (!isTaskAwbToken(token))
            return null;
        const task = yield deps.findTask(token.toLowerCase());
        if (!task || task.isDeleted)
            return null;
        const files = yield deps.findFiles(String(task._id));
        const labels = [];
        const seen = new Set();
        function add(source, name, format, mimetype, updatedAt, courier) {
            return __awaiter(this, void 0, void 0, function* () {
                if (typeof source !== 'string' || seen.has(source))
                    return;
                const url = yield taskAwbDownloadUrl(source, deps, courier);
                if (!url)
                    return;
                seen.add(source);
                labels.push({
                    id: (0, crypto_1.createHash)('sha256').update(source).digest('hex'),
                    version: (0, crypto_1.createHash)('sha256').update(`${source}:${String(updatedAt || '')}`).digest('hex'),
                    name: typeof name === 'string' && name ? name : 'AWB.pdf',
                    url, format, mimetype: typeof mimetype === 'string' ? mimetype : '',
                });
            });
        }
        if (task.orderId) {
            // Platform order numbers are not Mongo ids: parcel lookup always uses the
            // string orderId; only the optional website Order lookup needs an ObjectId.
            const orderId = String(task.orderId);
            const parcels = yield deps.findParcels(orderId);
            for (const parcel of parcels.filter(activeShipment)) {
                const source = labelSource(parcel);
                yield add(source.url, `${parcel.trackingNumber || 'AWB'}.pdf`, source.format, 'application/pdf', parcel.updatedAt, true);
            }
            if (!labels.length) {
                const order = yield deps.findOrder(orderId);
                if (order && activeShipment(order)) {
                    const source = labelSource(order);
                    yield add(source.url, `${order.easyparcelAwb || 'AWB'}.pdf`, source.format, 'application/pdf', order.updatedAt, true);
                }
            }
        }
        if (!labels.length) {
            const byPath = new Map(files.map(file => [file.path, file]));
            const awbFiles = new Map();
            for (const embedded of Array.isArray(task.files) ? task.files : []) {
                // A staff tag edit in FileUpload takes priority over the embedded copy.
                const file = byPath.get(embedded.url) || {
                    path: embedded.url, originalName: embedded.name, tag: embedded.tag, updatedAt: task.updatedAt,
                };
                if (file.tag === 'awb' && typeof file.path === 'string')
                    awbFiles.set(file.path, file);
            }
            for (const file of files) {
                if (file.tag === 'awb' && typeof file.path === 'string')
                    awbFiles.set(file.path, file);
            }
            for (const file of awbFiles.values()) {
                yield add(file.path, file.originalName || file.filename, null, file.mimetype, file.updatedAt, false);
            }
        }
        return { task: { title: typeof task.title === 'string' ? task.title : '', status: typeof task.status === 'string' ? task.status : '' }, labels };
    });
}
