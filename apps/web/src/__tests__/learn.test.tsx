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
