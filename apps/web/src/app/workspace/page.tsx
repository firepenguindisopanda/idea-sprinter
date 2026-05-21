"use client";

import { useWorkspace } from "@/hooks/use-workspace";
import { TopBar } from "@/components/workspace/top-bar";
import { IdeaInput } from "@/components/workspace/idea-input";
import { ClarifyingQuestions } from "@/components/workspace/clarifying-questions";
import { DirectionSelector } from "@/components/workspace/direction-selector";
import { ProgressiveDoc } from "@/components/workspace/progressive-doc";
import { WorkspaceChatFeed } from "@/components/workspace/workspace-chat-feed";
import { XCircle, AlertCircle } from "lucide-react";

export default function WorkspacePage() {
  const { phase, error, clearError } = useWorkspace();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />

      {error && (
        <div className="flex items-center justify-between gap-3 px-6 py-3 bg-destructive/10 border-b border-destructive/20 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-destructive-foreground truncate">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="shrink-0 text-destructive/70 hover:text-destructive transition-colors"
            aria-label="Dismiss error"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[450px_1fr] overflow-hidden">
        {/* Left Column: Command Center Feed */}
        <div className="bg-muted/30 border-r border-border overflow-y-auto p-6 space-y-6">
          <IdeaInput />
          {phase === "evaluating" && <WorkspaceChatFeed />}
          {phase === "clarifying_questions" && (
            <>
              <WorkspaceChatFeed />
              <ClarifyingQuestions />
            </>
          )}
          {phase === "direction_selection" && <DirectionSelector />}
        </div>

        {/* Right Column: Document View */}
        <div className="bg-background overflow-y-auto">
          <ProgressiveDoc />
        </div>
      </div>
    </div>
  );
}
