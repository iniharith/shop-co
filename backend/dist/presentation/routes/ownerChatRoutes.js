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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const crypto_1 = require("crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const OwnerChat_1 = require("../../domain/entities/OwnerChat");
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const router = (0, express_1.Router)();
const owner = () => process.env.OWNER_CHAT_USER_ID || '';
const validId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const publicMessage = (m) => { const { leaseToken, telegramDeliveredAt } = m, safe = __rest(m, ["leaseToken", "telegramDeliveredAt"]); return safe; };
const handle = (fn) => (0, express_async_handler_1.default)(fn);
router.use((req, res, next) => {
    if (!validId(owner()) || !process.env.OWNER_CHAT_BRIDGE_SECRET) {
        res.status(503).json({ message: 'AI Assistant is not configured yet.' });
        return;
    }
    const expected = Buffer.from(`Bearer ${process.env.OWNER_CHAT_BRIDGE_SECRET}`), actual = Buffer.from(req.headers.authorization || '');
    if (expected.length === actual.length && (0, crypto_1.timingSafeEqual)(expected, actual)) {
        req.ownerChatBridge = true;
        next();
        return;
    }
    (0, auth_middileware_1.default)(req, res, () => {
        if (String(req.userId) !== owner()) {
            res.status(403).json({ message: 'This private assistant belongs to the owner.' });
            return;
        }
        next();
    });
});
const bridgeOnly = (req, res, next) => req.ownerChatBridge ? next() : res.status(403).json({ message: 'Worker access required' });
function transaction(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield mongoose_1.default.startSession();
        try {
            return yield session.withTransaction(() => fn(session));
        }
        finally {
            yield session.endSession();
        }
    });
}
function ensureRoom() {
    return __awaiter(this, void 0, void 0, function* () { yield OwnerChat_1.OwnerChatRoom.updateOne({ _id: owner() }, { $setOnInsert: { workerSeenAt: new Date(0) } }, { upsert: true }); });
}
router.get('/', handle((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [messages, room] = yield Promise.all([OwnerChat_1.OwnerChatMessage.find({ ownerId: owner() }).sort({ createdAt: -1, _id: -1 }).limit(100).lean(), OwnerChat_1.OwnerChatRoom.findById(owner()).lean()]);
    res.set('Cache-Control', 'no-store').json({ messages: messages.reverse().map(publicMessage), workerOnline: !!(room === null || room === void 0 ? void 0 : room.workerSeenAt) && Date.now() - new Date(room.workerSeenAt).getTime() < 45000, codexThreadId: (room === null || room === void 0 ? void 0 : room.codexThreadId) || null });
})));
router.post('/messages', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, clientId } = req.body || {};
    if (typeof text !== 'string' || !text.trim() || text.length > 12000 || typeof clientId !== 'string' || !/^[\w:.-]{1,160}$/.test(clientId)) {
        res.status(400).json({ message: 'Use a message of 1–12,000 characters and a request ID.' });
        return;
    }
    const source = req.ownerChatBridge ? 'telegram' : 'website';
    const key = `${source}:${clientId}`;
    const existing = yield OwnerChat_1.OwnerChatMessage.findOne({ ownerId: owner(), clientId: key }).lean();
    if (existing) {
        res.json({ message: publicMessage(existing), duplicate: true });
        return;
    }
    if ((yield OwnerChat_1.OwnerChatMessage.countDocuments({ ownerId: owner(), role: 'user', status: { $in: ['queued', 'running'] } })) >= 20) {
        res.status(429).json({ message: 'The assistant queue is full. Wait for current requests.' });
        return;
    }
    let result;
    try {
        result = yield OwnerChat_1.OwnerChatMessage.create({ ownerId: owner(), clientId: key, role: 'user', source, text: text.trim(), status: 'queued' });
    }
    catch (e) {
        if (e.code !== 11000)
            throw e;
        result = yield OwnerChat_1.OwnerChatMessage.findOne({ ownerId: owner(), clientId: key });
    }
    res.status(202).json({ message: publicMessage(result.toObject()), duplicate: false });
})));
router.post('/approvals/:id', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!validId(req.params.id) || !['accept', 'decline'].includes((_a = req.body) === null || _a === void 0 ? void 0 : _a.decision)) {
        res.status(400).json({ message: 'Invalid approval' });
        return;
    }
    const result = yield transaction((session) => __awaiter(void 0, void 0, void 0, function* () {
        const approval = yield OwnerChat_1.OwnerChatMessage.findOne({ _id: req.params.id, ownerId: owner(), 'approval.id': { $exists: true }, 'approval.decision': { $exists: false } }).session(session);
        if (!approval)
            return null;
        const active = yield OwnerChat_1.OwnerChatMessage.findOne({ _id: approval.parentId, ownerId: owner(), status: 'running' }).session(session);
        const room = yield OwnerChat_1.OwnerChatRoom.findOne({ _id: owner(), activeMessageId: approval.parentId, leaseUntil: { $gt: new Date() } }).session(session);
        if (!active || !room)
            return null;
        approval.approval.decision = req.body.decision;
        yield approval.save({ session });
        return approval;
    }));
    if (!result) {
        res.status(409).json({ message: 'Approval expired or already decided.' });
        return;
    }
    res.json({ ok: true });
})));
router.post('/messages/:id/cancel', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!validId(req.params.id)) {
        res.status(400).json({ message: 'Invalid message ID' });
        return;
    }
    yield transaction((session) => __awaiter(void 0, void 0, void 0, function* () {
        yield OwnerChat_1.OwnerChatMessage.updateOne({ _id: req.params.id, ownerId: owner(), role: 'user', status: { $in: ['queued', 'running'] } }, { $set: { status: 'cancelled' } }, { session });
        // Keep the running lease until the worker confirms cancellation or it expires.
    }));
    res.json({ ok: true, message: 'Cancellation requested. Check any work already performed before retrying.' });
})));
router.use('/worker', bridgeOnly);
router.post('/worker/heartbeat', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ensureRoom();
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.messageId) {
        const active = yield OwnerChat_1.OwnerChatMessage.exists({ _id: req.body.messageId, ownerId: owner(), status: 'running', leaseToken: req.body.leaseToken });
        const changed = active && (yield OwnerChat_1.OwnerChatRoom.updateOne({ _id: owner(), activeMessageId: req.body.messageId, leaseToken: req.body.leaseToken, leaseUntil: { $gt: new Date() } }, { $set: { workerSeenAt: new Date(), leaseUntil: new Date(Date.now() + 45000) } }));
        res.json({ active: !!changed && changed.modifiedCount === 1 });
        return;
    }
    yield OwnerChat_1.OwnerChatRoom.updateOne({ _id: owner() }, { $set: { workerSeenAt: new Date() } });
    res.json({ ok: true });
})));
router.post('/worker/claim', handle((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureRoom();
    const job = yield transaction((session) => __awaiter(void 0, void 0, void 0, function* () {
        const token = (0, crypto_1.randomUUID)(), now = new Date();
        const room = yield OwnerChat_1.OwnerChatRoom.findOneAndUpdate({ _id: owner(), $or: [{ leaseUntil: null }, { leaseUntil: { $lt: now } }] }, { $set: { leaseToken: token, leaseUntil: new Date(Date.now() + 45000), workerSeenAt: now } }, { new: true, session });
        if (!room)
            return null;
        if (room.activeMessageId) {
            const stale = yield OwnerChat_1.OwnerChatMessage.updateOne({ _id: room.activeMessageId, ownerId: owner(), status: 'running' }, { $set: { status: 'failed' } }, { session });
            if (stale.modifiedCount)
                yield OwnerChat_1.OwnerChatMessage.updateOne({ ownerId: owner(), clientId: `reply:${room.activeMessageId}` }, { $setOnInsert: { role: 'assistant', source: 'codex', text: 'The PC disconnected before confirming this request. It was not automatically repeated. Check any work already performed before retrying.', status: 'failed', parentId: room.activeMessageId } }, { upsert: true, session });
            // Never re-run a lost job: it might already have printed or changed something.
        }
        const message = yield OwnerChat_1.OwnerChatMessage.findOneAndUpdate({ ownerId: owner(), role: 'user', status: 'queued' }, { $set: { status: 'running', leaseToken: token } }, { sort: { createdAt: 1, _id: 1 }, new: true, session });
        yield OwnerChat_1.OwnerChatRoom.updateOne({ _id: owner(), leaseToken: token }, message ? { $set: { activeMessageId: String(message._id) } } : { $unset: { activeMessageId: '', leaseToken: '', leaseUntil: '' } }, { session });
        return message;
    }));
    res.json({ job });
})));
function activeJob(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!validId((_a = req.body) === null || _a === void 0 ? void 0 : _a.messageId) || typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.leaseToken) !== 'string')
            return null;
        const room = yield OwnerChat_1.OwnerChatRoom.exists({ _id: owner(), activeMessageId: req.body.messageId, leaseToken: req.body.leaseToken, leaseUntil: { $gt: new Date() } });
        return room && OwnerChat_1.OwnerChatMessage.findOne({ _id: req.body.messageId, ownerId: owner(), leaseToken: req.body.leaseToken, status: 'running' });
    });
}
router.post('/worker/approval', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield activeJob(req))) {
        res.status(409).json({ message: 'Job no longer active' });
        return;
    }
    if (typeof req.body.prompt !== 'string' || !req.body.prompt.trim() || req.body.prompt.length > 12000 || typeof req.body.approvalId !== 'string' || req.body.approvalId.length > 100) {
        res.status(400).json({ message: 'Invalid approval prompt' });
        return;
    }
    const message = yield OwnerChat_1.OwnerChatMessage.findOneAndUpdate({ ownerId: owner(), clientId: `approval:${req.body.approvalId}` }, { $setOnInsert: { role: 'system', source: 'codex', text: req.body.prompt, status: 'completed', parentId: req.body.messageId, approval: { id: req.body.approvalId } } }, { upsert: true, new: true });
    res.json({ message: publicMessage(message.toObject()) });
})));
router.post('/worker/state', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const active = !!(yield activeJob(req));
    const approval = validId(req.body.approvalMessageId) ? yield OwnerChat_1.OwnerChatMessage.findOne({ _id: req.body.approvalMessageId, ownerId: owner(), parentId: req.body.messageId }).lean() : null;
    res.json({ active, decision: ((_a = approval === null || approval === void 0 ? void 0 : approval.approval) === null || _a === void 0 ? void 0 : _a.decision) || null });
})));
router.post('/worker/result', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!validId((_a = req.body) === null || _a === void 0 ? void 0 : _a.messageId) || typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.leaseToken) !== 'string' || typeof ((_c = req.body) === null || _c === void 0 ? void 0 : _c.text) !== 'string' || !req.body.text.trim() || req.body.text.length > 30000) {
        res.status(400).json({ message: 'Invalid result' });
        return;
    }
    const result = yield transaction((session) => __awaiter(void 0, void 0, void 0, function* () {
        const room = yield OwnerChat_1.OwnerChatRoom.findOne({ _id: owner(), activeMessageId: req.body.messageId, leaseToken: req.body.leaseToken, leaseUntil: { $gt: new Date() } }).session(session);
        const job = yield OwnerChat_1.OwnerChatMessage.findOne({ _id: req.body.messageId, ownerId: owner(), leaseToken: req.body.leaseToken }).session(session);
        if (!room || !job)
            return false;
        if (job.status !== 'cancelled') {
            if (job.status !== 'running')
                return false;
            yield OwnerChat_1.OwnerChatMessage.updateOne({ _id: job._id }, { $set: { status: req.body.failed ? 'failed' : 'completed' } }, { session });
            yield OwnerChat_1.OwnerChatMessage.updateOne({ ownerId: owner(), clientId: `reply:${job._id}` }, { $setOnInsert: { role: 'assistant', source: 'codex', text: req.body.text, status: req.body.failed ? 'failed' : 'completed', parentId: String(job._id) } }, { upsert: true, session });
        }
        yield OwnerChat_1.OwnerChatRoom.updateOne({ _id: owner(), leaseToken: req.body.leaseToken }, Object.assign({ $unset: { activeMessageId: '', leaseToken: '', leaseUntil: '' } }, (typeof req.body.codexThreadId === 'string' ? { $set: { codexThreadId: req.body.codexThreadId.slice(0, 100) } } : {})), { session });
        return true;
    }));
    res.status(result ? 200 : 409).json({ ok: !!result });
})));
router.post('/worker/tool', handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!(yield activeJob(req))) {
        res.status(409).json({ message: 'Job no longer active' });
        return;
    }
    if (req.body.operation === 'website_status') {
        res.json({ result: 'Backend is online and connected to MongoDB.' });
        return;
    }
    const q = (_a = req.body.arguments) === null || _a === void 0 ? void 0 : _a.query;
    if (req.body.operation !== 'search_tasks' || typeof q !== 'string' || q.trim().length < 2 || q.length > 100) {
        res.status(400).json({ message: 'Use search_tasks with a query of 2–100 characters.' });
        return;
    }
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), regex = { $regex: escaped, $options: 'i' };
    const files = yield FileUpload_1.FileUpload.find({ $or: [{ originalName: regex }, { notes: regex }] }).select('taskId originalName tag createdAt').sort({ createdAt: -1 }).limit(40).lean();
    const ids = files.map(f => f.taskId).filter(validId);
    const tasks = yield Task_1.Task.find({ isDeleted: { $ne: true }, $or: [{ title: regex }, { orderId: regex }, { customerUsername: regex }, { _id: { $in: ids } }] }).select('title status category createdAt updatedAt orderId customerUsername').sort({ updatedAt: -1 }).limit(20).lean();
    res.json({ result: JSON.stringify({ tasks, files: files.filter(f => tasks.some(t => String(t._id) === f.taskId)) }) });
})));
router.get('/relay', bridgeOnly, handle((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield OwnerChat_1.OwnerChatMessage.find({ ownerId: owner(), telegramDeliveredAt: { $exists: false }, $or: [{ role: 'assistant' }, { role: 'system' }, { role: 'user', source: 'website' }] }).sort({ createdAt: 1, _id: 1 }).limit(10).lean();
    res.json({ messages: messages.map(publicMessage) });
})));
router.post('/relay/:id/delivered', bridgeOnly, handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!validId(req.params.id)) {
        res.status(400).json({ message: 'Invalid message ID' });
        return;
    }
    yield OwnerChat_1.OwnerChatMessage.updateOne({ _id: req.params.id, ownerId: owner() }, { $set: { telegramDeliveredAt: new Date() } });
    res.json({ ok: true });
})));
exports.default = router;
