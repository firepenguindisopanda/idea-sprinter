import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * A design's status must reach the reader: in the Workshop while it runs and
 * when it is done, in what is saved, and on the saved project.
 *
 * It replaces the review sidebar for a design run - no critic, skeptic or
 * judge runs on that path, so there are no verdicts to show. What there is:
 * what the code checked, and what it still found.
 */

const saveWorkspace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/workspace',
  useSearchParams: () => new URLSearchParams(),
}));

const cancelRun = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    saveWorkspace: (...args: unknown[]) => saveWorkspace(...args),
    cancelRun: (...args: unknown[]) => cancelRun(...args),
    generateTitle: vi.fn(async () => ({ title: 'Untitled Project' })),
  },
  downloadProjectPdf: vi.fn(),
}));

import { DesignStatusPanel, DesignSummary, RunReport } from '@/components/workspace/design-status';
import { ProgressiveDoc } from '@/components/workspace/progressive-doc';
import { TopBar } from '@/components/workspace/top-bar';
import ResultsDisplay from '@/components/dashboard/results-display';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { agentRoles, isDesignDocument, projectDesign, projectSummaryBadge } from '@/lib/project-artifacts';
import type { DesignResult } from '@/types/workspace';

const LEDGER_FINDING = {
  source: 'ledger' as const,
  code: 'decision_no_cost',
  field: 'decisions[1].costs',
  detail: 'The decision names no cost.',
};
const DOCUMENT_FINDING = {
  source: 'document' as const,
  code: 'missing_section',
  field: '',
  detail: 'architecture - add it as a level-2 heading',
};

function design(overrides: Partial<DesignResult> = {}): DesignResult {
  return {
    status: 'checked',
    title: 'Photo blur',
    exercise_id: null,
    ledger: { numbers: [], decisions: [] },
    findings: [],
    context_ids: [],
    tokens: { input: 9000, output: 4000, total: 13000, calls: 3 },
    seconds: 181,
    ...overrides,
  };
}

describe('DesignStatusPanel', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it('renders nothing when no design run has started', () => {
    const { container } = render(<DesignStatusPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('says the design is being planned, and which round', () => {
    const store = useWorkspaceStore.getState();
    store.setDesignStage('ledger', 1);
    store.addLedgerRound({ round: 1, passed: false, findings: [LEDGER_FINDING] });
    store.setDesignStage('ledger', 2);

    render(<DesignStatusPanel />);
    expect(screen.getByText(/Planning the design/)).toBeTruthy();
    expect(screen.getByText(/round 2/i)).toBeTruthy();
    // What the first round failed is why there is a second.
    expect(screen.getByText(/Round 1: 1 check failed/)).toBeTruthy();
    expect(screen.getByText('The decision names no cost.')).toBeTruthy();
  });

  it('says a passed plan round passed', () => {
    const store = useWorkspaceStore.getState();
    store.setDesignStage('ledger', 1);
    store.addLedgerRound({ round: 1, passed: true, findings: [] });
    store.setDesignStage('writer', 1);

    render(<DesignStatusPanel />);
    expect(screen.getByText(/Round 1: passed/)).toBeTruthy();
    expect(screen.getByText(/Writing the design/)).toBeTruthy();
  });

  it('says the document is being revised on the second writer round', () => {
    useWorkspaceStore.getState().setDesignStage('writer', 2);
    render(<DesignStatusPanel />);
    expect(screen.getByText(/Revising the design/)).toBeTruthy();
  });

  it("says a keyed design is being graded against its exercise's key", () => {
    useWorkspaceStore.getState().setDesignStage('grade', 1);
    render(<DesignStatusPanel />);
    expect(screen.getByText(/Grading against the exercise's answer key/)).toBeTruthy();
    expect(screen.queryByText(/round 1 of/)).toBeNull();
  });

  it('shows the result in place of the progress once the run is done', () => {
    const store = useWorkspaceStore.getState();
    store.setDesignStage('writer', 1);
    store.setDesign(design());

    render(<DesignStatusPanel />);
    expect(screen.getByText('Checked against its plan')).toBeTruthy();
    expect(screen.queryByText(/Writing the design/)).toBeNull();
  });
});

describe('DesignSummary', () => {
  it('names what a checked design was checked against, and what the run cost', () => {
    render(<DesignSummary design={design()} />);
    expect(screen.getByText('Checked against its plan')).toBeTruthy();
    expect(screen.getByText(/3 model calls/)).toBeTruthy();
    expect(screen.getByText(/13,000 tokens/)).toBeTruthy();
    expect(screen.getByText(/3 min 1 s/)).toBeTruthy();
    expect(screen.queryByText(/still fail/i)).toBeNull();
  });

  it('shows an unresolved plan as unresolved, with what it still fails', () => {
    render(<DesignSummary design={design({ status: 'ledger_unresolved', findings: [LEDGER_FINDING] })} />);
    expect(screen.getByText('Plan unresolved')).toBeTruthy();
    expect(screen.queryByText('Checked against its plan')).toBeNull();
    expect(screen.getByText('The decision names no cost.')).toBeTruthy();
    expect(screen.getByText('decision_no_cost')).toBeTruthy();
    expect(screen.getByText(/decisions\[1\]\.costs/)).toBeTruthy();
    expect(screen.getByText('Plan')).toBeTruthy();
  });

  it('shows an unresolved document with its own findings', () => {
    render(<DesignSummary design={design({ status: 'document_unresolved', findings: [DOCUMENT_FINDING] })} />);
    expect(screen.getByText('Document unresolved')).toBeTruthy();
    expect(screen.getByText(/add it as a level-2 heading/)).toBeTruthy();
    expect(screen.getByText('Document')).toBeTruthy();
  });

  it('says a failed run wrote nothing', () => {
    render(<DesignSummary design={design({ status: 'failed', ledger: null })} />);
    expect(screen.getByText('Not written')).toBeTruthy();
  });

  it('shows what it can of a design saved in a shape it does not expect', () => {
    // A saved design is the owner's own JSON; one with odd contents must not
    // take the project page down with it.
    const odd = design({ tokens: {} as never, seconds: 12 });
    render(<DesignSummary design={odd} />);
    expect(screen.getByText('Checked against its plan')).toBeTruthy();
    expect(screen.queryByText(/model call/)).toBeNull();
  });

  it('shows a key grade as provisional: what it counted, and which model graded it', () => {
    const grade = { passed: 7, total: 13, core_passed: 2, core_total: 3, provisional: true, model: 'nvidia/nemotron-3-super' };
    render(<DesignSummary design={design({ exercise_id: 'bitly-link-health', key_grade: grade })} />);
    expect(screen.getByText(/Answer key · provisional/)).toBeTruthy();
    expect(screen.getByText(/7 of 13 checks · 2 of 3 core/)).toBeTruthy();
    expect(screen.getByText(/Graded by nvidia\/nemotron-3-super/)).toBeTruthy();
    expect(screen.getByText(/decides nothing/)).toBeTruthy();
    // A grade sits beside the status; it is not the status.
    expect(screen.getByText('Checked against its plan')).toBeTruthy();
  });

  it('shows no key grade for a design that has none', () => {
    render(<DesignSummary design={design({ key_grade: null })} />);
    expect(screen.queryByText(/Answer key/)).toBeNull();
  });

  it('counts one call and one second in the singular', () => {
    render(
      <DesignSummary
        design={design({ tokens: { input: 1, output: 1, total: 2, calls: 1 }, seconds: 1 })}
      />,
    );
    expect(screen.getByText(/1 model call ·/)).toBeTruthy();
    expect(screen.getByText(/· 1 s/)).toBeTruthy();
  });
});

describe('RunReport', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  const judge = { score: 6, approved: false, issuesCount: 2, recommendedAction: 'partial', feedback: 'x' };

  it('is the review sidebar for the old pipeline', () => {
    useWorkspaceStore.getState().mergeSectionReview('sec-a', 'solution_architect', { judge });
    render(<RunReport />);
    expect(screen.getByText('Review')).toBeTruthy();
    expect(screen.getByText(/0\/1 approved/)).toBeTruthy();
  });

  it('is the design status for a design run, with no review claims', () => {
    const store = useWorkspaceStore.getState();
    // Left over from an earlier run on the old pipeline.
    store.mergeSectionReview('sec-a', 'solution_architect', { judge });
    store.setDesignStage('ledger', 1);
    store.setDesign(design({ status: 'ledger_unresolved', findings: [LEDGER_FINDING] }));

    render(<RunReport />);
    expect(screen.getByText('Plan unresolved')).toBeTruthy();
    expect(screen.queryByText('Review')).toBeNull();
    expect(screen.queryByText(/approved/)).toBeNull();
  });
});

describe('saving a design', () => {
  const sections = [
    { id: 'sec-design-estimates', title: '2. Estimates', status: 'complete' as const, content: '300 photos/s.', order: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
    saveWorkspace.mockResolvedValue({ id: 7, title: 'Photo blur' });
    useWorkspaceStore.setState({
      phase: 'refinement',
      ideaInput: 'A photo sharing service that blurs faces.',
      projectTitle: 'Photo blur',
      selectedDirectionId: 'dir-a',
      documentSections: sections,
    });
  });

  it('sends the design, with its status, and the brief it was written from', async () => {
    const result = design({ status: 'ledger_unresolved', findings: [LEDGER_FINDING] });
    useWorkspaceStore.setState({ design: result });

    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    const payload = saveWorkspace.mock.calls[0][0];
    expect(payload.design).toEqual(result);
    expect(payload.brief).toContain('A photo sharing service that blurs faces.');
    expect(payload.sections).toEqual([
      { id: 'sec-design-estimates', title: '2. Estimates', content: '300 photos/s.', order: 0 },
    ]);
  });

  it('sends no design for a document the old pipeline wrote', async () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    const payload = saveWorkspace.mock.calls[0][0];
    expect('design' in payload).toBe(false);
    expect(payload.brief).toBe('');
  });

  it('will not save a design that has no status yet', async () => {
    // Found in review: Save is offered while the document streams, and a
    // design saved then has no `_design` - so the dashboard showed a
    // half-written draft as an ordinary, verified specification.
    useWorkspaceStore.setState({
      phase: 'generating',
      designProgress: { stage: 'writer', round: 1, ledgerRounds: [] },
      design: null,
    });

    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await Promise.resolve();
    expect(saveWorkspace).not.toHaveBeenCalled();
  });

  it('will not save one the user kept after it stopped, either', async () => {
    useWorkspaceStore.setState({
      phase: 'refinement', // "Keep what I have", after an interrupted run
      designProgress: { stage: 'writer', round: 1, ledgerRounds: [] },
      design: null,
    });

    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await Promise.resolve();
    expect(saveWorkspace).not.toHaveBeenCalled();
  });
});

describe('a design in the Workshop', () => {
  const section = {
    id: 'sec-design-estimates',
    title: '2. Estimates',
    status: 'complete' as const,
    content: '300 photos/s.',
    order: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
  });

  it('offers no refine on a section of a design', () => {
    // Found in review: a section could be refined after the run and the
    // design saved with its original status - "Checked against its plan" over
    // text no check ever saw. Nothing can re-check a refined section yet, so
    // for a design the refine box is not offered.
    useWorkspaceStore.setState({ phase: 'refinement', documentSections: [section], design: design() });
    render(<ProgressiveDoc />);
    expect(screen.getByText('2. Estimates')).toBeTruthy();
    expect(screen.queryByTitle('Refine section')).toBeNull();
  });

  it('still offers it on a document the old pipeline wrote', () => {
    useWorkspaceStore.setState({
      phase: 'refinement',
      documentSections: [{ ...section, id: 'sec-solution-architect', title: 'Solution Architect' }],
    });
    render(<ProgressiveDoc />);
    expect(screen.getByTitle('Refine section')).toBeTruthy();
  });

  it('stops the run on the server when a new project is started', async () => {
    // Found in review: "New project" only reset the store. The run went on,
    // spending tokens, with nothing in the app able to stop it.
    useWorkspaceStore.setState({
      phase: 'generating',
      runId: 'run-1',
      projectTitle: 'Photo blur',
      documentSections: [section],
      designProgress: { stage: 'writer', round: 1, ledgerRounds: [] },
    });
    cancelRun.mockResolvedValue(undefined);

    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    fireEvent.click(await screen.findByRole('button', { name: /discard and start new/i }));

    await waitFor(() => expect(cancelRun).toHaveBeenCalledWith('run-1'));
    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('idea_input');
    expect(state.runId).toBeNull();
    expect(state.designProgress).toBeNull();
  });
});

describe('a saved design on the project page', () => {
  // Found on the first live run: the results view stamps every section
  // "Verified", whatever the project is. Under a design's own status - which
  // may be "Plan unresolved" - that is a claim nobody checked.
  const results = {
    markdown_outputs: { 'sec-design-estimates': '300 photos/s at peak.' },
    judge_results: {},
  };
  const labels = { 'sec-design-estimates': '2. Estimates' };

  beforeEach(() => {
    // The results view watches its headings for a table of contents; jsdom
    // has no IntersectionObserver.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not stamp a design section as verified', () => {
    render(<ResultsDisplay results={results} outputLabels={labels} hideActions sectionsVerified={false} />);
    expect(screen.getAllByText('2. Estimates').length).toBeGreaterThan(0);
    expect(screen.queryByText('Verified')).toBeNull();
  });

  it('leaves the old view as it was', () => {
    render(<ResultsDisplay results={results} outputLabels={labels} hideActions />);
    expect(screen.getByText('Verified')).toBeTruthy();
  });
});

describe('projectDesign', () => {
  const artifacts = {
    _workspace: { type: 'workspace_spec', sections: [{ id: 'sec-design-estimates', title: '2. Estimates', content: 'x', order: 0 }] },
    _design: design({ status: 'document_unresolved', findings: [DOCUMENT_FINDING] }),
  };

  it('reads the design a saved project carries', () => {
    const saved = projectDesign(artifacts);
    expect(saved?.status).toBe('document_unresolved');
    expect(saved?.findings).toEqual([DOCUMENT_FINDING]);
  });

  it('is null for a project that is not a design', () => {
    expect(projectDesign({ solution_architect: '## Architecture' })).toBeNull();
    expect(projectDesign(null)).toBeNull();
  });

  it('is null for a design with no status it knows', () => {
    // Never guess a status: a design without one is shown as no design at all,
    // not as a checked one.
    expect(projectDesign({ _design: { findings: [] } })).toBeNull();
    expect(projectDesign({ _design: { status: 'approved', findings: [] } })).toBeNull();
    expect(projectDesign({ _design: 'checked' })).toBeNull();
  });

  it('tolerates a saved design with no findings list', () => {
    expect(projectDesign({ _design: { status: 'checked' } })?.findings).toEqual([]);
  });

  it('does not count the design as an agent', () => {
    expect(agentRoles(artifacts)).toEqual([]);
    expect(projectSummaryBadge(artifacts)).toBe('1 Section');
  });

  it('keeps only what it can show of the findings and the cost', () => {
    const saved = projectDesign({
      _design: {
        status: 'ledger_unresolved',
        findings: [null, 'text', { code: 'c' }, { ...LEDGER_FINDING, detail: { nested: true } }, LEDGER_FINDING],
        tokens: { total: 'many' },
        seconds: 'long',
      },
    });
    expect(saved?.findings).toEqual([LEDGER_FINDING]);
    expect(saved?.tokens).toBeUndefined();
    expect(saved?.seconds).toBeUndefined();
  });

  it('keeps a key grade only when it is counts and a model', () => {
    const grade = { passed: 7, total: 13, core_passed: 2, core_total: 3, provisional: true, model: 'm' };
    expect(projectDesign({ _design: { status: 'checked', key_grade: grade } })?.key_grade).toEqual(grade);
    expect(projectDesign({ _design: { status: 'checked', key_grade: { ...grade, passed: 'most' } } })?.key_grade).toBeNull();
    expect(projectDesign({ _design: { status: 'checked', key_grade: 'good' } })?.key_grade).toBeNull();
    expect(projectDesign({ _design: { status: 'checked' } })?.key_grade).toBeNull();
  });
});

describe('isDesignDocument', () => {
  it('knows a design by its saved result, or by its sections alone', () => {
    const sections = [{ id: 'sec-design-estimates', title: '2. Estimates', content: 'x', order: 0 }];
    expect(isDesignDocument({ _workspace: { sections }, _design: { status: 'checked' } })).toBe(true);
    // A design saved without its result (before the Workshop refused to):
    // still no agent's reviewed output, so still not "Verified".
    expect(isDesignDocument({ _workspace: { sections } })).toBe(true);
    expect(isDesignDocument({ _workspace: { sections: [{ ...sections[0], id: 'sec-solution-architect' }] } })).toBe(
      false,
    );
    expect(isDesignDocument({ solution_architect: '## Architecture' })).toBe(false);
    expect(isDesignDocument(null)).toBe(false);
  });
});
