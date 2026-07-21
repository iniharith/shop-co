import { NextFunction, Request, Response } from 'express';
import { AuditLog } from '../../domain/entities/AuditLog';

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const hiddenRoutes = ['/api/auth', '/api/audit-logs'];

const describeRequest = (req: Request) => {
  const parts = req.path.split('/').filter(Boolean);
  const apiIndex = parts.indexOf('api');
  const entityType = parts[apiIndex + 1] || parts[0] || 'website';
  const entityId = parts.find((part, index) => index > apiIndex + 1 && /^[a-f\d]{24}$/i.test(part));
  const isFile = parts.some(part => ['file', 'files', 'upload', 'upload-url'].includes(part));
  const isStatus = typeof req.body?.status === 'string' || parts.includes('status');
  const action = req.method === 'DELETE'
    ? (isFile ? 'file_delete' : 'delete')
    : isFile
      ? 'file_add'
      : isStatus
        ? 'status_change'
        : req.method === 'POST' ? 'create' : 'update';
  const label = req.body?.title || req.body?.fileName || req.body?.originalName || req.body?.name || entityId || entityType;
  return { entityType, entityId, action, summary: `${action.replace(/_/g, ' ')}: ${String(label).slice(0, 300)}` };
};

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!mutatingMethods.has(req.method) || hiddenRoutes.some(route => req.originalUrl.startsWith(route))) {
    next();
    return;
  }
  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    const details = describeRequest(req);
    const authReq = req as any;
    void AuditLog.create({
      ...details,
      actorId: authReq.userId,
      actorName: authReq.user?.name || authReq.user?.email || (authReq.userId ? 'Staff' : 'External user'),
      actorRole: authReq.role || (authReq.userId ? 'staff' : 'public'),
      source: authReq.userId ? 'admin' : req.originalUrl.includes('/share') || req.originalUrl.includes('/s/') ? 'public_share' : 'public',
      metadata: {
        status: typeof req.body?.status === 'string' ? req.body.status : undefined,
        fileCount: Array.isArray(req.body?.files) ? req.body.files.length : undefined,
      },
      method: req.method,
      route: req.originalUrl.split('?')[0],
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(error => console.error('[AuditLog] Failed to write:', error.message));
  });
  next();
};
