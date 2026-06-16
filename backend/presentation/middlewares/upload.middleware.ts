import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const token = req.params.token;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', token);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|ai|psd|svg|webp|tiff|eps/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  if (extname) {
    return cb(null, true);
  }
  cb(new Error('File type not allowed. Allowed: JPG, PNG, GIF, PDF, AI, PSD, SVG, WEBP, TIFF, EPS'));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB per file
}).array('files', 20);
