import type { Campaign } from '../types';
import { apiClient } from './client';

export interface CampaignInput {
  title: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export async function listCampaignsRequest(): Promise<Campaign[]> {
  const { data } = await apiClient.get<{ campaigns: Campaign[] }>('/admin/campaigns');
  return data.campaigns;
}

export async function createCampaignRequest(input: CampaignInput): Promise<Campaign> {
  const { data } = await apiClient.post<{ campaign: Campaign }>('/admin/campaigns', input);
  return data.campaign;
}

export async function updateCampaignRequest(id: string, input: Partial<CampaignInput>): Promise<Campaign> {
  const { data } = await apiClient.patch<{ campaign: Campaign }>(`/admin/campaigns/${id}`, input);
  return data.campaign;
}

export async function deleteCampaignRequest(id: string): Promise<void> {
  await apiClient.delete(`/admin/campaigns/${id}`);
}
