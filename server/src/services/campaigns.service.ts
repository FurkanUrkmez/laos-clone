import { prisma } from '../lib/prisma';

export async function listActiveCampaigns(businessId: string) {
  return prisma.campaign.findMany({
    where: { businessId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}
