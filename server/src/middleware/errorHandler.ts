import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Doğrulama hatası', details: err.flatten() });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Beklenmeyen bir hata oluştu' });
}
