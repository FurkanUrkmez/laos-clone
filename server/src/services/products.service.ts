import { prisma } from '../lib/prisma';

export async function listActiveProducts(businessId: string) {
  const products = await prisma.product.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    include: { category: { select: { name: true } } },
  });
  return products.map(({ category, ...rest }) => ({ ...rest, categoryName: category.name }));
}
