import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import {
  signAdminAccessToken,
  signAdminRefreshToken,
  verifyAdminRefreshToken,
} from '../utils/jwt';
import type { AdminUser } from '../generated/prisma/client';
import type { AdminLoginInput } from '../validators/adminAuth.validators';

function toAdminAuthUser(adminUser: AdminUser) {
  const { passwordHash, ...rest } = adminUser;
  return rest;
}

export async function loginAdmin(input: AdminLoginInput) {
  const adminUser = await prisma.adminUser.findUnique({ where: { email: input.email } });
  if (!adminUser) {
    throw new AppError(401, 'E-posta veya şifre hatalı');
  }

  const passwordMatches = await bcrypt.compare(input.password, adminUser.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'E-posta veya şifre hatalı');
  }

  const tokens = {
    accessToken: signAdminAccessToken({ adminUserId: adminUser.id, businessId: adminUser.businessId }),
    refreshToken: signAdminRefreshToken({ adminUserId: adminUser.id, businessId: adminUser.businessId }),
  };

  return { adminUser: toAdminAuthUser(adminUser), tokens };
}

export async function refreshAdminAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyAdminRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Geçersiz veya süresi dolmuş refresh token');
  }

  const adminUser = await prisma.adminUser.findUnique({ where: { id: payload.adminUserId } });
  if (!adminUser) {
    throw new AppError(401, 'Kullanıcı bulunamadı');
  }

  const accessToken = signAdminAccessToken({
    adminUserId: adminUser.id,
    businessId: adminUser.businessId,
  });
  return { accessToken };
}

export async function getCurrentAdmin(adminUserId: string) {
  const adminUser = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!adminUser) {
    throw new AppError(404, 'Kullanıcı bulunamadı');
  }
  return toAdminAuthUser(adminUser);
}
