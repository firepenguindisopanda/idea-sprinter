import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PreGenerationRequest, ProjectRequest, GenerateResponse } from '../types';

/**
 * Ideation Draft - stores the state from the ideation brainstorming page
 * Used when user is refining their idea via NVIDIA NIM before going to generation
 */
export interface IdeationDraft {
  /** Timestamp when draft was last updated */
  updatedAt: number;
  /** Pre-generation form state */
  preGenRequest: PreGenerationRequest;
  /** Generated examples from NVIDIA NIM */
  generatedExamples: string[];
  /** Selected example that user wants to use for generation */
  selectedExample: string | null;
}

/**
 * Generation Draft - stores the state from the generation page
 * Used when user is in the middle of generating specs via FastAPI backend
 */
export interface GenerationDraft {
  /** Timestamp when draft was last updated */
  updatedAt: number;
  /** Session ID for the generation (used for results page routing) */
  sessionId: string;
  /** Project request sent to the backend */
  projectRequest: ProjectRequest;
  /** Current phase of the multi-agent pipeline (1-5) */
  currentPhase: number;
  /** Which agents have completed their work */
  completedAgents: string[];
  /** Partial results as they stream in */
  partialResults: GenerateResponse | null;
  /** Whether generation is complete */
  isComplete: boolean;
  /** Error message if generation failed */
  error: string | null;
}

interface DraftStore {
  // Ideation draft state
  ideationDraft: IdeationDraft | null;
  
  // Generation draft state
  generationDraft: GenerationDraft | null;
  
  // Ideation draft actions
  setIdeationDraft: (draft: Partial<IdeationDraft>) => void;
  updateIdeationPreGen: (preGenRequest: Partial<PreGenerationRequest>) => void;
  setIdeationExamples: (examples: string[]) => void;
  selectIdeationExample: (example: string) => void;
  clearIdeationDraft: () => void;
  
  // Generation draft actions
  startGeneration: (projectRequest: ProjectRequest) => string;
  updateGenerationPhase: (phase: number, completedAgent?: string) => void;
  setGenerationResults: (results: GenerateResponse) => void;
  setGenerationError: (error: string) => void;
  clearGenerationDraft: () => void;
  
  // Utility actions
  hasAnyDraft: () => boolean;
  getDraftSummary: () => { type: 'ideation' | 'generation' | null; updatedAt: number | null };
}

// Default pre-generation form state
const DEFAULT_PRE_GEN_REQUEST: PreGenerationRequest = {
  title: "",
  audience: "",
  problemStatement: "",
  domain: "",
  mustHaveFeatures: [],
  techStack: "",
  exampleCount: 3,
  constraints: "",
  desiredTone: "",
};

// Generate a unique session ID for generation tracking
function generateSessionId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      ideationDraft: null,
      generationDraft: null,

      // ==================== Ideation Draft Actions ====================
      
      setIdeationDraft: (draft) => {
        set((state) => ({
          ideationDraft: {
            updatedAt: Date.now(),
            preGenRequest: draft.preGenRequest ?? state.ideationDraft?.preGenRequest ?? DEFAULT_PRE_GEN_REQUEST,
            generatedExamples: draft.generatedExamples ?? state.ideationDraft?.generatedExamples ?? [],
            selectedExample: draft.selectedExample ?? state.ideationDraft?.selectedExample ?? null,
          },
        }));
      },

      updateIdeationPreGen: (preGenRequest) => {
        const current = get().ideationDraft;
        set({
          ideationDraft: {
            updatedAt: Date.now(),
            preGenRequest: {
              ...(current?.preGenRequest ?? DEFAULT_PRE_GEN_REQUEST),
              ...preGenRequest,
            },
            generatedExamples: current?.generatedExamples ?? [],
            selectedExample: current?.selectedExample ?? null,
          },
        });
      },

      setIdeationExamples: (examples) => {
        const current = get().ideationDraft;
        if (!current) return;
        
        set({
          ideationDraft: {
            ...current,
            updatedAt: Date.now(),
            generatedExamples: examples,
          },
        });
      },

      selectIdeationExample: (example) => {
        const current = get().ideationDraft;
        if (!current) return;
        
        set({
          ideationDraft: {
            ...current,
            updatedAt: Date.now(),
            selectedExample: example,
          },
        });
      },

      clearIdeationDraft: () => {
        set({ ideationDraft: null });
      },

      // ==================== Generation Draft Actions ====================
      
      startGeneration: (projectRequest) => {
        const sessionId = generateSessionId();
        
        set({
          generationDraft: {
            updatedAt: Date.now(),
            sessionId,
            projectRequest,
            currentPhase: 1,
            completedAgents: [],
            partialResults: null,
            isComplete: false,
            error: null,
          },
        });
        
        return sessionId;
      },

      updateGenerationPhase: (phase, completedAgent) => {
        const current = get().generationDraft;
        if (!current) return;
        
        set({
          generationDraft: {
            ...current,
            updatedAt: Date.now(),
            currentPhase: phase,
            completedAgents: completedAgent 
              ? [...current.completedAgents, completedAgent]
              : current.completedAgents,
          },
        });
      },

      setGenerationResults: (results) => {
        const current = get().generationDraft;
        if (!current) return;
        
        set({
          generationDraft: {
            ...current,
            updatedAt: Date.now(),
            partialResults: results,
            isComplete: true,
          },
        });
      },

      setGenerationError: (error) => {
        const current = get().generationDraft;
        if (!current) return;
        
        set({
          generationDraft: {
            ...current,
            updatedAt: Date.now(),
            error,
            isComplete: true,
          },
        });
      },

      clearGenerationDraft: () => {
        set({ generationDraft: null });
      },

      // ==================== Utility Actions ====================
      
      hasAnyDraft: () => {
        const { ideationDraft, generationDraft } = get();
        return ideationDraft !== null || generationDraft !== null;
      },

      getDraftSummary: () => {
        const { ideationDraft, generationDraft } = get();
        
        // Prioritize showing generation draft if both exist (more actionable)
        if (generationDraft && !generationDraft.isComplete) {
          return { type: 'generation', updatedAt: generationDraft.updatedAt };
        }
        
        if (ideationDraft) {
          return { type: 'ideation', updatedAt: ideationDraft.updatedAt };
        }
        
        return { type: null, updatedAt: null };
      },
    }),
    {
      name: 'draft-storage',
      // Only persist essential data, not computed state
      partialize: (state) => ({
        ideationDraft: state.ideationDraft,
        generationDraft: state.generationDraft,
      }),
    }
  )
);

// ==================== Selectors ====================

/**
 * Hook to check if there's an in-progress generation
 */
export function useHasActiveGeneration(): boolean {
  return useDraftStore((state) => 
    state.generationDraft !== null && !state.generationDraft.isComplete
  );
}

/**
 * Hook to get the most recent draft for the banner
 */
export function useMostRecentDraft() {
  const ideationDraft = useDraftStore((state) => state.ideationDraft);
  const generationDraft = useDraftStore((state) => state.generationDraft);

  return useMemo(() => {
    if (generationDraft && !generationDraft.isComplete) {
      return { type: 'generation', updatedAt: generationDraft.updatedAt } as const;
    }

    if (ideationDraft) {
      return { type: 'ideation', updatedAt: ideationDraft.updatedAt } as const;
    }

    return { type: null, updatedAt: null } as const;
  }, [generationDraft, ideationDraft]);
}

/**
 * Hook to get ideation draft with default values
 */
export function useIdeationDraftWithDefaults(): IdeationDraft {
  const draft = useDraftStore((state) => state.ideationDraft);
  
  return draft ?? {
    updatedAt: 0,
    preGenRequest: DEFAULT_PRE_GEN_REQUEST,
    generatedExamples: [],
    selectedExample: null,
  };
}
