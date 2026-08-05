import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { CreateCampaignInput, UpdateCampaignInput } from '../validators/adminCampaigns.validators';

export async function listCampaigns(businessId: string) {
  return prisma.campaign.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
}

export async function createCampaign(businessId: string, input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive ?? true,
    },
  });
}

async function requireOwnedCampaign(businessId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, businessId } });
  if (!campaign) {
    throw new AppError(404, 'Kampanya bulunamadı');
  }
  return campaign;
}

export async function updateCampaign(businessId: string, campaignId: string, input: UpdateCampaignInput) {
  await requireOwnedCampaign(businessId, campaignId);
  return prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });
}

export async function deleteCampaign(businessId: string, campaignId: string) {
  await requireOwnedCampaign(businessId, campaignId);
  await prisma.campaign.delete({ where: { id: campaignId } });
}
