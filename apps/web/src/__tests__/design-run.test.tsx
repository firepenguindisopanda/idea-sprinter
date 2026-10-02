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

vi.mock('@/lib/api', () => ({
  api: {
    streamDesign: (...args: unknown[]) => streamDesign(...args),
    streamDocument: (...args: unknown[]) => streamDocument(...args),
    getRunStatus: (...args: unknown[]) => getRunStatus(...args),
    followRun: (...args: unknown[]) => followRun(...args),
  },
}));

import { resumeWorkspaceGeneration, runWorkspaceGeneration } from '@/lib/workspace-generate';
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
    script(RUN.slice(0, 8));
    await runWorkspaceGeneration('dir-a');

    const state = useWorkspaceStore.getState();
    expect(state.designProgress?.stage).toBe('writer');
    expect(state.design).toBeNull();
    expect(state.documentSections).toHaveLength(1);
    expect(state.documentSections[0]).toMatchObject({ status: 'generating', content: 'Blur ' });
    expect(state.phase).toBe('generating');
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
    // phase that offers Regenerate.
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
