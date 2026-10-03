import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OptionChallenge from '@/components/architecture/option-challenge';
import { api } from '@/lib/api';
import type { OptionChallenge as Challenge } from '@/types';

vi.mock('@/lib/api', () => ({ api: { challengeArchitectureOption: vi.fn(), contestAssumption: vi.fn() } }));

const mocked = api as unknown as { challengeArchitectureOption: ReturnType<typeof vi.fn> };

const CHALLENGE: Challenge = {
  option_id: 'o1',
  option_name: 'Monolith',
  risk_level: 'medium',
  summary: 'A single server is a single point of failure.',
  attack_vectors: [],
  assumptions_to_verify: [],
  counterpoint_reading: [
    {
      book: 'Designing Data-Intensive Applications by Martin Kleppmann',
      excerpt: 'Choose storage by access pattern.',
      url: 'https://github.com/ciembor/agent-rules-books/blob/x/ddia.mini.md',
    },
  ],
};

// Revamp I (§129 rows 1-2): the reading comes from the corpus's book rules,
// by title and URL, in place of the old Pinecone book index.
describe('the reading against an option', () => {
  beforeEach(() => vi.clearAllMocks());

  it('names the book as titled and links to its source', async () => {
    mocked.challengeArchitectureOption.mockResolvedValue(CHALLENGE);
    render(<OptionChallenge sessionId="s1" optionId="o1" />);
    fireEvent.click(screen.getByRole('button', { name: /Challenge this option/ }));
    expect(await screen.findByText('Designing Data-Intensive Applications by Martin Kleppmann')).toBeDefined();
    const link = screen.getByRole('link', { name: /Source/ });
    expect(link.getAttribute('href')).toBe(CHALLENGE.counterpoint_reading[0].url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
