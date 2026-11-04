import { Router, Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { createHash, randomBytes } from 'crypto';
import path from 'path';
import mongoose from 'mongoose';
import authMiddleware, { authorizeRoles } from '../middlewares/auth.middileware';
import { ProductionStation, ProductionScan } from '../../domain/entities/ProductionStation';
import { productionManifest, productionToken } from '../../shared/utils/productionManifest';

const router = Router();
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
// In Docker only backend/ is copied; the phone assets live in backend/public/production.
const publicPhonePath = path.join(__dirname, '../../../public/production');
const isId = (value: any) => typeof value === 'string' && mongoose.isValidObjectId(value);
const expiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

router.get('/phone', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  res.sendFile(path.join(publicPhonePath, 'index.html'));
});
router.get('/phone/:asset', (req, res) => {
  if (!['phone.js', 'phone.css', 'jsQR.js'].includes(req.params.asset)) { res.sendStatus(404); return; }
  if (req.params.asset === 'jsQR.js') { res.sendFile(require.resolve('jsqr')); return; }
  res.sendFile(path.join(publicPhonePath, req.params.asset));
});

// Pairing credentials are single-use, expire after five minutes and grant scanning only.
router.post('/pair', asyncHandler(async (req, res) => {
  const { stationId, secret, phoneName } = req.body;
  if (!isId(stationId) || typeof secret !== 'string' || !/^[a-f0-9]{64}$/.test(secret)) { res.status(400).json({ message: 'Invalid pairing link' }); return; }
  const deviceSecret = randomBytes(32).toString('hex');
  const station = await ProductionStation.findOneAndUpdate({ _id: stationId, pairingHash: hash(secret), pairingExpiresAt: { $gt: new Date() } }, {
    $set: { deviceHash: hash(deviceSecret), phoneName: String(phoneName || 'Staff phone').slice(0, 80), deviceApproved: false, phoneSeenAt: new Date() },
    $unset: { pairingHash: 1, pairingExpiresAt: 1 },
  }, { new: true });
  if (!station) { res.status(410).json({ message: 'Pairing link expired or already used. Generate a new link on the PC.' }); return; }
  res.json({ stationId: String(station._id), stationName: station.name, deviceSecret, approved: false });
}));

const phoneAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.get('X-Station-ID');
  const secret = req.get('X-Phone-Key');
  if (!isId(id) || !secret || !/^[a-f0-9]{64}$/.test(secret)) { res.status(401).json({ message: 'Pair this phone again' }); return; }
  const station = await ProductionStation.findOneAndUpdate({ _id: id, deviceHash: hash(secret) }, { $set: { phoneSeenAt: new Date() } }, { new: true });
  if (!station) { res.status(401).json({ message: 'Phone unpaired. Pair again on the PC.' }); return; }
  (req as any).station = station;
  next();
});
router.get('/phone-status', phoneAuth, (req, res) => {
  const station = (req as any).station;
  res.json({ stationName: station.name, approved: station.deviceApproved, pcOnline: !!station.pcSeenAt && Date.now() - station.pcSeenAt.getTime() < 15000 });
});
router.post('/scan', phoneAuth, asyncHandler(async (req, res) => {
  const station = (req as any).station;
  if (!station.deviceApproved) { res.status(403).json({ message: 'Approve this phone on the PC first' }); return; }
  const requestId = req.body.requestId;
  const test = req.body.test === true;
  const token = test ? 'TEST' : productionToken(req.body.code);
  if (!token || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{10,80}$/.test(requestId)) { res.status(400).json({ message: 'Scan a valid Shop-Co task QR' }); return; }
  const existing = await ProductionScan.findOne({ stationId: String(station._id), requestId }).read('primary').lean();
  if (existing) { res.json({ id: String(existing._id), status: existing.status }); return; }
  if (await ProductionScan.countDocuments({ stationId: String(station._id), status: 'queued' }).read('primary') >= 100) { res.status(429).json({ message: 'PC queue is full. Check the PC before scanning more jobs.' }); return; }
  const last = await ProductionScan.findOne({ stationId: String(station._id) }).sort({ createdAt: -1 }).read('primary').lean();
  if (last?.requestId === requestId) { res.json({ id: String(last._id), status: last.status }); return; }
  if (last && Date.now() - new Date(last.createdAt).getTime() < 1000) { res.status(429).json({ message: 'Please wait a moment between scans' }); return; }
  try {
    const scan = await ProductionScan.create({ stationId: String(station._id), requestId, token, test, expiresAt: expiry() });
    res.json({ id: String(scan._id), status: scan.status });
  } catch (error: any) {
    if (error.code !== 11000) throw error;
    const scan = await ProductionScan.findOne({ stationId: String(station._id), requestId }).read('primary').lean();
    res.json({ id: String(scan?._id), status: scan?.status });
  }
}));
router.get('/scan/:id', phoneAuth, asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) { res.sendStatus(404); return; }
  const scan = await ProductionScan.findOne({ _id: req.params.id, stationId: String((req as any).station._id) }).read('primary').lean();
  if (!scan) { res.sendStatus(404); return; }
  res.json({ status: scan.status, message: scan.message || 'Waiting for PC' });
}));

router.use(authMiddleware, authorizeRoles('admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'));
router.post('/stations', asyncHandler(async (req, res) => {
  const station = await ProductionStation.create({ ownerId: (req as any).userId, name: String(req.body.name || 'Production PC').slice(0, 80) });
  res.json({ id: String(station._id), name: station.name });
}));

router.use('/stations/:id', asyncHandler(async (req, res, next) => {
  if (!isId(req.params.id)) { res.sendStatus(404); return; }
  const station = await ProductionStation.findOneAndUpdate({ _id: req.params.id, ownerId: (req as any).userId }, { $set: { pcSeenAt: new Date() } }, { new: true });
  if (!station) { res.status(404).json({ message: 'Workstation belongs to another account or was removed' }); return; }
  (req as any).station = station;
  next();
}));
router.get('/stations/:id', (req, res) => {
  const station = (req as any).station;
  res.json({ id: String(station._id), name: station.name, phoneName: station.phoneName || null, approved: station.deviceApproved, phoneOnline: !!station.phoneSeenAt && Date.now() - station.phoneSeenAt.getTime() < 15000 });
});
router.post('/stations/:id/pairing', asyncHandler(async (req, res) => {
  const secret = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await ProductionStation.updateOne({ _id: req.params.id }, { $set: { pairingHash: hash(secret), pairingExpiresAt: expiresAt } });
  res.json({ secret, expiresAt });
}));
router.post('/stations/:id/approve', asyncHandler(async (req, res) => {
  const station = (req as any).station;
  if (!station.deviceHash) { res.status(409).json({ message: 'No phone waiting for approval' }); return; }
  await ProductionStation.updateOne({ _id: station._id, deviceHash: station.deviceHash }, { $set: { deviceApproved: true } });
  res.json({ success: true });
}));
router.delete('/stations/:id/phone', asyncHandler(async (req, res) => {
  await ProductionStation.updateOne({ _id: req.params.id }, { $unset: { deviceHash: 1, phoneName: 1, phoneSeenAt: 1, pairingHash: 1, pairingExpiresAt: 1 }, $set: { deviceApproved: false } });
  res.json({ success: true });
}));
router.get('/stations/:id/scans', asyncHandler(async (req, res) => {
  // Delivery is at least once. The PC persists request IDs before acknowledging.
  const scans = await ProductionScan.find({ stationId: req.params.id, status: 'queued', expiresAt: { $gt: new Date() } }).sort({ createdAt: 1 }).limit(10).read('primary').lean();
  res.json({ scans });
}));
router.post('/stations/:id/scans/:scanId/ack', asyncHandler(async (req, res) => {
  if (!isId(req.params.scanId) || !['received', 'ready', 'error'].includes(req.body.status)) { res.sendStatus(400); return; }
  await ProductionScan.updateOne({ _id: req.params.scanId, stationId: req.params.id }, { $set: { status: req.body.status, message: String(req.body.message || '').slice(0, 250) } });
  res.json({ success: true });
}));
router.get('/manifest/:token', asyncHandler(async (req, res) => {
  const token = productionToken(req.params.token);
  if (!token) { res.status(400).json({ message: 'Invalid task token' }); return; }
  const manifest = await productionManifest(token);
  if (!manifest) { res.status(404).json({ message: 'Task not found or deleted' }); return; }
  res.setHeader('Cache-Control', 'no-store');
  res.json(manifest);
}));
export default router;
