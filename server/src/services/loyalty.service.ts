import { prisma } from '../lib/prisma';
import { getUserPointsSums } from './adminLoyalty.service';
import { getPointsBalance, isRewardEligible } from './loyaltyCalc';

export async function getMyLoyalty(businessId: string, userId: string) {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const sums = await getUserPointsSums(prisma, businessId, userId);
  const pointsBalance = getPointsBalance(sums.earn, sums.redeem);

  return {
    pointsBalance,
    threshold: business.loyaltyTargetCups,
    rewardEligible: isRewardEligible(pointsBalance, business.loyaltyTargetCups),
  };
}
