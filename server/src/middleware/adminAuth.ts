import { NextFunction, Request, Response } from 'express';
import { verifyAdminAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export interface AdminAuthenticatedRequest extends Request {
  adminAuth?: {
    adminUserId: string;
    businessId: string;
  };
}

export function authenticateAdmin(req: AdminAuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'Yetkilendirme başlığı eksik'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAdminAccessToken(token);
    req.adminAuth = { adminUserId: payload.adminUserId, businessId: payload.businessId };
    next();
  } catch {
    next(new AppError(401, 'Geçersiz veya süresi dolmuş token'));
  }
}
