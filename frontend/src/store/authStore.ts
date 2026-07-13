import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
    isFirstLogin?: boolean;
  } | null;
  setAuth: (token: string, user: any) => void;
  updateUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
