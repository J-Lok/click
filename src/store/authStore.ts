import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';
import type { User } from '../types';
import { useRestaurantStore } from './restaurantStore';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (access: string, refresh: string) => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      login: async (username, password) => {
        const { data } = await authApi.login({ username, password });
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
        });
        await get().loadUser();
      },
      logout: () => {
        authApi.logout().catch(() => {});
        useRestaurantStore.getState().reset();
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
      },
      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },
      loadUser: async () => {
        try {
          const { data } = await authApi.getMe();
          set({
            user: {
              id: data.id,
              name: data.name ?? data.username ?? 'User',
              role: data.role ?? 'client',
            },
          });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: 'auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: !!s.accessToken,
      }),
    }
  )
);