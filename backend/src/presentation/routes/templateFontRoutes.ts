import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';
import { TemplateFont } from '../../domain/entities/TemplateFont';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';

const router = Router();
const allowedExtensions = new Set(['woff', 'woff2', 'ttf', 'otf']);
const mimeTypes: Record<string, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    cb(null, allowedExtensions.has(extension));
  },
});

router.use(authMiddilware, authorizeRoles('admin', 'sysadmin', 'boss'));

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const fonts = await TemplateFont.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: fonts });
}));

router.post('/', upload.single('font'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Please upload a .woff, .woff2, .ttf, or .otf font file.' });
    return;
  }

  const extension = req.file.originalname.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.has(extension)) {
    res.status(400).json({ success: false, message: 'Unsupported font format.' });
    return;
  }

  const suppliedFamily = String(req.body.family || '').trim();
  const fallbackFamily = req.file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  const family = (suppliedFamily || fallbackFamily).slice(0, 80);
  if (!family) {
    res.status(400).json({ success: false, message: 'A font family name is required.' });
    return;
  }
  if (await TemplateFont.exists({ family })) {
    res.status(409).json({ success: false, message: 'A font with this family name already exists.' });
    return;
  }

  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `kampungcetak/template-fonts/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
  const mimeType = mimeTypes[extension] || req.file.mimetype || 'application/octet-stream';
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: req.file.buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const region = process.env.AWS_REGION || 'ap-southeast-5';
  const font = await TemplateFont.create({
    name: family,
    family,
    key,
    mimeType,
    url: `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`,
    createdBy: (req as any).userId,
  });
  res.status(201).json({ success: true, data: font });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const font = await TemplateFont.findById(req.params.id);
  if (!font) {
    res.status(404).json({ success: false, message: 'Font not found.' });
    return;
  }
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: font.key }));
  await font.deleteOne();
  res.json({ success: true });
}));

export default router;
