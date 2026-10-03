import { describe, it, expect, vi, beforeEach } from 'vitest';

// The real redirect throws NEXT_REDIRECT; the mock does the same, so a page
// that redirects never returns.
const mockRedirect = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});
vi.mock('next/navigation', () => ({ redirect: mockRedirect }));

// Revamp I2: the old pipeline's pages are retired. Bookmarks still land
// somewhere - in the Workshop, which writes the design spec now.
describe('the retired pages redirect to the Workshop', () => {
  beforeEach(() => mockRedirect.mockClear());

  it.each([
    ['/generate', () => import('@/app/generate/page')],
    ['/generate/[sessionId]', () => import('@/app/generate/[sessionId]/page')],
    ['/ideation', () => import('@/app/ideation/page')],
    ['/generator', () => import('@/app/generator/page')],
  ])('%s', async (_route, load) => {
    const page = (await load()).default as () => never;
    expect(() => page()).toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/workspace');
  });
});
