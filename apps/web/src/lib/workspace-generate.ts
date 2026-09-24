import { api, type WorkspaceStreamEvent } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/workspace-store';

/**
 * The brief the pipeline generates from: the raw idea, every answered
 * clarifying question, and the direction that was chosen.
 *
 * The direction used to be left out entirely. `direction_id` reaches the server
 * but only the degraded single-agent fallback reads it - the pipeline generates
 * from `brief` alone - so picking "lean MVP" over "enterprise-grade" changed
 * nothing about the document that came back.
 */
export function buildBrief(): string {
  const state = useWorkspaceStore.getState();
  const parts: string[] = [state.ideaInput];
  for (const q of state.questions) {
    if (q.answer) parts.push(`- ${q.question} ${q.answer}`);
  }
  const direction = state.directions.find((d) => d.id === state.selectedDirectionId);
  if (direction) {
    parts.push(`\nChosen direction: ${direction.title}`);
    if (direction.description.trim()) parts.push(direction.description.trim());
  }
  return parts.join('\n');
}

/**
 * Run a workspace generation and fold the stream into the store.
 *
 * Shared by the direction picker and by the retry affordance shown after an
 * interrupted run - a reload mid-generation used to leave the workspace stuck
 * on skeleton loaders with no way back except discarding the whole project.
 */
/**
 * Fold one stream event into the store.
 *
 * Shared by a fresh generation and by a re-attach, because a resumed run
 * delivers exactly the same events - that is what makes resuming worth doing.
 */
function applyEvent(event: WorkspaceStreamEvent): void {
  const store = useWorkspaceStore.getState();
  if (typeof event.seq === 'number') store.setLastSeq(event.seq);
  {
      switch (event.type) {
        case 'run_started': {
          // The server owns the work now. Keeping the id is what lets a reload
          // rejoin a pipeline that is still running instead of losing it.
          if (event.run_id) store.setRun(event.run_id);
          break;
        }
        case 'section_start': {
          store.addDocSection({
            id: event.section_id!,
            title: event.title ?? 'Untitled',
            status: 'generating',
            content: '',
            order: event.order ?? 0,
          });
          break;
        }
        case 'chunk': {
          // `event.content` is a token delta - append it, don't replace the
          // section body, or the reader sees one word at a time flickering.
          store.appendDocSectionContent(event.section_id!, event.content ?? '');
          break;
        }
        case 'section_complete': {
          store.updateDocSection(event.section_id!, {
            status: 'complete',
            content: event.content ?? '',
          });
          break;
        }
        // The critic/skeptic/judge pass. Every spec should carry its review
        // scars; the backend ran all three all along and the workspace threw
        // the results away.
        case 'review': {
          const sectionId = event.section_id;
          if (!sectionId) break;
          const role = event.role ?? '';
          if (event.kind === 'critic') {
            store.mergeSectionReview(sectionId, role, {
              critic: {
                score: event.score ?? null,
                passed: event.passed ?? null,
                summary: event.summary ?? '',
                dimensions: event.dimensions ?? [],
              },
            });
          } else if (event.kind === 'skeptic') {
            store.mergeSectionReview(sectionId, role, {
              skeptic: {
                riskLevel: event.risk_level ?? '',
                summary: event.summary ?? '',
                attackVectors: event.attack_vectors ?? [],
              },
            });
          } else if (event.kind === 'judge') {
            store.mergeSectionReview(sectionId, role, {
              judge: {
                score: event.score ?? 0,
                approved: event.approved ?? false,
                issuesCount: event.issues_count ?? 0,
                recommendedAction: event.recommended_action ?? '',
                feedback: event.feedback ?? '',
                mustHaves: event.must_haves ?? [],
              },
            });
          }
          break;
        }
        case 'pipeline_complete': {
          // Contradictions arrive only here - the consistency check accumulates
          // them across the run and has no per-section event.
          if (event.contradictions?.length) {
            store.setContradictions(event.contradictions);
          }
          store.setRun(null);
          store.setPhase('refinement');
          break;
        }
      }
  }
}

function handleStreamFailure(): void {
  const s = useWorkspaceStore.getState();
  s.setError('Could not reach the server. Check your connection and try again.');
  // Land on `interrupted`, not `idea_input`: whatever sections did arrive are
  // still on screen and still worth retrying - and if the run is still alive on
  // the server, `resumeWorkspaceGeneration` will pick it back up.
  s.setPhase('interrupted');
}

export async function runWorkspaceGeneration(directionId: string): Promise<void> {
  const store = useWorkspaceStore.getState();

  // Refuse to start a second pipeline over the top of a live one.
  //
  // The UI is supposed to make this unreachable, and it did not: a slow
  // `/directions` response landing mid-run put the picker back on screen with
  // every card clickable. Two twelve-agent runs streaming into one store would
  // interleave two documents section by section, and bill for both. The guard
  // lives here rather than only in the component because this is the single
  // function every entry point goes through.
  if (store.phase === 'generating' && store.runId) {
    return;
  }

  store.setPhase('generating');
  store.clearError();
  const brief = buildBrief();

  try {
    await api.streamDocument(directionId, brief, applyEvent);
  } catch {
    handleStreamFailure();
  }
}

/**
 * Rejoin a generation that is still running on the server.
 *
 * A reload used to end a run: the pipeline was driven by the connection, so
 * closing the tab discarded however many agents had finished. The work is a
 * `Run` now, so this asks whether it is still going and, if so, replays the
 * events missed and follows the rest.
 *
 * Returns whether it re-attached, so the caller can fall back to offering a
 * retry when there is nothing left to rejoin.
 */
export async function resumeWorkspaceGeneration(): Promise<boolean> {
  const { runId, lastSeq } = useWorkspaceStore.getState();
  if (!runId) return false;

  try {
    const status = await api.getRunStatus(runId);
    if (status.status !== 'running') return false;

    const store = useWorkspaceStore.getState();
    store.clearError();
    store.setPhase('generating');
    await api.followRun(runId, lastSeq, applyEvent);
    return true;
  } catch {
    // A run that is gone, or a server we cannot reach. Either way there is
    // nothing to rejoin, and the interrupted-state retry is the right offer.
    return false;
  }
}

/** Stop the run this workspace is watching, if there is one. */
export async function cancelWorkspaceGeneration(): Promise<void> {
  const { runId } = useWorkspaceStore.getState();
  if (!runId) return;
  try {
    await api.cancelRun(runId);
  } catch {
    // Best effort: the run may already have finished.
  }
  useWorkspaceStore.getState().setRun(null);
}
