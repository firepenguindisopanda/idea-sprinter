import { describe, it, expect, vi } from 'vitest';

// Mock next/navigation redirect so it doesn't actually throw in tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/components/protected-route', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/generator/results-display', () => ({ default: () => <div /> }));
vi.mock('@/components/generator/save-modal', () => ({ default: () => <div /> }));

describe('GeneratorPage redirect', () => {
  it('should call redirect to /generate', async () => {
    const { redirect } = await import('next/navigation');
    // Dynamic import so the mock is in place before the module runs
    await import('@/app/generator/page');
    expect(redirect).toHaveBeenCalledWith('/generate');
  });
});
