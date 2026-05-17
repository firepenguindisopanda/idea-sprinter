import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '@/lib/workspace-store';

describe('WorkspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it('starts in idea_input phase with empty state', () => {
    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('idea_input');
    expect(state.ideaInput).toBe('');
    expect(state.questions).toEqual([]);
    expect(state.directions).toEqual([]);
    expect(state.documentSections).toEqual([]);
    expect(state.refinementHistory).toEqual([]);
    expect(state.selectedDirectionId).toBeNull();
    expect(state.projectTitle).toBe('');
  });

  it('setIdeaInput updates the idea text', () => {
    useWorkspaceStore.getState().setIdeaInput('Build a task manager');
    expect(useWorkspaceStore.getState().ideaInput).toBe('Build a task manager');
  });

  it('startClarifying transitions to clarifying_questions phase', () => {
    useWorkspaceStore.getState().setQuestions([
      { id: 'q1', question: 'Who is the user?', type: 'choice', options: ['B2C', 'B2B'], answer: null },
    ]);
    useWorkspaceStore.getState().startClarifying();
    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('clarifying_questions');
    expect(state.currentQuestionIndex).toBe(0);
  });

  it('answerQuestion updates the specific question', () => {
    useWorkspaceStore.getState().setQuestions([
      { id: 'q1', question: 'Who?', type: 'choice', options: ['A', 'B'], answer: null },
      { id: 'q2', question: 'What?', type: 'free_text', answer: null },
    ]);
    useWorkspaceStore.getState().answerQuestion('q1', 'B2C');
    const q1 = useWorkspaceStore.getState().questions.find((q) => q.id === 'q1');
    expect(q1?.answer).toBe('B2C');
    // q2 should remain untouched
    const q2 = useWorkspaceStore.getState().questions.find((q) => q.id === 'q2');
    expect(q2?.answer).toBeNull();
  });

  it('nextQuestion increments index but does not exceed bounds', () => {
    useWorkspaceStore.getState().setQuestions([
      { id: 'q1', question: 'Q1', type: 'free_text', answer: null },
      { id: 'q2', question: 'Q2', type: 'free_text', answer: null },
    ]);
    useWorkspaceStore.getState().startClarifying();
    expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(0);

    useWorkspaceStore.getState().nextQuestion();
    expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(1);

    // Should not go beyond last index
    useWorkspaceStore.getState().nextQuestion();
    expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(1);
  });

  it('previousQuestion decrements index but stops at 0', () => {
    useWorkspaceStore.getState().setQuestions([
      { id: 'q1', question: 'Q1', type: 'free_text', answer: null },
      { id: 'q2', question: 'Q2', type: 'free_text', answer: null },
    ]);
    useWorkspaceStore.getState().startClarifying();
    useWorkspaceStore.getState().nextQuestion();
    expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(1);

    useWorkspaceStore.getState().previousQuestion();
    expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(0);

    // Should not go below 0
    useWorkspaceStore.getState().previousQuestion();
    expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(0);
  });

  it('setDirections transitions to direction_selection phase', () => {
    useWorkspaceStore.getState().setDirections([
      { id: 'd1', title: 'MVP', description: 'Build fast', tags: ['lean'] },
    ]);
    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('direction_selection');
    expect(state.directions).toHaveLength(1);
    expect(state.directions[0].id).toBe('d1');
  });

  it('selectDirection sets phase to generating', () => {
    useWorkspaceStore.getState().selectDirection('d1');
    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('generating');
    expect(state.selectedDirectionId).toBe('d1');
  });

  it('addDocSection appends sections in order', () => {
    useWorkspaceStore.getState().addDocSection({
      id: 'sec-a', title: 'Section A', status: 'generating', content: '', order: 0,
    });
    useWorkspaceStore.getState().addDocSection({
      id: 'sec-b', title: 'Section B', status: 'pending', content: '', order: 1,
    });
    expect(useWorkspaceStore.getState().documentSections).toHaveLength(2);
  });

  it('updateDocSection merges partial updates', () => {
    useWorkspaceStore.getState().addDocSection({
      id: 'sec-a', title: 'Section A', status: 'generating', content: '', order: 0,
    });
    useWorkspaceStore.getState().updateDocSection('sec-a', {
      status: 'complete',
      content: 'Done',
    });
    const section = useWorkspaceStore.getState().documentSections.find((s) => s.id === 'sec-a');
    expect(section?.status).toBe('complete');
    expect(section?.content).toBe('Done');
    expect(section?.title).toBe('Section A'); // unchanged field
  });

  it('applyRefinement enforces applied: true and updates section content', () => {
    useWorkspaceStore.getState().addDocSection({
      id: 'sec-a', title: 'Section A', status: 'complete', content: 'Original', order: 0,
    });
    useWorkspaceStore.getState().applyRefinement({
      sectionId: 'sec-a',
      prompt: 'Make it better',
      originalContent: 'Original',
      suggestedContent: 'Improved content',
      applied: false, // consumer passed false, store should override to true
    });
    const state = useWorkspaceStore.getState();
    const section = state.documentSections.find((s) => s.id === 'sec-a');
    expect(section?.content).toBe('Improved content');
    expect(state.refinementHistory).toHaveLength(1);
    expect(state.refinementHistory[0].applied).toBe(true); // store enforces true
  });

  it('undoRefinement reverts section content and removes from history', () => {
    useWorkspaceStore.getState().addDocSection({
      id: 'sec-a', title: 'Section A', status: 'complete', content: 'Original', order: 0,
    });
    useWorkspaceStore.getState().applyRefinement({
      sectionId: 'sec-a',
      prompt: 'Better',
      originalContent: 'Original',
      suggestedContent: 'Improved',
      applied: true,
    });
    expect(useWorkspaceStore.getState().documentSections[0].content).toBe('Improved');
    useWorkspaceStore.getState().undoRefinement('sec-a');
    expect(useWorkspaceStore.getState().documentSections[0].content).toBe('Original');
    expect(useWorkspaceStore.getState().refinementHistory).toHaveLength(0);
  });

  it('reset returns to initial state', () => {
    useWorkspaceStore.getState().setIdeaInput('Test');
    useWorkspaceStore.getState().setProjectTitle('My Project');
    useWorkspaceStore.getState().reset();
    const state = useWorkspaceStore.getState();
    expect(state.phase).toBe('idea_input');
    expect(state.ideaInput).toBe('');
    expect(state.projectTitle).toBe('');
    expect(state.documentSections).toEqual([]);
  });

  it('setProjectTitle updates the title', () => {
    useWorkspaceStore.getState().setProjectTitle('Sprint Planner');
    expect(useWorkspaceStore.getState().projectTitle).toBe('Sprint Planner');
  });
});
