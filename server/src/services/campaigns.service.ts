import { prisma } from '../lib/prisma';
import type { PaginationQuery } from '../validators/pagination.validators';

export async function listActiveCampaigns(businessId: string, { page, limit }: PaginationQuery) {
  // Fetch one extra row to know whether another page exists, without a
  // separate COUNT query.
  const rows = await prisma.campaign.findMany({
    where: { businessId, isActive: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  return { items: rows.slice(0, limit), hasMore };
}
