import { displayLabels, displayOutputs, formatRole, type ProjectArtifacts } from '@/lib/project-artifacts';

/**
 * Carrying a finished spec into an architecture session.
 *
 * `/architecture` is the most differentiated thing in the app and it floated
 * alone: the only way in was to retype the requirements by hand, so a spec the
 * team had just spent minutes generating contributed nothing to the decision
 * that follows it.
 *
 * The session's `requirements` field is the input every option, comparison and
 * ADR reasons from, so this hands over the spec body itself rather than a
 * summary of it.
 */

/**
 * Requirements text is sent to the model on every option generation, so an
 * unbounded spec is a real cost. Truncation is announced in the text rather
 * than done silently - the session should not quietly reason from half a spec.
 */
const MAX_REQUIREMENTS_CHARS = 12000;

export interface ArchitecturePrefill {
  projectName: string;
  requirements: string;
}

/** Build the requirements body from ordered spec sections. */
export function requirementsFromSections(
  sections: { title: string; content: string }[],
): string {
  const body = sections
    .filter((s) => s.content?.trim())
    .map((s) => `## ${s.title}\n\n${s.content.trim()}`)
    .join('\n\n');

  if (body.length <= MAX_REQUIREMENTS_CHARS) return body;
  return (
    body.slice(0, MAX_REQUIREMENTS_CHARS) +
    '\n\n---\n*(Specification truncated here. Paste any further sections you want the architect to weigh.)*'
  );
}

/** Prefill drawn from a saved project's artifacts. */
export function prefillFromProject(
  title: string,
  artifacts: ProjectArtifacts | null | undefined,
): ArchitecturePrefill {
  const outputs = displayOutputs(artifacts);
  const labels = displayLabels(artifacts);
  const sections = Object.entries(outputs).map(([key, content]) => ({
    // Agent roles need formatting; workspace section ids have a stored label.
    title: labels[key] ?? formatRole(key),
    content,
  }));
  return { projectName: title, requirements: requirementsFromSections(sections) };
}
