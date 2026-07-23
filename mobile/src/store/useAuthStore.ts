import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens } from '../types';
import { setCurrentAccessToken } from '../services/api/tokenStore';
import { meRequest, refreshRequest } from '../services/api/auth';

const REFRESH_TOKEN_KEY = 'laos_refresh_token';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setSession: (user: User, tokens: AuthTokens) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrating: true,
  setSession: async (user, tokens) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    setCurrentAccessToken(tokens.accessToken);
    set({ user, accessToken: tokens.accessToken, isAuthenticated: true });
  },
  hydrate: async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      set({ isHydrating: false, isAuthenticated: false });
      return;
    }

    try {
      const { accessToken } = await refreshRequest(refreshToken);
      setCurrentAccessToken(accessToken);
      const { user } = await meRequest();
      set({ user, accessToken, isAuthenticated: true, isHydrating: false });
    } catch {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      setCurrentAccessToken(null);
      set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false });
    }
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    setCurrentAccessToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
