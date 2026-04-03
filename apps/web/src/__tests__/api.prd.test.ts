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
      agent_response: 'Got it — clarify the target user.',
      section_tag: 'Goals & Objectives',
      missing_sections: ['Constraints & Assumptions'],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockResponse), { headers: { 'Content-Type': 'application/json' } }))
    ) as any;

    const resp = await api.prdChat('sess-1', 'Our main goal is to improve UX');
    expect(resp.agent_response).toBe(mockResponse.agent_response);
    expect(resp.section_tag).toBe('Goals & Objectives');
  });

  it('getPrdStatus should fetch status for session', async () => {
    const mockStatus = {
      session_id: 'sess-1',
      completed_sections: ['overview', 'goals'],
      missing_sections: ['features'],
      all_tags: [{ section: 'goals', content: 'Improve UX' }],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockStatus), { headers: { 'Content-Type': 'application/json' } }))
    ) as any;

    const status = await api.getPrdStatus('sess-1');
    expect(status.session_id).toBe('sess-1');
    expect(status.completed_sections).toContain('goals');
  });

  it('getPrdDoc should return markdown by default and support json format', async () => {
    const mockDocMd = { session_id: 'sess-1', document: '# PRD\n\nOverview' };
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockDocMd), { headers: { 'Content-Type': 'application/json' } }))
    ) as any;

    const md = await api.getPrdDoc('sess-1');
    expect(typeof md.document).toBe('string');
    expect((md.document as string).startsWith('# PRD')).toBeTruthy();

    const mockDocJson = {
      session_id: 'sess-1',
      document: { overview: 'desc', goals: 'g' },
    };
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockDocJson), { headers: { 'Content-Type': 'application/json' } }))
    ) as any;

    const json = await api.getPrdDoc('sess-1', 'json');
    expect(typeof json.document).toBe('object');
    expect((json.document as any).overview).toBe('desc');
  });
});