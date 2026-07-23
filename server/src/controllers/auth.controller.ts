import { NextFunction, Request, Response } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '../validators/auth.validators';
import * as authService from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.registerUser(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.loginUser(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response) {
  // Stateless JWT: istemci taraflı token silme yeterli, sunucu tarafında işlem yok.
  res.status(204).send();
}

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.auth!.userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
