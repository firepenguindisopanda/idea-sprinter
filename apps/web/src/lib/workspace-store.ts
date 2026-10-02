import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorkspaceState,
  WorkspacePhase,
  ClarifyingQuestion,
  Contradiction,
  DesignResult,
  DirectionOption,
  DocSection,
  LedgerRound,
  RefinementAction,
  SectionReview,
  VaguenessScores,
  ChatMessage,
} from '@/types/workspace';

/**
 * The phases where the user has not yet committed to generating.
 *
 * Anything that arrives late from the pre-generation flow must not move the
 * workspace back into the picker once a run has started - see `setDirections`.
 */
const PRE_GENERATION_PHASES = new Set<WorkspacePhase>([
  'idea_input',
  'evaluating',
  'clarifying_questions',
  'direction_selection',
]);

interface WorkspaceActions {
  setPhase: (phase: WorkspacePhase) => void;
  setIdeaInput: (input: string) => void;
  setQuestions: (questions: ClarifyingQuestion[]) => void;
  startClarifying: () => void;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setDirections: (directions: DirectionOption[]) => void;
  /** Add one direction without leaving the picker - used by "describe my own". */
  addDirection: (direction: DirectionOption) => void;
  selectDirection: (directionId: string) => void;
  addDocSection: (section: DocSection) => void;
  updateDocSection: (sectionId: string, updates: Partial<DocSection>) => void;
  appendDocSectionContent: (sectionId: string, delta: string) => void;
  applyRefinement: (action: RefinementAction) => void;
  undoRefinement: (sectionId: string) => void;
  /** Merge one reviewer's verdict into that section's review. */
  mergeSectionReview: (
    sectionId: string,
    role: string,
    review: Partial<Omit<SectionReview, 'sectionId' | 'role'>>,
  ) => void;
  setContradictions: (contradictions: Contradiction[]) => void;
  /** A design run moved on: which call is running, and its round. */
  setDesignStage: (stage: string, round: number) => void;
  addLedgerRound: (round: LedgerRound) => void;
  setDesign: (design: DesignResult | null) => void;
  /** Forget the last design run, before another starts. */
  clearDesign: () => void;
  setRun: (runId: string | null) => void;
  setLastSeq: (seq: number) => void;
  setProjectTitle: (title: string) => void;
  setSavedProjectId: (id: number | null) => void;
  reset: () => void;
  // New actions
  setVaguenessScores: (scores: VaguenessScores) => void;
  setThreshold: (threshold: number) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  // `notice` is for an outcome that is not a failure, such as a refine that
  // came back unchanged; it is shown in the warning accent, not the error red.
  setError: (error: string | null, tone?: 'error' | 'notice') => void;
  clearError: () => void;
}

export const DEFAULT_VAGUENESS_THRESHOLD = 7;

const initialState: WorkspaceState & {
  vaguenessScores: VaguenessScores | null;
  threshold: number;
  chatMessages: ChatMessage[];
  error: string | null;
  errorTone: 'error' | 'notice';
  // The server-side run this workspace is watching, and how far into it the
  // client has read. Persisted, so a reload can re-attach rather than throw
  // away a generation that is still going on the server.
  runId: string | null;
  lastSeq: number;
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
  reviews: {},
  contradictions: [],
  designProgress: null,
  design: null,
  runId: null,
  lastSeq: 0,
  vaguenessScores: null,
  threshold: DEFAULT_VAGUENESS_THRESHOLD,
  chatMessages: [],
  error: null,
  errorTone: 'error',
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions & {
  vaguenessScores: VaguenessScores | null;
  threshold: number;
  runId: string | null;
  lastSeq: number;
  chatMessages: ChatMessage[];
  error: string | null;
  errorTone: 'error' | 'notice';
}>()(
  persist(
    (set, get) => ({
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

      // Arriving at the picker is only meaningful from the phases *before* it.
      //
      // This used to set `phase: 'direction_selection'` unconditionally, so a
      // slow `/directions` response landing after the user had already chosen
      // and started generating dragged the whole workspace backwards: the
      // picker reappeared over a live run, every card still clickable, and
      // clicking one started a *second* twelve-agent pipeline into the same
      // store. Observed in a real session - a duplicate request resolved 134
      // seconds into a generation and did exactly this.
      //
      // The directions themselves are still recorded; only the phase move is
      // suppressed, so nothing is lost if the response was legitimately wanted.
      setDirections: (directions) =>
        set((state) => ({
          directions,
          phase: PRE_GENERATION_PHASES.has(state.phase)
            ? 'direction_selection'
            : state.phase,
        })),

      // Deliberately does not touch `phase`, unlike setDirections: the user is
      // already in the picker and is adding to it, not arriving at it.
      addDirection: (direction) =>
        set((state) => ({
          directions: state.directions.some((d) => d.id === direction.id)
            ? state.directions.map((d) => (d.id === direction.id ? direction : d))
            : [...state.directions, direction],
        })),

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

      // Streamed `chunk` events carry a token delta, not the full section body.
      // The append must happen inside `set` so rapid-fire tokens cannot read a
      // stale snapshot and drop content.
      appendDocSectionContent: (sectionId, delta) =>
        set((state) => ({
          documentSections: state.documentSections.map((s) =>
            s.id === sectionId ? { ...s, content: s.content + delta } : s
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

      // Critic, skeptic and judge arrive as three separate events per section
      // and land in one review object, so a section that has been criticised
      // but not yet judged still renders what it has.
      mergeSectionReview: (sectionId, role, review) =>
        set((state) => ({
          reviews: {
            ...state.reviews,
            [sectionId]: {
              ...(state.reviews[sectionId] ?? { sectionId, role }),
              sectionId,
              role,
              ...review,
            },
          },
        })),

      setContradictions: (contradictions) => set({ contradictions }),

      // The writer starting - its first round, its revision, or a retry after
      // a dropped stream - sends the document again from its first section, so
      // whatever an earlier draft put on the page goes: a section only that
      // draft had would otherwise stay, under a status it never earned.
      setDesignStage: (stage, round) =>
        set((state) => ({
          designProgress: {
            ledgerRounds: state.designProgress?.ledgerRounds ?? [],
            stage,
            round,
          },
          ...(stage === 'writer' ? { documentSections: [], refinementHistory: [] } : {}),
        })),

      addLedgerRound: (round) =>
        set((state) => ({
          designProgress: {
            stage: state.designProgress?.stage ?? 'ledger',
            round: state.designProgress?.round ?? round.round,
            // Replace, not append: a rejoined run replays rounds already seen.
            ledgerRounds: [
              ...(state.designProgress?.ledgerRounds ?? []).filter((r) => r.round !== round.round),
              round,
            ],
          },
        })),

      setDesign: (design) => set({ design }),

      clearDesign: () => set({ design: null, designProgress: null }),

      setRun: (runId) => set({ runId, lastSeq: 0 }),
      // Highest-wins: replayed events after a reconnect arrive with sequence
      // numbers the client has already seen, and letting those move the marker
      // backwards would make the next reconnect ask for them all over again.
      setLastSeq: (seq) =>
        set((state) => (seq > state.lastSeq ? { lastSeq: seq } : state)),

      setProjectTitle: (title) => set({ projectTitle: title }),

      setSavedProjectId: (id) => set({ savedProjectId: id }),

      reset: () => set({ ...initialState }),

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

      setError: (error, tone = 'error') => set({ error, errorTone: tone }),

      clearError: () => set({ error: null, errorTone: 'error' }),
    }),
    {
      name: 'workspace-store',
      partialize: (state) => {
        const { error: _error, errorTone: _errorTone, ...persisted } = state;
        return persisted;
      },
      // A persisted 'generating' phase outlives the stream that produced it:
      // after a reload nothing is running, but the UI kept rendering skeleton
      // loaders forever. Demote on rehydrate so the workspace can offer a retry.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.phase === 'generating') {
          state.phase = 'interrupted';
          // Back to 'pending' rather than 'complete': the section stopped
          // mid-stream, so its content is real but unfinished, and the pulsing
          // "in progress" dot would be claiming work that isn't happening.
          state.documentSections = state.documentSections.map((s) =>
            s.status === 'generating' ? { ...s, status: 'pending' as const } : s
          );
        }
      },
    }
  )
);
