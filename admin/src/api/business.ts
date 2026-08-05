import type { Business } from '../types';
import { apiClient } from './client';

export async function getBusinessRequest(): Promise<Business> {
  const { data } = await apiClient.get<{ business: Business }>('/admin/business');
  return data.business;
}

export async function updateBusinessRequest(input: Partial<Business>): Promise<Business> {
  const { data } = await apiClient.patch<{ business: Business }>('/admin/business', input);
  return data.business;
}
