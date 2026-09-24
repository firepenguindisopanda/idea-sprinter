import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * The must-haves the backend checks in code, shown in the review sidebar.
 *
 * Since multi-agent-system HANDOFF §55 a section that fails one - most often a
 * described component left off its architecture diagram - is sent back for
 * another attempt whatever the critic scored. If it still fails after the
 * retries, it reaches the user unapproved, and the reason has to be visible:
 * before this the sidebar showed a critic score of 8 beside a "Not approved"
 * shield and nothing to connect them.
 */

const refineSection = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    refineSection: (...args: unknown[]) => refineSection(...args),
  },
}));

import { useWorkspaceStore } from '@/lib/workspace-store';
import { QualitySidebar } from '@/components/workspace/quality-sidebar';
import type { MustHaveFinding } from '@/types/workspace';

const DIAGRAM: MustHaveFinding = {
  code: 'sa_diagram_missing_component',
  message:
    'The architecture diagram leaves out components the text describes: ETL Processor. ' +
    'Add them to the diagram, or remove them from Core Components.',
  blocking: true,
};

const DEPENDENCY: MustHaveFinding = {
  code: 'ba_dependency_without_reason',
  message: 'Some dependencies (1 of 7) do not say why they exist.',
  blocking: false,
};

const ORIGINAL = '## Architecture\nA diagram without the ETL Processor.';
const FIXED = '## Architecture\nA diagram with the ETL Processor.';

function seed(mustHaves: MustHaveFinding[] | undefined) {
  const store = useWorkspaceStore.getState();
  store.addDocSection({ id: 'sec-sa', title: 'Solution Architecture', status: 'complete', content: ORIGINAL, order: 0 });
  store.mergeSectionReview('sec-sa', 'solution_architect', {
    critic: { score: 8, passed: true, summary: '', dimensions: [] },
    judge: {
      score: 8,
      approved: false,
      issuesCount: 0,
      recommendedAction: 'retry',
      feedback: '',
      mustHaves,
    },
  });
  store.setPhase('refinement');
}

const expand = () => fireEvent.click(screen.getByText('Solution Architect'));

describe('must-have findings in the review sidebar', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
    refineSection.mockReset();
  });

  it('flags a failed must-have on the card without expanding it', () => {
    seed([DIAGRAM]);
    render(<QualitySidebar />);
    expect(screen.getByText('1 must-have failed')).toBeDefined();
  });

  it('counts only the findings that block', () => {
    seed([DIAGRAM, DEPENDENCY]);
    render(<QualitySidebar />);
    expect(screen.getByText('1 must-have failed')).toBeDefined();
  });

  it('lists each finding with whether it blocks approval', () => {
    seed([DIAGRAM, DEPENDENCY]);
    render(<QualitySidebar />);
    expand();
    expect(screen.getByText(DIAGRAM.message)).toBeDefined();
    expect(screen.getByText(DEPENDENCY.message)).toBeDefined();
    expect(screen.getByText('Blocks approval')).toBeDefined();
    expect(screen.getByText('Report only')).toBeDefined();
  });

  it('opens a card whose only detail is a must-have', () => {
    seed([DIAGRAM]);
    render(<QualitySidebar />);
    expand();
    expect(screen.getByText(DIAGRAM.message)).toBeDefined();
  });

  it('refines the section with the finding', async () => {
    refineSection.mockResolvedValue({ section_id: 'sec-sa', content: FIXED, suggestions: [] });
    seed([DIAGRAM]);
    render(<QualitySidebar />);
    expand();

    fireEvent.click(screen.getByRole('button', { name: `Fix: ${DIAGRAM.message}` }));

    await waitFor(() =>
      expect(useWorkspaceStore.getState().documentSections[0].content).toBe(FIXED),
    );
    const [, sent, prompt] = refineSection.mock.calls[0];
    expect(sent).toBe(ORIGINAL);
    expect(prompt).toContain(DIAGRAM.message);
    expect(screen.getByText('Applied')).toBeDefined();
  });

  it('does not repeat a must-have that also leads the verdict feedback', () => {
    // The backend puts the finding first in the retry's feedback (§55), so
    // the feedback and the list carry the same sentence.
    const store = useWorkspaceStore.getState();
    seed([DIAGRAM]);
    store.mergeSectionReview('sec-sa', 'solution_architect', {
      judge: {
        score: 8,
        approved: false,
        issuesCount: 0,
        recommendedAction: 'retry',
        feedback: `${DIAGRAM.message}\n\nConsider naming a secrets store.`,
        mustHaves: [DIAGRAM],
      },
    });
    render(<QualitySidebar />);
    expand();
    expect(screen.getAllByText(DIAGRAM.message)).toHaveLength(1);
    expect(screen.getByText('Consider naming a secrets store.')).toBeDefined();
    expect(screen.getByText(/Verdict: retry/)).toBeDefined();
  });

  it('shows nothing extra for a section that passed them all', () => {
    seed([]);
    render(<QualitySidebar />);
    expect(screen.queryByText(/must-have/i)).toBeNull();
  });

  it('shows nothing extra for a review saved before findings existed', () => {
    seed(undefined);
    render(<QualitySidebar />);
    expect(screen.queryByText(/must-have/i)).toBeNull();
  });
});
