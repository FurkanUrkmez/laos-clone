import type { RedeemResult, ScanResult } from '../types';
import { apiClient } from './client';

export async function scanRequest(
  identifier: { qrValue: string } | { loyaltyCode: string },
  productId: string,
): Promise<ScanResult> {
  const { data } = await apiClient.post<ScanResult>('/admin/loyalty/scan', { ...identifier, productId });
  return data;
}

export async function redeemRequest(userId: string, productId?: string): Promise<RedeemResult> {
  const { data } = await apiClient.post<RedeemResult>('/admin/loyalty/redeem', { userId, productId });
  return data;
}
