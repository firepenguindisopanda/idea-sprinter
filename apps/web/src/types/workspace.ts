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

export interface RefinementAction {
  sectionId: string;
  prompt: string;
  originalContent: string;
  suggestedContent: string | null;
  applied: boolean;
}

/**
 * What a design document passed (multi-agent-system `DesignStatus`).
 *
 * Always present on a design: a document whose plan never passed its checks
 * must not read like one that did.
 */
export type DesignStatus = 'checked' | 'ledger_unresolved' | 'document_unresolved' | 'failed';

/** A check a design's plan (the ledger) or its document still fails. */
export interface DesignFinding {
  source: 'ledger' | 'document';
  code: string;
  field: string;
  detail: string;
}

/**
 * A design run's result: `pipeline_complete.design`.
 *
 * Kept in the server's snake_case, unlike the rest of this file, because it is
 * sent back as it came when the design is saved.
 */
/**
 * A keyed design graded against its exercise's answer key (revamp D3).
 *
 * Counts only - which checks passed would say what the key asks - and always
 * provisional while the grader's model is an open question. It blocks nothing.
 */
export interface KeyGrade {
  passed: number;
  total: number;
  core_passed: number;
  core_total: number;
  provisional: boolean;
  model: string;
}

export interface DesignResult {
  status: DesignStatus;
  title?: string;
  exercise_id?: string | null;
  ledger: Record<string, unknown> | null;
  findings: DesignFinding[];
  context_ids: string[];
  key_grade?: KeyGrade | null;
  tokens?: { input: number; output: number; total: number; calls: number };
  seconds?: number;
}

export interface LedgerRound {
  round: number;
  passed: boolean;
  findings: Array<Omit<DesignFinding, 'source'>>;
}

/** Where a design run is: which call is running, and what the plan's rounds found. */
export interface DesignProgress {
  stage: string;
  round: number;
  ledgerRounds: LedgerRound[];
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
  /** Set while and after a design run; null on the old pipeline. */
  designProgress: DesignProgress | null;
  /** The finished design run's result; null until `pipeline_complete`. */
  design: DesignResult | null;
  /**
   * The run that wrote `design`. Save sends it, and the server takes the design
   * from that run (HANDOFF §168). Kept apart from `runId`, which is cleared
   * when the run completes so nothing follows it any more (§171).
   */
  designRunId: string | null;
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
