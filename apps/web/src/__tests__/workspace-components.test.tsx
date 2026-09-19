import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdeaInput } from '@/components/workspace/idea-input';
import { DocSection } from '@/components/workspace/doc-section';
import { TopBar } from '@/components/workspace/top-bar';
import type { DocSection as DocSectionType } from '@/types/workspace';

// TopBar calls useRouter, which throws "invariant expected app router to be
// mounted" outside a Next app tree. Without this the three TopBar tests failed
// for want of a mock rather than for anything about TopBar.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/workspace',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the workspace hook
vi.mock('@/hooks/use-workspace', () => ({
  useWorkspace: vi.fn(),
}));

// Mock the API module - reject by default to test fallback paths
vi.mock('@/lib/api', () => ({
  api: {
    getClarifyingQuestions: vi.fn(() => Promise.reject(new Error('API unavailable'))),
    getDirections: vi.fn(() => Promise.reject(new Error('API unavailable'))),
    generateDocument: vi.fn(() => Promise.reject(new Error('API unavailable'))),
    refineSection: vi.fn(() => Promise.reject(new Error('API unavailable'))),
  },
}));

import { useWorkspace } from '@/hooks/use-workspace';
import { api } from '@/lib/api';

const mockUseWorkspace = useWorkspace as unknown as ReturnType<typeof vi.fn>;

describe('IdeaInput', () => {
  beforeEach(() => {
    mockUseWorkspace.mockReturnValue({
      ideaInput: '',
      setIdeaInput: vi.fn(),
      startClarifying: vi.fn(),
      setQuestions: vi.fn(),
      phase: 'idea_input',
    });
  });

  it('renders the heading and textarea', () => {
    render(<IdeaInput />);
    expect(screen.getByText('What are you building?')).toBeDefined();
    expect(screen.getByPlaceholderText('I want to build a...')).toBeDefined();
  });

  it('disables Start Crafting button when input is empty', () => {
    render(<IdeaInput />);
    const button = screen.getByRole('button', { name: /Start Crafting/i });
    expect(button).toBeDisabled();
  });

  it('enables Start Crafting button when input has text', () => {
    mockUseWorkspace.mockReturnValue({
      ideaInput: 'Build a task manager',
      setIdeaInput: vi.fn(),
      startClarifying: vi.fn(),
      setQuestions: vi.fn(),
      phase: 'idea_input',
    });
    render(<IdeaInput />);
    const button = screen.getByRole('button', { name: /Start Crafting/i });
    expect(button).toBeEnabled();
  });

  it('shows error when API is unavailable instead of falling back', async () => {
    const startClarifying = vi.fn();
    const setQuestions = vi.fn();
    const setError = vi.fn();
    mockUseWorkspace.mockReturnValue({
      ideaInput: 'Build a task manager',
      setIdeaInput: vi.fn(),
      startClarifying,
      setQuestions,
      phase: 'idea_input',
      vaguenessScores: null,
      setVaguenessScores: vi.fn(),
      setPhase: vi.fn(),
      setDirections: vi.fn(),
      addChatMessage: vi.fn(),
      setError,
    });
    render(<IdeaInput />);
    fireEvent.click(screen.getByRole('button', { name: /Start Crafting/i }));

    await waitFor(() => {
      // Asserts an error was surfaced, not its wording. These tests exist to
      // prove the component fails loudly instead of falling back to fake data;
      // pinning the copy made them break when the message stopped naming
      // localhost, which production users should never have seen.
      expect(setError).toHaveBeenCalledWith(expect.stringMatching(/\S/));
      expect(startClarifying).not.toHaveBeenCalled();
      expect(setQuestions).not.toHaveBeenCalled();
    });
  });
});

describe('TopBar', () => {
  it('shows New Project when no title is set', () => {
    mockUseWorkspace.mockReturnValue({
      phase: 'idea_input',
      projectTitle: '',
    });
    render(<TopBar />);
    expect(screen.getByText('New Project')).toBeDefined();
  });

  it('shows the project title when set', () => {
    mockUseWorkspace.mockReturnValue({
      phase: 'generating',
      projectTitle: 'Sprint Planner',
    });
    render(<TopBar />);
    expect(screen.getByText('Sprint Planner')).toBeDefined();
  });

  it('shows the correct stage label for each phase', () => {
    const phases: Array<{ phase: string; label: string }> = [
      { phase: 'idea_input', label: 'Draft' },
      { phase: 'clarifying_questions', label: 'Discovery' },
      { phase: 'direction_selection', label: 'Direction' },
      { phase: 'generating', label: 'Generating' },
      { phase: 'refinement', label: 'Ready' },
    ];

    for (const { phase, label } of phases) {
      mockUseWorkspace.mockReturnValue({
        phase,
        projectTitle: 'Test',
      });
      const { unmount } = render(<TopBar />);
      expect(screen.getByText(label)).toBeDefined();
      unmount();
    }
  });
});

describe('DocSection', () => {
  const baseSection: DocSectionType = {
    id: 'sec-1',
    title: 'Project Overview',
    status: 'complete',
    content: 'This is the project overview content.',
    order: 0,
  };

  beforeEach(() => {
    mockUseWorkspace.mockReturnValue({
      applyRefinement: vi.fn(),
      undoRefinement: vi.fn(),
      refinementHistory: [],
    });
  });

  it('renders section title and content', () => {
    render(<DocSection section={baseSection} isRefinementMode={false} />);
    expect(screen.getByText('Project Overview')).toBeDefined();
    expect(screen.getByText('This is the project overview content.')).toBeDefined();
  });

  it('shows shimmer placeholder when generating', () => {
    const generatingSection = { ...baseSection, status: 'generating' as const, content: '' };
    const { container } = render(<DocSection section={generatingSection} isRefinementMode={false} />);
    const shimmerElements = container.querySelectorAll('.animate-pulse');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it('shows pending message when pending', () => {
    const pendingSection = { ...baseSection, status: 'pending' as const, content: '' };
    render(<DocSection section={pendingSection} isRefinementMode={false} />);
    expect(screen.getByText('Queued')).toBeDefined();
  });

  it('shows refine button on hover in refinement mode', () => {
    render(<DocSection section={baseSection} isRefinementMode={true} />);
    const refineButton = screen.getByTitle('Refine section');
    expect(refineButton).toBeDefined();
  });

  it('does not show refine button when not in refinement mode', () => {
    render(<DocSection section={baseSection} isRefinementMode={false} />);
    expect(screen.queryByText('Refine')).toBeNull();
  });

  it('shows error when refineSection fails, does not mock-refine', async () => {
    const applyRefinement = vi.fn();
    const setError = vi.fn();
    mockUseWorkspace.mockReturnValue({
      applyRefinement,
      undoRefinement: vi.fn(),
      refinementHistory: [],
      setError,
    });
    render(<DocSection section={baseSection} isRefinementMode={true} />);

    // Click refine to open the panel
    fireEvent.click(screen.getByTitle('Refine section'));

    // Type in the refinement textarea
    const textarea = screen.getByPlaceholderText(/Make this more technical/i);
    fireEvent.change(textarea, { target: { value: 'Add pricing details' } });

    // Click Apply
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      // Asserts an error was surfaced, not its wording. These tests exist to
      // prove the component fails loudly instead of falling back to fake data;
      // pinning the copy made them break when the message stopped naming
      // localhost, which production users should never have seen.
      expect(setError).toHaveBeenCalledWith(expect.stringMatching(/\S/));
      expect(applyRefinement).not.toHaveBeenCalled();
    });
  });

  it('sends the section content with the refine request', async () => {
    // The backend's RefineRequest requires `content`; sending only
    // {section_id, prompt} 422'd every call, and the catch reported it as a
    // network error - so the marquee refine interaction had never worked.
    mockUseWorkspace.mockReturnValue({
      applyRefinement: vi.fn(),
      undoRefinement: vi.fn(),
      refinementHistory: [],
      setError: vi.fn(),
    });
    render(<DocSection section={baseSection} isRefinementMode={true} />);

    fireEvent.click(screen.getByTitle('Refine section'));
    fireEvent.change(screen.getByPlaceholderText(/Make this more technical/i), {
      target: { value: 'Add pricing details' },
    });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(api.refineSection).toHaveBeenCalledWith(
        baseSection.id,
        baseSection.content,
        'Add pricing details',
      );
    });
  });

  it('applies a changed section and closes the box', async () => {
    const applyRefinement = vi.fn();
    mockUseWorkspace.mockReturnValue({
      applyRefinement,
      undoRefinement: vi.fn(),
      refinementHistory: [],
      setError: vi.fn(),
    });
    vi.mocked(api.refineSection).mockResolvedValueOnce({
      section_id: baseSection.id,
      content: 'The overview, with pricing.',
      suggestions: [],
    });
    render(<DocSection section={baseSection} isRefinementMode={true} />);

    fireEvent.click(screen.getByTitle('Refine section'));
    fireEvent.change(screen.getByPlaceholderText(/Make this more technical/i), {
      target: { value: 'Add pricing details' },
    });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(applyRefinement).toHaveBeenCalledWith(
        expect.objectContaining({ suggestedContent: 'The overview, with pricing.' }),
      );
    });
    expect(screen.queryByPlaceholderText(/Make this more technical/i)).toBeNull();
  });

  it('reports an unchanged section as not applied and keeps the request', async () => {
    // The endpoint hands the original back when the model's reply is unusable.
    // Recorded, it showed a refinement that never happened, with an undo that
    // restored nothing.
    const applyRefinement = vi.fn();
    const setError = vi.fn();
    mockUseWorkspace.mockReturnValue({
      applyRefinement,
      undoRefinement: vi.fn(),
      refinementHistory: [],
      setError,
    });
    vi.mocked(api.refineSection).mockResolvedValueOnce({
      section_id: baseSection.id,
      content: baseSection.content,
      suggestions: [],
    });
    render(<DocSection section={baseSection} isRefinementMode={true} />);

    fireEvent.click(screen.getByTitle('Refine section'));
    fireEvent.change(screen.getByPlaceholderText(/Make this more technical/i), {
      target: { value: 'Add pricing details' },
    });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      // A notice, not an error: nothing failed.
      expect(setError).toHaveBeenCalledWith(expect.stringMatching(/\S/), 'notice');
    });
    expect(applyRefinement).not.toHaveBeenCalled();
    expect(
      (screen.getByPlaceholderText(/Make this more technical/i) as HTMLTextAreaElement).value,
    ).toBe('Add pricing details');
  });
});
