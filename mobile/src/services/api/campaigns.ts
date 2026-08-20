import { apiClient } from './client';

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CampaignsPage {
  campaigns: Campaign[];
  page: number;
  hasMore: boolean;
}

export async function campaignsRequest(page = 1, limit = 10): Promise<CampaignsPage> {
  const { data } = await apiClient.get<CampaignsPage>('/campaigns', { params: { page, limit } });
  return data;
}
