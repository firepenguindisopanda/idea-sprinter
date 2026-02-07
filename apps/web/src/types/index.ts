export interface User {
  id: number;
  email: string;
  full_name: string | null;
  profile_picture: string | null;
  created_at: string;
}
// add the pre-generation fields (title, audience, techStack, scope seeds, exampleCount) and a disabled `Generate examples` button that validates required fields.

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

export interface IdeationInput {
  rawDescription: string;
  title?: string;
  audience?: string;
  problemStatement?: string;
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
