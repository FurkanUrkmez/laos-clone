import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { CreateProductInput, UpdateProductInput } from '../validators/adminProducts.validators';

export async function listProducts(businessId: string) {
  const products = await prisma.product.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' },
    include: { category: { select: { name: true } } },
  });
  return products.map(({ category, ...rest }) => ({ ...rest, categoryName: category.name }));
}

async function findOrCreateCategory(businessId: string, name: string) {
  const existing = await prisma.category.findFirst({ where: { businessId, name } });
  if (existing) {
    return existing;
  }
  return prisma.category.create({ data: { businessId, name } });
}

export async function createProduct(businessId: string, input: CreateProductInput) {
  const category = await findOrCreateCategory(businessId, input.categoryName);
  return prisma.product.create({
    data: {
      businessId,
      categoryId: category.id,
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      price: input.price,
      pointsReward: input.pointsReward,
      redeemable: input.redeemable ?? true,
      isActive: input.isActive ?? true,
    },
  });
}

async function requireOwnedProduct(businessId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) {
    throw new AppError(404, 'Ürün bulunamadı');
  }
  return product;
}

export async function updateProduct(businessId: string, productId: string, input: UpdateProductInput) {
  await requireOwnedProduct(businessId, productId);

  const { categoryName, ...rest } = input;
  const categoryId = categoryName ? (await findOrCreateCategory(businessId, categoryName)).id : undefined;

  return prisma.product.update({
    where: { id: productId },
    data: { ...rest, categoryId },
  });
}

export async function deleteProduct(businessId: string, productId: string) {
  await requireOwnedProduct(businessId, productId);
  await prisma.product.delete({ where: { id: productId } });
}
