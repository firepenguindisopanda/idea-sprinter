import { describe, it, expect, vi, beforeEach } from 'vitest';

// Records where a page redirects. The real `redirect` throws to stop
// rendering; the record is all these tests need.
const { mockRedirect } = vi.hoisted(() => ({ mockRedirect: vi.fn() }));
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
    const page = (await load()).default as () => void;
    page();
    expect(mockRedirect).toHaveBeenCalledWith('/workspace');
  });
});
