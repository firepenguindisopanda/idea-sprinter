import { create } from 'zustand';
import type {
  WorkspaceState,
  WorkspacePhase,
  ClarifyingQuestion,
  DirectionOption,
  DocSection,
  RefinementAction,
  VaguenessScores,
  ChatMessage,
} from '@/types/workspace';

interface WorkspaceActions {
  setPhase: (phase: WorkspacePhase) => void;
  setIdeaInput: (input: string) => void;
  setQuestions: (questions: ClarifyingQuestion[]) => void;
  startClarifying: () => void;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setDirections: (directions: DirectionOption[]) => void;
  selectDirection: (directionId: string) => void;
  addDocSection: (section: DocSection) => void;
  updateDocSection: (sectionId: string, updates: Partial<DocSection>) => void;
  applyRefinement: (action: RefinementAction) => void;
  undoRefinement: (sectionId: string) => void;
  setProjectTitle: (title: string) => void;
  setSavedProjectId: (id: number | null) => void;
  reset: () => void;
  // New actions
  setVaguenessScores: (scores: VaguenessScores) => void;
  setThreshold: (threshold: number) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const DEFAULT_VAGUENESS_THRESHOLD = 7;

const initialState: WorkspaceState & {
  vaguenessScores: VaguenessScores | null;
  threshold: number;
  chatMessages: ChatMessage[];
  error: string | null;
} = {
  phase: 'idea_input',
  currentQuestionIndex: 0,
  ideaInput: '',
  questions: [],
  directions: [],
  selectedDirectionId: null,
  documentSections: [],
  refinementHistory: [],
  projectTitle: '',
  savedProjectId: null,
  vaguenessScores: null,
  threshold: DEFAULT_VAGUENESS_THRESHOLD,
  chatMessages: [],
  error: null,
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions & {
  vaguenessScores: VaguenessScores | null;
  threshold: number;
  chatMessages: ChatMessage[];
  error: string | null;
}>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setIdeaInput: (input) => set({ ideaInput: input }),

  setQuestions: (questions) => set({ questions }),

  startClarifying: () => set({
    phase: 'clarifying_questions',
    currentQuestionIndex: 0,
  }),

  answerQuestion: (questionId, answer) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId ? { ...q, answer } : q
      ),
    })),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.questions.length - 1
      ),
    })),

  previousQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  setDirections: (directions) => set({ directions, phase: 'direction_selection' }),

  selectDirection: (directionId) =>
    set({ selectedDirectionId: directionId, phase: 'generating' }),

  addDocSection: (section) =>
    set((state) => {
      const existing = state.documentSections.find((s) => s.id === section.id);
      if (existing) {
        return {
          documentSections: state.documentSections.map((s) =>
            s.id === section.id ? { ...s, ...section } : s
          ),
        };
      }
      return {
        documentSections: [...state.documentSections, section],
      };
    }),

  updateDocSection: (sectionId, updates) =>
    set((state) => ({
      documentSections: state.documentSections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    })),

  applyRefinement: (action) =>
    set((state) => ({
      refinementHistory: [...state.refinementHistory, { ...action, applied: true }],
      documentSections: state.documentSections.map((s) =>
        s.id === action.sectionId
          ? { ...s, content: action.suggestedContent ?? s.content }
          : s
      ),
    })),

  undoRefinement: (sectionId) => {
    const state = get();
    const lastRefinement = [...state.refinementHistory]
      .reverse()
      .find((r) => r.sectionId === sectionId);
    if (!lastRefinement) return;
    set({
      refinementHistory: state.refinementHistory.filter(
        (r) => r !== lastRefinement
      ),
      documentSections: state.documentSections.map((s) =>
        s.id === sectionId ? { ...s, content: lastRefinement.originalContent } : s
      ),
    });
  },

  setProjectTitle: (title) => set({ projectTitle: title }),

  setSavedProjectId: (id) => set({ savedProjectId: id }),

  reset: () => set({ ...initialState }),

  // New actions
  setVaguenessScores: (scores) => set({ vaguenessScores: scores }),

  setThreshold: (threshold) => set({ threshold }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...message,
          id: `msg-${crypto.randomUUID()}`,
          timestamp: Date.now(),
        },
      ],
    })),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
