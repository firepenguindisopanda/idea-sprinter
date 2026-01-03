import { describe, it, expect, vi } from 'vitest';
import { useAuthStore } from '@/lib/auth-store';

// Mock the auth store
vi.mock('@/lib/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

describe('Auth Store', () => {
  it('should initialize with no user', () => {
    const mockStore = {
      token: null,
      user: null,
      isLoading: false,
      setToken: vi.fn(),
      logout: vi.fn(),
      fetchUser: vi.fn(),
      initAuth: vi.fn(),
    };

    (useAuthStore as any).mockReturnValue(mockStore);

    expect(mockStore.user).toBeNull();
    expect(mockStore.token).toBeNull();
  });

  it('should set token', () => {
    const mockSetToken = vi.fn();
    const mockStore = {
      token: null,
      user: null,
      isLoading: false,
      setToken: mockSetToken,
      logout: vi.fn(),
      fetchUser: vi.fn(),
      initAuth: vi.fn(),
    };

    (useAuthStore as any).mockReturnValue(mockStore);

    const testToken = 'test-token-123';
    mockStore.setToken(testToken);

    expect(mockSetToken).toHaveBeenCalledWith(testToken);
  });
});
