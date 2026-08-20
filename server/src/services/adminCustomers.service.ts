import { prisma } from '../lib/prisma';
import { getPointsBalance } from './loyaltyCalc';

export async function listCustomers(businessId: string) {
  const [users, sums] = await Promise.all([
    prisma.user.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } }),
    prisma.loyaltyPointTransaction.groupBy({
      by: ['userId', 'type'],
      where: { businessId },
      _sum: { points: true },
    }),
  ]);

  const balanceMap = new Map<string, { earn: number; redeem: number }>();
  for (const row of sums) {
    const entry = balanceMap.get(row.userId) ?? { earn: 0, redeem: 0 };
    if (row.type === 'EARN') {
      entry.earn += row._sum.points ?? 0;
    } else {
      entry.redeem += row._sum.points ?? 0;
    }
    balanceMap.set(row.userId, entry);
  }

  return users.map((user) => {
    const entry = balanceMap.get(user.id) ?? { earn: 0, redeem: 0 };
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      loyaltyCode: user.loyaltyCode,
      pointsBalance: getPointsBalance(entry.earn, entry.redeem),
      createdAt: user.createdAt,
    };
  });
}
