import { NextFunction, Response } from 'express';
import multer from 'multer';
import { uploadImage } from '../middleware/upload';
import { AppError } from '../utils/AppError';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export function upload(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  uploadImage(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Dosya 5MB\'tan büyük olamaz' : 'Dosya yüklenemedi';
      next(new AppError(400, message));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    if (!req.file) {
      next(new AppError(400, 'Geçerli bir resim dosyası gerekli (jpg, png veya webp)'));
      return;
    }
    // A relative path (not an absolute URL) so each client resolves it
    // against its own configured API host — the admin panel and the
    // mobile app talk to the server on different hosts (localhost vs. the
    // machine's LAN IP), and baking in whichever host performed the
    // upload would break image loading for the other client.
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
}
