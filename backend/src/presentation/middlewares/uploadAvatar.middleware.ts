import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
  api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: Express.Multer.File) => ({
    folder: 'kampungcetak/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
} as any);

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
