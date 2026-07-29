import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
    isFirstLogin?: boolean;
  } | null;
  setAuth: (token: string, user: any, refreshToken?: string, rememberMe?: boolean) => void;
  updateUser: (user: any) => void;
  setToken: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, user, refreshToken, rememberMe = false) => {
        // Switch storage based on rememberMe
        const storage = rememberMe ? localStorage : sessionStorage;
        // Clear old key from both storages to avoid stale data
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
        // Write directly so the persist middleware picks it up on next rehydration
        storage.setItem('auth-storage', JSON.stringify({
          state: { token, user, refreshToken: refreshToken ?? null },
          version: 0,
        }));
        set({ token, user, refreshToken: refreshToken ?? null });
      },
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      setToken: (token, refreshToken) => set((state) => ({ token, refreshToken: refreshToken ?? state.refreshToken })),
      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await api.post('/Auth/logout', { refreshToken });
          } catch (error) {
            console.error('Logout API failed:', error);
          }
        }
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
        set({ token: null, user: null, refreshToken: null });
      },
    }),
    {
      name: 'auth-storage',
      // Try localStorage first (for rememberMe), fall back to sessionStorage
      storage: createJSONStorage(() =>
        localStorage.getItem('auth-storage') ? localStorage : sessionStorage
      ),
    }
  )
);
