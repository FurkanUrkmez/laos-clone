import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    businessId: string;
  };
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'Yetkilendirme başlığı eksik'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.userId, businessId: payload.businessId };
    next();
  } catch {
    next(new AppError(401, 'Geçersiz veya süresi dolmuş token'));
  }
}
