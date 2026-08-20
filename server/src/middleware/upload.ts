import { randomUUID } from 'crypto';
import path from 'path';
import multer from 'multer';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype]}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    callback(null, Boolean(ALLOWED_MIME_TYPES[file.mimetype]));
  },
}).single('image');
