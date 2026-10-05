"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDraftQrPdf = renderDraftQrPdf;
exports.createDraftQrAsset = createDraftQrAsset;
exports.deleteDraftQrCompanions = deleteDraftQrCompanions;
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = require("crypto");
const qrcode_1 = __importDefault(require("qrcode"));
const sharp_1 = __importDefault(require("sharp"));
const pdf_lib_1 = require("pdf-lib");
const s3_1 = require("../../infrastructure/config/s3");
const Task_1 = require("../../domain/entities/Task");
const keyFromUrl = (sourcePath) => {
    const url = new URL(sourcePath);
    if (url.protocol !== 'https:' || !url.hostname.startsWith(`${s3_1.S3_BUCKET_NAME}.s3.`)) {
        throw new Error('Draft source must be in the configured S3 bucket');
    }
    const key = decodeURIComponent(url.pathname.slice(1));
    if (!key.startsWith('kampungcetak/'))
        throw new Error('Invalid draft source key');
    return key;
};
function renderDraftQrPdf(source, targetUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const pdf = yield pdf_lib_1.PDFDocument.load(source);
        const qr = yield qrcode_1.default.toBuffer(targetUrl, {
            type: 'png', width: 600, margin: 2, errorCorrectionLevel: 'M',
            color: { dark: '#000000', light: '#FFFFFFFF' },
        });
        const image = yield pdf.embedPng(qr);
        for (const page of pdf.getPages()) {
            const width = page.getWidth();
            const height = page.getHeight();
            const size = width * 0.19;
            page.drawRectangle({
                x: width * 0.786,
                y: height * (1 - 0.848 - 0.144),
                width: width * 0.203,
                height: height * 0.144,
                color: (0, pdf_lib_1.rgb)(1, 1, 1),
            });
            page.drawImage(image, {
                x: width * 0.795,
                y: height * (1 - 0.853) - size,
                width: size,
                height: size,
            });
        }
        return Buffer.from(yield pdf.save());
    });
}
function createDraftQrAsset(sourcePath, taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const task = yield Task_1.Task.findById(taskId);
        if (!task || task.isDeleted)
            throw new Error('Draft must belong to an active task');
        if (!task.qrToken) {
            task.qrToken = (0, crypto_1.randomBytes)(24).toString('hex');
            yield task.save();
        }
        const sourceKey = keyFromUrl(sourcePath);
        const response = yield s3_1.s3Client.send(new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET_NAME, Key: sourceKey }));
        const body = yield ((_a = response.Body) === null || _a === void 0 ? void 0 : _a.transformToByteArray());
        if (!body)
            throw new Error('Draft file is empty');
        const source = Buffer.from(body);
        const baseUrl = (process.env.FRONTEND_URL || 'https://kampungcetak.com').replace(/\/$/, '');
        const targetUrl = `${baseUrl}/task-access/${task.qrToken}`;
        let output;
        let contentType;
        let extension;
        if (response.ContentType === 'application/pdf' || sourceKey.toLowerCase().endsWith('.pdf')) {
            output = yield renderDraftQrPdf(source, targetUrl);
            contentType = 'application/pdf';
            extension = 'pdf';
        }
        else {
            const metadata = yield (0, sharp_1.default)(source).metadata();
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
            const qr = yield qrcode_1.default.toBuffer(targetUrl, {
                type: 'png', width: size, margin: 2, errorCorrectionLevel: 'M',
                color: { dark: '#000000', light: '#FFFFFFFF' },
            });
            const panelLeft = Math.round(width * 0.786);
            const panelTop = Math.round(height * 0.848);
            const panelWidth = Math.min(Math.round(width * 0.203), width - panelLeft);
            const panelHeight = Math.min(Math.round(height * 0.144), height - panelTop);
            const whitePanel = yield (0, sharp_1.default)({
                create: { width: panelWidth, height: panelHeight, channels: 4, background: '#ffffff' },
            }).png().toBuffer();
            const processed = (0, sharp_1.default)(source)
                .resize({ width, height, fit: 'fill' })
                .composite([{ input: whitePanel, left: panelLeft, top: panelTop }, { input: qr, left, top }]);
            if (metadata.format === 'png') {
                output = yield processed.png().toBuffer();
                contentType = 'image/png';
            }
            else if (metadata.format === 'webp') {
                output = yield processed.webp({ quality: 95 }).toBuffer();
                contentType = 'image/webp';
            }
            else {
                output = yield processed.jpeg({ quality: 95 }).toBuffer();
                contentType = 'image/jpeg';
            }
            extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
        }
        const draftKey = `${sourceKey.replace(/\.[^/.]+$/, '')}-draft-qr.${extension}`;
        yield s3_1.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: s3_1.S3_BUCKET_NAME, Key: draftKey, Body: output, ContentType: contentType,
        }));
        const draftQrPath = new URL(encodeURI(draftKey), `https://${s3_1.S3_BUCKET_NAME}.s3.ap-southeast-5.amazonaws.com/`).toString();
        return { path: draftQrPath, sourcePath, draftQrPath, size: output.length, mimetype: contentType };
    });
}
function deleteDraftQrCompanions(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const companions = new Set([file.sourcePath, file.draftQrPath].filter((path) => Boolean(path && path !== file.path)));
        for (const path of companions)
            yield (0, s3_1.deleteFromS3)(path);
    });
}
