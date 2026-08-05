import { create } from 'zustand';
import type { AdminUser } from '../types';
import { setCurrentAccessToken } from '../api/tokenStore';
import { loginRequest, meRequest, refreshRequest } from '../api/auth';

const REFRESH_TOKEN_KEY = 'laos_admin_refresh_token';

interface AdminAuthState {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  adminUser: null,
  isAuthenticated: false,
  isHydrating: true,
  login: async (email, password) => {
    const { adminUser, tokens } = await loginRequest(email, password);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    setCurrentAccessToken(tokens.accessToken);
    set({ adminUser, isAuthenticated: true, isHydrating: false });
  },
  hydrate: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      set({ isHydrating: false, isAuthenticated: false });
      return;
    }
    try {
      const { accessToken } = await refreshRequest(refreshToken);
      setCurrentAccessToken(accessToken);
      const { adminUser } = await meRequest();
      set({ adminUser, isAuthenticated: true, isHydrating: false });
    } catch {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setCurrentAccessToken(null);
      set({ adminUser: null, isAuthenticated: false, isHydrating: false });
    }
  },
  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setCurrentAccessToken(null);
    set({ adminUser: null, isAuthenticated: false });
  },
}));
