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
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });
}
