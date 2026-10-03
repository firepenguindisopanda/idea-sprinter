import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdeaInput } from '@/components/workspace/idea-input';
import { ClarifyingQuestions } from '@/components/workspace/clarifying-questions';
import { DocSection } from '@/components/workspace/doc-section';
import type { DocSection as DocSectionType } from '@/types/workspace';

// Mock the workspace hook
vi.mock('@/hooks/use-workspace', () => ({
  useWorkspace: vi.fn(),
}));

// Mock the API module - all methods reject by default (simulating backend down)
vi.mock('@/lib/api', () => ({
  api: {
    evaluateVagueness: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
    getDirections: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
    streamDesign: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
    refineSection: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
  },
}));

import { useWorkspace } from '@/hooks/use-workspace';

const mockUseWorkspace = useWorkspace as unknown as ReturnType<typeof vi.fn>;

describe('API Error Handling - No Silent Fallback', () => {
  it('IdeaInput shows error when evaluateVagueness fails, does NOT transition to clarifying', async () => {
    const startClarifying = vi.fn();
    const setQuestions = vi.fn();
    const setPhase = vi.fn();
    const setDirections = vi.fn();
    const addChatMessage = vi.fn();
    const setVaguenessScores = vi.fn();
    const setError = vi.fn();
    mockUseWorkspace.mockReturnValue({
      ideaInput: 'Build a task manager',
      setIdeaInput: vi.fn(),
      startClarifying,
      setQuestions,
      setPhase,
      setDirections,
      phase: 'idea_input',
      vaguenessScores: null,
      setVaguenessScores,
      addChatMessage,
      error: null,
      setError,
    });

    render(<IdeaInput />);
    fireEvent.click(screen.getByRole('button', { name: /Check my idea/i }));

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(expect.stringContaining('connect'));
      expect(startClarifying).not.toHaveBeenCalled();
      expect(setQuestions).not.toHaveBeenCalled();
      expect(setDirections).not.toHaveBeenCalled();
    });
  });

  it('ClarifyingQuestions shows error when getDirections fails, does NOT silently fall back', async () => {
    const setDirections = vi.fn();
    const setError = vi.fn();
    mockUseWorkspace.mockReturnValue({
      questions: [
        { id: 'q1', question: 'Who?', type: 'free_text', answer: 'Devs' },
      ],
      currentQuestionIndex: 0,
      currentQuestion: { id: 'q1', question: 'Who?', type: 'free_text', answer: null },
      canGoPrevious: false,
      canGoNext: false,
      answerQuestion: vi.fn(),
      nextQuestion: vi.fn(),
      previousQuestion: vi.fn(),
      setDirections,
      phase: 'clarifying_questions',
      addChatMessage: vi.fn(),
      error: null,
      setError,
    });

    render(<ClarifyingQuestions />);

    const textarea = screen.getByPlaceholderText('Type your answer...');
    fireEvent.change(textarea, { target: { value: 'End users' } });
    fireEvent.click(screen.getByRole('button', { name: /See Directions/i }));

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(expect.stringContaining('connect'));
      expect(setDirections).not.toHaveBeenCalled();
    });
  });

  // The backend used to answer a failed model call with canned questions and
  // directions and a 200; it now answers 503 with a reason (HANDOFF §135).
  // The Workshop shows that reason, not "Could not reach the server".
  const unavailable = (message: string) =>
    Object.assign(new Error(message), { code: 'api_error', status: 503 });

  it('IdeaInput shows the server reason when the model gives no feedback', async () => {
    const { api } = await import('@/lib/api');
    const reason = 'The model service did not give usable feedback on the idea. Try again in a minute.';
    vi.mocked(api.evaluateVagueness).mockRejectedValueOnce(unavailable(reason));
    const setError = vi.fn();
    const startClarifying = vi.fn();
    mockUseWorkspace.mockReturnValue({
      ideaInput: 'Build a task manager',
      setIdeaInput: vi.fn(),
      startClarifying,
      setQuestions: vi.fn(),
      setPhase: vi.fn(),
      setDirections: vi.fn(),
      phase: 'idea_input',
      vaguenessScores: null,
      setVaguenessScores: vi.fn(),
      addChatMessage: vi.fn(),
      error: null,
      setError,
    });

    render(<IdeaInput />);
    fireEvent.click(screen.getByRole('button', { name: /Check my idea/i }));

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(reason);
      expect(startClarifying).not.toHaveBeenCalled();
    });
  });

  it('IdeaInput shows the server reason when a clear idea gets no directions', async () => {
    const { api } = await import('@/lib/api');
    const reason = 'The model service did not give usable directions. Try again in a minute.';
    vi.mocked(api.evaluateVagueness).mockResolvedValueOnce({
      scores: {
        borderline_case: 8, scalar_terms: 8, quantitative_imprecision: 8,
        subjective_modality: 8, context_dependence: 8,
      },
      overall_score: 8,
      threshold_met: true,
      weak_dimensions: [],
      targeted_questions: [],
    } as never);
    vi.mocked(api.getDirections).mockRejectedValueOnce(unavailable(reason));
    const setError = vi.fn();
    const setDirections = vi.fn();
    mockUseWorkspace.mockReturnValue({
      ideaInput: 'Build a task manager',
      setIdeaInput: vi.fn(),
      startClarifying: vi.fn(),
      setQuestions: vi.fn(),
      setPhase: vi.fn(),
      setDirections,
      phase: 'idea_input',
      vaguenessScores: null,
      setVaguenessScores: vi.fn(),
      addChatMessage: vi.fn(),
      error: null,
      setError,
    });

    render(<IdeaInput />);
    fireEvent.click(screen.getByRole('button', { name: /Check my idea/i }));

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(reason);
      expect(setDirections).not.toHaveBeenCalled();
    });
  });

  it('ClarifyingQuestions shows the server reason when the model gives no directions', async () => {
    const { api } = await import('@/lib/api');
    const reason = 'The model service did not give usable directions. Try again in a minute.';
    vi.mocked(api.getDirections).mockRejectedValueOnce(unavailable(reason));
    const setError = vi.fn();
    const setDirections = vi.fn();
    mockUseWorkspace.mockReturnValue({
      questions: [{ id: 'q1', question: 'Who?', type: 'free_text', answer: 'Devs' }],
      currentQuestionIndex: 0,
      currentQuestion: { id: 'q1', question: 'Who?', type: 'free_text', answer: null },
      canGoPrevious: false,
      canGoNext: false,
      answerQuestion: vi.fn(),
      nextQuestion: vi.fn(),
      previousQuestion: vi.fn(),
      setDirections,
      phase: 'clarifying_questions',
      addChatMessage: vi.fn(),
      error: null,
      setError,
    });

    render(<ClarifyingQuestions />);
    fireEvent.change(screen.getByPlaceholderText('Type your answer...'), { target: { value: 'End users' } });
    fireEvent.click(screen.getByRole('button', { name: /See Directions/i }));

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(reason);
      expect(setDirections).not.toHaveBeenCalled();
    });
  });

  it('a new attempt clears the last error before it starts', async () => {
    // Live, 2026-10-03: after a 503, a retry that succeeded left the 503's
    // message above the directions it produced.
    const { api } = await import('@/lib/api');
    vi.mocked(api.evaluateVagueness).mockRejectedValueOnce(unavailable('first try failed'));
    const setError = vi.fn();
    mockUseWorkspace.mockReturnValue({
      ideaInput: 'Build a task manager',
      setIdeaInput: vi.fn(),
      startClarifying: vi.fn(),
      setQuestions: vi.fn(),
      setPhase: vi.fn(),
      setDirections: vi.fn(),
      phase: 'idea_input',
      vaguenessScores: null,
      setVaguenessScores: vi.fn(),
      addChatMessage: vi.fn(),
      error: 'an earlier failure',
      setError,
    });

    render(<IdeaInput />);
    fireEvent.click(screen.getByRole('button', { name: /Check my idea/i }));

    await waitFor(() => expect(setError).toHaveBeenCalledWith('first try failed'));
    expect(setError.mock.calls[0]).toEqual([null]);
  });

  it('DocSection shows error when refineSection fails, does NOT mock-refine', async () => {
    const applyRefinement = vi.fn();
    const setError = vi.fn();
    mockUseWorkspace.mockReturnValue({
      applyRefinement,
      undoRefinement: vi.fn(),
      refinementHistory: [],
      error: null,
      setError,
    });

    const section: DocSectionType = {
      id: 'sec-1',
      title: 'Overview',
      status: 'complete',
      content: 'Original content.',
      order: 0,
    };

    render(<DocSection section={section} isRefinementMode={true} />);

    fireEvent.click(screen.getByTitle('Refine section'));

    const textarea = screen.getByPlaceholderText(/Make this more technical/i);
    fireEvent.change(textarea, { target: { value: 'Add more detail' } });

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(expect.stringContaining('connect'));
      expect(applyRefinement).not.toHaveBeenCalled();
    });
  });
});
