"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = void 0;
const AuditLog_1 = require("../../domain/entities/AuditLog");
const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const hiddenRoutes = ['/api/auth', '/api/audit-logs'];
const describeRequest = (req) => {
    var _a, _b, _c, _d, _e;
    const parts = req.path.split('/').filter(Boolean);
    const apiIndex = parts.indexOf('api');
    const entityType = parts[apiIndex + 1] || parts[0] || 'website';
    const entityId = parts.find((part, index) => index > apiIndex + 1 && /^[a-f\d]{24}$/i.test(part));
    const isFile = parts.some(part => ['file', 'files', 'upload', 'upload-url'].includes(part));
    const isStatus = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.status) === 'string' || parts.includes('status');
    const action = req.method === 'DELETE'
        ? (isFile ? 'file_delete' : 'delete')
        : isFile
            ? 'file_add'
            : isStatus
                ? 'status_change'
                : req.method === 'POST' ? 'create' : 'update';
    const label = ((_b = req.body) === null || _b === void 0 ? void 0 : _b.title) || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.fileName) || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.originalName) || ((_e = req.body) === null || _e === void 0 ? void 0 : _e.name) || entityId || entityType;
    return { entityType, entityId, action, summary: `${action.replace(/_/g, ' ')}: ${String(label).slice(0, 300)}` };
};
const auditMiddleware = (req, res, next) => {
    if (!mutatingMethods.has(req.method) || hiddenRoutes.some(route => req.originalUrl.startsWith(route))) {
        next();
        return;
    }
    res.on('finish', () => {
        var _a, _b, _c, _d;
        if (res.statusCode >= 400)
            return;
        const details = describeRequest(req);
        const authReq = req;
        void AuditLog_1.AuditLog.create(Object.assign(Object.assign({}, details), { actorId: authReq.userId, actorName: ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.email) || (authReq.userId ? 'Staff' : 'External user'), actorRole: authReq.role || (authReq.userId ? 'staff' : 'public'), source: authReq.userId ? 'admin' : req.originalUrl.includes('/share') || req.originalUrl.includes('/s/') ? 'public_share' : 'public', metadata: {
                status: typeof ((_c = req.body) === null || _c === void 0 ? void 0 : _c.status) === 'string' ? req.body.status : undefined,
                fileCount: Array.isArray((_d = req.body) === null || _d === void 0 ? void 0 : _d.files) ? req.body.files.length : undefined,
            }, method: req.method, route: req.originalUrl.split('?')[0], ip: req.ip, userAgent: req.get('user-agent') })).catch(error => console.error('[AuditLog] Failed to write:', error.message));
    });
    next();
};
exports.auditMiddleware = auditMiddleware;
