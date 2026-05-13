export type WorkspacePhase =
  | 'idea_input'
  | 'clarifying_questions'
  | 'direction_selection'
  | 'generating'
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

export interface WorkspaceState {
  phase: WorkspacePhase;
  currentQuestionIndex: number;
  ideaInput: string;
  brief: string;
  questions: ClarifyingQuestion[];
  directions: DirectionOption[];
  selectedDirectionId: string | null;
  documentSections: DocSection[];
  refinementHistory: RefinementAction[];
  projectTitle: string;
}
