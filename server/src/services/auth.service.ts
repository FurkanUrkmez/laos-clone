import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import type { User } from '../generated/prisma/client';
import type { LoginInput, RegisterInput } from '../validators/auth.validators';

const SALT_ROUNDS = 10;

async function getSingleBusinessId(): Promise<string> {
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) {
    throw new AppError(
      500,
      'İşletme kaydı bulunamadı. Lütfen önce `npm run prisma:seed` komutunu çalıştırın.',
    );
  }
  return business.id;
}

function toAuthUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'Bu e-posta adresi zaten kayıtlı');
  }

  const businessId = await getSingleBusinessId();
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      businessId,
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      phone: input.phone,
      gender: input.gender ?? 'UNSPECIFIED',
      balance: { create: { balance: 0 } },
    },
  });

  const tokens = {
    accessToken: signAccessToken({ userId: user.id, businessId: user.businessId }),
    refreshToken: signRefreshToken({ userId: user.id, businessId: user.businessId }),
  };

  return { user: toAuthUser(user), tokens };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, 'E-posta veya şifre hatalı');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'E-posta veya şifre hatalı');
  }

  const tokens = {
    accessToken: signAccessToken({ userId: user.id, businessId: user.businessId }),
    refreshToken: signRefreshToken({ userId: user.id, businessId: user.businessId }),
  };

  return { user: toAuthUser(user), tokens };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Geçersiz veya süresi dolmuş refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(401, 'Kullanıcı bulunamadı');
  }

  const accessToken = signAccessToken({ userId: user.id, businessId: user.businessId });
  return { accessToken };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'Kullanıcı bulunamadı');
  }
  return toAuthUser(user);
}
