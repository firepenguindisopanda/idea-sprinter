import { api } from '@/lib/api';
import type { AttackVector, DocSection, RefinementAction } from '@/types/workspace';

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
    // The server answered with a reason (a 503 once the model service has
    // failed past its retries): show it. Only a request that never got an
    // answer is a connection problem. Read by `code`, not `instanceof
    // ApiError`, so it holds wherever the API module is replaced.
    const answered = (err as { code?: string } | null)?.code === 'api_error';
    setError(
      answered && err instanceof Error && err.message
        ? err.message
        : 'Could not reach the server. Check your connection and try again.',
    );
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

/**
 * The instruction "Fix this" sends for one skeptic finding: the finding, its
 * suggested fix, and nothing else, so the rest of the section stays as it is.
 * Also the key that marks the finding applied in the refinement history.
 */
export function findingPrompt(finding: AttackVector): string {
  const lines = [`Address this reviewer finding: ${finding.description}`];
  if (finding.suggested_fix) lines.push(`Suggested fix: ${finding.suggested_fix}`);
  lines.push('Change only what this needs; keep the rest of the section as it is.');
  return lines.join('\n');
}
