/**
 * Workspace domain types (frontend state, not API-boundary).
 * Uses camelCase convention for frontend state consistency.
 * Convert to/from snake_case at API boundaries where needed.
 */

export type WorkspacePhase =
  | 'idea_input'
  | 'evaluating'
  | 'clarifying_questions'
  | 'direction_selection'
  | 'generating'
  // A run that was cut off - a reload, a dropped connection. Distinct from
  // 'generating' because nothing is streaming any more.
  | 'interrupted'
  | 'refinement';

export interface ClarifyingQuestion {
  id: string;
  question: string;
  type: 'choice' | 'free_text';
  options?: string[];
  answer: string | null;
}

export interface DirectionOption {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export interface DocSection {
  id: string;
  title: string;
  status: 'pending' | 'generating' | 'complete';
  content: string;
  order: number;
}

export interface RefinementSuggestion {
  label: string;
  prompt: string;
}

/**
 * The adversarial review attached to one section.
 *
 * The backend runs a critic, a skeptic and a judge over every agent's output.
 * All three arrive as `review` events distinguished by `kind`, so the fields
 * below are per-kind and only the ones for that kind are populated.
 */
export interface CriticDimension {
  name: string;
  score: number;
  justification: string;
  issues?: string[];
}

export interface AttackVector {
  id: string;
  category: string;
  description: string;
  severity: string;
  impacted_dimension?: string;
  suggested_fix?: string;
}

/**
 * A must-have the backend checked in code (multi-agent-system HANDOFF §55).
 * `message` is the instruction the section's retry was given. A blocking
 * finding fails the verdict whatever the critic scored.
 */
export interface MustHaveFinding {
  code: string;
  message: string;
  blocking: boolean;
}

export interface SectionReview {
  sectionId: string;
  role: string;
  critic?: {
    score: number | null;
    passed: boolean | null;
    summary: string;
    dimensions: CriticDimension[];
  };
  skeptic?: {
    riskLevel: string;
    summary: string;
    attackVectors: AttackVector[];
  };
  judge?: {
    score: number;
    approved: boolean;
    issuesCount: number;
    recommendedAction: string;
    feedback: string;
    /** Absent on reviews saved before the backend sent them. */
    mustHaves?: MustHaveFinding[];
  };
}

/** A cross-agent conflict found by the consistency check. */
export interface Contradiction {
  type: string;
  detail: string;
  severity: string;
  roles?: string[];
  entity_ids?: string[];
}

export interface RefinementAction {
  sectionId: string;
  prompt: string;
  originalContent: string;
  suggestedContent: string | null;
  applied: boolean;
}

export interface WorkspaceState {
  phase: WorkspacePhase;
  currentQuestionIndex: number;
  ideaInput: string;
  questions: ClarifyingQuestion[];
  directions: DirectionOption[];
  selectedDirectionId: string | null;
  documentSections: DocSection[];
  refinementHistory: RefinementAction[];
  projectTitle: string;
  savedProjectId: number | null;
  /** Section id -> the critic/skeptic/judge review of that section. */
  reviews: Record<string, SectionReview>;
  contradictions: Contradiction[];
}

export type VaguenessDimension =
  | 'borderlineCase'
  | 'scalarTerms'
  | 'quantitativeImprecision'
  | 'subjectiveModality'
  | 'contextDependence';

export interface VaguenessScores {
  borderlineCase: number;
  scalarTerms: number;
  quantitativeImprecision: number;
  subjectiveModality: number;
  contextDependence: number;
  overallScore: number;
  thresholdMet: boolean;
  weakDimensions: VaguenessDimension[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
