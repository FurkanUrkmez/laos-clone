import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import {
  computeRedeemBalance,
  getPointsBalance,
  isRewardEligible,
  parseUserIdFromQrValue,
} from './loyaltyCalc';
import type { RedeemInput, ScanInput } from '../validators/adminLoyalty.validators';

async function getUserPointsSums(businessId: string, userId: string) {
  const [earnAgg, redeemAgg] = await Promise.all([
    prisma.loyaltyPointTransaction.aggregate({
      where: { businessId, userId, type: 'EARN' },
      _sum: { points: true },
    }),
    prisma.loyaltyPointTransaction.aggregate({
      where: { businessId, userId, type: 'REDEEM' },
      _sum: { points: true },
    }),
  ]);
  return { earn: earnAgg._sum.points ?? 0, redeem: redeemAgg._sum.points ?? 0 };
}

async function requireBusinessUser(businessId: string, userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, businessId } });
  if (!user) {
    throw new AppError(404, 'Bu işletmeye kayıtlı müşteri bulunamadı');
  }
  return user;
}

export async function scanProduct(businessId: string, input: ScanInput) {
  const userId = parseUserIdFromQrValue(input.qrValue);
  await requireBusinessUser(businessId, userId);

  const product = await prisma.product.findFirst({
    where: { id: input.productId, businessId, isActive: true },
  });
  if (!product) {
    throw new AppError(404, 'Ürün bulunamadı');
  }

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });

  await prisma.loyaltyPointTransaction.create({
    data: {
      userId,
      businessId,
      productId: product.id,
      points: product.pointsReward,
      type: 'EARN',
    },
  });

  const sums = await getUserPointsSums(businessId, userId);
  const pointsBalance = getPointsBalance(sums.earn, sums.redeem);

  return {
    pointsBalance,
    rewardEligible: isRewardEligible(pointsBalance, business.loyaltyTargetCups),
    threshold: business.loyaltyTargetCups,
  };
}

export async function redeemReward(businessId: string, input: RedeemInput) {
  await requireBusinessUser(businessId, input.userId);

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const sums = await getUserPointsSums(businessId, input.userId);
  const currentBalance = getPointsBalance(sums.earn, sums.redeem);
  const newBalance = computeRedeemBalance(currentBalance, business.loyaltyTargetCups);

  await prisma.loyaltyPointTransaction.create({
    data: {
      userId: input.userId,
      businessId,
      points: business.loyaltyTargetCups,
      type: 'REDEEM',
      note: 'Ücretsiz ürün verildi',
    },
  });

  return { pointsBalance: newBalance };
}
