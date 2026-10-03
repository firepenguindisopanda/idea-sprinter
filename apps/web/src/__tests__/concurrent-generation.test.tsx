import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * A live generation must not be interruptible by the flow that started it.
 *
 * Found in a real session, not by these tests: `/directions` was requested
 * twice, the duplicate ran for 142 seconds, and its response landed 134 seconds
 * into a generation the user had already started from the first one's results.
 * `setDirections` moved the phase back to `direction_selection`, so the picker
 * reappeared over a running pipeline with every card still clickable - one
 * click away from a second twelve-agent run streaming into the same store.
 */

const getDirections = vi.fn();
const streamDesign = vi.fn(async (..._args: unknown[]) => {});

vi.mock('@/lib/api', () => ({
  api: {
    getDirections: (...args: unknown[]) => getDirections(...args),
    streamDesign: (...args: unknown[]) => streamDesign(...args),
  },
  ApiError: class ApiError extends Error {},
}));

import { useWorkspaceStore } from '@/lib/workspace-store';
import { runWorkspaceGeneration } from '@/lib/workspace-generate';
import { ClarifyingQuestions } from '@/components/workspace/clarifying-questions';

const DIRECTIONS = [
  { id: 'd1', title: 'Lean MVP', description: 'Smallest useful thing.', tags: [] },
  { id: 'd2', title: 'Enterprise', description: 'Multi-tenant from day one.', tags: [] },
];

describe('a late /directions response cannot reopen the picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
  });

  it('records the directions but leaves a running generation alone', () => {
    const store = useWorkspaceStore.getState();
    store.setPhase('generating');

    store.setDirections(DIRECTIONS);

    expect(useWorkspaceStore.getState().phase).toBe('generating');
    // Not discarded - only the phase move is suppressed.
    expect(useWorkspaceStore.getState().directions).toHaveLength(2);
  });

  it('leaves an interrupted run alone too', () => {
    const store = useWorkspaceStore.getState();
    store.setPhase('interrupted');
    store.setDirections(DIRECTIONS);
    expect(useWorkspaceStore.getState().phase).toBe('interrupted');
  });

  it('does not undo a finished document', () => {
    const store = useWorkspaceStore.getState();
    store.setPhase('refinement');
    store.setDirections(DIRECTIONS);
    expect(useWorkspaceStore.getState().phase).toBe('refinement');
  });

  it('still opens the picker from the phases before it', () => {
    for (const phase of ['idea_input', 'evaluating', 'clarifying_questions'] as const) {
      useWorkspaceStore.getState().reset();
      useWorkspaceStore.getState().setPhase(phase);
      useWorkspaceStore.getState().setDirections(DIRECTIONS);
      expect(useWorkspaceStore.getState().phase).toBe('direction_selection');
    }
  });
});

describe('a second generation cannot start over a live one', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
  });

  it('refuses while a run is in flight', async () => {
    useWorkspaceStore.setState({ phase: 'generating', runId: 'run-1' });

    await runWorkspaceGeneration('d2');

    expect(streamDesign).not.toHaveBeenCalled();
  });

  it('allows a retry once the run is gone', async () => {
    // `interrupted` with no run id is the retry case, which must still work.
    useWorkspaceStore.setState({ phase: 'interrupted', runId: null });

    await runWorkspaceGeneration('d2');

    expect(streamDesign).toHaveBeenCalledTimes(1);
  });
});

describe('the clarifying questions ask for directions once', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
    useWorkspaceStore.getState().setQuestions([
      { id: 'q1', question: 'Who is it for?', type: 'free_text', answer: null },
    ]);
    useWorkspaceStore.getState().setPhase('clarifying_questions');
  });

  it('does not fire a duplicate request when the button is double-clicked', async () => {
    // Never resolves, so both clicks land while the first is in flight - which
    // is the real case: the call takes tens of seconds.
    getDirections.mockImplementation(() => new Promise(() => {}));

    render(<ClarifyingQuestions />);
    fireEvent.change(screen.getByPlaceholderText(/Type your answer/i), {
      target: { value: 'Small climbing gyms' },
    });

    const submit = screen.getByRole('button', { name: /See Directions/i });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(getDirections).toHaveBeenCalledTimes(1));
  });

  it('says what it is doing while it waits', async () => {
    getDirections.mockImplementation(() => new Promise(() => {}));

    render(<ClarifyingQuestions />);
    fireEvent.change(screen.getByPlaceholderText(/Type your answer/i), {
      target: { value: 'Small climbing gyms' },
    });
    fireEvent.click(screen.getByRole('button', { name: /See Directions/i }));

    expect(await screen.findByText(/Finding directions/i)).toBeTruthy();
  });
});
