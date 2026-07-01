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
exports.deleteFromS3 = exports.S3_BUCKET_NAME = exports.s3Client = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-5',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});
exports.S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'kampungcetak-storage';
const deleteFromS3 = (fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!fileUrl.includes('amazonaws.com'))
            return false;
        // Extract the object key from the S3 URL
        // e.g. https://bucket-name.s3.ap-southeast-1.amazonaws.com/uploads/folder/file.jpg
        const urlObj = new URL(fileUrl);
        // urlObj.pathname has a leading slash, e.g. /uploads/folder/file.jpg
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: exports.S3_BUCKET_NAME,
            Key: key,
        });
        yield exports.s3Client.send(command);
        console.log(`[S3] Deleted file: ${key}`);
        return true;
    }
    catch (error) {
        console.error(`[S3] Failed to delete file from S3:`, error);
        return false;
    }
});
exports.deleteFromS3 = deleteFromS3;
