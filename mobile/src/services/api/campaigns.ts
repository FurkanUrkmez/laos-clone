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

export async function campaignsRequest(): Promise<Campaign[]> {
  const { data } = await apiClient.get<{ campaigns: Campaign[] }>('/campaigns');
  return data.campaigns;
}
