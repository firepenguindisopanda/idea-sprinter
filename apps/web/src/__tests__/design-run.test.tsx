import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * The Workshop on the design pipeline (multi-agent-system HANDOFF §92-§93).
 *
 * Behind NEXT_PUBLIC_DESIGN_PIPELINE, choosing a direction starts a design run
 * - one checked plan, one writer - instead of the eleven-agent pipeline. It
 * speaks the same section events, plus `stage`, `ledger_checked` and a `design`
 * payload whose status must reach the reader.
 */

const streamDesign = vi.fn();
const streamDocument = vi.fn();
const getRunStatus = vi.fn();
const followRun = vi.fn();
const cancelRun = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    streamDesign: (...args: unknown[]) => streamDesign(...args),
    streamDocument: (...args: unknown[]) => streamDocument(...args),
    getRunStatus: (...args: unknown[]) => getRunStatus(...args),
    followRun: (...args: unknown[]) => followRun(...args),
    cancelRun: (...args: unknown[]) => cancelRun(...args),
  },
}));

import {
  cancelWorkspaceGeneration,
  designPipelineEnabled,
  resumeWorkspaceGeneration,
  runWorkspaceGeneration,
} from '@/lib/workspace-generate';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { ProgressiveDoc } from '@/components/workspace/progressive-doc';

type Event = Record<string, unknown>;

/** Drive whichever stream is called with a scripted list of events. */
function script(events: Event[]) {
  const play = async (_dir: string, _brief: string, onEvent: (e: Event) => void) => {
    events.forEach((event, i) => onEvent({ ...event, seq: i + 1 }));
  };
  streamDesign.mockImplementation(play);
  streamDocument.mockImplementation(play);
}

const section = (id: string, title: string, order: number, content: string): Event[] => [
  { type: 'section_start', section_id: id, title, order },
  { type: 'chunk', section_id: id, content: content.slice(0, 5) },
  { type: 'chunk', section_id: id, content: content.slice(5) },
  { type: 'section_complete', section_id: id, title, content },
];

const FINDING = { code: 'decision_no_cost', field: 'decisions[1].costs', detail: 'A decision names no cost.' };
const DESIGN = {
  status: 'checked',
  title: 'Photo blur',
  exercise_id: null,
  ledger: { numbers: [], decisions: [] },
  findings: [],
  context_ids: [],
  tokens: { input: 9000, output: 4000, total: 13000, calls: 3 },
  seconds: 180.5,
};

const RUN: Event[] = [
  { type: 'run_started', run_id: 'run-1' },
  { type: 'stage', stage: 'ledger', round: 1 },
  { type: 'ledger_checked', passed: false, findings: [FINDING], round: 1 },
  { type: 'stage', stage: 'ledger', round: 2 },
  { type: 'ledger_checked', passed: true, findings: [], round: 2 },
  { type: 'stage', stage: 'writer', round: 1 },
  ...section('sec-design-requirements-and-scope', '1. Requirements and scope', 0, 'Blur faces before sharing.'),
  ...section('sec-design-estimates', '2. Estimates', 1, '300 photos/s at peak.'),
  { type: 'pipeline_complete', design: DESIGN },
];

describe('the Workshop on the design pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().reset();
    useWorkspaceStore.setState({ ideaInput: 'A photo sharing service that blurs faces.' });
    vi.stubEnv('NEXT_PUBLIC_DESIGN_PIPELINE', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts a design run for the chosen direction, with the brief', async () => {
    script(RUN);
    await runWorkspaceGeneration('dir-a');

    expect(streamDocument).not.toHaveBeenCalled();
    expect(streamDesign).toHaveBeenCalledTimes(1);
    const [directionId, brief] = streamDesign.mock.calls[0];
    expect(directionId).toBe('dir-a');
    expect(brief).toContain('A photo sharing service that blurs faces.');
  });

  it('runs the old pipeline when the flag is off', async () => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_PIPELINE', '');
    script([{ type: 'pipeline_complete' }]);
    await runWorkspaceGeneration('dir-a');

    expect(streamDesign).not.toHaveBeenCalled();
    expect(streamDocument).toHaveBeenCalledTimes(1);
    const state = useWorkspaceStore.getState();
    expect(state.design).toBeNull();
    expect(state.designProgress).toBeNull();
    expect(state.phase).toBe('refinement');
  });

  it('folds the run into sections, its progress and its result', async () => {
    script(RUN);
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.documentSections.map((s) => [s.id, s.title, s.status, s.content])).toEqual([
      ['sec-design-requirements-and-scope', '1. Requirements and scope', 'complete', 'Blur faces before sharing.'],
      ['sec-design-estimates', '2. Estimates', 'complete', '300 photos/s at peak.'],
    ]);
    expect(state.designProgress).toEqual({
      stage: 'writer',
      round: 1,
      ledgerRounds: [
        { round: 1, passed: false, findings: [FINDING] },
        { round: 2, passed: true, findings: [] },
      ],
    });
    expect(state.design).toEqual(DESIGN);
    expect(state.phase).toBe('refinement');
    expect(state.runId).toBeNull();
    expect(state.projectTitle).toBe('Photo blur');
  });

  it('keeps a title the user already gave', async () => {
    useWorkspaceStore.setState({ projectTitle: 'My blur service' });
    script(RUN);
    await runWorkspaceGeneration('dir-a');
    expect(useWorkspaceStore.getState().projectTitle).toBe('My blur service');
  });

  it('shows the progress while the document is still being written', async () => {
    let during: ReturnType<typeof useWorkspaceStore.getState> | null = null;
    streamDesign.mockImplementation(async (_dir: string, _brief: string, onEvent: (e: Event) => void) => {
      RUN.slice(0, 8).forEach((event, i) => onEvent({ ...event, seq: i + 1 }));
      during = useWorkspaceStore.getState();
    });
    await runWorkspaceGeneration('dir-a');

    const state = during!;
    expect(state.designProgress?.stage).toBe('writer');
    expect(state.design).toBeNull();
    expect(state.documentSections).toHaveLength(1);
    expect(state.documentSections[0]).toMatchObject({ status: 'generating', content: 'Blur ' });
    expect(state.phase).toBe('generating');
  });

  it('does not stay "generating" when the stream ends before the run does', async () => {
    // Found in review: a stream that closed without `pipeline_complete` left
    // the phase on `generating` with nothing attached, and the section's dot
    // pulsing for work that was not happening.
    script(RUN.slice(0, 8));
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('interrupted');
    expect(state.documentSections[0].status).toBe('pending');
    // Still the run to rejoin, if it is alive on the server.
    expect(state.runId).toBe('run-1');
  });

  it('stops the pulse on a section a failed run left unfinished', async () => {
    const message = 'The model service failed while the design was being written.';
    script([
      ...RUN.slice(0, 8),
      { type: 'error', stage: 'writer', message, content: message },
      { type: 'pipeline_complete', design: { ...DESIGN, status: 'failed' } },
    ]);
    await runWorkspaceGeneration('dir-a');
    expect(useWorkspaceStore.getState().documentSections.map((s) => s.status)).toEqual(['pending']);
  });

  it('drops the events of a stream once the workspace has moved on', async () => {
    // Found in review: "New project" reset the store while the old stream was
    // still open, and its later events rebuilt the old run in the new project
    // - its sections, its status, its title, and the refinement phase.
    streamDesign.mockImplementation(async (_dir: string, _brief: string, onEvent: (e: Event) => void) => {
      RUN.slice(0, 8).forEach((event, i) => onEvent({ ...event, seq: i + 1 }));
      useWorkspaceStore.getState().reset();
      RUN.slice(8).forEach((event, i) => onEvent({ ...event, seq: i + 9 }));
    });
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('idea_input');
    expect(state.documentSections).toEqual([]);
    expect(state.design).toBeNull();
    expect(state.designProgress).toBeNull();
    expect(state.projectTitle).toBe('');
  });

  it('drops them when a second run has taken its place, too', async () => {
    streamDesign.mockImplementation(async (_dir: string, _brief: string, onEvent: (e: Event) => void) => {
      RUN.slice(0, 8).forEach((event, i) => onEvent({ ...event, seq: i + 1 }));
      useWorkspaceStore.getState().reset();
      useWorkspaceStore.setState({ phase: 'generating', runId: 'run-2' });
      RUN.slice(8).forEach((event, i) => onEvent({ ...event, seq: i + 9 }));
    });
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.runId).toBe('run-2');
    expect(state.phase).toBe('generating');
    expect(state.documentSections).toEqual([]);
    expect(state.design).toBeNull();
  });

  it('drops the earlier draft when the writer starts again', async () => {
    // The revision, or a retry after a dropped stream: the document is sent
    // again from its first section, and a section only the first draft had
    // must not stay on the page.
    script([
      { type: 'stage', stage: 'ledger', round: 1 },
      { type: 'ledger_checked', passed: true, findings: [], round: 1 },
      { type: 'stage', stage: 'writer', round: 1 },
      ...section('sec-design-requirements-and-scope', '1. Requirements and scope', 0, 'First draft.'),
      ...section('sec-design-a-stray-heading', 'A stray heading', 1, 'Only in the first draft.'),
      { type: 'stage', stage: 'writer', round: 2 },
      ...section('sec-design-requirements-and-scope', '1. Requirements and scope', 0, 'Second draft.'),
      { type: 'pipeline_complete', design: DESIGN },
    ]);
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.documentSections.map((s) => [s.id, s.content])).toEqual([
      ['sec-design-requirements-and-scope', 'Second draft.'],
    ]);
    expect(state.designProgress).toMatchObject({ stage: 'writer', round: 2 });
  });

  it.each(['ledger_unresolved', 'document_unresolved'])('keeps a %s status with its findings', async (status) => {
    const finding = { source: status === 'ledger_unresolved' ? 'ledger' : 'document', ...FINDING };
    script([...RUN.slice(0, -1), { type: 'pipeline_complete', design: { ...DESIGN, status, findings: [finding] } }]);
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.design?.status).toBe(status);
    expect(state.design?.findings).toEqual([finding]);
    expect(state.phase).toBe('refinement');
  });

  it('ends a failed run with its message and the way to retry', async () => {
    const message = 'The model service failed while the design was being planned. Try again in a minute.';
    script([
      { type: 'run_started', run_id: 'run-1' },
      { type: 'stage', stage: 'ledger', round: 1 },
      { type: 'error', stage: 'ledger', message, content: message, detail: 'RuntimeError: 503' },
      { type: 'pipeline_complete', design: { ...DESIGN, status: 'failed', ledger: null } },
    ]);
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.error).toBe(message);
    expect(state.design?.status).toBe('failed');
    // Not "refinement": there is no document to refine. `interrupted` is the
    // phase that offers "Write it again".
    expect(state.phase).toBe('interrupted');
    expect(state.runId).toBeNull();
  });

  it('clears the last run before a new one starts', async () => {
    useWorkspaceStore.setState({
      design: { ...DESIGN, status: 'failed' } as never,
      designProgress: { stage: 'writer', round: 2, ledgerRounds: [] },
    });
    script([{ type: 'stage', stage: 'ledger', round: 1 }]);
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.design).toBeNull();
    expect(state.designProgress).toEqual({ stage: 'ledger', round: 1, ledgerRounds: [] });
  });

  it('applies a rejoined run the same way', async () => {
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 2, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'running', last_seq: 9 });
    followRun.mockImplementation(async (_run: string, _seq: number, onEvent: (e: Event) => void) => {
      RUN.slice(3).forEach((event, i) => onEvent({ ...event, seq: i + 3 }));
    });

    expect(await resumeWorkspaceGeneration()).toBe(true);
    const state = useWorkspaceStore.getState();
    expect(state.design).toEqual(DESIGN);
    expect(state.documentSections).toHaveLength(2);
    expect(state.phase).toBe('refinement');
  });

  it('replays a run that finished while the tab was away', async () => {
    // Found in review: a design takes about four minutes, so "finished while
    // I was reloading" is the common case - and it was refused, leaving
    // "Generation stopped" over a design that had in fact been written.
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 2, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'complete', last_seq: RUN.length - 1 });
    followRun.mockImplementation(async (_run: string, _seq: number, onEvent: (e: Event) => void) => {
      RUN.slice(3).forEach((event, i) => onEvent({ ...event, seq: i + 3 }));
    });

    expect(await resumeWorkspaceGeneration()).toBe(true);
    expect(followRun).toHaveBeenCalledWith('run-1', 2, expect.any(Function));
    const state = useWorkspaceStore.getState();
    expect(state.design).toEqual(DESIGN);
    expect(state.phase).toBe('refinement');
  });

  it.each(['failed', 'cancelled'])('does not replay a %s run', async (status) => {
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 2, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status, last_seq: 4 });

    expect(await resumeWorkspaceGeneration()).toBe(false);
    expect(followRun).not.toHaveBeenCalled();
    expect(useWorkspaceStore.getState().phase).toBe('interrupted');
  });

  it('rejoins in the middle of a section and finishes it', async () => {
    // The store as a reload leaves it: one section whole, one half written.
    useWorkspaceStore.setState({
      runId: 'run-1',
      lastSeq: 11,
      phase: 'interrupted',
      designProgress: { stage: 'writer', round: 1, ledgerRounds: [] },
      documentSections: [
        {
          id: 'sec-design-requirements-and-scope',
          title: '1. Requirements and scope',
          status: 'complete',
          content: 'Blur faces before sharing.',
          order: 0,
        },
        { id: 'sec-design-estimates', title: '2. Estimates', status: 'pending', content: '300 p', order: 1 },
      ],
    });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'running', last_seq: 14 });
    followRun.mockImplementation(async (_run: string, _seq: number, onEvent: (e: Event) => void) => {
      RUN.slice(12).forEach((event, i) => onEvent({ ...event, seq: i + 12 }));
    });

    expect(await resumeWorkspaceGeneration()).toBe(true);
    expect(followRun).toHaveBeenCalledWith('run-1', 11, expect.any(Function));
    const state = useWorkspaceStore.getState();
    expect(state.documentSections.map((s) => [s.status, s.content])).toEqual([
      ['complete', 'Blur faces before sharing.'],
      ['complete', '300 photos/s at peak.'],
    ]);
    expect(state.design).toEqual(DESIGN);
  });

  it('does not stay "generating" when a rejoined stream ends early', async () => {
    useWorkspaceStore.setState({ runId: 'run-1', lastSeq: 2, phase: 'interrupted' });
    getRunStatus.mockResolvedValue({ run_id: 'run-1', status: 'running', last_seq: 9 });
    followRun.mockImplementation(async (_run: string, _seq: number, onEvent: (e: Event) => void) => {
      RUN.slice(3, 8).forEach((event, i) => onEvent({ ...event, seq: i + 3 }));
    });

    await resumeWorkspaceGeneration();
    expect(useWorkspaceStore.getState().phase).toBe('interrupted');
  });

  it('cancelling does not forget a run that started in the meantime', async () => {
    useWorkspaceStore.setState({ runId: 'run-1', phase: 'generating' });
    cancelRun.mockImplementation(async () => {
      useWorkspaceStore.setState({ runId: 'run-2' });
    });

    await cancelWorkspaceGeneration();
    expect(cancelRun).toHaveBeenCalledWith('run-1');
    expect(useWorkspaceStore.getState().runId).toBe('run-2');
  });

  it('renders the document section by section', async () => {
    script(RUN);
    await runWorkspaceGeneration('dir-a');
    render(<ProgressiveDoc />);

    expect(screen.getByText('1. Requirements and scope')).toBeTruthy();
    expect(screen.getByText('2. Estimates')).toBeTruthy();
    expect(screen.getByText(/Blur faces before sharing\./)).toBeTruthy();
    expect(screen.getByText(/300 photos\/s at peak\./)).toBeTruthy();
  });
});

describe('the design pipeline flag', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['1', 'production', true],
    ['0', 'development', false],
    ['', 'development', false],
    [undefined, 'development', true],
    [undefined, 'production', false],
    [undefined, 'test', false],
  ])('set to %s under %s is %s', (flag, mode, expected) => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_PIPELINE', flag as unknown as string);
    vi.stubEnv('NODE_ENV', mode);
    expect(designPipelineEnabled()).toBe(expected);
  });
});
