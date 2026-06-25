import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'kampungcetak-storage';

export const deleteFromS3 = async (fileUrl: string) => {
  try {
    if (!fileUrl.includes('amazonaws.com')) return false;
    
    // Extract the object key from the S3 URL
    // e.g. https://bucket-name.s3.ap-southeast-1.amazonaws.com/uploads/folder/file.jpg
    const urlObj = new URL(fileUrl);
    // urlObj.pathname has a leading slash, e.g. /uploads/folder/file.jpg
    const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
    console.log(`[S3] Deleted file: ${key}`);
    return true;
  } catch (error) {
    console.error(`[S3] Failed to delete file from S3:`, error);
    return false;
  }
};
