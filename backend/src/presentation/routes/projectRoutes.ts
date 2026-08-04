/**
 * Coded by Harith
 * Kampungcetak (R)
 */
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import { Project } from '../../domain/entities/Project';
import { ProjectShare } from '../../domain/entities/ProjectShare';
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

const hashShareToken = (token: string) => createHash('sha256').update(token).digest('hex');

router.get(
  '/shared/:token/meta',
  asyncHandler(async (req: Request, res: Response) => {
    const share = await ProjectShare.findOne({
      tokenHash: hashShareToken(req.params.token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select('projectId').lean();
    if (!share) {
      res.status(404).json({ success: false, message: 'Project share link not found or expired' });
      return;
    }
    const project = await Project.findById(share.projectId).select('title').lean();
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, data: { title: project.title } });
  })
);

router.get(
  '/shared/:token',
  asyncHandler(async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const share = await ProjectShare.findOne({
      tokenHash: hashShareToken(req.params.token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!share) {
      res.status(404).json({ success: false, message: 'Project share link not found or expired' });
      return;
    }
    const project = await Project.findById(share.projectId);
    if (!project) {
      await share.deleteOne();
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    share.lastAccessedAt = new Date();
    await share.save();
    const data = await withSignedFileUrls(project);
    res.json({
      success: true,
      data: {
        title: data.title,
        description: data.description,
        updatedAt: data.updatedAt,
        files: data.files.map((file: any) => ({
          _id: file._id,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: file.uploadedAt,
          previewUrl: file.previewUrl,
        })),
      },
    });
  })
);

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
    const update: Record<string, any> = {};
    if (typeof req.body.title === 'string') update.title = req.body.title.trim();
    if (typeof req.body.description === 'string') update.description = req.body.description.trim();
    if (Array.isArray(req.body.assigneeIds)) update.assigneeIds = req.body.assigneeIds.filter((id: unknown) => typeof id === 'string');
    if (req.body.coverFileId === null || typeof req.body.coverFileId === 'string') update.coverFileId = req.body.coverFileId;
    if ('title' in update && !update.title) {
      res.status(400).json({ success: false, message: 'Project title is required' });
      return;
    }
    const existing = await Project.findOne({ _id: req.params.id, deletingAt: null });
    if (existing && update.coverFileId && !existing.files.some(file => file._id?.toString() === update.coverFileId && file.mimetype.startsWith('image/'))) {
      res.status(400).json({ success: false, message: 'Project cover must be an image file in this project' });
      return;
    }
    const project = await Project.findOneAndUpdate({ _id: req.params.id, deletingAt: null }, { $set: update }, { new: true, runValidators: true });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.delete(
  '/:id',
  authorizeRoles('sysadmin', 'admin', 'boss'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { deletingAt: new Date() } },
      { new: true }
    );
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    let failedFileDeletes = 0;
    const keys = project.files.map(file => file.key).filter(Boolean);
    for (let index = 0; index < keys.length; index += 1000) {
      const batch = keys.slice(index, index + 1000);
      try {
        const result = await s3Client.send(new DeleteObjectsCommand({
          Bucket: S3_BUCKET_NAME,
          Delete: { Objects: batch.map(Key => ({ Key })), Quiet: true },
        }));
        failedFileDeletes += result.Errors?.length || 0;
      } catch (error) {
        failedFileDeletes += batch.length;
        console.warn('[ProjectDelete] S3 cleanup failed:', error);
      }
    }
    if (failedFileDeletes > 0) {
      res.status(502).json({
        success: false,
        message: `Could not remove ${failedFileDeletes} project file${failedFileDeletes === 1 ? '' : 's'} from storage. The project was not deleted; please retry.`,
      });
      return;
    }

    await Project.findOneAndDelete({ _id: project._id, deletingAt: { $ne: null } });
    let shareCleanupFailed = false;
    await ProjectShare.deleteMany({ projectId: project._id }).catch(error => {
      shareCleanupFailed = true;
      console.warn('[ProjectDelete] Share-link cleanup failed:', error);
    });
    res.json({
      success: true,
      data: { deletedFiles: keys.length, shareCleanupFailed },
    });
  })
);

router.post(
  '/:id/folders',
  asyncHandler(async (req: Request, res: Response) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const parentFolderId = req.body.parentFolderId || null;
    
    if (!name) {
      res.status(400).json({ success: false, message: 'Folder name is required' });
      return;
    }
    const project = await Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    
    // Validate parentFolderId exists if provided
    if (parentFolderId && !project.folders.some(folder => folder._id?.toString() === parentFolderId)) {
      res.status(400).json({ success: false, message: 'Parent folder not found in this project' });
      return;
    }
    
    // Check nesting level (max 2 levels: root -> level 1 -> level 2)
    if (parentFolderId) {
      const parentFolder = project.folders.find(f => f._id?.toString() === parentFolderId);
      if (parentFolder?.parentFolderId) {
        res.status(400).json({ success: false, message: 'Maximum folder nesting depth (2 levels) reached' });
        return;
      }
    }
    
    project.folders.push({ name, parentFolderId });
    await project.save();
    res.status(201).json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.patch(
  '/:id/folders/:folderId',
  asyncHandler(async (req: Request, res: Response) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const project = await Project.findOne({ _id: req.params.id, deletingAt: null });
    const folder = project?.folders.find(item => item._id?.toString() === req.params.folderId);
    if (!project || !folder) {
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }
    if (!name) {
      res.status(400).json({ success: false, message: 'Folder name is required' });
      return;
    }
    folder.name = name;
    
    // Handle parentFolderId update if provided
    if ('parentFolderId' in req.body) {
      const newParentId = req.body.parentFolderId || null;
      
      // Validate new parent exists
      if (newParentId && !project.folders.some(f => f._id?.toString() === newParentId)) {
        res.status(400).json({ success: false, message: 'Parent folder not found in this project' });
        return;
      }
      
      // Prevent moving folder into itself
      if (newParentId === req.params.folderId) {
        res.status(400).json({ success: false, message: 'Cannot move folder into itself' });
        return;
      }
      
      // Prevent moving folder into its own child (would create circular reference)
      const childFolders = project.folders.filter(f => f.parentFolderId === req.params.folderId);
      if (childFolders.some(child => child._id?.toString() === newParentId)) {
        res.status(400).json({ success: false, message: 'Cannot move folder into its own subfolder' });
        return;
      }
      
      // Check nesting level (max 2 levels)
      if (newParentId) {
        const newParent = project.folders.find(f => f._id?.toString() === newParentId);
        if (newParent?.parentFolderId) {
          res.status(400).json({ success: false, message: 'Maximum folder nesting depth (2 levels) reached' });
          return;
        }
        
        // If this folder has children, it cannot be moved to level 1
        if (childFolders.length > 0) {
          res.status(400).json({ success: false, message: 'Cannot move folder with subfolders to level 2' });
          return;
        }
      }
      
      folder.parentFolderId = newParentId;
    }
    
    await project.save();
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.post(
  '/:id/folders/move',
  asyncHandler(async (req: Request, res: Response) => {
    const folderIds = Array.isArray(req.body.folderIds) ? req.body.folderIds.map(String) : [];
    const targetParentId = req.body.parentFolderId || null;

    if (folderIds.length === 0) {
      res.status(400).json({ success: false, message: 'No folders to move' });
      return;
    }

    const project = await Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Validate each folder exists and cannot be moved into itself
    for (const folderId of folderIds) {
      if (!project.folders.some(f => f._id?.toString() === folderId)) {
        res.status(400).json({ success: false, message: 'Folder not found in this project' });
        return;
      }
      if (targetParentId === folderId) {
        res.status(400).json({ success: false, message: 'Cannot move folder into itself' });
        return;
      }
    }

    // Validate new parent exists
    if (targetParentId && !project.folders.some(f => f._id?.toString() === targetParentId)) {
      res.status(400).json({ success: false, message: 'Parent folder not found in this project' });
      return;
    }

    // Prevent moving folders into their own subfolders (circular reference)
    const childIds = project.folders
      .filter(f => folderIds.includes(f.parentFolderId || ''))
      .map(f => f._id?.toString());
    if (targetParentId && childIds.includes(targetParentId)) {
      res.status(400).json({ success: false, message: 'Cannot move folder into its own subfolder' });
      return;
    }

    // Check nesting level (max 2 levels)
    if (targetParentId) {
      const newParent = project.folders.find(f => f._id?.toString() === targetParentId);
      if (newParent?.parentFolderId) {
        res.status(400).json({ success: false, message: 'Maximum folder nesting depth (2 levels) reached' });
        return;
      }

      // Folders that have subfolders cannot be moved to level 2
      const hasChildren = project.folders.some(f => folderIds.includes(f.parentFolderId || ''));
      if (hasChildren) {
        res.status(400).json({ success: false, message: 'Cannot move folder with subfolders to level 2' });
        return;
      }
    }

    for (const folderId of folderIds) {
      const folder = project.folders.find(f => f._id?.toString() === folderId);
      if (folder) folder.parentFolderId = targetParentId;
    }

    await project.save();
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.delete(
  '/:id/folders/:folderId',
  asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project || !project.folders.some(item => item._id?.toString() === req.params.folderId)) {
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }
    
    // Find all child folders (subfolders of this folder)
    const childFolderIds = project.folders
      .filter(f => f.parentFolderId === req.params.folderId)
      .map(f => f._id?.toString());
    
    // Remove the folder and all its subfolders
    project.folders = project.folders.filter(item => {
      const folderId = item._id?.toString();
      return folderId !== req.params.folderId && !childFolderIds.includes(folderId);
    });
    
    // Move files from deleted folders to project root
    project.files.forEach(file => {
      if (file.folderId === req.params.folderId || childFolderIds.includes(file.folderId)) {
        file.folderId = undefined;
      }
    });
    
    await project.save();
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

router.post(
  '/:id/share',
  asyncHandler(async (req: Request, res: Response) => {
    if (!await Project.exists({ _id: req.params.id, deletingAt: null })) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const share = await ProjectShare.create({
      projectId: req.params.id,
      tokenHash: hashShareToken(token),
      createdBy: (req as any).userId,
      expiresAt,
    });
    if (!await Project.exists({ _id: req.params.id, deletingAt: null })) {
      await share.deleteOne();
      res.status(409).json({ success: false, message: 'Project is being deleted' });
      return;
    }
    res.status(201).json({ success: true, data: { token, expiresAt } });
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
    if (!await Project.exists({ _id: req.params.id, deletingAt: null })) {
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
    const { key, originalName, folderId } = req.body;
    const expectedPrefix = `kampungcetak/projects/${req.params.id}/`;
    if (!key || !key.startsWith(expectedPrefix) || !originalName) {
      res.status(400).json({ success: false, message: 'Invalid project file metadata' });
      return;
    }

    const project = await Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key })).catch(error => {
        console.warn('[ProjectFileRegister] Orphan cleanup failed:', error);
      });
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    if (project.files.some(file => file.key === key)) {
      res.json({ success: true, data: await withSignedFileUrls(project) });
      return;
    }
    if (folderId && !project.folders.some(folder => folder._id?.toString() === folderId)) {
      res.status(400).json({ success: false, message: 'Folder not found in this project' });
      return;
    }

    const object = await s3Client.send(new HeadObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
    const size = object.ContentLength || 0;
    if (size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
      res.status(400).json({ success: false, message: 'Uploaded file is empty or exceeds 200MB' });
      return;
    }
    const newFile = {
      key,
      url: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
      originalName: originalName.toString().slice(0, 255),
      mimetype: object.ContentType || 'application/octet-stream',
      size,
      uploadedBy: (req as any).userId,
      uploadedAt: new Date(),
      folderId: folderId || undefined,
    };
    const updateFilter: Record<string, any> = {
      _id: req.params.id,
      deletingAt: null,
      'files.key': { $ne: key },
    };
    if (folderId) updateFilter['folders._id'] = folderId;
    const updatedProject = await Project.findOneAndUpdate(
      updateFilter,
      { $push: { files: newFile } },
      { new: true, runValidators: true }
    );
    if (!updatedProject) {
      const currentProject = await Project.findOne({ _id: req.params.id, deletingAt: null });
      if (currentProject?.files.some(file => file.key === key)) {
        res.json({ success: true, data: await withSignedFileUrls(currentProject) });
        return;
      }
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key })).catch(error => {
        console.warn('[ProjectFileRegister] Rejected-upload cleanup failed:', error);
      });
      res.status(409).json({ success: false, message: 'Project is being deleted or the selected folder no longer exists' });
      return;
    }
    res.status(201).json({ success: true, data: await withSignedFileUrls(updatedProject) });
  })
);

router.delete(
  '/:id/files/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findOne({ _id: req.params.id, deletingAt: null });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    const file = project.files.find(item => item._id?.toString() === req.params.fileId);
    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: file.key }));
    } catch (error) {
      console.warn('[ProjectFileDelete] S3 cleanup failed:', error);
      res.status(502).json({ success: false, message: 'File could not be removed from storage; please retry' });
      return;
    }
    const update: Record<string, any> = { $pull: { files: { _id: req.params.fileId } } };
    if (project.coverFileId === req.params.fileId) update.$unset = { coverFileId: 1 };
    const updatedProject = await Project.findOneAndUpdate(
      { _id: req.params.id, deletingAt: null, 'files._id': req.params.fileId },
      update,
      { new: true }
    );
    if (!updatedProject) {
      res.status(409).json({ success: false, message: 'Project is being deleted' });
      return;
    }
    res.json({ success: true, data: await withSignedFileUrls(updatedProject) });
  })
);

router.patch(
  '/:id/files/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findOne({ _id: req.params.id, deletingAt: null });
    const file = project?.files.find(item => item._id?.toString() === req.params.fileId);
    if (!project || !file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }
    if (typeof req.body.originalName === 'string') {
      const name = req.body.originalName.trim();
      if (!name) {
        res.status(400).json({ success: false, message: 'File name is required' });
        return;
      }
      file.originalName = name.slice(0, 255);
    }
    if (typeof req.body.notes === 'string') file.notes = req.body.notes.slice(0, 2000);
    if (req.body.folderId === null || typeof req.body.folderId === 'string') {
      if (req.body.folderId && !project.folders.some(folder => folder._id?.toString() === req.body.folderId)) {
        res.status(400).json({ success: false, message: 'Folder not found in this project' });
        return;
      }
      file.folderId = req.body.folderId || undefined;
    }
    await project.save();
    res.json({ success: true, data: await withSignedFileUrls(project) });
  })
);

export default router;
