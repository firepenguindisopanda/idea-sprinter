import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

/**
 * Starting over before a run (multi-agent-system HANDOFF §135, §172).
 *
 * "New project" was offered only while a run was writing or done, so a session
 * stuck on its questions or its directions - Checkpoint I's was stuck on
 * fallback directions - could not be reset without reloading. It is offered in
 * every phase after the idea goes in, and a reply that was on its way when the
 * user started over lands nowhere.
 */

const getDirections = vi.fn();
const cancelRun = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/workspace',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getDirections: (...args: unknown[]) => getDirections(...args),
    cancelRun: (...args: unknown[]) => cancelRun(...args),
    generateTitle: vi.fn(async () => ({ title: 'Untitled Project' })),
    saveWorkspace: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
  downloadProjectPdf: vi.fn(),
}));

import { TopBar } from '@/components/workspace/top-bar';
import { ClarifyingQuestions } from '@/components/workspace/clarifying-questions';
import { useWorkspaceStore } from '@/lib/workspace-store';

const DIRECTIONS = [
  { id: 'd1', title: 'Lean MVP', description: 'Smallest useful thing.', tags: [] },
  { id: 'd2', title: 'Enterprise', description: 'Multi-tenant from day one.', tags: [] },
];

// Exact: an untitled project's click-to-edit title reads "New Project".
const newProject = () => screen.queryByRole('button', { name: 'New project' });

describe('New project before a run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
    useWorkspaceStore.setState({ ideaInput: 'A booking app for a climbing gym.', projectTitle: 'Climbing gym' });
  });

  it.each(['clarifying_questions', 'direction_selection', 'interrupted', 'generating', 'refinement'] as const)(
    'is offered while %s',
    (phase) => {
      useWorkspaceStore.setState({ phase });
      render(<TopBar />);
      expect(newProject()).not.toBeNull();
    },
  );

  it('is not offered while the idea is still being written: there is nothing to reset', () => {
    render(<TopBar />);
    expect(newProject()).toBeNull();
  });

  it('starts over from the directions without asking, since nothing is written yet', () => {
    useWorkspaceStore.setState({ phase: 'direction_selection', directions: DIRECTIONS });
    render(<TopBar />);
    fireEvent.click(newProject()!);

    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('idea_input');
    expect(state.ideaInput).toBe('');
    expect(state.directions).toEqual([]);
    expect(screen.queryByText(/Start a new project\?/)).toBeNull();
  });
});

describe('a reply that arrives after starting over', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
    useWorkspaceStore.setState({ ideaInput: 'A booking app for a climbing gym.' });
    useWorkspaceStore.getState().setQuestions([
      { id: 'q1', question: 'Who is it for?', type: 'free_text', answer: null },
    ]);
    useWorkspaceStore.getState().setPhase('clarifying_questions');
  });

  it('does not bring the old project\'s directions back', async () => {
    let answer: (value: { directions: typeof DIRECTIONS }) => void = () => {};
    getDirections.mockImplementation(() => new Promise((resolve) => { answer = resolve; }));

    render(<ClarifyingQuestions />);
    fireEvent.change(screen.getByPlaceholderText(/Type your answer/i), {
      target: { value: 'Small climbing gyms' },
    });
    fireEvent.click(screen.getByRole('button', { name: /See Directions/i }));
    await waitFor(() => expect(getDirections).toHaveBeenCalledTimes(1));

    act(() => useWorkspaceStore.getState().reset());
    await act(async () => answer({ directions: DIRECTIONS }));

    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('idea_input');
    expect(state.directions).toEqual([]);
    expect(state.error).toBeNull();
  });
});
