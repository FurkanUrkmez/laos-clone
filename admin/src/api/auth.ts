import type { AdminUser, AuthTokens } from '../types';
import { apiClient } from './client';

interface AdminAuthResponse {
  adminUser: AdminUser;
  tokens: AuthTokens;
}

export async function loginRequest(email: string, password: string): Promise<AdminAuthResponse> {
  const { data } = await apiClient.post<AdminAuthResponse>('/admin/auth/login', { email, password });
  return data;
}

export async function refreshRequest(refreshToken: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>('/admin/auth/refresh', {
    refreshToken,
  });
  return data;
}

export async function meRequest(): Promise<{ adminUser: AdminUser }> {
  const { data } = await apiClient.get<{ adminUser: AdminUser }>('/admin/auth/me');
  return data;
}
