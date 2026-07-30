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
const AuditLog_1 = require("../../domain/entities/AuditLog");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('sysadmin', 'admin', 'boss'));
router.get('/filters', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [actorRows, actions] = yield Promise.all([
        AuditLog_1.AuditLog.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $ne: [{ $ifNull: ['$actorId', ''] }, ''] },
                            { $concat: ['id:', '$actorId'] },
                            { $concat: ['name:', { $ifNull: ['$actorName', 'Unknown user'] }] },
                        ],
                    },
                    actorName: { $first: { $ifNull: ['$actorName', 'Unknown user'] } },
                    actorRole: { $first: '$actorRole' },
                },
            },
            { $set: { actorSortName: { $toLower: '$actorName' } } },
            { $sort: { actorSortName: 1 } },
        ]),
        AuditLog_1.AuditLog.distinct('action'),
    ]);
    const actors = actorRows.map(row => ({
        value: row._id,
        name: row.actorName,
        role: row.actorRole || 'unknown',
    }));
    res.json({ success: true, data: { actors, actions: actions.sort() } });
})));
router.get('/', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const filter = {};
    if (typeof req.query.action === 'string' && req.query.action)
        filter.action = req.query.action;
    if (typeof req.query.entityType === 'string' && req.query.entityType)
        filter.entityType = req.query.entityType;
    if (typeof req.query.actorRole === 'string' && req.query.actorRole)
        filter.actorRole = req.query.actorRole;
    if (typeof req.query.actor === 'string') {
        if (req.query.actor.startsWith('id:'))
            filter.actorId = req.query.actor.slice(3, 203);
        if (req.query.actor.startsWith('name:'))
            filter.actorName = req.query.actor.slice(5, 205);
    }
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : null;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : null;
    if (from && !Number.isNaN(from.getTime()))
        filter.createdAt = Object.assign(Object.assign({}, filter.createdAt), { $gte: from });
    if (to && !Number.isNaN(to.getTime()))
        filter.createdAt = Object.assign(Object.assign({}, filter.createdAt), { $lte: to });
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
        const q = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
        filter.$or = [{ summary: { $regex: q, $options: 'i' } }, { actorName: { $regex: q, $options: 'i' } }];
    }
    const sortFields = { date: 'createdAt', user: 'actorName', action: 'action' };
    const sortField = sortFields[typeof req.query.sortBy === 'string' ? req.query.sortBy : 'date'] || 'createdAt';
    const sortDirection = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = sortField === 'createdAt'
        ? { createdAt: sortDirection, _id: sortDirection }
        : { [sortField]: sortDirection, createdAt: -1, _id: -1 };
    const logsQuery = AuditLog_1.AuditLog.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean();
    const countQuery = AuditLog_1.AuditLog.countDocuments(filter);
    if (sortField === 'actorName' || filter.actorName) {
        logsQuery.collation({ locale: 'en', strength: 2 });
        countQuery.collation({ locale: 'en', strength: 2 });
    }
    const [logs, total] = yield Promise.all([
        logsQuery,
        countQuery,
    ]);
    res.json({ success: true, data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
})));
exports.default = router;
