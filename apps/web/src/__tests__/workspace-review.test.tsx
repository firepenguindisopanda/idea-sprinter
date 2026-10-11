import { describe, it, expect } from 'vitest';

/**
 * The review scars a saved spec carries.
 *
 * The old pipeline ran a critic, a skeptic and a judge over every section, and
 * a spec it wrote was saved with their verdicts under `_review`. The Workshop
 * no longer receives review events (HANDOFF §171), but specs saved before
 * still carry the block, and the project page still reads it.
 */

import { projectReview } from '@/lib/project-artifacts';

describe('projectReview', () => {
  it('reads the review a saved spec carries', () => {
    const review = projectReview({
      solution_architect: '## Architecture',
      _review: {
        judge_results: {
          solution_architect: {
            is_approved: false,
            score: 6,
            issues_count: 2,
            recommended_action: 'partial',
            feedback: 'Address the DLQ gap.',
          },
        },
        contradictions: [{ type: 'property_conflict', detail: 'x', severity: 'high' }],
      },
    });
    expect(review.judgeResults.solution_architect.score).toBe(6);
    expect(review.contradictions).toHaveLength(1);
  });

  it('returns empty for specs saved before reviews were persisted', () => {
    // The detail page used to hardcode `judge_results: {}`; older projects
    // genuinely have nothing, and must not throw on the way to showing that.
    expect(projectReview({ solution_architect: '## Architecture' })).toEqual({
      judgeResults: {},
      contradictions: [],
    });
    expect(projectReview(null)).toEqual({ judgeResults: {}, contradictions: [] });
  });

  it('does not let the review block be counted as an agent', async () => {
    const { agentRoles } = await import('@/lib/project-artifacts');
    const roles = agentRoles({
      solution_architect: '## Architecture',
      _review: { judge_results: {}, contradictions: [] },
    });
    expect(roles).toEqual(['solution_architect']);
  });
});
