import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdeaInput } from '@/components/workspace/idea-input';
import { DocSection } from '@/components/workspace/doc-section';
import { TopBar } from '@/components/workspace/top-bar';
import type { DocSection as DocSectionType } from '@/types/workspace';

// Mock the workspace hook
vi.mock('@/hooks/use-workspace', () => ({
  useWorkspace: vi.fn(),
}));

// Mock the API module — reject by default to test fallback paths
vi.mock('@/lib/api', () => ({
  api: {
    getClarifyingQuestions: vi.fn(() => Promise.reject(new Error('API unavailable'))),
    getDirections: vi.fn(() => Promise.reject(new Error('API unavailable'))),
    generateDocument: vi.fn(() => Promise.reject(new Error('API unavailable'))),
    refineSection: vi.fn(() => Promise.reject(new Error('API unavailable'))),
  },
}));

import { useWorkspace } from '@/hooks/use-workspace';

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

  it('calls startClarifying via fallback when API is unavailable', async () => {
    const startClarifying = vi.fn();
    const setQuestions = vi.fn();
    mockUseWorkspace.mockReturnValue({
      ideaInput: 'Build a task manager',
      setIdeaInput: vi.fn(),
      startClarifying,
      setQuestions,
      phase: 'idea_input',
    });
    render(<IdeaInput />);
    fireEvent.click(screen.getByRole('button', { name: /Start Crafting/i }));

    await waitFor(() => {
      expect(setQuestions).toHaveBeenCalled();
      expect(startClarifying).toHaveBeenCalled();
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
    expect(screen.getByText('Waiting to generate...')).toBeDefined();
  });

  it('shows refine button on hover in refinement mode', () => {
    render(<DocSection section={baseSection} isRefinementMode={true} />);
    const refineButton = screen.getByText('Refine');
    expect(refineButton).toBeDefined();
  });

  it('does not show refine button when not in refinement mode', () => {
    render(<DocSection section={baseSection} isRefinementMode={false} />);
    expect(screen.queryByText('Refine')).toBeNull();
  });

  it('applies refinement via fallback when API is unavailable', async () => {
    const applyRefinement = vi.fn();
    mockUseWorkspace.mockReturnValue({
      applyRefinement,
      undoRefinement: vi.fn(),
      refinementHistory: [],
    });
    render(<DocSection section={baseSection} isRefinementMode={true} />);

    // Click refine to open the panel
    fireEvent.click(screen.getByText('Refine'));

    // Type in the refinement textarea
    const textarea = screen.getByPlaceholderText(/Make this more technical/i);
    fireEvent.change(textarea, { target: { value: 'Add pricing details' } });

    // Click Apply (async — uses fallback since API is mocked to reject)
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(applyRefinement).toHaveBeenCalledWith(
        expect.objectContaining({
          sectionId: 'sec-1',
          prompt: 'Add pricing details',
        })
      );
    });
  });
});
