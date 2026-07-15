import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  setAuth: (token: string, user: any, refreshToken?: string) => void;
  updateUser: (user: any) => void;
  setToken: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, user, refreshToken) => set({ token, user, refreshToken: refreshToken ?? null }),
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      setToken: (token, refreshToken) => set((state) => ({ token, refreshToken: refreshToken ?? state.refreshToken })),
      logout: () => set({ token: null, user: null, refreshToken: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
