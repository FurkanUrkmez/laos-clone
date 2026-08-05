import type { RedeemResult, ScanResult } from '../types';
import { apiClient } from './client';

export async function scanRequest(qrValue: string, productId: string): Promise<ScanResult> {
  const { data } = await apiClient.post<ScanResult>('/admin/loyalty/scan', { qrValue, productId });
  return data;
}

export async function redeemRequest(userId: string): Promise<RedeemResult> {
  const { data } = await apiClient.post<RedeemResult>('/admin/loyalty/redeem', { userId });
  return data;
}
