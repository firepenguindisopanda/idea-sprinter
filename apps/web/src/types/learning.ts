/**
 * Learning mode - the shapes of `/api/learning/*` (backend spec
 * docs/superpowers/specs/2026-09-30-learning-mode-design.md).
 *
 * Before reveal a grading carries only pass/fail and, for a missed check, a
 * hint (the check's `why`). The answers - `pass_if`, the grader's quote and
 * reason, the strong answer, the reference design - arrive only in `Reveal`.
 */

export interface LearningExercise {
  id: string;
  exercise: string;
  premise: string;
  twist: string;
}

export interface GradedCheck {
  id: string;
  core: boolean;
  check: string;
  passed: boolean;
  not_applicable?: boolean;
  /** Only on a missed check: why it matters, never how to pass it. */
  hint?: string;
  /** Only on a missed check: reading on its topics, by title and link (revamp E3). */
  read?: Array<{ title: string; url: string }>;
}

export interface Grading {
  at: string;
  passed: number;
  total: number;
  core_passed: number;
  core_total: number;
  checks: GradedCheck[];
  /** Only on the response to a grade request. */
  gradings_left?: number;
}

export interface CheckVerdict {
  id: string;
  answer: 'yes' | 'no' | 'n/a';
  passed: boolean;
  lines: number[];
  quote: string;
  reason: string;
  unverified: boolean;
}

export interface RevealedCheck {
  id: string;
  area: string;
  core?: boolean;
  check: string;
  pass_if: string;
  fail_if?: string;
  why: string;
  applies_if?: string;
  result: CheckVerdict;
}

export interface Reveal extends LearningExercise {
  attempt_id: string;
  tension: string;
  strong_answer: string;
  checks: RevealedCheck[];
  reference_design: string;
  draft: string;
  revealed_at: string | null;
}

export interface LearningAttempt {
  attempt_id: string;
  exercise: LearningExercise;
  status: 'open' | 'revealed';
  gradings_left: number;
  gradings: Grading[];
  last_draft: string;
  reveal: Reveal | null;
}
