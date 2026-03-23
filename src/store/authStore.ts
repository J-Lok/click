import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';
import { useRestaurantStore } from './restaurantStore';

interface AuthState {
  accessToken: string | null;
  user: { id: string; name: string; role: string } | null;
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
      user: null,
      isAuthenticated: false,
      login: async (username, password) => {
        const { data } = await authApi.login({ username, password });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        set({ accessToken: data.access_token, isAuthenticated: true });
        await get().loadUser();
      },
      logout: () => {
        authApi.logout().catch(() => {});
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Eviter de garder un `currentRestaurantId` d'un ancien utilisateur
        useRestaurantStore.getState().setCurrentRestaurantId(null);
        set({ accessToken: null, user: null, isAuthenticated: false });
      },
      setTokens: (access, refresh) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        set({ accessToken: access, isAuthenticated: true });
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
        isAuthenticated: !!s.accessToken,
      }),
    }
  )
);
