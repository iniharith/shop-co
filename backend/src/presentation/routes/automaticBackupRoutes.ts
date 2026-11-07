import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { pipeline } from 'stream/promises';
import auth, { authorizeRoles } from '../middlewares/auth.middileware';
import { DatabaseBackup } from '../../domain/entities/DatabaseBackup';
import { automaticBackupsConfigured, backupSummary, openBackupDownload, queueDatabaseBackup } from '../../infrastructure/services/AutomaticDatabaseBackupService';

const router = Router();
router.use(auth, authorizeRoles('sysadmin', 'admin', 'boss'));
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
router.get('/', asyncHandler(async (_req, res) => {
  await DatabaseBackup.updateMany({ status: 'running', leaseUntil: { $lte: new Date() } }, { $set: { status: 'failed', error: 'The server stopped before this backup finished. Start another backup.' }, $unset: { leaseUntil: '' } });
  const records = await DatabaseBackup.find({}).sort({ startedAt: -1 }).limit(60).lean();
  res.json({ configured: automaticBackupsConfigured(), enabled: process.env.AUTO_DATABASE_BACKUPS_ENABLED === 'true', schedule: 'Daily at 03:00 Malaysia time; missed runs catch up after restart', retention: 'Backups are retained; no automatic deletion is enabled.', backups: records.map(backupSummary) });
}));
router.post('/', asyncHandler(async (_req, res) => {
  try { res.status(202).json({ backup: backupSummary(await queueDatabaseBackup()) }); }
  catch (error: any) {
    const busy = error?.message === 'A database backup is already running';
    res.status(busy ? 409 : 503).json({ message: busy ? error.message : 'Backup could not start. Check server backup configuration.' });
  }
}));
router.get('/:id/download', asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) { res.status(400).json({ message: 'Invalid backup ID' }); return; }
  const backup = await openBackupDownload(req.params.id);
  if (!backup) { res.status(404).json({ message: 'Completed backup not found' }); return; }
  res.attachment(backup.filename).type('application/gzip');
  res.setHeader('X-Backup-SHA256', backup.sha256);
  try { await pipeline(backup.encrypted, backup.decipher, res); }
  catch { if (!res.headersSent) res.status(500).json({ message: 'Backup download failed integrity verification' }); else res.destroy(); }
}));
export default router;
