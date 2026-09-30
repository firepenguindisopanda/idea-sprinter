import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * A learner's unsent draft per exercise, kept in localStorage so a reload or a
 * lost connection mid-grading does not throw the writing away. The server keeps
 * only the drafts that were graded.
 */
interface LearnDraftStore {
  drafts: Record<string, string>;
  setDraft: (exerciseId: string, draft: string) => void;
  clearDraft: (exerciseId: string) => void;
}

/** A suggested shape, not enforced: the key grades content, not headings. */
export const DRAFT_OUTLINE = [
  '## Requirements',
  '',
  '## Estimates',
  '',
  '## Core decision',
  '',
  '## Architecture',
  '',
  '## APIs',
  '',
  '## Data model',
  '',
  '## Failure modes',
  '',
  '## Tests',
  '',
  '## Open questions',
  '',
].join('\n');

export const useLearnDraftStore = create<LearnDraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (exerciseId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [exerciseId]: draft } })),
      clearDraft: (exerciseId) =>
        set((state) => {
          const { [exerciseId]: _dropped, ...rest } = state.drafts;
          return { drafts: rest };
        }),
    }),
    { name: 'learn-drafts' },
  ),
);
