import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContestableAssumption from '@/components/architecture/contestable-assumption';
import { api } from '@/lib/api';
import type { ContestOutcome } from '@/types';

vi.mock('@/lib/api', () => ({ api: { contestAssumption: vi.fn() } }));

const mocked = api as unknown as { contestAssumption: ReturnType<typeof vi.fn> };

const base: ContestOutcome = {
  option_id: 'opt_1',
  assumption: 'traffic is evenly distributed',
  correction: 'are you sure?',
  assumption_was_wrong: false,
  changes_recommendation: false,
  verdict: 'defended',
  impact: 'Unchanged: nothing new was stated. The recommendation stands.',
  affected_dimensions: [],
  still_recommended: true,
  new_fact: '',
  nothing_new: true,
};

async function contest(correction: string) {
  render(<ContestableAssumption sessionId="arch_1" optionId="opt_1" assumption="traffic is evenly distributed" />);
  fireEvent.click(screen.getByRole('button', { name: /That's wrong/i }));
  fireEvent.change(screen.getByPlaceholderText(/What's actually true/i), { target: { value: correction } });
  fireEvent.click(screen.getByRole('button', { name: /Make it reassess/i }));
}

describe('ContestableAssumption (revamp G2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('says the recommendation is unchanged when nothing new was stated', async () => {
    mocked.contestAssumption.mockResolvedValue(base);
    await contest('are you sure?');
    expect(await screen.findByText(/Unchanged - nothing new was stated/i)).toBeDefined();
    expect(screen.queryByText(/Recommendation defended/i)).toBeNull();
    expect(screen.queryByText(/your correction was accepted/i)).toBeNull();
  });

  it('shows the new fact a revision rests on', async () => {
    mocked.contestAssumption.mockResolvedValue({
      ...base,
      correction: 'all 5000 users arrive in the same 20 minutes',
      assumption_was_wrong: true,
      changes_recommendation: true,
      verdict: 'revised',
      impact: 'A 20-minute peak of 5000 users breaks the even-load sizing this option rests on.',
      new_fact: 'all 5000 users arrive in the same 20 minutes',
      nothing_new: false,
    });
    await contest('all 5000 users arrive in the same 20 minutes');
    expect(await screen.findByText(/Recommendation revised/i)).toBeDefined();
    expect(screen.getByText(/New fact:/i).parentElement?.textContent).toContain(
      'all 5000 users arrive in the same 20 minutes',
    );
  });
});
