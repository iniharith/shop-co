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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.descriptionText = descriptionText;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const events_1 = require("events");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const Task_1 = require("../../domain/entities/Task");
const TaskDescriptionRevision_1 = require("../../domain/entities/TaskDescriptionRevision");
function descriptionText(value) {
    return String(value || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(div|p|li|tr)>/gi, '\n').replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
}
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss', 'designer', 'production', 'packaging', 'awapparel'));
router.use((req, res, next) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id || '')) {
        res.status(400).json({ message: 'Invalid task ID' });
        return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    next();
});
function taskContext(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = yield Task_1.Task.findById(id).select('title description isDeleted activities').read('primary').lean();
        const last = !task ? yield TaskDescriptionRevision_1.TaskDescriptionRevision.findOne({ taskId: id }).sort({ _id: -1 }).lean() : null;
        if (!task && !last)
            return null;
        return { taskId: id, taskTitle: (task === null || task === void 0 ? void 0 : task.title) || last.taskTitle, taskDeleted: !task || !!task.isDeleted,
            currentHtml: task ? (task.description || '') : null, currentText: task ? descriptionText(task.description || '') : null,
            legacy: ((task === null || task === void 0 ? void 0 : task.activities) || []).filter((a) => a.action === 'changed description' && String(a.details || '').startsWith('from "')).map((a) => ({ actorName: a.userName, capturedAt: a.createdAt, details: a.details, truncated: true })),
            historicalLimit: 'Older activity entries saved only 80 characters per version. Their missing text cannot be reconstructed. Full revisions below are stored separately and survive task deletion.' };
    });
}
const readable = (revision) => (Object.assign(Object.assign({}, revision), { beforeText: descriptionText(revision.beforeHtml), afterText: descriptionText(revision.afterHtml) }));
router.get('/export', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c, _d, e_2, _e, _f;
    var _g;
    const context = yield taskContext(req.params.id);
    if (!context) {
        res.status(404).json({ message: 'Task history not found' });
        return;
    }
    const filename = `task-${req.params.id}-description-history`;
    const cursor = TaskDescriptionRevision_1.TaskDescriptionRevision.find({ taskId: req.params.id }).sort({ capturedAt: 1, _id: 1 }).lean().cursor();
    const write = (text) => __awaiter(void 0, void 0, void 0, function* () { if (res.destroyed)
        throw new Error('Download disconnected'); if (!res.write(text))
        yield (0, events_1.once)(res, 'drain'); });
    try {
        if (req.query.format === 'text') {
            res.attachment(filename + '.txt').type('text/plain; charset=utf-8');
            yield write([context.taskTitle, `Task ID: ${context.taskId}`, context.historicalLimit, '', 'CURRENT DESCRIPTION', (_g = context.currentText) !== null && _g !== void 0 ? _g : '(Task permanently deleted; see saved revisions.)', '', 'FULL SAVED REVISIONS', 'Times below are Malaysia time.', ''].join('\n'));
            const date = (value) => new Date(value).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'medium' });
            try {
                for (var _h = true, cursor_1 = __asyncValues(cursor), cursor_1_1; cursor_1_1 = yield cursor_1.next(), _a = cursor_1_1.done, !_a; _h = true) {
                    _c = cursor_1_1.value;
                    _h = false;
                    const entry = _c;
                    const r = readable(entry);
                    yield write(['', `${date(r.capturedAt)} MYT | ${r.actorName} | ${r.kind}`, 'BEFORE:', r.beforeText, 'AFTER:', r.afterText, ''].join('\n'));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_h && !_a && (_b = cursor_1.return)) yield _b.call(cursor_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            yield write(['', 'OLDER PARTIAL ACTIVITY RECORDS', ...context.legacy.flatMap((r) => ['', `${date(r.capturedAt)} MYT | ${r.actorName} | TRUNCATED AT SOURCE`, r.details])].join('\n'));
            res.end();
        }
        else {
            res.attachment(filename + '.json').type('application/json');
            const header = JSON.stringify(Object.assign({ schemaVersion: 1, exportedAt: new Date().toISOString() }, context));
            yield write(header.slice(0, -1) + ',"revisions":[');
            let first = true;
            try {
                for (var _j = true, cursor_2 = __asyncValues(cursor), cursor_2_1; cursor_2_1 = yield cursor_2.next(), _d = cursor_2_1.done, !_d; _j = true) {
                    _f = cursor_2_1.value;
                    _j = false;
                    const entry = _f;
                    yield write((first ? '' : ',') + JSON.stringify(readable(entry)));
                    first = false;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_j && !_d && (_e = cursor_2.return)) yield _e.call(cursor_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            res.end(']}');
        }
    }
    finally {
        yield cursor.close();
    }
})));
router.get('/', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.query.before && !/^[a-f\d]{24}$/i.test(String(req.query.before))) {
        res.status(400).json({ message: 'Invalid history cursor' });
        return;
    }
    const context = yield taskContext(req.params.id);
    if (!context) {
        res.status(404).json({ message: 'Task history not found' });
        return;
    }
    const anchor = req.query.before ? yield TaskDescriptionRevision_1.TaskDescriptionRevision.findOne({ taskId: req.params.id, _id: req.query.before }).select('capturedAt').lean() : null;
    if (req.query.before && !anchor) {
        res.status(400).json({ message: 'History cursor no longer exists' });
        return;
    }
    const query = Object.assign({ taskId: req.params.id }, (anchor ? { $or: [{ capturedAt: { $lt: anchor.capturedAt } }, { capturedAt: anchor.capturedAt, _id: { $lt: anchor._id } }] } : {}));
    const rows = yield TaskDescriptionRevision_1.TaskDescriptionRevision.find(query).sort({ capturedAt: -1, _id: -1 }).limit(21).lean();
    const hasMore = rows.length > 20;
    if (hasMore)
        rows.pop();
    res.json(Object.assign(Object.assign({}, context), { revisions: rows.map(readable), nextCursor: hasMore ? String(rows[rows.length - 1]._id) : null }));
})));
exports.default = router;
