import { apiClient } from './client';
import { AuthTokens, User } from '../../types';
import { LoginFormValues, RegisterFormValues } from '../../utils/validation';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export async function registerRequest(input: RegisterFormValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
  return data;
}

export async function loginRequest(input: LoginFormValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
  return data;
}

export async function refreshRequest(refreshToken: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
    refreshToken,
  });
  return data;
}

export async function meRequest(): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>('/auth/me');
  return data;
}
