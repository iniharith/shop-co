import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { timingSafeEqual, randomUUID } from 'crypto';
import mongoose from 'mongoose';
import auth from '../middlewares/auth.middileware';
import { OwnerChatMessage as Message, OwnerChatRoom as Room } from '../../domain/entities/OwnerChat';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';

const router = Router();
const owner = () => process.env.OWNER_CHAT_USER_ID || '';
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const publicMessage = (m: any) => { const { leaseToken, telegramDeliveredAt, ...safe } = m; return safe; };
const handle = (fn: (req: any, res: any) => Promise<any>) => asyncHandler(fn);
router.use((req: any, res, next) => {
  if (!validId(owner()) || !process.env.OWNER_CHAT_BRIDGE_SECRET) { res.status(503).json({ message: 'AI Assistant is not configured yet.' }); return; }
  const expected = Buffer.from(`Bearer ${process.env.OWNER_CHAT_BRIDGE_SECRET}`), actual = Buffer.from(req.headers.authorization || '');
  if (expected.length === actual.length && timingSafeEqual(expected, actual)) { req.ownerChatBridge = true; next(); return; }
  auth(req, res, () => {
    if (String(req.userId) !== owner()) { res.status(403).json({ message: 'This private assistant belongs to the owner.' }); return; }
    next();
  });
});
const bridgeOnly = (req: any, res: any, next: any) => req.ownerChatBridge ? next() : res.status(403).json({ message: 'Worker access required' });
async function transaction(fn: (session: mongoose.ClientSession) => Promise<any>) {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => fn(session)); } finally { await session.endSession(); }
}
async function ensureRoom() { await Room.updateOne({ _id: owner() }, { $setOnInsert: { workerSeenAt: new Date(0) } }, { upsert: true }); }

router.get('/', handle(async (_req, res) => {
  const [messages, room] = await Promise.all([Message.find({ ownerId: owner() }).sort({ createdAt: -1, _id: -1 }).limit(100).lean(), Room.findById(owner()).lean()]);
  res.set('Cache-Control', 'no-store').json({ messages: messages.reverse().map(publicMessage), workerOnline: !!room?.workerSeenAt && Date.now() - new Date(room.workerSeenAt).getTime() < 45000, codexThreadId: room?.codexThreadId || null });
}));
router.post('/messages', handle(async (req, res) => {
  const { text, clientId } = req.body || {};
  if (typeof text !== 'string' || !text.trim() || text.length > 12000 || typeof clientId !== 'string' || !/^[\w:.-]{1,160}$/.test(clientId)) { res.status(400).json({ message: 'Use a message of 1–12,000 characters and a request ID.' }); return; }
  const source = req.ownerChatBridge ? 'telegram' : 'website';
  const key = `${source}:${clientId}`;
  const existing = await Message.findOne({ ownerId: owner(), clientId: key }).lean();
  if (existing) { res.json({ message: publicMessage(existing), duplicate: true }); return; }
  if (await Message.countDocuments({ ownerId: owner(), role: 'user', status: { $in: ['queued', 'running'] } }) >= 20) { res.status(429).json({ message: 'The assistant queue is full. Wait for current requests.' }); return; }
  let result;
  try { result = await Message.create({ ownerId: owner(), clientId: key, role: 'user', source, text: text.trim(), status: 'queued' }); }
  catch (e: any) { if (e.code !== 11000) throw e; result = await Message.findOne({ ownerId: owner(), clientId: key }); }
  res.status(202).json({ message: publicMessage(result!.toObject()), duplicate: false });
}));
router.post('/approvals/:id', handle(async (req, res) => {
  if (!validId(req.params.id) || !['accept', 'decline'].includes(req.body?.decision)) { res.status(400).json({ message: 'Invalid approval' }); return; }
  const result = await transaction(async session => {
    const approval = await Message.findOne({ _id: req.params.id, ownerId: owner(), 'approval.id': { $exists: true }, 'approval.decision': { $exists: false } }).session(session);
    if (!approval) return null;
    const active = await Message.findOne({ _id: approval.parentId, ownerId: owner(), status: 'running' }).session(session);
    const room = await Room.findOne({ _id: owner(), activeMessageId: approval.parentId, leaseUntil: { $gt: new Date() } }).session(session);
    if (!active || !room) return null;
    approval.approval!.decision = req.body.decision; await approval.save({ session }); return approval;
  });
  if (!result) { res.status(409).json({ message: 'Approval expired or already decided.' }); return; }
  res.json({ ok: true });
}));
router.post('/messages/:id/cancel', handle(async (req, res) => {
  if (!validId(req.params.id)) { res.status(400).json({ message: 'Invalid message ID' }); return; }
  await transaction(async session => {
    await Message.updateOne({ _id: req.params.id, ownerId: owner(), role: 'user', status: { $in: ['queued', 'running'] } }, { $set: { status: 'cancelled' } }, { session });
    // Keep the running lease until the worker confirms cancellation or it expires.
  });
  res.json({ ok: true, message: 'Cancellation requested. Check any work already performed before retrying.' });
}));

router.use('/worker', bridgeOnly);
router.post('/worker/heartbeat', handle(async (req, res) => {
  await ensureRoom();
  if (req.body?.messageId) {
    const active = await Message.exists({ _id: req.body.messageId, ownerId: owner(), status: 'running', leaseToken: req.body.leaseToken });
    const changed = active && await Room.updateOne({ _id: owner(), activeMessageId: req.body.messageId, leaseToken: req.body.leaseToken, leaseUntil: { $gt: new Date() } }, { $set: { workerSeenAt: new Date(), leaseUntil: new Date(Date.now() + 45000) } });
    res.json({ active: !!changed && changed.modifiedCount === 1 }); return;
  }
  await Room.updateOne({ _id: owner() }, { $set: { workerSeenAt: new Date() } }); res.json({ ok: true });
}));
router.post('/worker/claim', handle(async (_req, res) => {
  await ensureRoom();
  const job = await transaction(async session => {
    const token = randomUUID(), now = new Date();
    const room = await Room.findOneAndUpdate({ _id: owner(), $or: [{ leaseUntil: null }, { leaseUntil: { $lt: now } }] }, { $set: { leaseToken: token, leaseUntil: new Date(Date.now() + 45000), workerSeenAt: now } }, { new: true, session });
    if (!room) return null;
    if (room.activeMessageId) {
      const stale = await Message.updateOne({ _id: room.activeMessageId, ownerId: owner(), status: 'running' }, { $set: { status: 'failed' } }, { session });
      if (stale.modifiedCount) await Message.updateOne({ ownerId: owner(), clientId: `reply:${room.activeMessageId}` }, { $setOnInsert: { role: 'assistant', source: 'codex', text: 'The PC disconnected before confirming this request. It was not automatically repeated. Check any work already performed before retrying.', status: 'failed', parentId: room.activeMessageId } }, { upsert: true, session });
      // Never re-run a lost job: it might already have printed or changed something.
    }
    const message = await Message.findOneAndUpdate({ ownerId: owner(), role: 'user', status: 'queued' }, { $set: { status: 'running', leaseToken: token } }, { sort: { createdAt: 1, _id: 1 }, new: true, session });
    await Room.updateOne({ _id: owner(), leaseToken: token }, message ? { $set: { activeMessageId: String(message._id) } } : { $unset: { activeMessageId: '', leaseToken: '', leaseUntil: '' } }, { session });
    return message;
  });
  res.json({ job });
}));
async function activeJob(req: any) {
  if (!validId(req.body?.messageId) || typeof req.body?.leaseToken !== 'string') return null;
  const room = await Room.exists({ _id: owner(), activeMessageId: req.body.messageId, leaseToken: req.body.leaseToken, leaseUntil: { $gt: new Date() } });
  return room && Message.findOne({ _id: req.body.messageId, ownerId: owner(), leaseToken: req.body.leaseToken, status: 'running' });
}
router.post('/worker/approval', handle(async (req, res) => {
  if (!await activeJob(req)) { res.status(409).json({ message: 'Job no longer active' }); return; }
  if (typeof req.body.prompt !== 'string' || !req.body.prompt.trim() || req.body.prompt.length > 12000 || typeof req.body.approvalId !== 'string' || req.body.approvalId.length > 100) { res.status(400).json({ message: 'Invalid approval prompt' }); return; }
  const message = await Message.findOneAndUpdate({ ownerId: owner(), clientId: `approval:${req.body.approvalId}` }, { $setOnInsert: { role: 'system', source: 'codex', text: req.body.prompt, status: 'completed', parentId: req.body.messageId, approval: { id: req.body.approvalId } } }, { upsert: true, new: true });
  res.json({ message: publicMessage(message.toObject()) });
}));
router.post('/worker/state', handle(async (req, res) => {
  const active = !!await activeJob(req);
  const approval = validId(req.body.approvalMessageId) ? await Message.findOne({ _id: req.body.approvalMessageId, ownerId: owner(), parentId: req.body.messageId }).lean() : null;
  res.json({ active, decision: approval?.approval?.decision || null });
}));
router.post('/worker/result', handle(async (req, res) => {
  if (!validId(req.body?.messageId) || typeof req.body?.leaseToken !== 'string' || typeof req.body?.text !== 'string' || !req.body.text.trim() || req.body.text.length > 30000) { res.status(400).json({ message: 'Invalid result' }); return; }
  const result = await transaction(async session => {
    const room = await Room.findOne({ _id: owner(), activeMessageId: req.body.messageId, leaseToken: req.body.leaseToken, leaseUntil: { $gt: new Date() } }).session(session);
    const job = await Message.findOne({ _id: req.body.messageId, ownerId: owner(), leaseToken: req.body.leaseToken }).session(session);
    if (!room || !job) return false;
    if (job.status !== 'cancelled') {
      if (job.status !== 'running') return false;
      await Message.updateOne({ _id: job._id }, { $set: { status: req.body.failed ? 'failed' : 'completed' } }, { session });
      await Message.updateOne({ ownerId: owner(), clientId: `reply:${job._id}` }, { $setOnInsert: { role: 'assistant', source: 'codex', text: req.body.text, status: req.body.failed ? 'failed' : 'completed', parentId: String(job._id) } }, { upsert: true, session });
    }
    await Room.updateOne({ _id: owner(), leaseToken: req.body.leaseToken }, { $unset: { activeMessageId: '', leaseToken: '', leaseUntil: '' }, ...(typeof req.body.codexThreadId === 'string' ? { $set: { codexThreadId: req.body.codexThreadId.slice(0, 100) } } : {}) }, { session });
    return true;
  });
  res.status(result ? 200 : 409).json({ ok: !!result });
}));
router.post('/worker/tool', handle(async (req, res) => {
  if (!await activeJob(req)) { res.status(409).json({ message: 'Job no longer active' }); return; }
  if (req.body.operation === 'website_status') { res.json({ result: 'Backend is online and connected to MongoDB.' }); return; }
  const q = req.body.arguments?.query;
  if (req.body.operation !== 'search_tasks' || typeof q !== 'string' || q.trim().length < 2 || q.length > 100) { res.status(400).json({ message: 'Use search_tasks with a query of 2–100 characters.' }); return; }
  const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), regex = { $regex: escaped, $options: 'i' };
  const files = await FileUpload.find({ $or: [{ originalName: regex }, { notes: regex }] }).select('taskId originalName tag createdAt').sort({ createdAt: -1 }).limit(40).lean();
  const ids = files.map(f => f.taskId).filter(validId);
  const tasks = await Task.find({ isDeleted: { $ne: true }, $or: [{ title: regex }, { orderId: regex }, { customerUsername: regex }, { _id: { $in: ids } }] }).select('title status category createdAt updatedAt orderId customerUsername').sort({ updatedAt: -1 }).limit(20).lean();
  res.json({ result: JSON.stringify({ tasks, files: files.filter(f => tasks.some(t => String(t._id) === f.taskId)) }) });
}));
router.get('/relay', bridgeOnly, handle(async (_req, res) => {
  const messages = await Message.find({ ownerId: owner(), telegramDeliveredAt: { $exists: false }, $or: [{ role: 'assistant' }, { role: 'system' }, { role: 'user', source: 'website' }] }).sort({ createdAt: 1, _id: 1 }).limit(10).lean();
  res.json({ messages: messages.map(publicMessage) });
}));
router.post('/relay/:id/delivered', bridgeOnly, handle(async (req, res) => {
  if (!validId(req.params.id)) { res.status(400).json({ message: 'Invalid message ID' }); return; }
  await Message.updateOne({ _id: req.params.id, ownerId: owner() }, { $set: { telegramDeliveredAt: new Date() } }); res.json({ ok: true });
}));
export default router;
