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
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const ProductionStation_1 = require("../../domain/entities/ProductionStation");
const productionManifest_1 = require("../../shared/utils/productionManifest");
const router = (0, express_1.Router)();
const hash = (value) => (0, crypto_1.createHash)('sha256').update(value).digest('hex');
// In Docker only backend/ is copied; the phone assets live in backend/public/production.
const publicPhonePath = path_1.default.join(__dirname, '../../../public/production');
const isId = (value) => typeof value === 'string' && mongoose_1.default.isValidObjectId(value);
const expiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
router.get('/phone', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.sendFile(path_1.default.join(publicPhonePath, 'index.html'));
});
router.get('/phone/:asset', (req, res) => {
    if (!['phone.js', 'phone.css', 'jsQR.js'].includes(req.params.asset)) {
        res.sendStatus(404);
        return;
    }
    if (req.params.asset === 'jsQR.js') {
        res.sendFile(require.resolve('jsqr'));
        return;
    }
    res.sendFile(path_1.default.join(publicPhonePath, req.params.asset));
});
// Pairing credentials are single-use, expire after five minutes and grant scanning only.
router.post('/pair', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { stationId, secret, phoneName } = req.body;
    if (!isId(stationId) || typeof secret !== 'string' || !/^[a-f0-9]{64}$/.test(secret)) {
        res.status(400).json({ message: 'Invalid pairing link' });
        return;
    }
    const deviceSecret = (0, crypto_1.randomBytes)(32).toString('hex');
    const station = yield ProductionStation_1.ProductionStation.findOneAndUpdate(Object.assign({ _id: stationId, pairingHash: hash(secret), pairingExpiresAt: { $gt: new Date() } }, (phoneName === 'Telegram bot' ? { deviceHash: { $exists: false } } : {})), {
        $set: { deviceHash: hash(deviceSecret), phoneName: String(phoneName || 'Staff phone').slice(0, 80), deviceApproved: false, phoneSeenAt: new Date() },
        $unset: { pairingHash: 1, pairingExpiresAt: 1 },
    }, { new: true });
    if (!station) {
        res.status(410).json({ message: 'Pairing link expired or already used. Generate a new link on the PC.' });
        return;
    }
    res.json({ stationId: String(station._id), stationName: station.name, deviceSecret, approved: false });
})));
const phoneAuth = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.get('X-Station-ID');
    const secret = req.get('X-Phone-Key');
    if (!isId(id) || !secret || !/^[a-f0-9]{64}$/.test(secret)) {
        res.status(401).json({ message: 'Pair this phone again' });
        return;
    }
    const station = yield ProductionStation_1.ProductionStation.findOneAndUpdate({ _id: id, deviceHash: hash(secret) }, { $set: { phoneSeenAt: new Date() } }, { new: true });
    if (!station) {
        res.status(401).json({ message: 'Phone unpaired. Pair again on the PC.' });
        return;
    }
    req.station = station;
    next();
}));
router.get('/phone-status', phoneAuth, (req, res) => {
    const station = req.station;
    res.json({ stationName: station.name, approved: station.deviceApproved, pcOnline: !!station.pcSeenAt && Date.now() - station.pcSeenAt.getTime() < 15000 });
});
router.post('/scan', phoneAuth, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const station = req.station;
    if (!station.deviceApproved) {
        res.status(403).json({ message: 'Approve this phone on the PC first' });
        return;
    }
    const requestId = req.body.requestId;
    const test = req.body.test === true;
    const token = test ? 'TEST' : (0, productionManifest_1.productionToken)(req.body.code);
    if (!token || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{10,80}$/.test(requestId)) {
        res.status(400).json({ message: 'Scan a valid Shop-Co task QR' });
        return;
    }
    const existing = yield ProductionStation_1.ProductionScan.findOne({ stationId: String(station._id), requestId }).read('primary').lean();
    if (existing) {
        res.json({ id: String(existing._id), status: existing.status });
        return;
    }
    if ((yield ProductionStation_1.ProductionScan.countDocuments({ stationId: String(station._id), status: 'queued' }).read('primary')) >= 100) {
        res.status(429).json({ message: 'PC queue is full. Check the PC before scanning more jobs.' });
        return;
    }
    const last = yield ProductionStation_1.ProductionScan.findOne({ stationId: String(station._id) }).sort({ createdAt: -1 }).read('primary').lean();
    if ((last === null || last === void 0 ? void 0 : last.requestId) === requestId) {
        res.json({ id: String(last._id), status: last.status });
        return;
    }
    if (last && Date.now() - new Date(last.createdAt).getTime() < 1000) {
        res.status(429).json({ message: 'Please wait a moment between scans' });
        return;
    }
    try {
        const scan = yield ProductionStation_1.ProductionScan.create({ stationId: String(station._id), requestId, token, test, expiresAt: expiry() });
        res.json({ id: String(scan._id), status: scan.status });
    }
    catch (error) {
        if (error.code !== 11000)
            throw error;
        const scan = yield ProductionStation_1.ProductionScan.findOne({ stationId: String(station._id), requestId }).read('primary').lean();
        res.json({ id: String(scan === null || scan === void 0 ? void 0 : scan._id), status: scan === null || scan === void 0 ? void 0 : scan.status });
    }
})));
router.get('/scan/:id', phoneAuth, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isId(req.params.id)) {
        res.sendStatus(404);
        return;
    }
    const scan = yield ProductionStation_1.ProductionScan.findOne({ _id: req.params.id, stationId: String(req.station._id) }).read('primary').lean();
    if (!scan) {
        res.sendStatus(404);
        return;
    }
    res.json({ status: scan.status, message: scan.message || 'Waiting for PC' });
})));
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'));
router.post('/stations', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const station = yield ProductionStation_1.ProductionStation.create({ ownerId: req.userId, name: String(req.body.name || 'Production PC').slice(0, 80) });
    res.json({ id: String(station._id), name: station.name });
})));
router.use('/stations/:id', (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isId(req.params.id)) {
        res.sendStatus(404);
        return;
    }
    const station = yield ProductionStation_1.ProductionStation.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: { pcSeenAt: new Date() } }, { new: true });
    if (!station) {
        res.status(404).json({ message: 'Workstation belongs to another account or was removed' });
        return;
    }
    req.station = station;
    next();
})));
router.get('/stations/:id', (req, res) => {
    const station = req.station;
    res.json({ id: String(station._id), name: station.name, phoneName: station.phoneName || null, approved: station.deviceApproved, phoneOnline: !!station.phoneSeenAt && Date.now() - station.phoneSeenAt.getTime() < 15000 });
});
router.post('/stations/:id/pairing', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const secret = (0, crypto_1.randomBytes)(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    yield ProductionStation_1.ProductionStation.updateOne({ _id: req.params.id }, { $set: { pairingHash: hash(secret), pairingExpiresAt: expiresAt } });
    res.json({ secret, expiresAt });
})));
router.post('/stations/:id/approve', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const station = req.station;
    if (!station.deviceHash) {
        res.status(409).json({ message: 'No phone waiting for approval' });
        return;
    }
    yield ProductionStation_1.ProductionStation.updateOne({ _id: station._id, deviceHash: station.deviceHash }, { $set: { deviceApproved: true } });
    res.json({ success: true });
})));
router.delete('/stations/:id/phone', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield ProductionStation_1.ProductionStation.updateOne({ _id: req.params.id }, { $unset: { deviceHash: 1, phoneName: 1, phoneSeenAt: 1, pairingHash: 1, pairingExpiresAt: 1 }, $set: { deviceApproved: false } });
    res.json({ success: true });
})));
router.get('/stations/:id/scans', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Delivery is at least once. The PC persists request IDs before acknowledging.
    const scans = yield ProductionStation_1.ProductionScan.find({ stationId: req.params.id, status: 'queued', expiresAt: { $gt: new Date() } }).sort({ createdAt: 1 }).limit(10).read('primary').lean();
    res.json({ scans });
})));
router.post('/stations/:id/scans/:scanId/ack', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isId(req.params.scanId) || !['received', 'ready', 'error'].includes(req.body.status)) {
        res.sendStatus(400);
        return;
    }
    yield ProductionStation_1.ProductionScan.updateOne({ _id: req.params.scanId, stationId: req.params.id }, { $set: { status: req.body.status, message: String(req.body.message || '').slice(0, 250) } });
    res.json({ success: true });
})));
router.get('/manifest/:token', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, productionManifest_1.productionToken)(req.params.token);
    if (!token) {
        res.status(400).json({ message: 'Invalid task token' });
        return;
    }
    const manifest = yield (0, productionManifest_1.productionManifest)(token);
    if (!manifest) {
        res.status(404).json({ message: 'Task not found or deleted' });
        return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json(manifest);
})));
exports.default = router;
