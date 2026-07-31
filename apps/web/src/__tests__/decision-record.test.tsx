import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DecisionRecord from '@/components/architecture/decision-record';
import { api } from '@/lib/api';
import type { ArchitectureDecisionDraft } from '@/types';

vi.mock('@/lib/api', () => ({
  api: {
    getDecision: vi.fn(),
    draftDecision: vi.fn(),
    saveDecision: vi.fn(),
  },
}));

const draft: ArchitectureDecisionDraft = {
  title: 'Use a modular monolith',
  chosen_pattern: 'modular_monolith',
  context: '5000 technicians concentrated in a 20 minute morning window.',
  decision: 'We will build a modular monolith with an async worker tier.',
  alternatives: [
    { name: 'Microservices', rejected_because: 'Three developers cannot operate eight services.' },
  ],
  consequences: [
    {
      consequence: 'A single deploy pipeline means one bad release stops everything.',
      kind: 'accepted_cost',
      mitigation: 'Blue-green deploys.',
    },
  ],
  contested: [
    {
      assumption: 'traffic is evenly distributed',
      correction: 'all 5000 hit it in the same 20 minutes',
      verdict: 'revised',
      impact: 'Concurrency invalidates the sizing assumption.',
    },
  ],
};

const mocked = api as unknown as {
  getDecision: ReturnType<typeof vi.fn>;
  draftDecision: ReturnType<typeof vi.fn>;
  saveDecision: ReturnType<typeof vi.fn>;
};

async function openDraft() {
  render(<DecisionRecord sessionId="arch_1" optionId="opt_1" optionName="Modular Monolith" />);
  fireEvent.click(await screen.findByRole('button', { name: /draft the record/i }));
  return screen.findByDisplayValue(draft.title);
}

const saveButton = () => screen.getByRole('button', { name: /record this decision/i });

describe('DecisionRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getDecision.mockResolvedValue(null);
    mocked.draftDecision.mockResolvedValue(structuredClone(draft));
    mocked.saveDecision.mockImplementation(async (_id: string, record: unknown) => ({
      ...(record as object),
      id: 'adr_1',
      session_id: 'arch_1',
      status: 'accepted',
      created_at: '2026-07-29T00:00:00Z',
      updated_at: '2026-07-29T00:00:00Z',
    }));
  });

  it('prompts for a selection before anything can be recorded', async () => {
    render(<DecisionRecord sessionId="arch_1" />);
    expect(await screen.findByText(/choose an option first/i)).toBeInTheDocument();
    expect(mocked.draftDecision).not.toHaveBeenCalled();
  });

  it('saves nothing when merely drafting', async () => {
    await openDraft();
    expect(mocked.draftDecision).toHaveBeenCalledWith('arch_1', 'opt_1');
    expect(mocked.saveDecision).not.toHaveBeenCalled();
  });

  describe('the review gate', () => {
    it('blocks saving an unread draft', async () => {
      await openDraft();
      expect(saveButton()).toBeDisabled();
      expect(screen.getByText(/edit or confirm first/i)).toBeInTheDocument();
    });

    it('opens once the user acknowledges having read it', async () => {
      await openDraft();
      fireEvent.click(screen.getByRole('checkbox'));
      await waitFor(() => expect(saveButton()).toBeEnabled());
    });

    it('opens once the user edits, without needing the checkbox', async () => {
      const title = await openDraft();
      fireEvent.change(title, { target: { value: 'Use a modular monolith, for now' } });

      await waitFor(() => expect(saveButton()).toBeEnabled());
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('closes again if an edit is reverted', async () => {
      const title = await openDraft();
      fireEvent.change(title, { target: { value: 'Something else' } });
      await waitFor(() => expect(saveButton()).toBeEnabled());

      fireEvent.change(title, { target: { value: draft.title } });
      await waitFor(() => expect(saveButton()).toBeDisabled());
    });
  });

  describe('what gets recorded', () => {
    it('marks an acknowledged draft as accepted rather than edited', async () => {
      await openDraft();
      fireEvent.click(screen.getByRole('checkbox'));
      await waitFor(() => expect(saveButton()).toBeEnabled());
      fireEvent.click(saveButton());

      await waitFor(() => expect(mocked.saveDecision).toHaveBeenCalled());
      expect(mocked.saveDecision.mock.calls[0][1]).toMatchObject({
        option_id: 'opt_1',
        edited_by_user: false,
        title: draft.title,
      });
    });

    it('records the edit flag and the edited text', async () => {
      const title = await openDraft();
      fireEvent.change(title, { target: { value: 'Use a modular monolith, for now' } });
      await waitFor(() => expect(saveButton()).toBeEnabled());
      fireEvent.click(saveButton());

      await waitFor(() => expect(mocked.saveDecision).toHaveBeenCalled());
      expect(mocked.saveDecision.mock.calls[0][1]).toMatchObject({
        edited_by_user: true,
        title: 'Use a modular monolith, for now',
      });
    });

    it('carries the contest trail through to the saved record', async () => {
      await openDraft();
      fireEvent.click(screen.getByRole('checkbox'));
      await waitFor(() => expect(saveButton()).toBeEnabled());
      fireEvent.click(saveButton());

      await waitFor(() => expect(mocked.saveDecision).toHaveBeenCalled());
      const sent = mocked.saveDecision.mock.calls[0][1] as ArchitectureDecisionDraft;
      expect(sent.contested).toEqual(draft.contested);
    });
  });

  it('shows an already-captured record without redrafting', async () => {
    mocked.getDecision.mockResolvedValue({
      ...draft,
      id: 'adr_1',
      session_id: 'arch_1',
      option_id: 'opt_1',
      edited_by_user: true,
      status: 'accepted',
      created_at: '2026-07-29T00:00:00Z',
      updated_at: '2026-07-29T00:00:00Z',
    });

    render(<DecisionRecord sessionId="arch_1" optionId="opt_1" />);

    expect(await screen.findByText(draft.title)).toBeInTheDocument();
    expect(screen.getByText(/edited by you/i)).toBeInTheDocument();
    expect(mocked.draftDecision).not.toHaveBeenCalled();
  });

  it('surfaces a drafting failure instead of a blank panel', async () => {
    mocked.draftDecision.mockRejectedValue(new Error('Reassessment unavailable'));
    render(<DecisionRecord sessionId="arch_1" optionId="opt_1" />);

    fireEvent.click(await screen.findByRole('button', { name: /draft the record/i }));
    expect(await screen.findByText(/reassessment unavailable/i)).toBeInTheDocument();
  });
});
