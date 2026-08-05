import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { UpdateBusinessInput } from '../validators/adminBusiness.validators';

export async function getBusiness(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new AppError(404, 'İşletme bulunamadı');
  }
  return business;
}

export async function updateBusiness(businessId: string, input: UpdateBusinessInput) {
  await getBusiness(businessId);
  return prisma.business.update({ where: { id: businessId }, data: input });
}
