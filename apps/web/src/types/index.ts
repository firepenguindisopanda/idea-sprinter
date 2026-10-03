export type UserPersona = 'founder' | 'pm' | 'developer' | 'non_technical_pm';

export interface UserPersonaInfo {
  id: UserPersona;
  name: string;
  description: string;
  icon: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  profile_picture: string | null;
  created_at: string;
  persona?: UserPersona | null;
  persona_changed_at?: string | null;
}

export interface PreGenerationRequest {
  title?: string;
  audience?: string;
  problemStatement: string;
  domain?: string;
  mustHaveFeatures?: string[];
  techStack?: string;
  exampleCount: number;
  constraints?: string;
  desiredTone?: string;
}

export interface ProjectRequest {
  description: string;
  frontend_framework?: string | null;
  backend_framework?: string | null;
  database?: string | null;
  auth_service?: string | null;
  payment_gateway?: string | null;
  package_manager?: string | null;
  orm?: string | null;
  runtime?: string | null;
  include_docker?: boolean;
  include_cicd?: boolean;
}

export interface GenerateResponse {
  srs_document?: string;
  project_description?: string;
  project_title?: string;
  markdown_outputs: Record<string, string>;
  judge_results: Record<string, JudgeResult>;
}

export interface JudgeResult {
  is_approved: boolean;
  score: number;
  issues_count: number;
  recommended_action: string;
  feedback: string;
}

export interface Project {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  /**
   * Agent role -> markdown output, plus `_`-prefixed metadata.
   *
   * Typed as unknown values rather than string because the workspace flow also
   * writes nested objects and arrays here. Read it through the helpers in
   * `lib/project-artifacts` rather than indexing it directly - they separate
   * agent output from metadata, which is the distinction the dashboard depends
   * on.
   */
  artifacts: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectCreate {
  title: string;
  description?: string | null;
  /** Same shape as `Project.artifacts` - agent output plus `_`-prefixed metadata. */
  artifacts: Record<string, unknown>;
}

export interface UsageStatsResponse {
  window_days: number;
  /** Exact figures for calls made since token recording was added. */
  recorded: {
    operations: number;
    total_tokens: number;
    cost_usd: number;
    avg_latency_ms: number;
  };
  /** Full history from LangSmith, or null when it is unreachable. */
  langsmith: {
    llm_calls: number;
    error_rate: number;
    latency_p50_s: number;
    latency_p99_s: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    last_run_at: string | null;
  } | null;
  langsmith_project: string | null;
  sources: { llm_calls: string | null; tokens: string; cost: string };
}

export interface UsageMetrics {
  specsbeforecode_tokens_used_monthly?: number;
  specsbeforecode_budget_remaining?: number;
  specsbeforecode_cost_estimate_total?: number;
  specsbeforecode_requests_total?: number;
  // Also support unprefixed format
  monthly_tokens_used?: number;
  budget_remaining?: number;
  total_cost_estimate?: number;
  requests_total?: number;
  // Additional operation metrics
  [key: string]: number | undefined;
}

// PRD types
export interface PRDStartRequest {
  description: string;
  user_id?: number | null;
  persona?: UserPersona | null;
}

export interface PRDStartResponse {
  session_id: string;
  message: string;
}

export interface PRDChatResponse {
  agent_response: string;
  needs_more: boolean;
  phase: string;
  missing_requirements: Record<string, boolean>;
  questions: string[];
  generated_prd?: string | null;
}

export interface PRDStatusResponse {
  session_id: string;
  phase: string;
  requirements_status: Record<string, boolean>;
  collected_info: Record<string, string>;
  missing_sections: string[];
  follow_up_count: number;
}

export interface PRDDocumentResponse {
  session_id: string;
  generated_prd: string;
  requirements_status: Record<string, boolean>;
}

// Architecture Agent types
export interface ArchitectureOption {
  id: string;
  name: string;
  description: string;
  components: string[];
  tech_stack: Record<string, string>;
  pros: string[];
  cons: string[];
  diagram_description?: string;
  estimated_cost?: string;
  estimated_setup_time?: string;
  /** Things the model assumed that the user never stated - contestable. */
  assumptions?: string[];
  best_when?: string;
  avoid_when?: string;
  /** A generic starter served because generation failed - the same for every project. */
  is_template?: boolean;
}

export interface ArchitectureScore {
  scalability: number;
  development_speed: number;
  cost_initial: number;
  cost_ongoing: number;
  security: number;
  operational_complexity: number;
  vendor_lockin: number;
  performance: number;
  /** dimension -> why that score, citing a stated requirement or constraint. */
  justifications?: Record<string, string>;
}

/** The case against an option, from POST .../options/{id}/challenge */
export interface AttackVector {
  id: string;
  category: string;
  description: string;
  severity: string;
  impacted_dimension: string;
  suggested_fix?: string;
}

/** Result of contesting an assumption - POST .../options/{id}/contest */
export interface ContestOutcome {
  option_id: string;
  assumption: string;
  correction: string;
  assumption_was_wrong: boolean;
  changes_recommendation: boolean;
  /** Derived server-side from changes_recommendation. */
  verdict: 'revised' | 'defended';
  impact: string;
  affected_dimensions: string[];
  revised_assumption?: string | null;
  still_recommended: boolean;
  follow_up_question?: string | null;
  /** The new fact the correction states, in the user's words; empty if none (revamp G2). */
  new_fact?: string;
  /** No new fact was stated, so nothing changed - checked server-side. */
  nothing_new?: boolean;
  error?: boolean;
}

/** An option that was considered and rejected, with the reason. */
export interface DecisionAlternative {
  name: string;
  rejected_because: string;
}

/** Something the project now lives with as a result of the decision. */
export interface DecisionConsequence {
  consequence: string;
  kind: 'accepted_cost' | 'benefit' | 'risk';
  mitigation?: string | null;
}

/** A step-3 exchange, carried onto the record as evidence it was argued. */
export interface ContestedPoint {
  assumption: string;
  correction: string;
  verdict: 'revised' | 'defended';
  impact: string;
}

/** The model's proposal - never persisted until the user sends it back. */
export interface ArchitectureDecisionDraft {
  title: string;
  chosen_pattern: string;
  context: string;
  decision: string;
  alternatives: DecisionAlternative[];
  consequences: DecisionConsequence[];
  contested: ContestedPoint[];
}

export interface ArchitectureDecisionSave extends ArchitectureDecisionDraft {
  option_id: string;
  edited_by_user: boolean;
}

export interface ArchitectureDecisionRecord extends ArchitectureDecisionSave {
  id: string;
  session_id: string;
  project_name?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OptionChallenge {
  option_id: string;
  option_name: string;
  risk_level: string;
  summary: string;
  attack_vectors: AttackVector[];
  assumptions_to_verify: string[];
  counterpoint_reading: Array<{ book: string; excerpt: string }>;
}

export interface ArchitectureComparison {
  options: ArchitectureOption[];
  scores: Record<string, ArchitectureScore>;
  recommendation: string;
  trade_offs: string[];
}

export interface ArchitectureMessage {
  role: string;
  content: string;
  timestamp: string;
}

export type ArchitectureSessionStatus = 'created' | 'generating' | 'comparing' | 'refining' | 'completed';

export interface ArchitectureSession {
  id: string;
  user_id?: number;
  project_name: string;
  requirements: string;
  constraints?: string;
  persona?: UserPersona;
  status: ArchitectureSessionStatus;
  messages: ArchitectureMessage[];
  options: ArchitectureOption[];
  comparison?: ArchitectureComparison;
  selected_option_id?: string;
  refined_option_id?: string;
  iteration_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * What `GET /architecture/sessions` actually returns.
 *
 * Not an `ArchitectureSession`: the list endpoint projects a summary
 * (`architecture_session.list_sessions`) with no messages, options, requirements
 * or comparison. The client typed it as the full session, which nothing caught
 * because `listArchitectureSessions` was never called from anywhere.
 */
export interface ArchitectureSessionSummary {
  id: string;
  project_name: string;
  status: ArchitectureSessionStatus;
  options_count: number;
  selected_option_id?: string | null;
  created_at: string | null;
}

export interface ArchitectureSessionCreate {
  project_name: string;
  requirements: string;
  constraints?: string;
  persona?: UserPersona;
}

export interface ArchitectureGenerateRequest {
  num_options?: number;
}

export interface ArchitectureRefineRequest {
  feedback: string;
  target_option_id: string;
}

export interface ArchitectureSelectRequest {
  option_id: string;
}
