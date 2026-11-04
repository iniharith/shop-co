import { createHash } from 'crypto';
import mongoose from 'mongoose';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import { Parcel } from '../../domain/entities/Parcel';
import Order from '../../infrastructure/db/models/order.model';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';

export function productionToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (/^[a-f0-9]{48}$/i.test(input)) return input.toLowerCase();
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.hostname !== 'admin.kampungcetak.com') return null;
    const token = /^\/task-access\/([a-f0-9]{48})\/?$/i.exec(url.pathname)?.[1];
    return token?.toLowerCase() || null;
  } catch { return null; }
}

export async function productionManifest(token: string) {
  const task: any = await Task.findOne({ qrToken: token, isDeleted: { $ne: true } }).read('primary').lean();
  if (!task) return null;
  const taskId = String(task._id);
  const files: any[] = await FileUpload.find({ taskId }).read('primary').lean();
  const byPath = new Map(files.map(file => [file.path, file]));
  const merged = new Map<string, any>();
  for (const embedded of task.files || []) {
    const record = byPath.get(embedded.url);
    const value = record || { path: embedded.url, originalName: embedded.name, tag: embedded.tag, updatedAt: task.updatedAt };
    if (['for_print', 'draft', 'awb'].includes(value.tag)) merged.set(value.path, value);
  }
  for (const file of files) {
    if (['for_print', 'draft', 'awb'].includes(file.tag)) merged.set(file.path, file);
  }
  const result = await Promise.all([...merged.values()].map(async file => {
    const identity = String(file._id || createHash('sha256').update(file.path).digest('hex'));
    const version = `${file.updatedAt ? new Date(file.updatedAt).toISOString() : ''}:${file.size || 0}`;
    return {
      id: identity, version, name: file.originalName || file.filename || 'file', tag: file.tag,
      size: file.size || 0, mimetype: file.mimetype || '', url: await downloadUrl(file.path),
    };
  }));
  // Platform order numbers are strings, not necessarily Mongo ObjectIds.
  const parcels: any[] = task.orderId ? await Parcel.find({ orderId: task.orderId, status: { $nin: ['cancelled', 'failed', 'returned', 'delivered'] } }).read('primary').lean() : [];
  const order: any = task.orderId && mongoose.isValidObjectId(task.orderId) ? await Order.findById(task.orderId).read('primary').lean() : null;
  const labels: any[] = [];
  for (const parcel of parcels) {
    const url = parcel.awbUrlsByFormat?.A6 || parcel.awbUrlsByFormat?.A4 || parcel.awbUrl;
    if (url) labels.push({ id: `parcel:${parcel._id}`, version: parcel.trackingNumber || url, name: `${parcel.trackingNumber || parcel._id}.pdf`, url: await downloadUrl(url), format: parcel.awbUrlsByFormat?.A6 ? 'A6' : 'A4' });
  }
  if (!labels.length && order) {
    const url = order.awbUrlsByFormat?.A6 || order.awbUrlsByFormat?.A4 || order.awbUrl;
    if (url) labels.push({ id: `order:${order._id}`, version: order.easyparcelAwb || url, name: `${order.easyparcelAwb || order._id}.pdf`, url: await downloadUrl(url), format: order.awbUrlsByFormat?.A6 ? 'A6' : 'A4' });
  }
  if (!labels.length) {
    for (const file of result.filter(file => file.tag === 'awb')) {
      labels.push({ ...file, id: `uploaded:${file.id}`, format: null });
    }
  }
  return {
    task: { id: taskId, title: task.title, orderId: task.orderId || null, customer: task.customerUsername || '', product: task.productName || '', category: task.category || '', status: task.status, lineItems: task.lineItems || [] },
    files: result.filter(file => file.tag !== 'awb'), labels,
    warnings: [!result.some(file => file.tag === 'for_print') ? 'No TO PRINT files' : '', !result.some(file => file.tag === 'draft') ? 'No DRAFT files' : '', !labels.length ? 'AWB unavailable — upload or create the label in Shop-Co' : ''].filter(Boolean),
  };
}

async function downloadUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname;
  if (host === `${S3_BUCKET_NAME}.s3.ap-southeast-5.amazonaws.com` || host === `${S3_BUCKET_NAME}.s3.amazonaws.com`) {
    return getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: decodeURIComponent(url.pathname.slice(1)) }), { expiresIn: 3600 });
  }
  if (url.protocol !== 'https:') throw new Error('Production downloads require HTTPS file URLs');
  return value;
}
