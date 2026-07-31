"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/protected-route";
import ProjectForm from "@/components/generator/project-form";
import { AgentPipelineProgress } from "@/components/generator/agent-pipeline-progress";
import { LivePreview } from "@/components/generator/live-preview";
import { useDraftStore } from "@/lib/draft-store";
import { useAuthStore } from "@/lib/auth-store";
import { useSSE } from "@/hooks/useSSE";
import type { ProjectRequest, GenerateResponse } from "@/types";

/**
 * Agent pipeline configuration - 5 phases with 12 agents
 */
const AGENT_PHASES = [
  {
    phase: 1,
    name: "Discovery",
    agents: ["product_owner", "business_analyst"],
  },
  {
    phase: 2,
    name: "Architecture",
    agents: ["solution_architect", "data_architect", "security_analyst"],
  },
  {
    phase: 3,
    name: "Design",
    agents: ["ux_designer", "api_designer"],
  },
  {
    phase: 4,
    name: "Operations",
    agents: ["qa_strategist", "devops_architect"],
  },
  {
    phase: 5,
    name: "Documentation",
    agents: ["technical_writer", "spec_coordinator"],
  },
];

const AGENT_LABELS: Record<string, string> = {
  product_owner: "Product Owner",
  business_analyst: "Business Analyst",
  solution_architect: "Solution Architect",
  data_architect: "Data Architect",
  security_analyst: "Security Analyst",
  ux_designer: "UX Designer",
  api_designer: "API Designer",
  qa_strategist: "QA Strategist",
  devops_architect: "DevOps Architect",
  technical_writer: "Technical Writer",
  spec_coordinator: "Spec Coordinator",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Loading fallback for Suspense boundary
 */
function GeneratePageLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="mt-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        Loading Generator...
      </p>
    </div>
  );
}

/**
 * Main content component that uses useSearchParams
 */
function GeneratePageContent() {
  const router = useRouter();

  // Draft store for persistence - read description from store if available
  const {
    generationDraft,
    startGeneration,
    updateGenerationPhase,
    updateGenerationPartialResults,
    setGenerationResults,
    setGenerationError,
    clearGenerationDraft
  } = useDraftStore();

  // Auth token for API calls
  const { token } = useAuthStore();

  // Get initial description from URL params (fallback for direct links) or draft store
  const searchParams = useSearchParams();
  const urlDescription = searchParams.get('description') || '';
  const initialDescription = generationDraft?.projectRequest?.description || urlDescription || '';
  
  // Local state
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  /** Short lifecycle message for the pipeline panel ("Judging Product Owner..."). */
  const [statusText, setStatusText] = useState<string>("");
  /** Streamed document text, kept per agent so status messages can never clobber it. */
  const [outputsByAgent, setOutputsByAgent] = useState<Record<string, string>>({});
  /** Which agent's output the preview pane is showing. */
  const [previewRole, setPreviewRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const sse = useSSE<Record<string, unknown>>({
    onEvent: (event) => {
      handleEventRef.current(event, sessionIdRef.current, (results) => {
        finalResultsRef.current = results;
      });
    },
    onComplete: () => {
      if (finalResultsRef.current) {
        setGenerationResults(finalResultsRef.current);
        router.push(`/generate/${sessionIdRef.current}`);
      } else {
        const errMsg = 'Generation stream ended without completing the pipeline';
        setError(errMsg);
        setGenerationError(errMsg);
      }
    },
    onError: (err) => {
      const message = err.message || 'Generation failed';
      setError(message);
      setGenerationError(message);
    },
  });
  const isGenerating = sse.isStreaming;

  // Track if we should resume from draft
  const resumedFromDraft = useRef(false);
  const partialOutputsRef = useRef<Record<string, string>>({});
  const finalResultsRef = useRef<GenerateResponse | null>(null);
  const sessionIdRef = useRef<string>('');
  const handleEventRef = useRef<(event: Record<string, unknown>, sessionId: string, onComplete: (results: GenerateResponse) => void) => void>(() => {});

  // Resume from draft if exists and not complete AND has actual partial progress
  useEffect(() => {
    if (generationDraft && !generationDraft.isComplete && !resumedFromDraft.current) {
      // Only resume if there's actual partial progress (completed agents or partial results)
      const hasPartialProgress =
        generationDraft.completedAgents.length > 0 ||
        generationDraft.partialResults !== null ||
        generationDraft.error !== null;

      if (!hasPartialProgress) {
        // Fresh draft with no progress - don't restore stale state
        return;
      }

      resumedFromDraft.current = true;
      setCurrentPhase(generationDraft.currentPhase);
      setCompletedAgents(generationDraft.completedAgents);
      if (generationDraft.partialResults?.markdown_outputs) {
        setStatusText("Recovered partial results from your last session.");
        partialOutputsRef.current = {
          ...generationDraft.partialResults.markdown_outputs,
        };
        setOutputsByAgent({ ...generationDraft.partialResults.markdown_outputs });
        setPreviewRole(Object.keys(generationDraft.partialResults.markdown_outputs)[0] ?? null);
      }
      if (generationDraft.error) {
        setError(generationDraft.error);
      }
    }
  }, [generationDraft]);

  const handleStreamEvent = useCallback((
    event: Record<string, unknown>,
    _sessionId: string,
    onComplete: (results: GenerateResponse) => void
  ) => {
    const eventType = event.type as string;
    const labelFor = (role: unknown) => AGENT_LABELS[role as string] || (role as string);

    switch (eventType) {
      case 'status':
        setStatusText(event.message as string || '');
        break;

      case 'context_ready':
        setStatusText('RAG context gathered, starting agents...');
        break;

      case 'agent_start': {
        const role = event.role as string;
        setActiveAgent(role);
        setPreviewRole(role);
        setStatusText(`${labelFor(role)} is working...`);
        // Reset this role's buffer so a retry/re-prompt of the same agent
        // starts clean instead of appending to the previous attempt.
        setOutputsByAgent(prev => ({ ...prev, [role]: '' }));
        partialOutputsRef.current = { ...partialOutputsRef.current, [role]: '' };
        break;
      }

      case 'chunk': {
        const role = event.role as string;
        const chunk = event.chunk as string;
        if (!role || !chunk) break;
        setOutputsByAgent(prev => ({ ...prev, [role]: (prev[role] ?? '') + chunk }));
        // Mirror into a ref for draft recovery. Persisting to the draft store
        // happens on agent_complete, not per token - a localStorage write per
        // token would jank the whole page.
        partialOutputsRef.current = {
          ...partialOutputsRef.current,
          [role]: `${partialOutputsRef.current[role] ?? ''}${chunk}`,
        };
        break;
      }

      case 'agent_complete': {
        const role = event.role as string;
        // The event carries the authoritative full text; adopt it so any
        // dropped token self-heals.
        const content = typeof event.content === 'string' ? event.content : undefined;
        if (content !== undefined) {
          setOutputsByAgent(prev => ({ ...prev, [role]: content }));
          partialOutputsRef.current = { ...partialOutputsRef.current, [role]: content };
        }
        updateGenerationPartialResults({
          markdown_outputs: { ...partialOutputsRef.current },
        });
        setCompletedAgents(prev => (prev.includes(role) ? prev : [...prev, role]));
        setActiveAgent(null);
        setStatusText(`${labelFor(role)} finished`);
        break;
      }

      case 'judge_start':
        setStatusText(`Quality review for ${labelFor(event.role)}...`);
        break;

      case 'critic_complete':
        setStatusText(`Critic evaluation for ${labelFor(event.role)} completed`);
        break;

      case 'skeptic_complete':
        setStatusText(`Adversarial review for ${labelFor(event.role)} completed`);
        break;

      case 'judge_complete':
        updateGenerationPartialResults({
          judge_results: {
            [event.role as string]: {
              is_approved: Boolean(event.is_approved),
              score: Number(event.score ?? 0),
              issues_count: Number(event.issues_count ?? 0),
              recommended_action: String(event.recommended_action ?? ""),
              feedback: String(event.feedback ?? ""),
            },
          },
        });
        break;
        
      case 'srs_assemble':
        setStatusText(event.message as string || 'Assembling SRS...');
        break;
      case 'srs_complete':
        setStatusText('SRS document assembled. Validating...');
        break;
      case 'cross_validate':
        setStatusText(event.message as string || 'Validating SRS...');
        break;
      case 'validation_report':
        setStatusText('Validation complete.');
        break;
        
      case 'pipeline_complete':
        onComplete({
          markdown_outputs: event.markdown_outputs as Record<string, string>,
          judge_results: event.judge_results as Record<string, GenerateResponse['judge_results'][string]>,
          project_title: event.project_title as string | undefined,
        });
        break;
        
      case 'error':
        setError(event.message as string || 'Unknown error');
        break;
        
      case 'done':
        // Stream finished
        break;
    }
  }, [updateGenerationPartialResults]);
  handleEventRef.current = handleStreamEvent;

  const handleGenerate = useCallback(async (data: ProjectRequest) => {
    setCurrentPhase(1);
    setCompletedAgents([]);
    setActiveAgent(null);
    setStatusText("");
    setOutputsByAgent({});
    setPreviewRole(null);
    setError(null);
    partialOutputsRef.current = {};
    finalResultsRef.current = null;

    const sid = startGeneration(data);
    sessionIdRef.current = sid;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await sse.startStream(`${API_URL}/api/generate/stream`, data, headers);
  }, [startGeneration, sse.startStream, token]);

  const getPhaseForAgent = (agent: string): number => {
    for (const phase of AGENT_PHASES) {
      if (phase.agents.includes(agent)) {
        return phase.phase;
      }
    }
    return 1;
  };

  useEffect(() => {
    if (completedAgents.length > 0) {
      const lastCompleted = completedAgents.at(-1);
      if (lastCompleted) {
        const phase = getPhaseForAgent(lastCompleted);
        if (phase > currentPhase) {
          setCurrentPhase(phase);
        }
        updateGenerationPhase(phase, lastCompleted);
      }
    }
  }, [completedAgents, currentPhase, updateGenerationPhase]);


  const hasInterruptedGeneration = Boolean(
    generationDraft &&
    !generationDraft.isComplete &&
    generationDraft.completedAgents.length > 0 &&
    !isGenerating
  );

  return (
    <div className="w-full h-[calc(100vh-64px)] px-4 py-4 flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-4 shrink-0 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 ${isGenerating ? 'bg-primary animate-pulse' : 'bg-primary/50'}`} />
            <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
              {isGenerating ? 'Pipeline Active' : 'Ready to Generate'}
            </span>
          </div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter">
            Specification <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground font-sans text-xs max-w-xl">
            Multi-agent system generating comprehensive software specifications.
          </p>
        </div>
        
        {/* Link to ideation */}
        <Link 
          href="/ideation"
          className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-amber-500 uppercase tracking-widest transition-colors"
        >
          <Lightbulb className="h-4 w-4" />
          Need help with your idea?
        </Link>
      </div>

      {hasInterruptedGeneration && (
        <div className="border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase text-amber-500/80 tracking-widest">
              Generation was interrupted
            </p>
            <p className="text-sm text-muted-foreground">
              We found partial progress from your last session. You can view it or start over.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {generationDraft?.partialResults && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/generate/${generationDraft.sessionId}`)}
                className="rounded-none font-mono uppercase text-[10px] tracking-widest"
              >
                View Partial Results
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearGenerationDraft();
                setCompletedAgents([]);
                setCurrentPhase(0);
                setActiveAgent(null);
                setStatusText("");
                setOutputsByAgent({});
                setPreviewRole(null);
                setError(null);
                partialOutputsRef.current = {};
                resumedFromDraft.current = false;
              }}
              className="rounded-none font-mono uppercase text-[10px] tracking-widest text-muted-foreground"
            >
              Start Over
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[35%_20%_45%] gap-4 flex-1 min-h-0">
        {/* Left: Project Configuration */}
        <div className="flex flex-col h-full min-h-0 overflow-hidden border border-border/40 rounded-md bg-background/50 p-4">
          <div className="mb-4 shrink-0">
            <h2 className="text-sm font-mono font-bold uppercase flex items-center gap-2">
              <span className="text-primary">[01]</span> Project Configuration
            </h2>
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ProjectForm
              onSubmit={handleGenerate}
              isLoading={isGenerating}
              initialDescription={initialDescription}
            />
          </div>
        </div>

        {/* Middle: Agent Pipeline Progress */}
        <div className="flex flex-col h-full min-h-0 overflow-hidden border border-border/40 rounded-md bg-background/50 p-4">
          <AgentPipelineProgress
            isGenerating={isGenerating}
            currentPhase={currentPhase}
            completedAgents={completedAgents}
            activeAgent={activeAgent}
            statusText={statusText}
            error={error}
            phases={AGENT_PHASES}
            agentLabels={AGENT_LABELS}
            onRetry={() => {
              setError(null);
              clearGenerationDraft();
            }}
          />
        </div>

        {/* Right: Live Preview */}
        <div className="flex flex-col h-full min-h-0 overflow-hidden border border-border/40 rounded-md bg-background/50 p-4 lg:col-span-1">
          <LivePreview
            streamingContent={previewRole ? (outputsByAgent[previewRole] ?? '') : ''}
            activeAgent={activeAgent ?? previewRole}
            currentPhase={currentPhase}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-primary/10 shrink-0">
        <Link 
          href="/"
          className="text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
        >
          ← Back to Home
        </Link>
        
        <Link 
          href="/dashboard"
          className="text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          Dashboard
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Generation Page - Main specification generation interface
 * 
 * This page:
 * 1. Accepts a project description (from ideation or direct input)
 * 2. Streams generation progress from FastAPI backend
 * 3. Shows real-time agent pipeline status
 * 4. Redirects to results page on completion
 */
export default function GeneratePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<GeneratePageLoading />}>
        <GeneratePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
