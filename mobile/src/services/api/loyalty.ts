import { apiClient } from './client';

export interface MyLoyalty {
  pointsBalance: number;
  threshold: number;
  rewardEligible: boolean;
}

export async function myLoyaltyRequest(): Promise<MyLoyalty> {
  const { data } = await apiClient.get<MyLoyalty>('/loyalty/me');
  return data;
}
