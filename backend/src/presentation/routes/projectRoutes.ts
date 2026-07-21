/**
 * Coded by Harith
 * Kampungcetak (R)
 */
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { Project } from '../../domain/entities/Project';
import { s3Client, S3_BUCKET_NAME } from '../../infrastructure/config/s3';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';

const router = Router();
const MAX_PROJECT_FILE_SIZE = 200 * 1024 * 1024;
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-5';

const withSignedFileUrls = async (project: any) => {
  const data = typeof project.toObject === 'function' ? project.toObject() : project;
  data.files = await Promise.all((data.files || []).map(async (file: any) => ({
    ...file,
    previewUrl: await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: file.key }),
      { expiresIn: 900 }
    ),
  })));
  return data;
};

router.use(authMiddilware, authorizeRoles('sysadmin', 'admin', 'boss', 'designer'));

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const filter = query
      ? { $or: [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }] }
      : {};
    const projects = await Project.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data: await Promise.all(projects.map(withSignedFileUrls)) });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!title) {
      res.status(400).json({ success: false, message: 'Project title is required' });
      return;
    }
    const authReq = req as any;
    const project = await Project.create({
      title,
      description,
      createdBy: authReq.userId,
      createdByName: authReq.user?.name || authReq.user?.email || '',
    });
    res.status(201).json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const update: Record<string, string> = {};
    if (typeof req.body.title === 'string') update.title = req.body.title.trim();
    if (typeof req.body.description === 'string') update.description = req.body.description.trim();
    if ('title' in update && !update.title) {
      res.status(400).json({ success: false, message: 'Project title is required' });
      return;
    }
    const project = await Project.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.post(
  '/:id/upload-url',
  asyncHandler(async (req: Request, res: Response) => {
    const { filename, contentType, size } = req.body;
    if (!filename || !Number.isFinite(size) || size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
      res.status(400).json({ success: false, message: 'A valid file up to 200MB is required' });
      return;
    }
    if (!await Project.exists({ _id: req.params.id })) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const safeFilename = filename.toString().replace(/[^a-zA-Z0-9.-]/g, '_').slice(-180) || 'file';
    const key = `kampungcetak/projects/${req.params.id}/${Date.now()}-${Math.round(Math.random() * 1E9)}-${safeFilename}`;
    const mimetype = contentType || 'application/octet-stream';
    const command = new PutObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key, ContentType: mimetype });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    res.json({
      success: true,
      signedUrl,
      key,
      fileUrl: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
    });
  })
);

router.post(
  '/:id/files',
  asyncHandler(async (req: Request, res: Response) => {
    const { key, originalName } = req.body;
    const expectedPrefix = `kampungcetak/projects/${req.params.id}/`;
    if (!key || !key.startsWith(expectedPrefix) || !originalName) {
      res.status(400).json({ success: false, message: 'Invalid project file metadata' });
      return;
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    if (project.files.some(file => file.key === key)) {
      res.json({ success: true, data: await withSignedFileUrls(project) });
      return;
    }

    const object = await s3Client.send(new HeadObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
    const size = object.ContentLength || 0;
    if (size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
      res.status(400).json({ success: false, message: 'Uploaded file is empty or exceeds 200MB' });
      return;
    }
    project.files.push({
      key,
      url: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
      originalName: originalName.toString().slice(0, 255),
      mimetype: object.ContentType || 'application/octet-stream',
      size,
      uploadedBy: (req as any).userId,
      uploadedAt: new Date(),
    });
    await project.save();
    res.status(201).json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.delete(
  '/:id/files/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    const file = project.files.find(item => item._id?.toString() === req.params.fileId);
    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }
    project.files = project.files.filter(item => item._id?.toString() !== req.params.fileId);
    await project.save();
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: file.key }));
    } catch (error) {
      console.warn('[ProjectFileDelete] S3 cleanup failed:', error);
    }
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

export default router;
