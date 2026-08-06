import { create } from 'zustand';
import Cookies from 'js-cookie';
import { api, ApiError } from './api';
import { rememberIntendedRoute } from './post-login-redirect';
import type { User, UserPersona } from '../types';

/**
 * The cookie is the only place a token lives.
 *
 * It used to live in two: a 7-day cookie *and* a `persist`ed localStorage entry
 * with no expiry. `initAuth` read the cookie, so once it expired the store
 * still rehydrated a truthy token from localStorage while the API client had
 * none. `ProtectedRoute` saw a token and rendered, every request went out
 * unauthenticated and came back 401, and `onAuthError` - which had no way to
 * reach the store, as its own comment admitted - could only clear the cookie
 * and hard-redirect. The localStorage token survived, so the next visit did it
 * all again, destroying whatever was in progress each time.
 *
 * One store of record removes the disagreement rather than trying to keep two
 * in sync.
 */
const TOKEN_COOKIE = 'auth_token';
const LEGACY_PERSIST_KEY = 'auth-storage';

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  
  setToken: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  initAuth: () => Promise<void>;
  updatePersona: (persona: UserPersona) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: true,

      setToken: (token) => {
        Cookies.set(TOKEN_COOKIE, token, { expires: 7 });
        api.setToken(token);
        set({ token });
      },

      logout: () => {
        Cookies.remove(TOKEN_COOKIE);
        api.setToken(null);
        set({ token: null, user: null });
      },

      fetchUser: async () => {
        try {
          const user = await api.getCurrentUser();
          set({ user });
        } catch (error) {
          // Handle typed API errors gracefully
          if (error instanceof ApiError) {
            if (error.code === 'auth_error') {
              // Token expired or invalid - onAuthError already triggered redirect
              console.warn('Auth error: session expired, redirecting to login');
              return; // Don't call logout again, onAuthError handles it
            }
            if (error.code === 'network_error') {
              // Backend unreachable - don't crash, just log and continue
              console.warn('Network error: backend unreachable, keeping cached token');
              return; // Don't logout, keep the token in case backend comes back
            }
          }
          // For any other error, logout as fallback
          console.error('Failed to fetch user:', error);
          get().logout();
        }
      },

      initAuth: async () => {
        // Anyone who signed in before the token stopped being persisted still
        // has the old entry. Left in place it is inert, but it is a copy of a
        // bearer token sitting in localStorage with no expiry, so clear it.
        if (typeof globalThis.window !== 'undefined') {
          globalThis.window.localStorage.removeItem(LEGACY_PERSIST_KEY);
        }

        const token = Cookies.get(TOKEN_COOKIE);
        if (token) {
          api.setToken(token);
          set({ token });
          await get().fetchUser();
        } else {
          // The cookie is gone, so the session is over - say so in the store
          // rather than leaving a stale token to render protected pages.
          get().logout();
        }
        set({ isLoading: false });
      },

      updatePersona: async (persona: UserPersona) => {
        try {
          const updatedUser = await api.updatePersona(persona);
          set({ user: updatedUser });
        } catch (error) {
          console.error('Failed to update persona:', error);
          throw error;
        }
      },
    })
);

// Registered after the store exists so it can actually clear it. Previously
// this lived above `create` and could only reach the cookie and the API client,
// which is why an expired session could not be cleaned up from the one place
// that decided whether to render protected pages.
api.onAuthError = () => {
  useAuthStore.getState().logout();

  if (typeof globalThis.window === 'undefined') return;

  const { pathname, search } = globalThis.window.location;
  rememberIntendedRoute(pathname + search);
  globalThis.window.location.href = '/auth/login';
};
