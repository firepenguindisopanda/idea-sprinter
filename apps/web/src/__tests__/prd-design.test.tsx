import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/prd',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/markdown', () => ({
  Markdown: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    api: {
      getPrdStatus: vi.fn(),
      getPrdDoc: vi.fn(),
      downloadPrd: vi.fn(),
      startPrdDesign: vi.fn(),
      getRunStatus: vi.fn(),
      followRun: vi.fn(),
    },
  };
});

import { api } from '@/lib/api';
import PrdDocument from '@/components/prd/prd-document';
import { openWorkspaceRun } from '@/lib/workspace-generate';
import { useWorkspaceStore } from '@/lib/workspace-store';

const mocked = api as unknown as Record<string, ReturnType<typeof vi.fn>>;
const PRD = '# Product Requirements Document\n\n## 1. Product Vision\nWalks, ticked off.';

describe('"Design this" on the PRD page (revamp F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getPrdStatus.mockResolvedValue({ session_id: 's1', phase: 'complete', judge_approved: false, judge_score: 4 });
  });

  it('starts a design from the PRD and opens the Workshop on its run', async () => {
    mocked.startPrdDesign.mockResolvedValue('run-1');
    render(<PrdDocument sessionId="s1" generatedPrd={PRD} />);
    fireEvent.click(await screen.findByRole('button', { name: /Design this/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/workspace?run=run-1'));
    expect(mocked.startPrdDesign).toHaveBeenCalledWith('s1');
  });

  it('offers no way into the old generator, and no judge gate on the design', async () => {
    mocked.getPrdStatus.mockResolvedValue({ session_id: 's1', phase: 'complete', judge_approved: false, judge_score: 2 });
    render(<PrdDocument sessionId="s1" generatedPrd={PRD} />);
    const design = (await screen.findByRole('button', { name: /Design this/ })) as HTMLButtonElement;
    expect(design.disabled).toBe(false);
    expect(screen.queryByRole('button', { name: /Send to Pipeline/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Use as Project Description/i })).toBeNull();
  });

  // §130: the PRD judge is removed - it could never approve and gated nothing.
  it('shows no judge score', async () => {
    mocked.getPrdStatus.mockResolvedValue({ session_id: 's1', phase: 'complete', judge_approved: false, judge_score: 5 });
    render(<PrdDocument sessionId="s1" generatedPrd={PRD} />);
    await screen.findByRole('button', { name: /Design this/ });
    await waitFor(() => expect(mocked.getPrdStatus).toHaveBeenCalled());
    expect(screen.queryByText(/Judge/i)).toBeNull();
  });

  it('says why when the design could not start, and stays on the page', async () => {
    mocked.startPrdDesign.mockRejectedValue(new Error('SSE request failed: 409 Conflict'));
    render(<PrdDocument sessionId="s1" generatedPrd={PRD} />);
    fireEvent.click(await screen.findByRole('button', { name: /Design this/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/could not start/i);
    expect(push).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: /Design this/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('the Workshop opened on a run (revamp F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
  });

  it('starts a new project on that run, with the brief the server wrote it from, and follows it', async () => {
    useWorkspaceStore.setState({ ideaInput: 'an older idea', projectTitle: 'Old', savedProjectId: 7 });
    mocked.getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'running', kind: 'design', brief: 'PRD-BRIEF', last_seq: 0 });
    mocked.followRun.mockImplementation(async (_id: string, _after: number, onEvent: (e: unknown) => void) => {
      onEvent({ type: 'stage', stage: 'ledger', round: 1, seq: 1 });
    });
    await openWorkspaceRun('run-1');
    const state = useWorkspaceStore.getState();
    expect(mocked.followRun).toHaveBeenCalledWith('run-1', 0, expect.any(Function));
    expect(state.ideaInput).toBe('PRD-BRIEF');
    expect(state.projectTitle).toBe('');
    expect(state.savedProjectId).toBeNull();
    expect(state.designProgress).not.toBeNull();
  });

  it('leaves the workspace alone when it already follows that run', async () => {
    useWorkspaceStore.setState({ runId: 'run-1', ideaInput: 'kept', phase: 'interrupted' });
    await openWorkspaceRun('run-1');
    expect(mocked.getRunStatus).not.toHaveBeenCalled();
    expect(useWorkspaceStore.getState().ideaInput).toBe('kept');
  });

  it('says so when the run cannot be found, and keeps the work already there', async () => {
    useWorkspaceStore.setState({ ideaInput: 'unsaved idea', phase: 'refinement', runId: null });
    mocked.getRunStatus.mockRejectedValue(new Error('404'));
    await openWorkspaceRun('gone');
    const state = useWorkspaceStore.getState();
    expect(state.error).toMatch(/could not be opened/i);
    expect(state.runId).toBeNull();
    expect(state.ideaInput).toBe('unsaved idea');
    expect(state.phase).toBe('refinement');
  });
});
