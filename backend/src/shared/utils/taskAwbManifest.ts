import { createHash } from 'crypto';
import { isIP } from 'net';
import mongoose from 'mongoose';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import { Parcel } from '../../domain/entities/Parcel';
import Order from '../../infrastructure/db/models/order.model';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';

export const TASK_AWB_URL_TTL_SECONDS = 300;
const INACTIVE_SHIPMENTS = new Set(['cancelled', 'failed', 'returned', 'delivered']);

export interface TaskAwbDependencies {
  bucket: string;
  findTask: (token: string) => Promise<any>;
  findFiles: (taskId: string) => Promise<any[]>;
  findParcels: (orderId: string) => Promise<any[]>;
  findOrder: (orderId: string) => Promise<any>;
  signS3: (key: string, expiresIn: number) => Promise<string>;
}

const defaults: TaskAwbDependencies = {
  bucket: S3_BUCKET_NAME,
  findTask: token => Task.findOne({ qrToken: token, isDeleted: { $ne: true } })
    .select('_id title status orderId files isDeleted updatedAt').read('primary').lean().exec(),
  findFiles: taskId => FileUpload.find({ taskId })
    .select('path originalName filename tag mimetype size updatedAt').read('primary').lean().exec(),
  findParcels: orderId => Parcel.find({
    orderId, status: { $nin: [...INACTIVE_SHIPMENTS] }, bookingStatus: { $ne: 'failed' },
  }).select('status bookingStatus awbUrl awbUrlsByFormat trackingNumber updatedAt').read('primary').lean().exec(),
  findOrder: orderId => /^[a-f\d]{24}$/i.test(orderId) && mongoose.isValidObjectId(orderId)
    ? Order.findOne({ _id: orderId, isDeleted: { $ne: true } })
      .select('isDeleted orderStatus awbUrl awbUrlsByFormat easyparcelAwb updatedAt').read('primary').lean().exec()
    : Promise.resolve(null),
  signS3: (key, expiresIn) => getSignedUrl(
    s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }), { expiresIn },
  ),
};

export function isTaskAwbToken(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{48}$/i.test(value);
}

// The app fetches these URLs without any staff Authorization header. Only the
// configured bucket can be signed; courier URLs must use public HTTPS hosts.
export async function taskAwbDownloadUrl(
  value: unknown, deps: TaskAwbDependencies, allowCourier = false,
): Promise<string | null> {
  if (typeof value !== 'string') return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
  const host = url.hostname.toLowerCase();
  const bucketHosts = new Set([
    `${deps.bucket}.s3.ap-southeast-5.amazonaws.com`, `${deps.bucket}.s3.amazonaws.com`,
  ]);
  if (bucketHosts.has(host)) {
    let key: string;
    try { key = decodeURIComponent(url.pathname.slice(1)); } catch { return null; }
    if (!key || /[\x00-\x1f\x7f]/.test(key)) return null;
    return deps.signS3(key, TASK_AWB_URL_TTL_SECONDS);
  }
  // Uploaded task files must belong to Shop-Co storage. Existing courier label
  // URLs may live on provider CDNs, so preserve those without signing/fetching.
  if (!allowCourier || !host.includes('.') || isIP(host.replace(/^\[|\]$/g, ''))
      || /(^|\.)(localhost|local|internal|lan|home|test|invalid|example)$/.test(host)
      || host.endsWith('.')) return null;
  return url.toString();
}

function activeShipment(value: any): boolean {
  const status = String(value.status || value.orderStatus || '').toLowerCase();
  return !value.isDeleted && !INACTIVE_SHIPMENTS.has(status) && value.bookingStatus !== 'failed';
}

function labelSource(value: any): { url: unknown; format: string | null } {
  if (value.awbUrlsByFormat?.A6) return { url: value.awbUrlsByFormat.A6, format: 'A6' };
  if (value.awbUrlsByFormat?.A4) return { url: value.awbUrlsByFormat.A4, format: 'A4' };
  if (value.awbUrlsByFormat?.A5) return { url: value.awbUrlsByFormat.A5, format: 'A5' };
  return { url: value.awbUrl, format: null };
}

export async function taskAwbManifest(token: unknown, deps: TaskAwbDependencies = defaults) {
  if (!isTaskAwbToken(token)) return null;
  const task = await deps.findTask(token.toLowerCase());
  if (!task || task.isDeleted) return null;
  const files = await deps.findFiles(String(task._id));
  const labels: { id: string; version: string; name: string; url: string; format: string | null; mimetype: string }[] = [];
  const seen = new Set<string>();
  async function add(source: unknown, name: unknown, format: string | null, mimetype: unknown, updatedAt: unknown, courier: boolean) {
    if (typeof source !== 'string' || seen.has(source)) return;
    const url = await taskAwbDownloadUrl(source, deps, courier);
    if (!url) return;
    seen.add(source);
    labels.push({
      id: createHash('sha256').update(source).digest('hex'),
      version: createHash('sha256').update(`${source}:${String(updatedAt || '')}`).digest('hex'),
      name: typeof name === 'string' && name ? name : 'AWB.pdf',
      url, format, mimetype: typeof mimetype === 'string' ? mimetype : '',
    });
  }
  if (task.orderId) {
    // Platform order numbers are not Mongo ids: parcel lookup always uses the
    // string orderId; only the optional website Order lookup needs an ObjectId.
    const orderId = String(task.orderId);
    const parcels = await deps.findParcels(orderId);
    for (const parcel of parcels.filter(activeShipment)) {
      const source = labelSource(parcel);
      await add(source.url, `${parcel.trackingNumber || 'AWB'}.pdf`, source.format, 'application/pdf', parcel.updatedAt, true);
    }
    if (!labels.length) {
      const order = await deps.findOrder(orderId);
      if (order && activeShipment(order)) {
        const source = labelSource(order);
        await add(source.url, `${order.easyparcelAwb || 'AWB'}.pdf`, source.format, 'application/pdf', order.updatedAt, true);
      }
    }
  }
  if (!labels.length) {
    const byPath = new Map(files.map(file => [file.path, file]));
    const awbFiles = new Map<string, any>();
    for (const embedded of Array.isArray(task.files) ? task.files : []) {
      // A staff tag edit in FileUpload takes priority over the embedded copy.
      const file = byPath.get(embedded.url) || {
        path: embedded.url, originalName: embedded.name, tag: embedded.tag, updatedAt: task.updatedAt,
      };
      if (file.tag === 'awb' && typeof file.path === 'string') awbFiles.set(file.path, file);
    }
    for (const file of files) {
      if (file.tag === 'awb' && typeof file.path === 'string') awbFiles.set(file.path, file);
    }
    for (const file of awbFiles.values()) {
      await add(file.path, file.originalName || file.filename, null, file.mimetype, file.updatedAt, false);
    }
  }
  return { task: { title: typeof task.title === 'string' ? task.title : '', status: typeof task.status === 'string' ? task.status : '' }, labels };
}
