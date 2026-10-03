import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

// Wording row 33: the PDF's title page says what the document is. The
// Workshop's export asks for "Design spec"; the server titled every PDF
// "Software Requirements Specification".
describe('PDF export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.setToken(null);
  });

  it('sends the title it is given', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(new Blob(['%PDF']), { status: 200 })),
    );
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await api.downloadPdf('A project.', { Body: 'Body.' }, 'Design spec');
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.title).toBe('Design spec');
  });

  it('sends no title when none is given, so the server chooses a neutral one', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(new Blob(['%PDF']), { status: 200 })),
    );
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await api.downloadPdf('A project.', { Body: 'Body.' });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect('title' in body).toBe(false);
  });
});
