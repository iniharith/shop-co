import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import authMiddilware from '../middlewares/auth.middileware';
import { FileUpload } from '../../domain/entities/FileUpload';
import { FileAnnotation } from '../../domain/entities/FileAnnotation';
import Order from '../../infrastructure/db/models/order.model';
import { canAccessFileAnnotations, isAnnotationStaff, validateImageAnnotations } from '../../shared/utils/fileAnnotations';

const router = Router();
router.use(authMiddilware);
const actor = (req: Request) => ({ userId: (req as any).userId as string, role: (req as any).role as string });

async function accessibleFile(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.fileId)) {
    res.status(400).json({ success: false, message: 'Invalid file ID' });
    return null;
  }
  const file = await FileUpload.findById(req.params.fileId).lean();
  if (!file) {
    res.status(404).json({ success: false, message: 'File not found' });
    return null;
  }
  let ownerId: string | null = null;
  if (!isAnnotationStaff(actor(req).role) && file.userId !== actor(req).userId && mongoose.isValidObjectId(file.orderId)) {
    const order = await Order.findById(file.orderId).select('userId').lean();
    ownerId = (order as any)?.userId?.toString() || null;
  }
  if (!canAccessFileAnnotations(actor(req), file, ownerId)) {
    res.status(403).json({ success: false, message: 'You do not have access to this file' });
    return null;
  }
  if (!file.mimetype?.startsWith('image/') && !/\.(jpe?g|png|gif|webp|heic|heif|tiff?|bmp|avif)$/i.test(file.originalName)) {
    res.status(400).json({ success: false, message: 'Annotations are available for image files' });
    return null;
  }
  return file;
}

// One lightweight request for the editor badges of every file in a task.
router.post('/summaries', asyncHandler(async (req: Request, res: Response) => {
  const { fileIds } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length > 200 || fileIds.some(id => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    res.status(400).json({ success: false, message: 'Invalid file IDs' });
    return;
  }
  const identity = actor(req);
  let ids = fileIds;
  if (!isAnnotationStaff(identity.role)) {
    const orders = await Order.find({ userId: identity.userId }).select('_id').lean();
    const owned = await FileUpload.find({ _id: { $in: fileIds }, $or: [{ userId: identity.userId }, { orderId: { $in: orders.map(order => order._id.toString()) } }] }).select('_id').lean();
    ids = owned.map(file => file._id.toString());
  }
  const layers = await FileAnnotation.find({ fileId: { $in: ids }, 'items.0': { $exists: true } }).select('fileId editorId editorName updatedAt revision').sort({ updatedAt: -1 }).lean();
  const data: Record<string, any[]> = {};
  layers.forEach(layer => { (data[layer.fileId] ||= []).push(layer); });
  res.json({ success: true, data });
}));

router.get('/:fileId', asyncHandler(async (req: Request, res: Response) => {
  if (!await accessibleFile(req, res)) return;
  const layers = await FileAnnotation.find({ fileId: req.params.fileId }).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: layers });
}));

router.put('/:fileId', asyncHandler(async (req: Request, res: Response) => {
  if (!await accessibleFile(req, res)) return;
  let items;
  try { items = validateImageAnnotations(req.body.items); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); return; }
  const revision = req.body.revision;
  if (!Number.isSafeInteger(revision) || revision < 0) {
    res.status(400).json({ success: false, message: 'Invalid annotation revision' });
    return;
  }
  const identity = actor(req);
  // Identity always comes from the authenticated account, never the payload.
  const editorName = (req as any).user?.name || 'User';
  await FileAnnotation.init();
  let saved;
  if (revision === 0) {
    try { saved = await FileAnnotation.create({ fileId: req.params.fileId, editorId: identity.userId, editorName, items, revision: 1 }); }
    catch (error: any) { if (error.code !== 11000) throw error; }
  } else {
    saved = await FileAnnotation.findOneAndUpdate({ fileId: req.params.fileId, editorId: identity.userId, revision }, { $set: { items, editorName }, $inc: { revision: 1 } }, { new: true });
  }
  if (!saved) {
    res.status(409).json({ success: false, message: 'Your annotations changed in another tab. Reload the layer before saving again.' });
    return;
  }
  res.json({ success: true, data: saved });
}));

export default router;
