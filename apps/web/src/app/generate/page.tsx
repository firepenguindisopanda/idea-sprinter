"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lightbulb, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/protected-route";
import ProjectForm from "@/components/generator/project-form";
import { AgentPipelineProgress } from "@/components/generator/agent-pipeline-progress";
import { LivePreview } from "@/components/generator/live-preview";
import { useDraftStore } from "@/lib/draft-store";
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
    agents: ["qa_strategist", "devops_architect", "environment_engineer"],
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
  environment_engineer: "Environment Engineer",
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
    setGenerationResults,
    setGenerationError,
    clearGenerationDraft
  } = useDraftStore();

  // Get initial description from URL params (fallback for direct links) or draft store
  const searchParams = useSearchParams();
  const urlDescription = searchParams.get('description') || '';
  const initialDescription = generationDraft?.projectRequest?.description || urlDescription || '';
  
  // Local state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Track if we should resume from draft
  const resumedFromDraft = useRef(false);

  // Resume from draft if exists and not complete
  useEffect(() => {
    if (generationDraft && !generationDraft.isComplete && !resumedFromDraft.current) {
      resumedFromDraft.current = true;
      setCurrentPhase(generationDraft.currentPhase);
      setCompletedAgents(generationDraft.completedAgents);
      if (generationDraft.error) {
        setError(generationDraft.error);
      }
    }
  }, [generationDraft]);

  const handleGenerate = useCallback(async (data: ProjectRequest) => {
    setIsGenerating(true);
    setCurrentPhase(1);
    setCompletedAgents([]);
    setActiveAgent(null);
    setStreamingContent("");
    setError(null);
    
    // Start generation in draft store
    const sessionId = startGeneration(data);
    
    try {
      const response = await fetch(`${API_URL}/api/generate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResults: GenerateResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              handleStreamEvent(eventData, sessionId, (results) => {
                finalResults = results;
              });
            } catch {
              // Ignore parse errors for malformed events
            }
          }
        }
      }

      // On completion, redirect to results
      if (finalResults) {
        setGenerationResults(finalResults);
        router.push(`/generate/${sessionId}`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      setGenerationError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [startGeneration, setGenerationResults, setGenerationError, router]);

  const handleStreamEvent = useCallback((
    event: Record<string, unknown>,
    _sessionId: string,
    onComplete: (results: GenerateResponse) => void
  ) => {
    const eventType = event.type as string;
    
    switch (eventType) {
      case 'status':
        setStreamingContent(event.message as string || '');
        break;
        
      case 'context_ready':
        setStreamingContent('RAG context gathered, starting agents...');
        break;
        
      case 'agent_start':
        setActiveAgent(event.role as string);
        setStreamingContent(`${AGENT_LABELS[event.role as string] || event.role} is working...`);
        break;
        
      case 'chunk':
        // Update streaming content with chunk
        if (event.content) {
          setStreamingContent(prev => prev + (event.content as string));
        }
        break;
        
      case 'agent_complete': {
        const role = event.role as string;
        setCompletedAgents(prev => {
          if (!prev.includes(role)) {
            return [...prev, role];
          }
          return prev;
        });
        setActiveAgent(null);
        // Phase update will be handled in useEffect
        break;
      }
          // Effect to update phase after completedAgents changes
          useEffect(() => {
            if (completedAgents.length > 0) {
              const lastCompleted = completedAgents.at(-1);
              if (lastCompleted) {
                const phase = getPhaseForAgent(lastCompleted);
                if (phase > currentPhase) {
                  setCurrentPhase(phase);
                  updateGenerationPhase(phase, lastCompleted);
                }
              }
            }
          }, [completedAgents]);
        
      case 'judge_start':
        setStreamingContent(`Quality review for ${AGENT_LABELS[event.role as string] || event.role}...`);
        break;
        
      case 'judge_complete':
        // Judge completed, continue
        break;
        
      case 'pipeline_complete':
        onComplete({
          markdown_outputs: event.markdown_outputs as Record<string, string>,
          judge_results: event.judge_results as Record<string, GenerateResponse['judge_results'][string]>,
        });
        break;
        
      case 'error':
        setError(event.message as string || 'Unknown error');
        break;
        
      case 'done':
        // Stream finished
        break;
    }
  }, [currentPhase, updateGenerationPhase]);

  const getPhaseForAgent = (agent: string): number => {
    for (const phase of AGENT_PHASES) {
      if (phase.agents.includes(agent)) {
        return phase.phase;
      }
    }
    return 1;
  };

  const getAgentStatus = (agent: string): 'completed' | 'active' | 'pending' => {
    if (completedAgents.includes(agent)) return 'completed';
    if (activeAgent === agent) return 'active';
    return 'pending';
  };

  const progressPercentage = (completedAgents.length / 12) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 ${isGenerating ? 'bg-primary animate-pulse' : 'bg-primary/50'}`} />
            <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
              {isGenerating ? 'Pipeline Active' : 'Ready to Generate'}
            </span>
          </div>
          <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">
            Specification <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground font-sans text-sm max-w-xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Project Form */}
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10" />
            <div className="mb-4">
              <h2 className="text-lg font-mono font-bold uppercase flex items-center gap-2">
                <span className="text-primary">[01]</span> Project Configuration
              </h2>
            </div>
            
            <div className="bg-background border-2 border-primary/20 p-6 rounded-none relative">
              <div className="absolute -top-3 -left-3 h-6 w-6 border-l-2 border-t-2 border-primary" />
              <div className="absolute -bottom-3 -right-3 h-6 w-6 border-r-2 border-b-2 border-primary" />
              
              <ProjectForm
                onSubmit={handleGenerate}
                isLoading={isGenerating}
                initialDescription={initialDescription}
              />
            </div>
          </div>
        </div>

        {/* Right: Pipeline Status & Live Preview */}
        <div className="space-y-6">
          {/* Agent Pipeline Progress */}
          <AgentPipelineProgress
            isGenerating={isGenerating}
            currentPhase={currentPhase}
            completedAgents={completedAgents}
            activeAgent={activeAgent}
            streamingContent={streamingContent}
            error={error}
            phases={AGENT_PHASES}
            agentLabels={AGENT_LABELS}
            onRetry={() => {
              setError(null);
              clearGenerationDraft();
            }}
          />

          {/* Live Preview */}
          <LivePreview
            streamingContent={streamingContent}
            activeAgent={activeAgent}
            currentPhase={currentPhase}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-primary/10">
        <Link 
          href="/"
          className="text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
        >
          ← Back to Home
        </Link>
        
        <Link 
          href="/generator"
          className="text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          Legacy Generator
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
