import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { api } from './api';
import type { User } from '../types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  
  setToken: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: true,

      setToken: (token) => {
        Cookies.set('auth_token', token, { expires: 7 });
        api.setToken(token);
        set({ token });
      },

      logout: () => {
        Cookies.remove('auth_token');
        api.setToken(null);
        set({ token: null, user: null });
      },

      fetchUser: async () => {
        try {
          const user = await api.getCurrentUser();
          set({ user });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          get().logout();
        }
      },

      initAuth: async () => {
        const token = Cookies.get('auth_token');
        if (token) {
          api.setToken(token);
          set({ token });
          await get().fetchUser();
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
