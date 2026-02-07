"use client";

import { Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AgentStatusIndicator } from "./agent-status-indicator";

export interface AgentInfo {
  role: string;
  label: string;
}

export interface PhaseInfo {
  phase: number;
  name: string;
  agents: string[];
}

export interface AgentPipelineProgressProps {
  isGenerating: boolean;
  currentPhase: number;
  completedAgents: string[];
  activeAgent: string | null;
  streamingContent: string;
  error: string | null;
  phases: PhaseInfo[];
  agentLabels: Record<string, string>;
  onRetry?: () => void;
}

export function AgentPipelineProgress({
  isGenerating,
  currentPhase,
  completedAgents,
  activeAgent,
  streamingContent,
  error,
  phases,
  agentLabels,
  onRetry,
}: Readonly<AgentPipelineProgressProps>) {
  const totalAgents = phases.reduce((acc, phase) => acc + phase.agents.length, 0);
  const progressPercentage = (completedAgents.length / totalAgents) * 100;

  const getAgentStatus = (agent: string): 'completed' | 'active' | 'pending' => {
    if (completedAgents.includes(agent)) return 'completed';
    if (activeAgent === agent) return 'active';
    return 'pending';
  };

  const isPhaseComplete = (phaseNumber: number): boolean => {
    const phase = phases.find(p => p.phase === phaseNumber);
    if (!phase) return false;
    return phase.agents.every(agent => completedAgents.includes(agent));
  };

  const isPhaseActive = (phaseNumber: number): boolean => {
    if (currentPhase !== phaseNumber) return false;
    return phases[phaseNumber - 1]?.agents.some(
      agent => !completedAgents.includes(agent) && agent !== activeAgent
    ) ?? false;
  };

  return (
    <div className="bg-background border-2 border-primary/20 p-6 rounded-none space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-mono uppercase">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-primary">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className={cn(
            "h-2 rounded-none transition-all duration-500",
            isGenerating && "animate-pulse"
          )} 
        />
      </div>

      {/* Phase Progress */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const phaseComplete = isPhaseComplete(phase.phase);
          const phaseActive = isPhaseActive(phase.phase);
          
          return (
            <div 
              key={phase.phase} 
              className={cn(
                "space-y-2 transition-all duration-300",
                phaseActive && "opacity-100",
                !phaseActive && !phaseComplete && "opacity-50"
              )}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-mono font-bold uppercase",
                  phaseComplete && "text-green-500",
                  phaseActive && "text-primary",
                  !phaseComplete && !phaseActive && "text-muted-foreground"
                )}>
                  Phase {phase.phase}: {phase.name}
                </span>
                {phaseComplete && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
                {phaseActive && (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                )}
              </div>
              
              {/* Agent List */}
              <div className="pl-4 space-y-1">
                {phase.agents.map((agent) => {
                  const status = getAgentStatus(agent);
                  const label = agentLabels[agent] || agent;
                  
                  return (
                    <AgentStatusIndicator
                      key={agent}
                      agent={agent}
                      label={label}
                      status={status}
                      isActive={activeAgent === agent}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Status */}
      {isGenerating && streamingContent && (
        <div className="border-t border-primary/10 pt-4 animate-in fade-in slide-in-from-top-2">
          <div className="text-[10px] font-mono text-primary uppercase mb-2 flex items-center gap-2">
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            Current Activity
          </div>
          <p className="text-xs text-muted-foreground font-mono line-clamp-3 animate-pulse">
            {streamingContent}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border-t border-destructive/20 pt-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-[10px] font-mono uppercase">Error</span>
          </div>
          <p className="text-xs text-destructive/80 font-mono mt-2">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-none font-mono text-[10px] uppercase hover:bg-destructive/20 transition-colors"
            >
              Dismiss & Retry
            </button>
          )}
        </div>
      )}

      {/* Idle State */}
      {!isGenerating && !error && completedAgents.length === 0 && (
        <div className="border-t border-primary/10 pt-4 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary/20 flex items-center justify-center mx-auto mb-2">
            <Circle className="h-4 w-4 text-primary/20" />
          </div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">
            Configure and submit to start
          </p>
        </div>
      )}
    </div>
  );
}
