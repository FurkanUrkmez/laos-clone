import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  businessId: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresInSeconds,
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresInSeconds,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
}

export interface AdminTokenPayload {
  adminUserId: string;
  businessId: string;
}

export function signAdminAccessToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.adminJwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresInSeconds,
  });
}

export function signAdminRefreshToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.adminJwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresInSeconds,
  });
}

export function verifyAdminAccessToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.adminJwtAccessSecret) as AdminTokenPayload;
}

export function verifyAdminRefreshToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.adminJwtRefreshSecret) as AdminTokenPayload;
}
