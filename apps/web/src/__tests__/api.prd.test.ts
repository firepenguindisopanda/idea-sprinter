import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

describe('PRD API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.setToken(null);
  });

  it('prdChat should POST message and return agent response', async () => {
    const mockResponse = {
      session_id: 'sess-1',
      agent_response: 'Got it - clarify the target user.',
      needs_more: true,
      phase: 'gathering',
      missing_requirements: { goals: true },
      questions: ['What is the target user?'],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockResponse), { headers: { 'Content-Type': 'application/json' } }))
    ) as unknown as typeof global.fetch;

    const resp = await api.prdChat('sess-1', 'Our main goal is to improve UX');
    expect(resp.agent_response).toBe(mockResponse.agent_response);
    expect(resp.needs_more).toBe(true);
  });

  it('getPrdStatus should fetch status for session', async () => {
    const mockStatus = {
      session_id: 'sess-1',
      phase: 'gathering',
      requirements_status: { goals: true, features: false },
      collected_info: { goals: 'Improve UX' },
      missing_sections: ['features'],
      follow_up_count: 1,
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockStatus), { headers: { 'Content-Type': 'application/json' } }))
    ) as unknown as typeof global.fetch;

    const status = await api.getPrdStatus('sess-1');
    expect(status.session_id).toBe('sess-1');
    expect(status.missing_sections).toContain('features');
  });

  it('getPrdDoc should return PRD document', async () => {
    const mockDoc = { session_id: 'sess-1', generated_prd: '# PRD\n\nOverview', requirements_status: { goals: true } };
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockDoc), { headers: { 'Content-Type': 'application/json' } }))
    ) as unknown as typeof global.fetch;

    const doc = await api.getPrdDoc('sess-1');
    expect(doc.generated_prd).toContain('# PRD');
    expect(doc.session_id).toBe('sess-1');
  });

  // Revamp F2: the run belongs to the server; the PRD page needs only its id.
  it('startPrdDesign starts a design run from the PRD and returns its id', async () => {
    const sse = 'data: {"type":"run_started","run_id":"run-1"}\n\ndata: {"type":"stage","stage":"ledger","seq":1}\n\n';
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(sse, { headers: { 'Content-Type': 'text/event-stream' } })),
    );
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(api.startPrdDesign('sess-1')).resolves.toBe('run-1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/prd\/design\/sess-1$/);
    expect(init?.method).toBe('POST');
  });

  it('startPrdDesign fails when the server refuses', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response('{"detail":"Generate the PRD before designing from it"}', { status: 409 })),
    ) as unknown as typeof global.fetch;
    await expect(api.startPrdDesign('sess-1')).rejects.toThrow();
  });

  it('has no way to send a PRD to the old pipeline', () => {
    expect('sendPrdToPipeline' in api).toBe(false);
  });
});