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

// Mock the API module — all methods reject by default (simulating backend down)
vi.mock('@/lib/api', () => ({
  api: {
    evaluateVagueness: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
    getDirections: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
    streamDocument: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
    refineSection: vi.fn(() => Promise.reject(new Error('Backend unreachable'))),
  },
}));

import { useWorkspace } from '@/hooks/use-workspace';

const mockUseWorkspace = useWorkspace as unknown as ReturnType<typeof vi.fn>;

describe('API Error Handling — No Silent Fallback', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Start Crafting/i }));

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
