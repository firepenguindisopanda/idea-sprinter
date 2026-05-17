import { useWorkspaceStore } from '@/lib/workspace-store';

export function useWorkspace() {
  const store = useWorkspaceStore();
  return {
    // State
    phase: store.phase,
    ideaInput: store.ideaInput,
    questions: store.questions,
    currentQuestionIndex: store.currentQuestionIndex,
    currentQuestion: store.questions[store.currentQuestionIndex] ?? null,
    directions: store.directions,
    selectedDirectionId: store.selectedDirectionId,
    documentSections: store.documentSections,
    refinementHistory: store.refinementHistory,
    projectTitle: store.projectTitle,
    savedProjectId: store.savedProjectId,

    // Computed
    canGoPrevious: store.currentQuestionIndex > 0,
    canGoNext: store.currentQuestionIndex < store.questions.length - 1,
    completedSections: store.documentSections.filter((s) => s.status === 'complete'),
    generatingSections: store.documentSections.filter((s) => s.status === 'generating'),

    // Actions
    setIdeaInput: store.setIdeaInput,
    setQuestions: store.setQuestions,
    startClarifying: store.startClarifying,
    answerQuestion: store.answerQuestion,
    nextQuestion: store.nextQuestion,
    previousQuestion: store.previousQuestion,
    setDirections: store.setDirections,
    selectDirection: store.selectDirection,
    addDocSection: store.addDocSection,
    updateDocSection: store.updateDocSection,
    applyRefinement: store.applyRefinement,
    undoRefinement: store.undoRefinement,
    setPhase: store.setPhase,
    setProjectTitle: store.setProjectTitle,
    setSavedProjectId: store.setSavedProjectId,
    reset: store.reset,
  };
}
