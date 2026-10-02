import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Tier 2 on the client: a session with one source of truth, and a generation
 * that survives losing its connection.
 */

const getRunStatus = vi.fn();
const followRun = vi.fn(async (..._args: unknown[]) => {});
const streamDocument = vi.fn(async (..._args: unknown[]) => {});
const cancelRun = vi.fn(async (..._args: unknown[]) => {});

vi.mock('@/lib/api', () => ({
  api: {
    getRunStatus: (...args: unknown[]) => getRunStatus(...args),
    followRun: (...args: unknown[]) => followRun(...args),
    streamDocument: (...args: unknown[]) => streamDocument(...args),
    cancelRun: (...args: unknown[]) => cancelRun(...args),
    setToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

import { useWorkspaceStore } from '@/lib/workspace-store';
import { resumeWorkspaceGeneration } from '@/lib/workspace-generate';
import { ProgressiveDoc } from '@/components/workspace/progressive-doc';

describe('resuming a run after the connection drops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
  });

  it('does nothing when there is no run to rejoin', async () => {
    expect(await resumeWorkspaceGeneration()).toBe(false);
    expect(getRunStatus).not.toHaveBeenCalled();
  });

  it('re-attaches from the last event it saw, not from the beginning', async () => {
    // The whole point of `after_seq`: a reload eleven agents into a twelve-agent
    // pipeline must not replay - or pay for - the eleven.
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 42, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'running', last_seq: 50 });
    let whileFollowing = '';
    followRun.mockImplementationOnce(async () => {
      whileFollowing = useWorkspaceStore.getState().phase;
    });

    expect(await resumeWorkspaceGeneration()).toBe(true);
    expect(followRun).toHaveBeenCalledWith('run-1', 42, expect.any(Function));
    expect(whileFollowing).toBe('generating');
  });

  it('reads the ending of a run that finished while the tab was away', async () => {
    // It used to refuse a finished run, so a reload near the end of a run
    // showed "Generation stopped" over a document the server had completed.
    // The events after `lastSeq` are still there to replay.
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 3, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'complete', last_seq: 9 });
    followRun.mockImplementationOnce(async (_run, _seq, onEvent) => {
      (onEvent as (e: Record<string, unknown>) => void)({ type: 'pipeline_complete', seq: 9 });
    });

    expect(await resumeWorkspaceGeneration()).toBe(true);
    expect(followRun).toHaveBeenCalledWith('run-1', 3, expect.any(Function));
    expect(useWorkspaceStore.getState().phase).toBe('refinement');
  });

  it('does not re-attach to a run that failed', async () => {
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 3, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'failed', last_seq: 9 });

    expect(await resumeWorkspaceGeneration()).toBe(false);
    expect(followRun).not.toHaveBeenCalled();
    // Stays interrupted so the retry affordance is still offered.
    expect(useWorkspaceStore.getState().phase).toBe('interrupted');
  });

  it('lands on interrupted, not stuck generating, when the rejoined stream ends early', async () => {
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 3, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'running', last_seq: 9 });

    expect(await resumeWorkspaceGeneration()).toBe(true);
    expect(useWorkspaceStore.getState().phase).toBe('interrupted');
  });

  it('reports failure rather than throwing when the run is gone', async () => {
    useWorkspaceStore.setState({ runId: 'run-1', phase: 'interrupted' });
    getRunStatus.mockRejectedValue(new Error('404'));

    expect(await resumeWorkspaceGeneration()).toBe(false);
  });

  it('never moves the resume marker backwards', async () => {
    // Replayed events arrive with sequence numbers already seen; letting those
    // lower the marker would make the next reconnect re-request them.
    const store = useWorkspaceStore.getState();
    store.setLastSeq(10);
    store.setLastSeq(4);
    expect(useWorkspaceStore.getState().lastSeq).toBe(10);
  });
});

describe('ProgressiveDoc after an interrupted run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
  });

  it('tries to rejoin before offering to start over', async () => {
    useWorkspaceStore.setState({
      runId: 'run-1',
      lastSeq: 5,
      phase: 'interrupted',
      selectedDirectionId: 'd1',
    });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'running', last_seq: 5 });
    // Never resolves: a live re-attach stays open for the rest of the run, and
    // that open state is what the banner is reporting.
    followRun.mockImplementation(() => new Promise(() => {}));

    render(<ProgressiveDoc />);

    await waitFor(() => expect(getRunStatus).toHaveBeenCalledWith('run-1'));
    await waitFor(() =>
      expect(screen.getByText(/Reconnecting to a run that is still going/i)).toBeTruthy(),
    );
  });

  it('offers a retry when there is nothing to rejoin', async () => {
    useWorkspaceStore.setState({ phase: 'interrupted', selectedDirectionId: 'd1' });

    render(<ProgressiveDoc />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Regenerate/i })).toBeTruthy(),
    );
    expect(getRunStatus).not.toHaveBeenCalled();
  });
});

describe('auth has one source of truth', () => {
  const ORIGINAL = globalThis.window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.window.localStorage.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: ORIGINAL,
    });
  });

  it('clears a token left behind by the old persisted store', async () => {
    // The split-brain: a 7-day cookie *and* a forever-persisted localStorage
    // entry. Once the cookie expired the store still rehydrated a truthy token,
    // so protected pages rendered, every request 401'd, and the redirect loop
    // repeated on every visit because nothing could clear localStorage.
    globalThis.window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { token: 'stale-token' }, version: 0 }),
    );

    const { useAuthStore } = await import('@/lib/auth-store');
    await useAuthStore.getState().initAuth();

    expect(globalThis.window.localStorage.getItem('auth-storage')).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('does not leave a stale token in the store when the cookie is gone', async () => {
    const { useAuthStore } = await import('@/lib/auth-store');
    useAuthStore.setState({ token: 'stale-token' });

    await useAuthStore.getState().initAuth();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
