import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * The review scars a spec carries.
 *
 * The backend runs a critic, a skeptic and a judge over every section, and the
 * workspace used to drop all three in its stream handling - the user saw a clean
 * document with no sign it had been scrutinised. These cover the whole path:
 * stream -> store -> sidebar, and the saved-spec reader on the other end.
 */

const streamDocument = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    streamDocument: (...args: unknown[]) => streamDocument(...args),
  },
}));

import { runWorkspaceGeneration } from '@/lib/workspace-generate';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { QualitySidebar } from '@/components/workspace/quality-sidebar';
import { projectReview } from '@/lib/project-artifacts';

/** Drive the stream callback with a scripted list of events. */
function scriptStream(events: Array<Record<string, unknown>>) {
  streamDocument.mockImplementation(
    async (_dir: string, _brief: string, onEvent: (e: Record<string, unknown>) => void) => {
      for (const event of events) onEvent(event);
    },
  );
}

const CRITIC = {
  type: 'review',
  kind: 'critic',
  section_id: 'sec-solution_architect',
  role: 'solution_architect',
  score: 7.5,
  passed: true,
  summary: 'Solid but thin on failure modes.',
  dimensions: [
    { name: 'completeness', score: 7, justification: 'Covers the happy path only.' },
  ],
};

const SKEPTIC = {
  type: 'review',
  kind: 'skeptic',
  section_id: 'sec-solution_architect',
  role: 'solution_architect',
  risk_level: 'high',
  summary: 'Single point of failure.',
  attack_vectors: [
    {
      id: 'av-1',
      category: 'feasibility',
      description: 'The queue has no dead-letter path.',
      severity: 'high',
      suggested_fix: 'Add a DLQ.',
    },
  ],
};

const JUDGE = {
  type: 'review',
  kind: 'judge',
  section_id: 'sec-solution_architect',
  role: 'solution_architect',
  score: 6,
  approved: false,
  issues_count: 2,
  recommended_action: 'partial',
  feedback: 'Address the DLQ gap.',
};

describe('review events fold into the store', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
    streamDocument.mockReset();
  });

  it('merges critic, skeptic and judge into one review per section', async () => {
    scriptStream([CRITIC, SKEPTIC, JUDGE, { type: 'pipeline_complete' }]);
    await runWorkspaceGeneration('dir-a');

    const review = useWorkspaceStore.getState().reviews['sec-solution_architect'];
    expect(review.role).toBe('solution_architect');
    expect(review.critic?.score).toBe(7.5);
    expect(review.skeptic?.riskLevel).toBe('high');
    expect(review.judge?.score).toBe(6);
    expect(review.judge?.approved).toBe(false);
  });

  it('keeps a partial review when only some reviewers have reported', async () => {
    // The three arrive as separate events; a section criticised but not yet
    // judged must still render what it has rather than nothing.
    scriptStream([CRITIC, { type: 'pipeline_complete' }]);
    await runWorkspaceGeneration('dir-a');

    const review = useWorkspaceStore.getState().reviews['sec-solution_architect'];
    expect(review.critic?.summary).toBe('Solid but thin on failure modes.');
    expect(review.judge).toBeUndefined();
  });

  it('stores contradictions from pipeline_complete', async () => {
    scriptStream([
      {
        type: 'pipeline_complete',
        contradictions: [
          {
            type: 'property_conflict',
            detail: 'Conflicting storage choice for Orders',
            severity: 'high',
            roles: ['solution_architect', 'data_architect'],
          },
        ],
      },
    ]);
    await runWorkspaceGeneration('dir-a');

    const { contradictions, phase } = useWorkspaceStore.getState();
    expect(contradictions).toHaveLength(1);
    expect(contradictions[0].detail).toBe('Conflicting storage choice for Orders');
    expect(phase).toBe('refinement');
  });

  it('ignores a review event with no section to attach to', async () => {
    scriptStream([{ ...CRITIC, section_id: undefined }, { type: 'pipeline_complete' }]);
    await runWorkspaceGeneration('dir-a');
    expect(useWorkspaceStore.getState().reviews).toEqual({});
  });
});

describe('QualitySidebar', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it('renders nothing before any verdict arrives', () => {
    const { container } = render(<QualitySidebar />);
    expect(container.firstChild).toBeNull();
  });

  it('summarises approvals and shows the verdict per section', () => {
    useWorkspaceStore.getState().mergeSectionReview('sec-a', 'solution_architect', {
      judge: {
        score: 6,
        approved: false,
        issuesCount: 2,
        recommendedAction: 'partial',
        feedback: 'Address the DLQ gap.',
      },
    });
    useWorkspaceStore.getState().mergeSectionReview('sec-b', 'data_architect', {
      judge: {
        score: 9,
        approved: true,
        issuesCount: 0,
        recommendedAction: 'accept',
        feedback: '',
      },
    });

    render(<QualitySidebar />);
    expect(screen.getByText(/1\/2 approved/)).toBeDefined();
    expect(screen.getByText(/avg 7\.5/)).toBeDefined();
    expect(screen.getByText('Solution Architect')).toBeDefined();
    expect(screen.getByText('6/10')).toBeDefined();
    expect(screen.getByText('9/10')).toBeDefined();
  });

  it('reveals the attack vectors behind a section on expand', () => {
    useWorkspaceStore.getState().mergeSectionReview('sec-a', 'solution_architect', {
      skeptic: {
        riskLevel: 'high',
        summary: 'Single point of failure.',
        attackVectors: [
          {
            id: 'av-1',
            category: 'feasibility',
            description: 'The queue has no dead-letter path.',
            severity: 'high',
            suggested_fix: 'Add a DLQ.',
          },
        ],
      },
    });

    render(<QualitySidebar />);
    // Collapsed by default: the count is visible, the detail is not.
    expect(screen.getByText('1 attack')).toBeDefined();
    expect(screen.queryByText(/dead-letter path/)).toBeNull();

    fireEvent.click(screen.getByText('Solution Architect'));
    expect(screen.getByText(/dead-letter path/)).toBeDefined();
    expect(screen.getByText(/Add a DLQ/)).toBeDefined();
  });

  it('surfaces cross-agent contradictions above the per-section cards', () => {
    useWorkspaceStore.getState().setContradictions([
      {
        type: 'property_conflict',
        detail: 'Conflicting storage choice for Orders',
        severity: 'high',
        roles: ['solution_architect', 'data_architect'],
      },
    ]);

    render(<QualitySidebar />);
    expect(screen.getByText(/1 cross-agent contradiction/)).toBeDefined();
    expect(screen.getByText('Conflicting storage choice for Orders')).toBeDefined();
    expect(screen.getByText('Solution Architect, Data Architect')).toBeDefined();
  });
});

describe('projectReview', () => {
  it('reads the review a saved spec carries', () => {
    const review = projectReview({
      solution_architect: '## Architecture',
      _review: {
        judge_results: {
          solution_architect: {
            is_approved: false,
            score: 6,
            issues_count: 2,
            recommended_action: 'partial',
            feedback: 'Address the DLQ gap.',
          },
        },
        contradictions: [{ type: 'property_conflict', detail: 'x', severity: 'high' }],
      },
    });
    expect(review.judgeResults.solution_architect.score).toBe(6);
    expect(review.contradictions).toHaveLength(1);
  });

  it('returns empty for specs saved before reviews were persisted', () => {
    // The detail page used to hardcode `judge_results: {}`; older projects
    // genuinely have nothing, and must not throw on the way to showing that.
    expect(projectReview({ solution_architect: '## Architecture' })).toEqual({
      judgeResults: {},
      contradictions: [],
    });
    expect(projectReview(null)).toEqual({ judgeResults: {}, contradictions: [] });
  });

  it('does not let the review block be counted as an agent', async () => {
    const { agentRoles } = await import('@/lib/project-artifacts');
    const roles = agentRoles({
      solution_architect: '## Architecture',
      _review: { judge_results: {}, contradictions: [] },
    });
    expect(roles).toEqual(['solution_architect']);
  });
});

/**
 * What a real model actually returns.
 *
 * The sidebar was built against stubs and then checked against a live
 * twenty-two-minute pipeline run. Every field below arrived populated, and
 * three of them were being carried across the wire and dropped by the UI: the
 * critic's summary paragraph, the per-dimension `issues` list (the actionable
 * half - `justification` is mostly praise), and the judge's recommended action.
 */
describe('QualitySidebar against live payload shapes', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  function seedLiveReview() {
    const store = useWorkspaceStore.getState();
    store.addDocSection({ id: 'sec-a', title: 'Product Owner', status: 'complete', content: 'x', order: 0 });
    store.mergeSectionReview('sec-a', 'product_owner', {
      critic: {
        score: 8.6,
        passed: true,
        summary: 'The product requirements document is well-structured and clear.',
        dimensions: [
          {
            name: 'Feature Completeness',
            score: 8,
            justification: 'The key features are well-defined.',
            issues: ['Some features could benefit from more detailed acceptance criteria.'],
          },
          { name: 'Vision Clarity', score: 9, justification: 'The product vision is clearly stated.', issues: [] },
        ],
      },
      judge: {
        score: 8,
        approved: true,
        issuesCount: 1,
        recommendedAction: 'accept',
        feedback: 'Critic score 8.6 meets threshold.',
      },
    });
  }

  it('shows the concrete issues, not only the justification prose', async () => {
    seedLiveReview();
    render(<QualitySidebar />);
    fireEvent.click(screen.getByRole('button', { name: /Product Owner/i }));

    expect(
      await screen.findByText(/more detailed acceptance criteria/i),
    ).toBeTruthy();
    // A dimension with nothing wrong still explains its score.
    expect(screen.getByText(/The product vision is clearly stated/i)).toBeTruthy();
  });

  it("shows the critic's summary and the judge's verdict", async () => {
    seedLiveReview();
    render(<QualitySidebar />);
    fireEvent.click(screen.getByRole('button', { name: /Product Owner/i }));

    expect(await screen.findByText(/well-structured and clear/i)).toBeTruthy();
    expect(screen.getByText(/Verdict: accept/i)).toBeTruthy();
    expect(screen.getByText(/1 issue/i)).toBeTruthy();
  });

  it('says how much of the document was actually reviewed', () => {
    // The live run reviewed 3 of 11 sections. "3/3 approved" beside an
    // eleven-section document reads as though the whole thing passed, and this
    // panel exists to be the evidence - overclaiming here is the one thing it
    // cannot do.
    const store = useWorkspaceStore.getState();
    seedLiveReview();
    for (let i = 1; i < 5; i++) {
      store.addDocSection({ id: `sec-${i}`, title: `S${i}`, status: 'complete', content: 'x', order: i });
    }

    render(<QualitySidebar />);
    expect(screen.getByText(/1 of 5 sections were put through adversarial review/i)).toBeTruthy();
  });

  it('does not claim partial coverage when every section was reviewed', () => {
    seedLiveReview();
    render(<QualitySidebar />);
    expect(screen.queryByText(/sections were put through adversarial review/i)).toBeNull();
  });
});
