import { api } from '@/lib/api';
import { serverMessage } from '@/lib/server-message';
import type { DocSection, RefinementAction } from '@/types/workspace';

export type RefineOutcome = 'applied' | 'unchanged' | 'failed';

interface RefineActions {
  applyRefinement: (action: RefinementAction) => void;
  setError: (error: string | null, tone?: 'error' | 'notice') => void;
}

/**
 * Refine one section and record it so it can be undone.
 *
 * Shared by the section's own refine box and the review sidebar's "Fix this".
 * The actions are passed in rather than read from the store so each caller
 * keeps its own subscription - the sidebar must not re-render on every
 * streamed token.
 *
 * The endpoint hands the original back when the model's reply cannot be used,
 * so an unchanged section is reported as not applied. Recording it would show
 * the user a fix that never happened, with an undo that restores nothing.
 */
export async function refineAndRecord(
  section: DocSection,
  prompt: string,
  { applyRefinement, setError }: RefineActions,
): Promise<RefineOutcome> {
  let content: string;
  try {
    const response = await api.refineSection(section.id, section.content, prompt);
    content = response.content ?? section.content;
  } catch (err) {
    setError(serverMessage(err));
    return 'failed';
  }

  if (content.trim() === section.content.trim()) {
    setError('The section came back unchanged. Try again, or reword the request.', 'notice');
    return 'unchanged';
  }

  applyRefinement({
    sectionId: section.id,
    prompt,
    originalContent: section.content,
    suggestedContent: content,
    applied: true,
  });
  return 'applied';
}
