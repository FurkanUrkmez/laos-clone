import { prisma } from '../lib/prisma';

export async function listProducts(businessId: string) {
  return prisma.product.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' },
  });
}
