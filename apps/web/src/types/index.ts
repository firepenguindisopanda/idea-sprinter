export interface User {
  id: number;
  email: string;
  full_name: string | null;
  profile_picture: string | null;
  created_at: string;
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
  artifacts: Record<string, string>;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectCreate {
  title: string;
  description?: string | null;
  artifacts: Record<string, string>;
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

// ---------------------- PRD types ----------------------
export interface PRDStartRequest {
  description: string;
  user_id?: number | null;
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
  judge_feedback?: string | null;
}

export interface PRDStatusResponse {
  session_id: string;
  phase: string;
  requirements_status: Record<string, boolean>;
  collected_info: Record<string, string>;
  missing_sections: string[];
  follow_up_count: number;
  judge_approved?: boolean | null;
  judge_score?: number | null;
  judge_feedback?: string | null;
}

export interface PRDDocumentResponse {
  session_id: string;
  generated_prd: string;
  requirements_status: Record<string, boolean>;
}
