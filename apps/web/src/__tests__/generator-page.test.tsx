import { describe, it, expect, vi } from 'vitest';

// Mock next/navigation redirect - make it throw like the real implementation
// so the component function doesn't return undefined
const mockRedirect = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/components/protected-route', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/generator/results-display', () => ({ default: () => <div /> }));
vi.mock('@/components/generator/save-modal', () => ({ default: () => <div /> }));

describe('GeneratorPage redirect', () => {
  it('should call redirect to /generate', async () => {
    // Dynamic import so the mock is in place before the module runs
    const mod = await import('@/app/generator/page');

    // Calling the component function directly - the real redirect throws
    // (NEXT_REDIRECT), and our mock mirrors that behavior
    try {
      mod.default();
    } catch {
      // expected - redirect throws
    }

    expect(mockRedirect).toHaveBeenCalledWith('/generate');
  });
});
