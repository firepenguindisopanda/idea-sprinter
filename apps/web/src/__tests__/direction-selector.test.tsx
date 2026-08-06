import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * The direction picker's escape hatch and the brief it produces.
 *
 * "I want something different - describe my own" was a button with no onClick:
 * the only way out of three generated options did nothing. And the chosen
 * direction never reached the brief at all, so picking one option over another
 * changed nothing about the document that came back.
 */

// Typed with a rest parameter so the assertions below can index into
// `mock.calls`; `vi.fn(async () => {})` infers a zero-arity tuple.
const streamDocument = vi.fn(async (..._args: unknown[]) => {});

vi.mock('@/lib/api', () => ({
  api: { streamDocument: (...args: unknown[]) => streamDocument(...args) },
}));

import { DirectionSelector } from '@/components/workspace/direction-selector';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { buildBrief } from '@/lib/workspace-generate';

const DIRECTIONS = [
  { id: 'd1', title: 'Lean MVP', description: 'Ship the smallest useful thing.', tags: ['lean'] },
  { id: 'd2', title: 'Enterprise', description: 'Multi-tenant from day one.', tags: ['scale'] },
];

describe('buildBrief', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it('carries the chosen direction into the brief', () => {
    const store = useWorkspaceStore.getState();
    store.setIdeaInput('A task manager');
    store.setQuestions([
      { id: 'q1', question: 'Who is it for?', type: 'free_text', answer: 'Small teams' },
    ]);
    store.setDirections(DIRECTIONS);
    store.selectDirection('d2');

    const brief = buildBrief();
    expect(brief).toContain('A task manager');
    expect(brief).toContain('Small teams');
    // Without this the pipeline generated from the idea alone and the choice
    // between "Lean MVP" and "Enterprise" was decorative.
    expect(brief).toContain('Enterprise');
    expect(brief).toContain('Multi-tenant from day one.');
    expect(brief).not.toContain('Lean MVP');
  });

  it('omits the direction line when none is chosen', () => {
    useWorkspaceStore.getState().setIdeaInput('A task manager');
    expect(buildBrief()).not.toContain('Chosen direction');
  });
});

describe('DirectionSelector', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
    useWorkspaceStore.getState().setDirections(DIRECTIONS);
    streamDocument.mockClear();
  });

  it('generates from a listed direction', async () => {
    render(<DirectionSelector />);
    fireEvent.click(screen.getByText('Lean MVP'));

    await waitFor(() => expect(streamDocument).toHaveBeenCalled());
    expect(streamDocument.mock.calls[0][0]).toBe('d1');
    expect(useWorkspaceStore.getState().selectedDirectionId).toBe('d1');
  });

  it('opens a field for a direction the user writes themselves', () => {
    render(<DirectionSelector />);
    expect(screen.queryByPlaceholderText(/single-tenant internal tool/i)).toBeNull();

    fireEvent.click(screen.getByText(/describe my own/i));
    expect(screen.getByPlaceholderText(/single-tenant internal tool/i)).toBeDefined();
  });

  it('generates from the custom direction and puts it in the brief', async () => {
    render(<DirectionSelector />);
    fireEvent.click(screen.getByText(/describe my own/i));
    fireEvent.change(screen.getByPlaceholderText(/single-tenant internal tool/i), {
      target: { value: 'Offline-first, one user, no accounts.' },
    });
    fireEvent.click(screen.getByText('Generate with this'));

    await waitFor(() => expect(streamDocument).toHaveBeenCalled());
    // The id is incidental; what steers generation is the brief.
    expect(streamDocument.mock.calls[0][1]).toContain('Offline-first, one user, no accounts.');
    expect(useWorkspaceStore.getState().phase).toBe('generating');
  });

  it('will not generate from an empty custom direction', () => {
    render(<DirectionSelector />);
    fireEvent.click(screen.getByText(/describe my own/i));
    const button = screen.getByText('Generate with this').closest('button');
    expect(button).toBeDisabled();
  });

  it('adding a custom direction does not drop the generated ones', () => {
    render(<DirectionSelector />);
    fireEvent.click(screen.getByText(/describe my own/i));
    fireEvent.change(screen.getByPlaceholderText(/single-tenant internal tool/i), {
      target: { value: 'Something else entirely.' },
    });
    fireEvent.click(screen.getByText('Generate with this'));

    const { directions } = useWorkspaceStore.getState();
    expect(directions.map((d) => d.id)).toEqual(['d1', 'd2', 'custom']);
  });

  it('cancelling returns to the list', () => {
    render(<DirectionSelector />);
    fireEvent.click(screen.getByText(/describe my own/i));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText(/single-tenant internal tool/i)).toBeNull();
    expect(screen.getByText(/describe my own/i)).toBeDefined();
  });
});
