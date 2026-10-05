import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { PDFDocument, rgb } from 'pdf-lib';
import { S3_BUCKET_NAME, deleteFromS3, s3Client } from '../../infrastructure/config/s3';
import { Task } from '../../domain/entities/Task';
import { taskQrUrl } from './taskQrUrl';

export type DraftQrAsset = {
  path: string;
  sourcePath: string;
  draftQrPath: string;
  size: number;
  mimetype: string;
};

const keyFromUrl = (sourcePath: string): string => {
  const url = new URL(sourcePath);
  if (url.protocol !== 'https:' || !url.hostname.startsWith(`${S3_BUCKET_NAME}.s3.`)) {
    throw new Error('Draft source must be in the configured S3 bucket');
  }
  const key = decodeURIComponent(url.pathname.slice(1));
  if (!key.startsWith('kampungcetak/')) throw new Error('Invalid draft source key');
  return key;
};

export async function renderDraftQrPdf(source: Buffer, targetUrl: string): Promise<Buffer> {
  const pdf = await PDFDocument.load(source);
  const qr = await QRCode.toBuffer(targetUrl, {
    type: 'png', width: 600, margin: 2, errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFFFF' },
  });
  const image = await pdf.embedPng(qr);
  for (const page of pdf.getPages()) {
    const width = page.getWidth();
    const height = page.getHeight();
    const size = width * 0.19;
    page.drawRectangle({
      x: width * 0.786,
      y: height * (1 - 0.848 - 0.144),
      width: width * 0.203,
      height: height * 0.144,
      color: rgb(1, 1, 1),
    });
    page.drawImage(image, {
      x: width * 0.795,
      y: height * (1 - 0.853) - size,
      width: size,
      height: size,
    });
  }
  return Buffer.from(await pdf.save());
}

export async function createDraftQrAsset(sourcePath: string, taskId: string): Promise<DraftQrAsset> {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error('Draft must belong to an active task');
  if (!task.qrToken) {
    task.qrToken = randomBytes(24).toString('hex');
    await task.save();
  }

  const sourceKey = keyFromUrl(sourcePath);
  const response = await s3Client.send(new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: sourceKey }));
  const body = await response.Body?.transformToByteArray();
  if (!body) throw new Error('Draft file is empty');
  const source = Buffer.from(body);
  const targetUrl = taskQrUrl(task.qrToken);
  let output: Buffer;
  let contentType: string;
  let extension: string;

  if (response.ContentType === 'application/pdf' || sourceKey.toLowerCase().endsWith('.pdf')) {
    output = await renderDraftQrPdf(source, targetUrl);
    contentType = 'application/pdf';
    extension = 'pdf';
  } else {
    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height || !['jpeg', 'png', 'webp'].includes(metadata.format || '')) {
      throw new Error('Draft QR requires a PDF, JPEG, PNG, or WebP file');
    }

    // The updated A5 reference places the QR beside the footer notes.
    // Upscale tiny previews so the generated QR retains enough pixels to scan.
    const width = Math.max(metadata.width, 1800);
    const height = Math.round(metadata.height * width / metadata.width);
    const size = Math.round(width * 0.19);
    const left = Math.min(Math.round(width * 0.795), width - size);
    const top = Math.min(Math.round(height * 0.853), height - size);
    const qr = await QRCode.toBuffer(targetUrl, {
      type: 'png', width: size, margin: 2, errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFFFF' },
    });

    const panelLeft = Math.round(width * 0.786);
    const panelTop = Math.round(height * 0.848);
    const panelWidth = Math.min(Math.round(width * 0.203), width - panelLeft);
    const panelHeight = Math.min(Math.round(height * 0.144), height - panelTop);
    const whitePanel = await sharp({
      create: { width: panelWidth, height: panelHeight, channels: 4, background: '#ffffff' },
    }).png().toBuffer();

    const processed = sharp(source)
      .resize({ width, height, fit: 'fill' })
      .composite([{ input: whitePanel, left: panelLeft, top: panelTop }, { input: qr, left, top }]);
    if (metadata.format === 'png') {
      output = await processed.png().toBuffer();
      contentType = 'image/png';
    } else if (metadata.format === 'webp') {
      output = await processed.webp({ quality: 95 }).toBuffer();
      contentType = 'image/webp';
    } else {
      output = await processed.jpeg({ quality: 95 }).toBuffer();
      contentType = 'image/jpeg';
    }

    extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
  }
  const draftKey = `${sourceKey.replace(/\.[^/.]+$/, '')}-draft-qr.${extension}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET_NAME, Key: draftKey, Body: output, ContentType: contentType,
  }));
  const draftQrPath = new URL(encodeURI(draftKey), `https://${S3_BUCKET_NAME}.s3.ap-southeast-5.amazonaws.com/`).toString();
  return { path: draftQrPath, sourcePath, draftQrPath, size: output.length, mimetype: contentType };
}

export async function deleteDraftQrCompanions(file: {
  path: string;
  sourcePath?: string;
  draftQrPath?: string;
}): Promise<void> {
  const companions = new Set([file.sourcePath, file.draftQrPath].filter(
    (path): path is string => Boolean(path && path !== file.path)
  ));
  for (const path of companions) await deleteFromS3(path);
}
