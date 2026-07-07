import { S3Client, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/.env' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-5',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'kampungcetak-storage';

async function checkBucket() {
  try {
    const cmd = new GetBucketLocationCommand({ Bucket: bucketName });
    const res = await s3Client.send(cmd);
    console.log("Bucket location:", res.LocationConstraint);
  } catch (error) {
    console.error("Failed to get bucket location:", error);
  }
}
checkBucket();
