import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { getCurrentAccessToken, setCurrentAccessToken } from './tokenStore';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const REFRESH_TOKEN_KEY = 'laos_admin_refresh_token';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// A separate, non-intercepted client used only for the token-refresh call
// itself. Keeping it off `apiClient` means a failed refresh can never
// re-enter this same response interceptor, which would otherwise risk an
// infinite retry loop. It also means this file never needs to import
// `./auth` (which imports `apiClient`), so there's no circular import.
const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getCurrentAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Registered by the auth store (via `registerAuthFailureHandler`) so this
// module can react to an unrecoverable 401 without importing the zustand
// store directly, which would create a circular import
// (client.ts -> useAdminAuthStore.ts -> api/auth.ts -> client.ts).
let onAuthFailure: (() => void) | null = null;

export function registerAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

// Shared across concurrent 401s so a burst of requests triggers exactly one
// refresh call instead of one per request.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string }>('/admin/auth/refresh', { refreshToken })
      .then(({ data }) => {
        setCurrentAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    const shouldAttemptRefresh =
      error.response?.status === 401 && originalRequest !== undefined && !originalRequest._retry;

    if (!shouldAttemptRefresh) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return Promise.reject(error);
    }

    // Mark before awaiting so a second 401 on this same request (after the
    // retry) is never retried again.
    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken(refreshToken);
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setCurrentAccessToken(null);
      onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  },
);
