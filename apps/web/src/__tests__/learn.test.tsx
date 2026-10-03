import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Grading, LearningAttempt, LearningExercise, Reveal } from '@/types/learning';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/learn',
  useSearchParams: () => new URLSearchParams(),
}));

// Streamdown is heavy and irrelevant here: render the markdown source as text.
vi.mock('@/components/markdown', () => ({
  Markdown: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    api: {
      learningExercises: vi.fn(),
      startLearningAttempt: vi.fn(),
      gradeLearningDraft: vi.fn(),
      revealLearningAttempt: vi.fn(),
      streamLearningDesign: vi.fn(),
      cancelRun: vi.fn(),
    },
  };
});

import { api, ApiError } from '@/lib/api';
import { ExerciseList } from '@/components/learn/exercise-list';
import { ExerciseWorkspace } from '@/components/learn/exercise-workspace';
import { useLearnDraftStore } from '@/lib/learn-draft-store';

const mocked = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

const EXERCISE: LearningExercise = {
  id: 'bitly-link-health',
  exercise: 'Bitly + link health monitoring',
  premise: 'Shorten a long URL to a compact code.',
  twist: 'Detect when a destination starts 404ing.',
};

const ATTEMPT: LearningAttempt = {
  attempt_id: 'a1',
  exercise: EXERCISE,
  status: 'open',
  gradings_left: 5,
  gradings: [],
  last_draft: '',
  reveal: null,
};

const GRADING: Grading = {
  at: '2026-09-30T10:00:00Z',
  passed: 1,
  total: 2,
  core_passed: 0,
  core_total: 1,
  gradings_left: 4,
  checks: [
    { id: 'B1', core: false, check: 'Is the redirect independent of checking?', passed: true },
    { id: 'B2', core: true, check: 'Does it decide on storage from both rates?', passed: false,
      hint: 'This is the decision the twist forces.' },
  ],
};

const REVEAL: Reveal = {
  ...EXERCISE,
  attempt_id: 'a1',
  tension: 'Redirects and checks want opposite storage.',
  strong_answer: 'STRONG-ANSWER-TEXT',
  reference_design: 'REFERENCE-DESIGN-TEXT',
  draft: 'my draft',
  revealed_at: '2026-09-30T10:05:00Z',
  checks: [{
    id: 'B2', area: 'core_decision', core: true, check: 'Does it decide on storage from both rates?',
    pass_if: 'PASS-IF-TEXT', why: 'This is the decision the twist forces.',
    result: { id: 'B2', answer: 'no', passed: false, lines: [], quote: '', reason: 'One database for both.', unverified: false },
  }],
};

const LONG_DRAFT = '## Architecture\n' + 'Redirects come from a cache in front of a key-value store. '.repeat(5);

describe('ExerciseList', () => {
  it('lists the exercises with premise and twist, linking to each', async () => {
    mocked.learningExercises.mockResolvedValue([EXERCISE]);
    render(<ExerciseList />);
    const link = await screen.findByRole('link', { name: /Bitly \+ link health monitoring/ });
    expect(link.getAttribute('href')).toBe('/learn/bitly-link-health');
    expect(screen.getByText(EXERCISE.premise)).toBeDefined();
    expect(screen.getByText(EXERCISE.twist)).toBeDefined();
  });
});

describe('ExerciseWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLearnDraftStore.setState({ drafts: {} });
    mocked.startLearningAttempt.mockResolvedValue(ATTEMPT);
  });

  it('starts with the outline and will not grade a draft that is too short', async () => {
    render(<ExerciseWorkspace exerciseId="bitly-link-health" />);
    const box = (await screen.findByLabelText('Your design')) as HTMLTextAreaElement;
    expect(box.value).toContain('## Core decision');
    expect((screen.getByRole('button', { name: /Grade my draft/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Reveal answers/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('grades, shows hints for missed checks, and no answers before reveal', async () => {
    mocked.gradeLearningDraft.mockResolvedValue(GRADING);
    render(<ExerciseWorkspace exerciseId="bitly-link-health" />);
    fireEvent.change(await screen.findByLabelText('Your design'), { target: { value: LONG_DRAFT } });
    fireEvent.click(screen.getByRole('button', { name: /Grade my draft/ }));
    await screen.findByText(/of 2 checks/);
    expect(mocked.gradeLearningDraft).toHaveBeenCalledWith('a1', LONG_DRAFT);
    expect(screen.getByText('This is the decision the twist forces.')).toBeDefined();
    expect(screen.getByText(/4 gradings left/)).toBeDefined();
    // The grader is known to be too generous at times (HANDOFF §81-§88): say so.
    expect(screen.getByRole('note').textContent).toMatch(/provisional/i);
    // Learner first: nothing generates a design before the answers are revealed.
    expect(screen.queryByRole('tab', { name: 'Generated design' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Generate a design/ })).toBeNull();
    const text = document.body.textContent ?? '';
    for (const answer of ['PASS-IF-TEXT', 'STRONG-ANSWER-TEXT', 'REFERENCE-DESIGN-TEXT', REVEAL.tension]) {
      expect(text).not.toContain(answer);
    }
  });

  it('reveals only after confirming, then shows the answers and the reference design', async () => {
    mocked.startLearningAttempt.mockResolvedValue({ ...ATTEMPT, gradings: [GRADING], gradings_left: 4 });
    mocked.revealLearningAttempt.mockResolvedValue(REVEAL);
    render(<ExerciseWorkspace exerciseId="bitly-link-health" />);
    fireEvent.click(await screen.findByRole('button', { name: /Reveal answers/ }));
    expect(mocked.revealLearningAttempt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Yes, show the answers/ }));
    await screen.findByText(REVEAL.tension);
    expect(screen.getByText('PASS-IF-TEXT')).toBeDefined();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Reference design' }));
    await waitFor(() => expect(screen.getByText('REFERENCE-DESIGN-TEXT')).toBeDefined());
    mocked.startLearningAttempt.mockResolvedValue({ ...ATTEMPT, attempt_id: 'a2' });
    fireEvent.click(screen.getByRole('button', { name: /Start a new attempt/ }));
    await waitFor(() => expect(mocked.startLearningAttempt).toHaveBeenLastCalledWith('bitly-link-health', true));
    await screen.findByRole('button', { name: /Grade my draft/ });
    expect(mocked.startLearningAttempt).toHaveBeenNthCalledWith(1, 'bitly-link-health', false);
  });

  it('shows the answers again when a revealed attempt is reopened', async () => {
    mocked.startLearningAttempt.mockResolvedValue({
      ...ATTEMPT, status: 'revealed', gradings: [GRADING], gradings_left: 0, reveal: REVEAL,
    });
    render(<ExerciseWorkspace exerciseId="bitly-link-health" />);
    await screen.findByText(REVEAL.tension);
    expect((screen.getByLabelText('Your design') as HTMLTextAreaElement).readOnly).toBe(true);
    expect((screen.getByRole('button', { name: /Grade again/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /Reveal answers/ })).toBeNull();
  });

  it('keeps the draft and shows the reason when grading fails', async () => {
    mocked.gradeLearningDraft.mockRejectedValue(
      new ApiError('api_error', 'The grading model is busy or unavailable, so nothing was recorded.', 503),
    );
    render(<ExerciseWorkspace exerciseId="bitly-link-health" />);
    fireEvent.change(await screen.findByLabelText('Your design'), { target: { value: LONG_DRAFT } });
    fireEvent.click(screen.getByRole('button', { name: /Grade my draft/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('busy or unavailable');
    expect(useLearnDraftStore.getState().drafts['bitly-link-health']).toBe(LONG_DRAFT);
  });
});

describe('a generated design, after the reveal (revamp E2)', () => {
  const RUN = [
    { type: 'run_started', run_id: 'r1' },
    { type: 'stage', stage: 'ledger', round: 1 },
    { type: 'ledger_checked', passed: true, findings: [], round: 1 },
    { type: 'stage', stage: 'writer', round: 1 },
    { type: 'section_start', section_id: 'sec-design-estimates', title: '2. Estimates', order: 0 },
    { type: 'chunk', section_id: 'sec-design-estimates', content: 'GENERATED-' },
    { type: 'section_complete', section_id: 'sec-design-estimates', title: '2. Estimates', content: 'GENERATED-ESTIMATES' },
    { type: 'stage', stage: 'grade', round: 1 },
    { type: 'pipeline_complete', design: {
      status: 'checked', ledger: {}, findings: [], context_ids: [], exercise_id: 'bitly-link-health',
      key_grade: { passed: 5, total: 13, core_passed: 3, core_total: 3, provisional: true, model: 'nvidia/nemotron' },
    } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mocked.startLearningAttempt.mockResolvedValue({
      ...ATTEMPT, status: 'revealed', gradings: [GRADING], gradings_left: 0, reveal: REVEAL,
    });
  });

  async function openTab() {
    render(<ExerciseWorkspace exerciseId="bitly-link-health" />);
    await screen.findByText(REVEAL.tension);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Generated design' }));
    return screen.findByRole('button', { name: /Generate a design/ });
  }

  it('starts the run for this attempt, streams the document, and shows its status and grade beside the reference', async () => {
    mocked.streamLearningDesign.mockImplementation(async (_id: string, onEvent: (e: unknown) => void) => {
      for (const event of RUN) onEvent(event);
    });
    fireEvent.click(await openTab());
    await screen.findByText('GENERATED-ESTIMATES');
    expect(mocked.streamLearningDesign).toHaveBeenCalledWith('a1', expect.any(Function), expect.anything());
    expect(screen.getByText('Checked against its plan')).toBeDefined();
    expect(screen.getByText(/Answer key · provisional/)).toBeDefined();
    expect(screen.getByText(/5 of 13 checks · 3 of 3 core/)).toBeDefined();
    // Beside it, to critique against.
    const generated = screen.getByRole('region', { name: 'Generated design' });
    const reference = screen.getByRole('region', { name: 'Reference design' });
    expect(generated.textContent).toContain('GENERATED-ESTIMATES');
    expect(reference.textContent).toContain('REFERENCE-DESIGN-TEXT');
    expect(screen.queryByRole('button', { name: /Generate a design/ })).toBeNull();
  });

  it('says what it is doing while it runs', async () => {
    let send: (e: unknown) => void = () => {};
    mocked.streamLearningDesign.mockImplementation((_id: string, onEvent: (e: unknown) => void) => {
      send = onEvent;
      return new Promise(() => {});
    });
    fireEvent.click(await openTab());
    await waitFor(() => expect(mocked.streamLearningDesign).toHaveBeenCalled());
    send(RUN[1]);
    expect(await screen.findByText(/Planning the design/)).toBeDefined();
    send(RUN[3]);
    expect(await screen.findByText(/Writing the design/)).toBeDefined();
    send(RUN[7]);
    expect(await screen.findByText(/Grading against the exercise's answer key/)).toBeDefined();
  });

  it('shows why when the run could not start, and offers it again', async () => {
    mocked.streamLearningDesign.mockRejectedValue(new Error('SSE request failed: 409 Conflict'));
    fireEvent.click(await openTab());
    expect((await screen.findByRole('alert')).textContent).toMatch(/could not be generated/i);
    expect(screen.getByRole('button', { name: /Generate a design/ })).toBeDefined();
  });

  it('shows the run’s own error and keeps what was written', async () => {
    mocked.streamLearningDesign.mockImplementation(async (_id: string, onEvent: (e: unknown) => void) => {
      for (const event of RUN.slice(0, 7)) onEvent(event);
      onEvent({ type: 'error', stage: 'writer', message: 'The model service failed while the design was being written.' });
      onEvent({ type: 'pipeline_complete', design: { status: 'failed', ledger: null, findings: [], context_ids: [] } });
    });
    fireEvent.click(await openTab());
    expect((await screen.findByRole('alert')).textContent).toContain('model service failed');
    expect(screen.getByText('Not written')).toBeDefined();
  });
});
