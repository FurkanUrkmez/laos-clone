import { prisma } from '../lib/prisma';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../utils/AppError';
import {
  computeRedeemBalance,
  getPointsBalance,
  isRewardEligible,
  parseUserIdFromQrValue,
} from './loyaltyCalc';
import type { RedeemInput, ScanInput } from '../validators/adminLoyalty.validators';

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

export async function getUserPointsSums(
  client: PrismaClientOrTx,
  businessId: string,
  userId: string,
) {
  const [earnAgg, redeemAgg] = await Promise.all([
    client.loyaltyPointTransaction.aggregate({
      where: { businessId, userId, type: 'EARN' },
      _sum: { points: true },
    }),
    client.loyaltyPointTransaction.aggregate({
      where: { businessId, userId, type: 'REDEEM' },
      _sum: { points: true },
    }),
  ]);
  return { earn: earnAgg._sum.points ?? 0, redeem: redeemAgg._sum.points ?? 0 };
}

async function requireBusinessUser(client: PrismaClientOrTx, businessId: string, userId: string) {
  const user = await client.user.findFirst({ where: { id: userId, businessId } });
  if (!user) {
    throw new AppError(404, 'Bu işletmeye kayıtlı müşteri bulunamadı');
  }
  return user;
}

export async function scanProduct(businessId: string, input: ScanInput) {
  const userId = parseUserIdFromQrValue(input.qrValue);
  await requireBusinessUser(prisma, businessId, userId);

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

  const sums = await getUserPointsSums(prisma, businessId, userId);
  const pointsBalance = getPointsBalance(sums.earn, sums.redeem);

  return {
    userId,
    pointsBalance,
    rewardEligible: isRewardEligible(pointsBalance, business.loyaltyTargetCups),
    threshold: business.loyaltyTargetCups,
  };
}

export async function redeemReward(businessId: string, input: RedeemInput) {
  return prisma.$transaction(async (tx) => {
    // Lock the user row so a concurrent redeemReward call for the same user
    // blocks until this transaction commits, preventing a double-spend of
    // the same points balance (see: two simultaneous redeem requests both
    // reading a pre-redemption balance and both passing the threshold check).
    await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${input.userId} FOR UPDATE`;

    await requireBusinessUser(tx, businessId, input.userId);

    const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
    const sums = await getUserPointsSums(tx, businessId, input.userId);
    const currentBalance = getPointsBalance(sums.earn, sums.redeem);
    const newBalance = computeRedeemBalance(currentBalance, business.loyaltyTargetCups);

    await tx.loyaltyPointTransaction.create({
      data: {
        userId: input.userId,
        businessId,
        points: business.loyaltyTargetCups,
        type: 'REDEEM',
        note: 'Ücretsiz ürün verildi',
      },
    });

    return { pointsBalance: newBalance };
  });
}
