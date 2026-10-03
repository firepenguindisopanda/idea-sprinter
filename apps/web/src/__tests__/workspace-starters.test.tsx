import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Learner first (revamp E2): a starter that is a learning exercise opens the
 * exercise, not the generator. Drafting comes before any generated design, and
 * the decision a keyed starter forces - half its answer - is not shown in the
 * picker. Every other starter behaves as it always did.
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/workspace',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/use-workspace', () => ({ useWorkspace: vi.fn() }));

vi.mock('@/lib/api', () => ({
  api: { learningExercises: vi.fn(), evaluateVagueness: vi.fn() },
}));

import { IdeaInput } from '@/components/workspace/idea-input';
import { useWorkspace } from '@/hooks/use-workspace';
import { api } from '@/lib/api';
import { ideaFor, ALL_EXAMPLE_PROMPTS } from '@/lib/example-prompts';
import { SYSTEM_DESIGN_EXAMPLES } from '@/lib/system-design-examples';

const mocked = api as unknown as Record<string, ReturnType<typeof vi.fn>>;
const BITLY = SYSTEM_DESIGN_EXAMPLES.find((e) => e.id === 'bitly-link-health')!;
const OTHER = SYSTEM_DESIGN_EXAMPLES.find((e) => e.id !== BITLY.id)!;
const EXERCISES = [{ id: BITLY.id, exercise: 'Bitly + link health', premise: BITLY.premise, twist: BITLY.twist }];

let setIdeaInput: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  setIdeaInput = vi.fn();
  (useWorkspace as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    ideaInput: '', setIdeaInput, startClarifying: vi.fn(), setQuestions: vi.fn(), phase: 'idea_input',
  });
});

function search(text: string) {
  fireEvent.click(screen.getByRole('button', { name: /Need inspiration/ }));
  fireEvent.change(screen.getByLabelText('Search examples'), { target: { value: text } });
}

describe('the starter picker', () => {
  it('opens a starter that is an exercise in learning mode, and says to draft it first', async () => {
    mocked.learningExercises.mockResolvedValue(EXERCISES);
    render(<IdeaInput />);
    search(BITLY.name);
    const link = await screen.findByRole('link', { name: new RegExp(BITLY.name) });
    expect(link.getAttribute('href')).toBe(`/learn/${BITLY.id}`);
    expect(link.textContent).toMatch(/draft it first/i);
    expect(document.body.textContent).not.toContain(BITLY.tension);
    fireEvent.click(link);
    expect(setIdeaInput).not.toHaveBeenCalled();
  });

  it('leaves a starter that is no exercise as it was', async () => {
    mocked.learningExercises.mockResolvedValue(EXERCISES);
    render(<IdeaInput />);
    await waitFor(() => expect(mocked.learningExercises).toHaveBeenCalled());
    search(OTHER.name);
    const prompt = ALL_EXAMPLE_PROMPTS.find((p) => p.id === `sd-${OTHER.id}`)!;
    expect(screen.queryByRole('link', { name: new RegExp(OTHER.name) })).toBeNull();
    expect(document.body.textContent).toContain(OTHER.tension);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(OTHER.name) }));
    expect(setIdeaInput).toHaveBeenCalledWith(ideaFor(prompt));
  });

  it('treats every starter as before when the exercises cannot be listed', async () => {
    mocked.learningExercises.mockRejectedValue(new Error('401'));
    render(<IdeaInput />);
    await waitFor(() => expect(mocked.learningExercises).toHaveBeenCalled());
    search(BITLY.name);
    expect(screen.queryByRole('link', { name: new RegExp(BITLY.name) })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(BITLY.name) }));
    expect(setIdeaInput).toHaveBeenCalled();
  });
});
