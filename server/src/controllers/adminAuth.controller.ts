import { NextFunction, Request, Response } from 'express';
import { adminLoginSchema, adminRefreshSchema } from '../validators/adminAuth.validators';
import * as adminAuthService from '../services/adminAuth.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminLoginSchema.parse(req.body);
    const result = await adminAuthService.loginAdmin(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = adminRefreshSchema.parse(req.body);
    const result = await adminAuthService.refreshAdminAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response) {
  res.status(204).send();
}

export async function me(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const adminUser = await adminAuthService.getCurrentAdmin(req.adminAuth!.adminUserId);
    res.status(200).json({ adminUser });
  } catch (err) {
    next(err);
  }
}
