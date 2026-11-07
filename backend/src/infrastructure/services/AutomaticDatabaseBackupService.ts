import { randomBytes, randomUUID, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Transform, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Task } from '../../domain/entities/Task';
import { TaskDescriptionRevision } from '../../domain/entities/TaskDescriptionRevision';
import { DatabaseBackup, DatabaseBackupLock } from '../../domain/entities/DatabaseBackup';
import { s3Client, S3_BUCKET_NAME } from '../config/s3';
import { startDatabaseBackup, createDatabaseBackupFilename } from './DatabaseBackupService';

const LOCK_ID = 'full-database-backup';
const LEASE_MS = 45 * 60_000;
export function backupEncryptionKey(): Buffer {
  const key = Buffer.from(process.env.DATABASE_BACKUP_ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('Automatic backup encryption is not configured');
  return key;
}
export function automaticBackupsConfigured(): boolean {
  try { backupEncryptionKey(); return !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY; } catch { return false; }
}
export const backupDay = (now = new Date()) => new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10); // 03:00 Malaysia cutover
export function backupSummary(record: any) {
  return { id: String(record._id), status: record.status, startedAt: record.startedAt, completedAt: record.completedAt, filename: record.filename, bytes: record.bytes, sha256: record.sha256, error: record.error, automatic: !!record.slot };
}

// Capture the descriptions already present when this feature is enabled, including
// soft-deleted tasks. These are snapshots, never invented historical versions.
export async function captureDescriptionBaselines() {
  let operations: any[] = [];
  for await (const task of Task.find({}).select('_id title description updatedAt').lean().cursor()) {
    operations.push({ updateOne: { filter: { taskId: String(task._id), kind: 'baseline' }, update: { $setOnInsert: {
      taskId: String(task._id), taskTitle: task.title || '(untitled)', kind: 'baseline', beforeHtml: task.description || '', afterHtml: task.description || '', actorId: 'system', actorName: 'System snapshot', capturedAt: new Date(), sourceUpdatedAt: task.updatedAt,
    } }, upsert: true } });
    if (operations.length === 100) { await TaskDescriptionRevision.bulkWrite(operations); operations = []; }
  }
  if (operations.length) await TaskDescriptionRevision.bulkWrite(operations);
}

async function performBackup(record: any) {
  let temporary = '', dump: Awaited<ReturnType<typeof startDatabaseBackup>> | undefined;
  try {
    await captureDescriptionBaselines();
    const key = backupEncryptionKey(), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv), hash = createHash('sha256');
    temporary = await fs.mkdtemp(join(tmpdir(), 'shop-co-encrypted-backup-'));
    const encryptedPath = join(temporary, 'archive.enc');
    dump = await startDatabaseBackup(process.env.MONGO_URI || '');
    const hashing = new Transform({ transform(chunk, _encoding, done) { hash.update(chunk); done(null, chunk); } });
    await Promise.all([pipeline(dump.stream, hashing, cipher, createWriteStream(encryptedPath, { mode: 0o600 })), dump.completion]);
    const size = (await fs.stat(encryptedPath)).size;
    if (!size || size >= 5 * 1024 ** 3) throw new Error('Backup archive is empty or exceeds the supported upload size');
    const objectKey = `shop-co/private-backups/v1/${record._id}-${record.owner}.archive.gz.enc`;
    const bucket = process.env.DATABASE_BACKUP_BUCKET || S3_BUCKET_NAME;
    await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: createReadStream(encryptedPath), ContentLength: size,
      ContentType: 'application/octet-stream', ServerSideEncryption: 'AES256', CacheControl: 'private, no-store',
    }), { abortSignal: AbortSignal.timeout(10 * 60_000) });
    // Keep recovery metadata outside MongoDB too: a database loss must not make its archive unreadable.
    const manifest = { schemaVersion: 1, backupId: String(record._id), filename: record.filename, bucket, objectKey, algorithm: 'aes-256-gcm', iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), sha256: hash.digest('hex'), bytes: size, createdAt: new Date().toISOString() };
    await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey + '.json', Body: JSON.stringify(manifest), ContentType: 'application/json', ServerSideEncryption: 'AES256', CacheControl: 'private, no-store' }), { abortSignal: AbortSignal.timeout(60_000) });
    await DatabaseBackup.updateOne({ _id: record._id, owner: record.owner, status: 'running' }, { $set: {
      status: 'completed', completedAt: new Date(), objectKey, bucket, iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), sha256: manifest.sha256, bytes: size,
    }, $unset: { error: '', leaseUntil: '' } });
    console.log('[AutomaticBackup] Completed', String(record._id));
  } catch {
    dump?.cancel();
    await DatabaseBackup.updateOne({ _id: record._id, owner: record.owner }, { $set: { status: 'failed', error: 'Backup did not complete. Check storage access and the server backup tool.' }, $unset: { leaseUntil: '' } });
    console.error('[AutomaticBackup] Failed', String(record._id)); // Never log URI or encryption credentials.
  } finally {
    await DatabaseBackupLock.deleteOne({ _id: LOCK_ID, owner: record.owner });
    if (temporary) await fs.rm(temporary, { recursive: true, force: true }).catch(() => {});
  }
}

export async function queueDatabaseBackup(slot?: string) {
  if (!automaticBackupsConfigured()) throw new Error('Automatic backup storage/encryption is not configured');
  const owner = randomUUID(), startedAt = new Date(), leaseUntil = new Date(Date.now() + LEASE_MS);
  try {
    await DatabaseBackupLock.findOneAndUpdate({ _id: LOCK_ID, leaseUntil: { $lte: startedAt } }, { $set: { owner, leaseUntil } }, { upsert: true, new: true });
  } catch (error: any) { if (error?.code === 11000) throw new Error('A database backup is already running'); throw error; }
  try {
    let record: any = slot ? await DatabaseBackup.findOne({ slot }) : null;
    if (record?.status === 'completed') { await DatabaseBackupLock.deleteOne({ _id: LOCK_ID, owner }); return record; }
    if (record) record = await DatabaseBackup.findByIdAndUpdate(record._id, { $set: { owner, status: 'running', startedAt, leaseUntil }, $unset: { error: '' } }, { new: true });
    else record = await DatabaseBackup.create({ ...(slot ? { slot } : {}), owner, status: 'running', startedAt, leaseUntil, filename: createDatabaseBackupFilename(startedAt) });
    void performBackup(record).catch(() => console.error('[AutomaticBackup] Worker failed; lease will expire safely'));
    return record;
  } catch (error) { await DatabaseBackupLock.deleteOne({ _id: LOCK_ID, owner }); throw error; }
}

export async function openBackupDownload(id: string) {
  const record: any = await DatabaseBackup.findOne({ _id: id, status: 'completed' }).lean();
  if (!record) return null;
  const object = await s3Client.send(new GetObjectCommand({ Bucket: record.bucket, Key: record.objectKey }));
  if (!object.Body) throw new Error('Backup object is unavailable');
  const decipher = createDecipheriv('aes-256-gcm', backupEncryptionKey(), Buffer.from(record.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(record.authTag, 'base64'));
  return { filename: record.filename, sha256: record.sha256, encrypted: object.Body as Readable, decipher };
}

export function startAutomaticDatabaseBackups() {
  if (process.env.AUTO_DATABASE_BACKUPS_ENABLED !== 'true') return;
  const check = async () => {
    if (!automaticBackupsConfigured()) { console.error('[AutomaticBackup] Storage/encryption configuration is missing'); return; }
    const slot = `daily:${backupDay()}`;
    const previous: any = await DatabaseBackup.findOne({ slot }).lean();
    if (previous?.status === 'completed' || (previous?.status === 'failed' && Date.now() - new Date(previous.updatedAt).getTime() < 15 * 60_000)) return;
    try { await queueDatabaseBackup(slot); } catch { /* Another instance/job owns the lease; retry on the next tick. */ }
  };
  void check().catch(() => console.error('[AutomaticBackup] Scheduler check failed'));
  setInterval(() => void check().catch(() => console.error('[AutomaticBackup] Scheduler check failed')), 60_000).unref();
}
